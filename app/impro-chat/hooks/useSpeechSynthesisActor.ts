'use client';

import { useCallback, useEffect } from 'react';

function obtenerVozHumanaSinHelena(): SpeechSynthesisVoice | null {
  const voces = window.speechSynthesis.getVoices();

  if (voces.length === 0) {
    return null;
  }

  const vocesPermitidas = voces.filter((voz) =>
    voz.lang.startsWith('es') && !voz.name.toLowerCase().includes('helena')
  );

  const premium = vocesPermitidas.find((voz) =>
    voz.name.includes('Google') || voz.name.includes('Natural') || voz.name.includes('Neural')
  );

  if (premium) {
    return premium;
  }

  const alternativaLocal = vocesPermitidas.find((voz) =>
    voz.name.includes('Mónica') || voz.name.includes('Jorge') || voz.name.includes('Microsoft')
  );

  return alternativaLocal ?? vocesPermitidas[0] ?? null;
}

export function useSpeechSynthesisActor(params: {
  onStart: () => void;
  onEnd: () => void;
}) {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const cancelarVoz = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const reproducirVoz = useCallback((texto: string, callbackAlTerminar: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('SpeechSynthesis no está soportado.');
      callbackAlTerminar();
      return;
    }

    window.speechSynthesis.cancel();
    params.onStart();

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(texto);
      const vozElegida = obtenerVozHumanaSinHelena();

      if (vozElegida) {
        utterance.voice = vozElegida;
        utterance.lang = vozElegida.lang;
      } else {
        utterance.lang = 'es-ES';
      }

      utterance.rate = 1.15;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        params.onEnd();
        callbackAlTerminar();
      };

      utterance.onerror = (event) => {
        console.error('Error en síntesis de voz:', event);
        params.onEnd();
        callbackAlTerminar();
      };

      window.speechSynthesis.speak(utterance);
    }, 60);
  }, [params]);

  return {
    cancelarVoz,
    reproducirVoz,
  };
}

