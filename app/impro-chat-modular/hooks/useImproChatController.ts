'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { INFORME_INICIAL, NOMBRES_FASES, TIEMPOS_INICIALES } from '../constants';
import { evaluarActoDirector, generarReplicaCoactor, generarTituloChat, transcribirTurno } from '../services/groq';
import type { DificultadChat, FaseActo, FeedbackFijo, InformeDirector, MensajeChat, PantallaChat, TiemposConfig } from '../types';
import { useSpeechSynthesisActor } from './useSpeechSynthesisActor';
import { useVoiceTurnRecorder } from './useVoiceTurnRecorder';

function getSiguienteFase(fase: FaseActo): FaseActo | null {
  if (fase === 'intro') return 'nudo';
  if (fase === 'nudo') return 'desenlace';
  return null;
}

export function useImproChatController() {
  const [dificultad, setDificultad] = useState<DificultadChat>('media');
  const [tiemposConfig, setTiemposConfig] = useState<TiemposConfig>(TIEMPOS_INICIALES);
  const [pantalla, setPantalla] = useState<PantallaChat>('config');
  const [faseActual, setFaseActual] = useState<FaseActo>('intro');
  const [titulo, setTitulo] = useState('');
  const [historialLetra, setHistorialLetra] = useState<MensajeChat[]>([]);
  const [titulos, setTitulos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTexto, setLoadingTexto] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [iaHablando, setIaHablando] = useState(false);
  const [informeFinal, setInformeFinal] = useState<InformeDirector>(INFORME_INICIAL);
  const [ultimoFeedbackFijo, setUltimoFeedbackFijo] = useState<FeedbackFijo | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textoAcumuladoActoRef = useRef<string[]>([]);
  const pantallaRef = useRef<PantallaChat>('config');
  const faseActualRef = useRef<FaseActo>('intro');
  const historialLetraRef = useRef<MensajeChat[]>([]);
  const tituloRef = useRef('');
  const tiemposConfigRef = useRef<TiemposConfig>(TIEMPOS_INICIALES);

  const recorder = useVoiceTurnRecorder();

  const vozActor = useSpeechSynthesisActor({
    onStart: () => {
      setIaHablando(true);
    },
    onEnd: () => {
      setIaHablando(false);
    },
  });

  useEffect(() => {
    pantallaRef.current = pantalla;
  }, [pantalla]);

  useEffect(() => {
    faseActualRef.current = faseActual;
  }, [faseActual]);

  useEffect(() => {
    historialLetraRef.current = historialLetra;
  }, [historialLetra]);

  useEffect(() => {
    tituloRef.current = titulo;
  }, [titulo]);

  useEffect(() => {
    tiemposConfigRef.current = tiemposConfig;
  }, [tiemposConfig]);

  const finalizarFuncionYMostrarInforme = useCallback(() => {
    recorder.liberarMicrofono();
    vozActor.cancelarVoz();
    setPantalla('final');
  }, [recorder, vozActor]);

  const ejecutarEvaluacionDirectorEnBackstage = useCallback(async (fase: FaseActo, textoActor: string) => {
    try {
      const evaluacion = await evaluarActoDirector({
        fase,
        titulo: tituloRef.current,
        historial: historialLetraRef.current,
        textoActor,
      });

      setInformeFinal((prev) => ({
        ...prev,
        [fase]: evaluacion,
      }));

      setUltimoFeedbackFijo({
        fase: NOMBRES_FASES[fase],
        texto: evaluacion.comentario,
        aprobado: evaluacion.aprobado,
      });
    } catch (error) {
      console.error('Error evaluando acto en backstage:', error);
      const propuestaFinal = textoActor.trim() ? textoActor : '[SIN_RESPUESTA]';

      setInformeFinal((prev) => ({
        ...prev,
        [fase]: {
          aprobado: true,
          comentario: '¡El director asiente desde la oscuridad! El show debe continuar.',
          transcripcionAcumulada: propuestaFinal === '[SIN_RESPUESTA]' ? 'Sin intervención de voz.' : propuestaFinal,
        },
      }));
    }
  }, []);

  const avanzarFaseEstructural = useCallback(() => {
    const faseTerminada = faseActualRef.current;
    const textoDelActo = textoAcumuladoActoRef.current.join(' ');
    const siguienteFase = getSiguienteFase(faseTerminada);

    recorder.cancelarGrabacion();
    ejecutarEvaluacionDirectorEnBackstage(faseTerminada, textoDelActo);
    textoAcumuladoActoRef.current = [];

    if (!siguienteFase) {
      finalizarFuncionYMostrarInforme();
      return;
    }

    setFaseActual(siguienteFase);
    setTimeLeft(tiemposConfigRef.current[siguienteFase]);
    setPantalla('jugando');
    setTimeout(() => recorder.iniciarGrabacion(), 100);
  }, [ejecutarEvaluacionDirectorEnBackstage, finalizarFuncionYMostrarInforme, recorder]);

  useEffect(() => {
    if (pantalla === 'jugando' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && pantalla === 'jugando') {
      avanzarFaseEstructural();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [avanzarFaseEstructural, pantalla, timeLeft]);

  const handleTiempoChange = useCallback((fase: FaseActo, valor: number) => {
    setTiemposConfig((prev) => ({ ...prev, [fase]: valor }));
  }, []);

  const procesarTurnoConversacional = useCallback(async (audioBlob: Blob | null) => {
    if (pantallaRef.current !== 'jugando') return;

    setLoading(true);
    setLoadingTexto('Procesando réplica...');

    try {
      const transcripcion = await transcribirTurno(audioBlob);
      const transcripcionUsuario = transcripcion.trim() ? transcripcion : '[SIN_RESPUESTA]';

      textoAcumuladoActoRef.current.push(transcripcionUsuario);

      const nuevoHistorial: MensajeChat[] = [
        ...historialLetraRef.current,
        { role: 'user', content: transcripcionUsuario },
      ];

      setHistorialLetra(nuevoHistorial);

      const respuestaIA = await generarReplicaCoactor(nuevoHistorial);
      setHistorialLetra((prev) => [...prev, { role: 'assistant', content: respuestaIA }]);
      setLoading(false);

      vozActor.reproducirVoz(respuestaIA, () => {
        if (pantallaRef.current === 'jugando') {
          recorder.iniciarGrabacion();
        }
      });
    } catch (error) {
      console.error(error);
      setLoading(false);

      if (pantallaRef.current === 'jugando') {
        recorder.iniciarGrabacion();
      }
    }
  }, [recorder, vozActor]);

  const detenerGrabacionYProcesar = useCallback(async () => {
    const audioBlob = await recorder.detenerGrabacionYObtenerAudio();
    await procesarTurnoConversacional(audioBlob);
  }, [procesarTurnoConversacional, recorder]);

  const iniciarEjercicio = useCallback(async () => {
    let streamInicial: MediaStream | null = null;

    try {
      streamInicial = await recorder.solicitarMicrofono();
    } catch {
      alert('¡El escenario requiere permisos de micrófono!');
      return;
    }

    setLoading(true);
    setLoadingTexto('El público está buscando ideas locas...');
    setHistorialLetra([]);
    setFaseActual('intro');
    textoAcumuladoActoRef.current = [];
    setUltimoFeedbackFijo(null);
    setInformeFinal(INFORME_INICIAL);

    try {
      const nuevoTitulo = await generarTituloChat(dificultad, titulos);
      setTitulo(nuevoTitulo);
      setTitulos((prev) => [...prev, nuevoTitulo]);
      setTimeLeft(tiemposConfigRef.current.intro);
      setPantalla('jugando');
      setLoading(false);
      setTimeout(() => recorder.iniciarGrabacion(streamInicial), 100);
    } catch (error) {
      console.error(error);
      recorder.liberarMicrofono();
      setPantalla('config');
      setLoading(false);
    }
  }, [dificultad, recorder, titulos]);

  const reiniciarTeatroCompleto = useCallback(() => {
    recorder.liberarMicrofono();
    vozActor.cancelarVoz();
    setTitulo('');
    setHistorialLetra([]);
    setPantalla('config');
    setFaseActual('intro');
    setUltimoFeedbackFijo(null);
    setIaHablando(false);
  }, [recorder, vozActor]);

  return {
    avanzarFaseEstructural,
    detenerGrabacionYProcesar,
    dificultad,
    escuchando: recorder.escuchando,
    faseActual,
    finalizarFuncionYMostrarInforme,
    handleTiempoChange,
    historialLetra,
    iaHablando,
    informeFinal,
    iniciarEjercicio,
    loading,
    loadingTexto,
    pantalla,
    reiniciarTeatroCompleto,
    setDificultad,
    tiemposConfig,
    timeLeft,
    titulo,
    ultimoFeedbackFijo,
  };
}

