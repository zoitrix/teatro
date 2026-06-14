'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ESCENA_FINAL_VACIA, TIEMPO_INICIAL_FINAL, TIPOS_FINAL } from '../constants';
import { evaluarFinalConDirector, generarEscenaParaFinal, generarTituloFinal, transcribirAudioFinal } from '../services/groq';
import type { DificultadEnd, EscenaFinal, PantallaEnd, TipoFinal } from '../types';
import { useNativeRecorder } from '../../structure/hooks/useNativeRecorder';

function buscarTipoFinalPorId(id: string): TipoFinal {
  return TIPOS_FINAL.find((tipoFinal) => tipoFinal.id === id) ?? TIPOS_FINAL[0];
}

export function useEndController() {
  const [dificultad, setDificultad] = useState<DificultadEnd>('media');
  const [tipoFinalId, setTipoFinalId] = useState(TIPOS_FINAL[0].id);
  const [tiempoConfig, setTiempoConfig] = useState(TIEMPO_INICIAL_FINAL);
  const [pantalla, setPantalla] = useState<PantallaEnd>('config');
  const [escena, setEscena] = useState<EscenaFinal>(ESCENA_FINAL_VACIA);
  const [loading, setLoading] = useState(false);
  const [loadingTexto, setLoadingTexto] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [textoUsuario, setTextoUsuario] = useState('');
  const [feedbackDirector, setFeedbackDirector] = useState('');
  const [aprobadoPorDirector, setAprobadoPorDirector] = useState(false);
  const [titulos, setTitulos] = useState<string[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const esBotonFinalizarRef = useRef(false);
  const escenaRef = useRef(escena);
  const tipoFinalIdRef = useRef(tipoFinalId);
  const tiempoConfigRef = useRef(tiempoConfig);

  useEffect(() => {
    escenaRef.current = escena;
  }, [escena]);

  useEffect(() => {
    tipoFinalIdRef.current = tipoFinalId;
  }, [tipoFinalId]);

  useEffect(() => {
    tiempoConfigRef.current = tiempoConfig;
  }, [tiempoConfig]);

  const procesarFinalConWhisperYDirector = useCallback(async (audioBlob: Blob | null) => {
    setLoading(true);
    setPantalla('feedback');

    try {
      setLoadingTexto('Escuchando tu grabacion con Whisper...');
      const transcripcionFinal = await transcribirAudioFinal(audioBlob);
      setTextoUsuario(transcripcionFinal);

      const propuestaFinal = transcripcionFinal !== '' ? transcripcionFinal : '[SIN_RESPUESTA]';
      const tipoFinal = buscarTipoFinalPorId(tipoFinalIdRef.current);

      setLoadingTexto('El Director esta evaluando tu final...');
      const evaluacion = await evaluarFinalConDirector({
        escena: escenaRef.current,
        propuestaFinal,
        tipoFinal,
      });

      setFeedbackDirector(evaluacion.comentario);
      setAprobadoPorDirector(evaluacion.aprobado);
    } catch (error) {
      console.error('Fallo en el pipeline del Director de finales:', error);
      setFeedbackDirector('El director no ha podido revisar este final. Probemos de nuevo.');
      setAprobadoPorDirector(false);
    } finally {
      setLoading(false);
      setLoadingTexto('');
    }
  }, []);

  const recorder = useNativeRecorder(procesarFinalConWhisperYDirector);

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
    setEscena(ESCENA_FINAL_VACIA);
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
    setLoadingTexto('Preparando el planteamiento...');
    setTextoUsuario('');
    setFeedbackDirector('');
    setAprobadoPorDirector(false);
    esBotonFinalizarRef.current = false;

    try {
      const tipoFinal = buscarTipoFinalPorId(tipoFinalIdRef.current);
      const nuevoTitulo = await generarTituloFinal(dificultad, titulos);
      setTitulos((prev) => [...prev, nuevoTitulo]);

      setLoadingTexto('Escribiendo el nudo de la escena...');
      const contexto = await generarEscenaParaFinal({ titulo: nuevoTitulo, tipoFinal });
      setEscena({ titulo: nuevoTitulo, ...contexto });
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

  const terminarFinal = useCallback(() => {
    esBotonFinalizarRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    recorder.detenerGrabacion();
  }, [recorder]);

  const reintentarFinal = useCallback(async () => {
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
    escena,
    escuchando: recorder.escuchando,
    feedbackDirector,
    handleTiempoChange,
    iniciarEjercicio,
    loading,
    loadingTexto,
    pantalla,
    reiniciarEjercicio,
    reintentarFinal,
    setDificultad,
    setTipoFinalId,
    terminarFinal,
    textoUsuario,
    tiempoConfig,
    timeLeft,
    tipoFinal: buscarTipoFinalPorId(tipoFinalId),
    tipoFinalId,
    tiposFinal: TIPOS_FINAL,
  };
}
