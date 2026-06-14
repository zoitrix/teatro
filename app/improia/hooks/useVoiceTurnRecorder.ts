'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface DetectorVoz {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  intervalo: NodeJS.Timeout | null;
  habloAlMenosUnaVez: boolean;
  procesandoSilencio: boolean;
  ultimoSonidoEn: number | null;
}

export function useVoiceTurnRecorder() {
  const [escuchando, setEscuchando] = useState(false);
  const detectorVozRef = useRef<DetectorVoz>({
    audioContext: null,
    analyser: null,
    intervalo: null,
    habloAlMenosUnaVez: false,
    procesandoSilencio: false,
    ultimoSonidoEn: null,
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fragmentosAudioRef = useRef<Blob[]>([]);
  const flujoAudioRef = useRef<MediaStream | null>(null);

  const liberarDetector = useCallback(() => {
    const { audioContext, intervalo } = detectorVozRef.current;

    if (intervalo) {
      clearInterval(intervalo);
    }

    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }

    detectorVozRef.current = {
      audioContext: null,
      analyser: null,
      intervalo: null,
      habloAlMenosUnaVez: false,
      procesandoSilencio: false,
      ultimoSonidoEn: null,
    };
  }, []);

  const liberarMicrofono = useCallback(() => {
    liberarDetector();

    if (flujoAudioRef.current) {
      flujoAudioRef.current.getTracks().forEach((track) => track.stop());
      flujoAudioRef.current = null;
    }
  }, [liberarDetector]);

  useEffect(() => {
    return () => {
      liberarMicrofono();
    };
  }, [liberarMicrofono]);

  const solicitarMicrofono = useCallback(async (): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    flujoAudioRef.current = stream;
    return stream;
  }, []);

  const iniciarGrabacion = useCallback(async (streamExistente?: MediaStream | null, onSilencio?: () => void) => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        return;
      }

      fragmentosAudioRef.current = [];
      let stream = streamExistente || flujoAudioRef.current;

      if (!stream || !stream.active) {
        stream = await solicitarMicrofono();
      }

      flujoAudioRef.current = stream;

      const opciones = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : undefined;
      const mediaRecorder = new MediaRecorder(stream, opciones);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          fragmentosAudioRef.current.push(event.data);
        }
      };

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      detectorVozRef.current = {
        audioContext,
        analyser,
        habloAlMenosUnaVez: false,
        procesandoSilencio: false,
        ultimoSonidoEn: null,
        intervalo: setInterval(() => {
          const bufferDatos = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(bufferDatos);
          const promedioVolumen = bufferDatos.reduce((a, b) => a + b, 0) / bufferDatos.length;
          const ahora = Date.now();

          if (promedioVolumen > 10) {
            detectorVozRef.current.habloAlMenosUnaVez = true;
            detectorVozRef.current.ultimoSonidoEn = ahora;
            return;
          }

          const silencioMs = detectorVozRef.current.ultimoSonidoEn ? ahora - detectorVozRef.current.ultimoSonidoEn : 0;

          if (
            onSilencio &&
            detectorVozRef.current.habloAlMenosUnaVez &&
            silencioMs > 1500 &&
            !detectorVozRef.current.procesandoSilencio
          ) {
            detectorVozRef.current.procesandoSilencio = true;
            onSilencio();
          }
        }, 100),
      };

      mediaRecorder.start();
      setEscuchando(true);
    } catch (error) {
      console.error('Error al iniciar grabación con VAD:', error);
    }
  }, [solicitarMicrofono]);

  const detenerGrabacionYObtenerAudio = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return null;
    }

    setEscuchando(false);
    const mediaRecorder = mediaRecorderRef.current;
    const mimeTypeUsado = mediaRecorder.mimeType;
    const habloAlMenosUnaVez = detectorVozRef.current.habloAlMenosUnaVez;

    liberarDetector();

    const audioBlobListo = await new Promise<Blob | null>((resolve) => {
      mediaRecorder.onstop = () => {
        if (fragmentosAudioRef.current.length === 0) {
          resolve(null);
          return;
        }

        const audioBlob = new Blob(fragmentosAudioRef.current, { type: mimeTypeUsado });

        if (audioBlob.size < 1200) {
          resolve(null);
          return;
        }

        resolve(habloAlMenosUnaVez || audioBlob.size > 3500 ? audioBlob : null);
      };

      mediaRecorder.stop();
    });

    fragmentosAudioRef.current = [];
    return audioBlobListo;
  }, [liberarDetector]);

  const cancelarGrabacion = useCallback(() => {
    setEscuchando(false);
    liberarDetector();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }

    fragmentosAudioRef.current = [];
  }, [liberarDetector]);

  return {
    cancelarGrabacion,
    detenerGrabacionYObtenerAudio,
    escuchando,
    iniciarGrabacion,
    liberarMicrofono,
    solicitarMicrofono,
  };
}
