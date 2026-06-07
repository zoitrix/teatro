'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FASES_EN_ORDEN, OBRA_VACIA, TIEMPOS_INICIALES } from '../constants';
import { evaluarActoConDirector, generarTituloImpro, transcribirAudioImpro } from '../services/groq';
import type { DificultadImpro, FaseActo, ObraHistorial, PantallaImpro, TiemposConfig } from '../types';
import { useNativeRecorder } from './useNativeRecorder';

function getExplicacionInicial(): string {
  return 'Construye una obra de improvisación completa por actos. Configura los tiempos de cada reto abajo (en segundos), asume tu rol ¡y que empiece el espectáculo!';
}

function getSiguienteFase(fase: FaseActo): FaseActo | null {
  const indiceActual = FASES_EN_ORDEN.indexOf(fase);
  return FASES_EN_ORDEN[indiceActual + 1] ?? null;
}

export function useImproBaseController() {
  const [dificultad, setDificultad] = useState<DificultadImpro>('media');
  const [tiemposConfig, setTiemposConfig] = useState<TiemposConfig>(TIEMPOS_INICIALES);
  const [faseActual, setFaseActual] = useState<FaseActo>('intro');
  const [pantalla, setPantalla] = useState<PantallaImpro>('config');
  const [titulo, setTitulo] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTexto, setLoadingTexto] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [textoUsuario, setTextoUsuario] = useState('');
  const [feedbackDirector, setFeedbackDirector] = useState('');
  const [aprobadoPorDirector, setAprobadoPorDirector] = useState(false);
  const [obra, setObra] = useState<ObraHistorial>(OBRA_VACIA);
  const [titulos, setTitulos] = useState<string[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const esBotonFinalizarRef = useRef(false);
  const faseActualRef = useRef(faseActual);
  const tituloRef = useRef(titulo);
  const obraRef = useRef(obra);
  const tiemposConfigRef = useRef(tiemposConfig);

  useEffect(() => {
    faseActualRef.current = faseActual;
  }, [faseActual]);

  useEffect(() => {
    tituloRef.current = titulo;
  }, [titulo]);

  useEffect(() => {
    obraRef.current = obra;
  }, [obra]);

  useEffect(() => {
    tiemposConfigRef.current = tiemposConfig;
  }, [tiemposConfig]);

  const procesarFaseConWhisperYDirector = useCallback(async (audioBlob: Blob | null) => {
    setLoading(true);
    setPantalla('feedback');

    try {
      setLoadingTexto('Escuchando tu grabación con Whisper...');
      const transcripcionFinal = await transcribirAudioImpro(audioBlob);
      setTextoUsuario(transcripcionFinal);

      const propuestaFinal = transcripcionFinal !== '' ? transcripcionFinal : '[SIN_RESPUESTA]';

      setLoadingTexto('El Director está redactando las notas...');
      const evaluacion = await evaluarActoConDirector({
        fase: faseActualRef.current,
        titulo: tituloRef.current,
        obra: obraRef.current,
        propuestaFinal,
      });

      setFeedbackDirector(evaluacion.comentario);
      setAprobadoPorDirector(evaluacion.aprobado);

      if (evaluacion.aprobado && propuestaFinal !== '[SIN_RESPUESTA]') {
        setObra((prev) => ({ ...prev, [faseActualRef.current]: propuestaFinal }));
      }
    } catch (error) {
      console.error('Fallo en el pipeline del Director:', error);
      setFeedbackDirector('¡El director se ha trabado con el guion! Repitamos el acto.');
      setAprobadoPorDirector(false);
    } finally {
      setLoading(false);
      setLoadingTexto('');
    }
  }, []);

  const recorder = useNativeRecorder(procesarFaseConWhisperYDirector);

  useEffect(() => {
    if (pantalla === 'jugando' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && pantalla === 'jugando' && !esBotonFinalizarRef.current) {
      recorder.detenerGrabacion();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pantalla, recorder, timeLeft]);

  const handleTiempoChange = useCallback((fase: FaseActo, valor: number) => {
    setTiemposConfig((prev) => ({
      ...prev,
      [fase]: valor,
    }));
  }, []);

  const reiniciarTeatroCompleto = useCallback(() => {
    recorder.liberarMicrofono();
    setTitulo('');
    setFaseActual('intro');
    setPantalla('config');
    setTextoUsuario('');
    setFeedbackDirector('');
    setAprobadoPorDirector(false);
  }, [recorder]);

  const iniciarEjercicio = useCallback(async () => {
    const tiempos = tiemposConfigRef.current;
    const tiemposInvalidos = Object.values(tiempos).some((tiempo) => tiempo <= 0);

    if (tiemposInvalidos) {
      alert('Por favor, introduce tiempos válidos (mayores a 0 segundos) para todos los actos.');
      return;
    }

    setLoading(true);
    setLoadingTexto('Afinando el libreto...');
    setTextoUsuario('');
    setFeedbackDirector('');
    setAprobadoPorDirector(false);
    setFaseActual('intro');
    esBotonFinalizarRef.current = false;
    setObra(OBRA_VACIA);

    try {
      const nuevoTitulo = await generarTituloImpro(dificultad, titulos);
      setTitulo(nuevoTitulo);
      setTitulos((prev) => [...prev, nuevoTitulo]);
      setObra((prev) => ({ ...prev, titulo: nuevoTitulo }));
      setTimeLeft(tiempos.intro);
      setPantalla('jugando');
      await recorder.iniciarGrabacion();
    } catch (error) {
      console.error(error);
      alert('¡Fallo en las luces! Revisa tu configuración o tu API Key de Groq.');
      setPantalla('config');
    } finally {
      setLoading(false);
      setLoadingTexto('');
    }
  }, [dificultad, recorder, titulos]);

  const clickBotonTerminarManual = useCallback(() => {
    esBotonFinalizarRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    recorder.detenerGrabacion();
  }, [recorder]);

  const avanzarSiguienteFase = useCallback(async () => {
    const siguienteFase = getSiguienteFase(faseActualRef.current);
    esBotonFinalizarRef.current = false;
    setTextoUsuario('');
    setFeedbackDirector('');

    if (!siguienteFase) {
      setPantalla('final');
      return;
    }

    setFaseActual(siguienteFase);
    setTimeLeft(tiemposConfigRef.current[siguienteFase]);
    setPantalla('jugando');
    setTimeout(() => recorder.iniciarGrabacion(), 100);
  }, [recorder]);

  const reintentarActoActual = useCallback(async () => {
    esBotonFinalizarRef.current = false;
    setTextoUsuario('');
    setFeedbackDirector('');
    setAprobadoPorDirector(false);
    setTimeLeft(tiemposConfigRef.current[faseActualRef.current]);
    setPantalla('jugando');
    setTimeout(() => recorder.iniciarGrabacion(), 100);
  }, [recorder]);

  return {
    aprobadoPorDirector,
    avanzarSiguienteFase,
    clickBotonTerminarManual,
    dificultad,
    escuchando: recorder.escuchando,
    faseActual,
    feedbackDirector,
    getExplicacionInicial,
    handleTiempoChange,
    iniciarEjercicio,
    loading,
    loadingTexto,
    obra,
    pantalla,
    reiniciarTeatroCompleto,
    reintentarActoActual,
    setDificultad,
    textoUsuario,
    tiemposConfig,
    timeLeft,
    titulo,
  };
}

