'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useNativeRecorder(onAudioReady: (audioBlob: Blob | null) => Promise<void> | void) {
  const [escuchando, setEscuchando] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fragmentosAudioRef = useRef<Blob[]>([]);
  const flujoAudioRef = useRef<MediaStream | null>(null);
  const onAudioReadyRef = useRef(onAudioReady);

  useEffect(() => {
    onAudioReadyRef.current = onAudioReady;
  }, [onAudioReady]);

  const liberarMicrofono = useCallback(() => {
    if (flujoAudioRef.current) {
      flujoAudioRef.current.getTracks().forEach((track) => track.stop());
      flujoAudioRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      liberarMicrofono();
    };
  }, [liberarMicrofono]);

  const iniciarGrabacion = useCallback(async () => {
    try {
      fragmentosAudioRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      flujoAudioRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          fragmentosAudioRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setEscuchando(true);
    } catch (error) {
      console.error('Error al acceder al microfono:', error);
      alert('No se pudo acceder al microfono. Por favor, asegúrate de dar permisos de audio.');
      await onAudioReadyRef.current(null);
    }
  }, []);

  const detenerGrabacion = useCallback(async () => {
    setEscuchando(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(fragmentosAudioRef.current, { type: 'audio/mpeg' });
        liberarMicrofono();
        await onAudioReadyRef.current(audioBlob);
      };

      mediaRecorderRef.current.stop();
      return;
    }

    await onAudioReadyRef.current(null);
  }, [liberarMicrofono]);

  return {
    escuchando,
    iniciarGrabacion,
    detenerGrabacion,
    liberarMicrofono,
  };
}

