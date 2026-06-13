'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ESTRATEGIAS_INICIO, TIEMPO_INICIAL } from '../constants';
import { evaluarInicioConDirector, generarTituloInicio, transcribirAudioInicio } from '../services/groq';
import type { DificultadStart, EstrategiaInicio, PantallaStart } from '../types';
import { useNativeRecorder } from '../../structure/hooks/useNativeRecorder';

function buscarEstrategiaPorId(id: string): EstrategiaInicio {
  return ESTRATEGIAS_INICIO.find((estrategia) => estrategia.id === id) ?? ESTRATEGIAS_INICIO[0];
}

export function useStartController() {
  const [dificultad, setDificultad] = useState<DificultadStart>('media');
  const [estrategiaId, setEstrategiaId] = useState(ESTRATEGIAS_INICIO[0].id);
  const [tiempoConfig, setTiempoConfig] = useState(TIEMPO_INICIAL);
  const [pantalla, setPantalla] = useState<PantallaStart>('config');
  const [titulo, setTitulo] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTexto, setLoadingTexto] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [textoUsuario, setTextoUsuario] = useState('');
  const [feedbackDirector, setFeedbackDirector] = useState('');
  const [aprobadoPorDirector, setAprobadoPorDirector] = useState(false);
  const [titulos, setTitulos] = useState<string[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const esBotonFinalizarRef = useRef(false);
  const tituloRef = useRef(titulo);
  const estrategiaIdRef = useRef(estrategiaId);
  const tiempoConfigRef = useRef(tiempoConfig);

  useEffect(() => {
    tituloRef.current = titulo;
  }, [titulo]);

  useEffect(() => {
    estrategiaIdRef.current = estrategiaId;
  }, [estrategiaId]);

  useEffect(() => {
    tiempoConfigRef.current = tiempoConfig;
  }, [tiempoConfig]);

  const procesarInicioConWhisperYDirector = useCallback(async (audioBlob: Blob | null) => {
    setLoading(true);
    setPantalla('feedback');

    try {
      setLoadingTexto('Escuchando tu grabacion con Whisper...');
      const transcripcionFinal = await transcribirAudioInicio(audioBlob);
      setTextoUsuario(transcripcionFinal);

      const propuestaFinal = transcripcionFinal !== '' ? transcripcionFinal : '[SIN_RESPUESTA]';
      const estrategia = buscarEstrategiaPorId(estrategiaIdRef.current);

      setLoadingTexto('El Director esta evaluando tu inicio...');
      const evaluacion = await evaluarInicioConDirector({
        titulo: tituloRef.current,
        propuestaFinal,
        estrategia,
      });

      setFeedbackDirector(evaluacion.comentario);
      setAprobadoPorDirector(evaluacion.aprobado);
    } catch (error) {
      console.error('Fallo en el pipeline del Director de inicios:', error);
      setFeedbackDirector('El director no ha podido revisar este arranque. Probemos de nuevo.');
      setAprobadoPorDirector(false);
    } finally {
      setLoading(false);
      setLoadingTexto('');
    }
  }, []);

  const recorder = useNativeRecorder(procesarInicioConWhisperYDirector);

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

  const handleTiempoChange = useCallback((valor: number) => {
    setTiempoConfig(valor);
  }, []);

  const reiniciarEjercicio = useCallback(() => {
    recorder.liberarMicrofono();
    setTitulo('');
    setPantalla('config');
    setTextoUsuario('');
    setFeedbackDirector('');
    setAprobadoPorDirector(false);
    setTimeLeft(0);
  }, [recorder]);

  const iniciarEjercicio = useCallback(async () => {
    const tiempo = tiempoConfigRef.current;

    if (tiempo <= 0) {
      alert('Por favor, introduce un tiempo valido mayor a 0 segundos.');
      return;
    }

    setLoading(true);
    setLoadingTexto('Afinando el arranque...');
    setTextoUsuario('');
    setFeedbackDirector('');
    setAprobadoPorDirector(false);
    esBotonFinalizarRef.current = false;

    try {
      const nuevoTitulo = await generarTituloInicio(dificultad, titulos);
      setTitulo(nuevoTitulo);
      setTitulos((prev) => [...prev, nuevoTitulo]);
      setTimeLeft(tiempo);
      setPantalla('jugando');
      await recorder.iniciarGrabacion();
    } catch (error) {
      console.error(error);
      alert('Fallo en las luces. Revisa tu configuracion o tu API Key de Groq.');
      setPantalla('config');
    } finally {
      setLoading(false);
      setLoadingTexto('');
    }
  }, [dificultad, recorder, titulos]);

  const terminarInicio = useCallback(() => {
    esBotonFinalizarRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    recorder.detenerGrabacion();
  }, [recorder]);

  const reintentarInicio = useCallback(async () => {
    esBotonFinalizarRef.current = false;
    setTextoUsuario('');
    setFeedbackDirector('');
    setAprobadoPorDirector(false);
    setTimeLeft(tiempoConfigRef.current);
    setPantalla('jugando');
    setTimeout(() => recorder.iniciarGrabacion(), 100);
  }, [recorder]);

  return {
    aprobadoPorDirector,
    dificultad,
    escuchando: recorder.escuchando,
    estrategia: buscarEstrategiaPorId(estrategiaId),
    estrategiaId,
    estrategias: ESTRATEGIAS_INICIO,
    feedbackDirector,
    handleTiempoChange,
    iniciarEjercicio,
    loading,
    loadingTexto,
    pantalla,
    reiniciarEjercicio,
    reintentarInicio,
    setDificultad,
    setEstrategiaId,
    terminarInicio,
    textoUsuario,
    tiempoConfig,
    timeLeft,
    titulo,
  };
}
