'use client';

import React, { useState, useEffect, useRef } from 'react';
import { OpenAI } from 'openai';
import styles from './impro.module.css';

interface MensajeChat {
  role: 'user' | 'assistant';
  content: string;
}

// 🎭 1. Simplificación a 3 Estados Clásicos
type FaseActo = 'intro' | 'nudo' | 'desenlace';

interface TiemposConfig {
  intro: number;
  nudo: number;
  desenlace: number;
}

interface EvaluacionActo {
  aprobado: boolean;
  comentario: string;
  transcripcionAcumulada: string;
}

interface InformeDirector {
  intro: EvaluacionActo | null;
  nudo: EvaluacionActo | null;
  desenlace: EvaluacionActo | null;
}

export default function ImproChatPage() {
  const [dificultad, setDificultad] = useState<string>('media');
  
  // ⏱️ Ajuste de tiempos por defecto para los 3 actos
  const [tiemposConfig, setTiemposConfig] = useState<TiemposConfig>({
    intro: 60,
    nudo: 240, // Suma del tiempo anterior o el que consideres ideal
    desenlace: 60
  });

  const dectectorVozRef = useRef<{
    audioContext: AudioContext | null;
    analyser: AnalyserNode | null;
    intervalo: NodeJS.Timeout | null;
    habloAlMenosUnaVez: boolean;
  }>({ audioContext: null, analyser: null, intervalo: null, habloAlMenosUnaVez: false });

  const [pantalla, setPantalla] = useState<'config' | 'jugando' | 'final'>('config');
  const [faseActual, setFaseActual] = useState<FaseActo>('intro');
  const [titulo, setTitulo] = useState<string>('');
  const [historialLetra, setHistorialLetra] = useState<MensajeChat[]>([]);
  const [titulos, setTitulos] = useState<string[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTexto, setLoadingTexto] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [escuchando, setEscuchando] = useState<boolean>(false);
  const [iaHablando, setIaHablando] = useState<boolean>(false);

  const [informeFinal, setInformeFinal] = useState<InformeDirector>({
    intro: null,
    nudo: null,
    desenlace: null
  });

  const [ultimoFeedbackFijo, setUltimoFeedbackFijo] = useState<{ fase: string; texto: string; aprobado: boolean } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fragmentosAudioRef = useRef<Blob[]>([]);
  const flujoAudioRef = useRef<MediaStream | null>(null);
  
  const textoAcumuladoActoRef = useRef<string[]>([]);
  
  const pantallaRef = useRef<'config' | 'jugando' | 'final'>('config');
  const faseActualRef = useRef<FaseActo>('intro');
  const historialLetraRef = useRef<MensajeChat[]>([]);

  useEffect(() => { pantallaRef.current = pantalla; }, [pantalla]);
  useEffect(() => { faseActualRef.current = faseActual; }, [faseActual]);
  useEffect(() => { historialLetraRef.current = historialLetra; }, [historialLetra]);

  // ⏱️ CRONÓMETRO POR ACTOS
  useEffect(() => {
    if (pantalla === 'jugando' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && pantalla === 'jugando') {
      avanzarFaseEstructural();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timeLeft, pantalla]);

  useEffect(() => {
    return () => {
      liberarMicrofono();
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // 📡 PRECARGA DE VOCES NATURALES DEL SISTEMA
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const liberarMicrofono = () => {
    if (flujoAudioRef.current) {
      flujoAudioRef.current.getTracks().forEach(track => track.stop());
      flujoAudioRef.current = null;
    }
  };

  const handleTiempoChange = (fase: FaseActo, valor: number) => {
    setTiemposConfig(prev => ({ ...prev, [fase]: valor }));
  };

  const iniciarGrabacionNativa = async (streamExistente?: MediaStream) => {
    if (pantallaRef.current !== 'jugando') return;
    try {
      fragmentosAudioRef.current = [];
      let stream = streamExistente || flujoAudioRef.current;
      if (!stream || !stream.active) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      flujoAudioRef.current = stream;

      const opciones = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : undefined;
      const mediaRecorder = new MediaRecorder(stream, opciones);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          fragmentosAudioRef.current.push(e.data);
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

      dectectorVozRef.current = {
        audioContext,
        analyser,
        habloAlMenosUnaVez: false,
        intervalo: setInterval(() => {
          const bufferDatos = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(bufferDatos);
          
          const promedioVolumen = bufferDatos.reduce((a, b) => a + b, 0) / bufferDatos.length;
          
          if (promedioVolumen > 10) {
            dectectorVozRef.current.habloAlMenosUnaVez = true;
          }
        }, 100)
      };

      mediaRecorder.start();
      setEscuchando(true);
      setIaHablando(false);
    } catch (error) {
      console.error("Error al iniciar grabación con VAD:", error);
    }
  };

  const detenerGrabacionYProcesar = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }
    
    setEscuchando(false);
    const mimeTypeUsado = mediaRecorderRef.current.mimeType;

    const { audioContext, intervalo, habloAlMenosUnaVez } = dectectorVozRef.current;
    if (intervalo) clearInterval(intervalo);
    if (audioContext && audioContext.state !== 'closed') audioContext.close();

    const obtenerBlobAudio = () => {
      return new Promise<Blob | null>((resolve) => {
        if (!mediaRecorderRef.current) return resolve(null);

        mediaRecorderRef.current.onstop = () => {
          if (fragmentosAudioRef.current.length === 0) {
            return resolve(null);
          }

          const audioBlob = new Blob(fragmentosAudioRef.current, { type: mimeTypeUsado });

          if (audioBlob.size < 1200) {
            return resolve(null);
          }

          if (habloAlMenosUnaVez || audioBlob.size > 3500) {
            resolve(audioBlob);
          } else {
            resolve(null);
          }
        };
        
        mediaRecorderRef.current.stop();
      });
    };

    const audioBlobListo = await obtenerBlobAudio();
    fragmentosAudioRef.current = []; 

    await procesarTurnoConversacional(audioBlobListo);
  };

  const reproducirVozIA = async (texto: string, callbackAlTerminar: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn("SpeechSynthesis no está soportado.");
      callbackAlTerminar();
      return;
    }

    window.speechSynthesis.cancel();
    setIaHablando(true);
    setEscuchando(false);

    const obtenerVozHumanaSinHelena = (): SpeechSynthesisVoice | null => {
      const voces = window.speechSynthesis.getVoices();
      if (voces.length === 0) return null;

      const vocesPermitidas = voces.filter(v => 
        v.lang.startsWith('es') && !v.name.toLowerCase().includes('helena')
      );

      const premium = vocesPermitidas.find(v => 
        v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural')
      );
      if (premium) return premium;

      const alternativaLocal = vocesPermitidas.find(v => 
        v.name.includes('Mónica') || v.name.includes('Jorge') || v.name.includes('Microsoft')
      );
      if (alternativaLocal) return alternativaLocal;

      return vocesPermitidas[0] ?? null;
    };

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
        setIaHablando(false);
        callbackAlTerminar();
      };

      utterance.onerror = (e) => {
        console.error("Error en síntesis de voz:", e);
        setIaHablando(false);
        callbackAlTerminar();
      };

      window.speechSynthesis.speak(utterance);
    }, 60);
  };

  const iniciarEjercicio = async () => {
    let streamInicial: MediaStream | null = null;
    try {
      streamInicial = await navigator.mediaDevices.getUserMedia({ audio: true });
      flujoAudioRef.current = streamInicial;
    } catch (err) {
      alert("¡El escenario requiere permisos de micrófono!");
      return;
    }

    setLoading(true);
    setLoadingTexto('El público está buscando ideas locas...');
    setHistorialLetra([]);
    setFaseActual('intro');
    textoAcumuladoActoRef.current = [];
    setUltimoFeedbackFijo(null);
    setInformeFinal({ intro: null, nudo: null, desenlace: null });

    const historialTitulos = titulos.length > 0 ? titulos.join(', ') : 'Ninguno todavía';

    const promptTitulo = `
[ROL]
Eres un espectador real, gamberro, divertido y muy espontáneo en un show de comedia de improvisación teatral. Estás entre el público y gritas una frase ingeniosa para que los actores arranquen su escena desde una situación estimulante.

[MISIÓN]
Inventa una frase inicial o título único de exactamente entre 4 y 7 palabras en español.

[🚨 REGLA CRÍTICA DE ORTOGRAFÍA Y GRAMÁTICA]
- Queda estrictamente PROHIBIDO inventar palabras o cometer errores de conjugación (como "mentiendo"). Asegúrate de que todos los verbos irregulares estén perfectamente conjugados en español real y correcto (ej: "mintiendo", "cuenten", "vuelen"). 

[REGLAS DE ORO PARA EL TONO (NATURALIDAD TOTAL)]
1. 🚨 PROHIBIDO EL TONO POÉTICO O METAFÓRICO: Evita palabras como "sol", "luna", "frágil", "alma", o frases filosóficas abstractas. Nadie grita poesía en un show de impro.
2. 🚨 FRASES DE PÚBLICO REAL: Debe sonar a algo que un espectador grita con energía, un chisme, una orden, una acusación, una queja o una confesión absurda.
3. VARIEDAD SINTÁCTICA: Está prohibido que todas tus frases empiecen por "Mi perro...", "Mi jefe..." o "El vecino...". Usa preguntas, imperativos (órdenes), exclamaciones o pon el tiempo/lugar al principio.

[FILTRO SEMÁNTICO (EVITAR REPETICIÓN)]
- Historial de títulos ya jugados: [${historialTitulos}]
🚨 REGLA DE ORO: No repitas conceptos, entornos ni palabras clave del historial. Si ya se usó una temática, salta a otra completamente distinta.

🚨 FILTRO DE CONTENIDO:
Nada de dramas oscuros, tragedies ni infidelidades serias. Buscamos comedia de enredos, situaciones ridículas y juego limpio.

[MECANISMO DE INSPIRACIÓN POR NIVEL: ${dificultad.toUpperCase()}]
Fuerza a tu lógica a imitar la estructura y la perfecta ortografía de estos ejemplos reales:

- FÁCIL (Enredos cotidianos y órdenes directas):
  * "¡Saca inmediatamente ese pato del coche!"
  * "Mañana cerramos la fábrica de almohadas"
  * "¿Quién ha metido los pantalones en el lavavajillas?"

- MEDIA (Chismes, sospechas y situaciones incómodas):
  * "Creo que el televisor nos está mintiendo"
  * "No debiste darle café a ese maniquí"

- DIFÍCIL (Secretos absurdos, conspiraciones cotidianas y exageraciones):
  * "Si parpadeas, el pasillo se hace largo"
  * "Cuidado con los tomates, huelen el miedo"

[CONTROL DE CALIDAD FINAL - ANTES DE CONTESTAR]
Revisa tu frase antes de soltarla.

[FORMATO DE SALIDA CRÍTICO]
Devuelve ÚNICAMENTE las palabras de la frase. 
Está PROHIBIDO incluir comillas ("), puntos finales (.), introducciones o explicaciones.

Frase final:`;

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      if (!apiKey) throw new Error("Falta la API Key.");
      const groq = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1", dangerouslyAllowBrowser: true });

      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: promptTitulo }],
        max_tokens: 40,
      });

      const nuevoTitulo = response.choices[0]?.message?.content?.trim() || '¡El misterio del calcetín perdido!';
      setTitulo(nuevoTitulo);
      setTitulos((prev) => [...prev, nuevoTitulo]);
      setTimeLeft(tiemposConfig.intro);
      setPantalla('jugando');
      setLoading(false);
      
      setTimeout(() => { iniciarGrabacionNativa(streamInicial!); }, 100);
    } catch (error) {
      console.error(error);
      liberarMicrofono();
      setPantalla('config');
      setLoading(false);
    }
  };

  const procesarTurnoConversacional = async (audioBlob: Blob | null) => {
    if (pantallaRef.current !== 'jugando') return;
    setLoading(true);
    setLoadingTexto('Procesando réplica...');

    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (!apiKey) { setLoading(false); iniciarGrabacionNativa(); return; }
    const groq = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1", dangerouslyAllowBrowser: true });

    let transcripcionUsuario = "";

    if (audioBlob) {
      try {
        let tipoLimpio = audioBlob.type.split(';')[0]; 
        let extension = tipoLimpio.includes('mp4') || tipoLimpio.includes('m4a') ? 'm4a' : 'webm';
        const archivoAudio = new File([audioBlob], `impro.${extension}`, { type: tipoLimpio });
        
        const respuestaWhisper = await groq.audio.transcriptions.create({
          file: archivoAudio, 
          model: 'whisper-large-v3', 
          language: 'es', 
          temperature: 0.0,
          prompt: "." 
        });
        
        let textoCrudo = respuestaWhisper.text?.trim() || '';
        
        const esAlucinacionAudio = (texto: string) => {
          const normalizado = texto.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¡¿]/g, "").trim();
          const patronesFantasmas = [
            /^gracias$/, /^gracias por ver$/, /^gracias por ver el video$/, 
            /^subtitulos$/, /^subtitulado$/, /^reproduccion$/, /^amén$/, 
            /^oiga$/, /^mira$/, /^reproducir$/, /^por ver$/, /^todos$/
          ];
          if (normalizado.length <= 2) return true;
          return patronesFantasmas.some(rx => rx.test(normalizado));
        };

        if (esAlucinacionAudio(textoCrudo)) {
          transcripcionUsuario = "";
        } else {
          transcripcionUsuario = textoCrudo;
        }

      } catch (err) { 
        console.error("Error en Whisper:", err); 
      }
    }

    if (!transcripcionUsuario || transcripcionUsuario.trim() === "") {
      transcripcionUsuario = "[SIN_RESPUESTA]";
    }

    textoAcumuladoActoRef.current.push(transcripcionUsuario);

    const nuevoHistorial: MensajeChat[] = [...historialLetra, { role: 'user', content: transcripcionUsuario }];
    setHistorialLetra(nuevoHistorial);

    try {
        const response = await groq.chat.completions.create({
  model: 'llama-3.1-8b-instant',
  messages: [
    { 
      role: 'system', 
      content: `ERES UN ACTOR DE IMPROVISACIÓN (TU PERSONAJE):
- Eres el compañero de escena del usuario. Hablas SIEMPRE en primera persona ("Yo", "Nosotros").
- ESTÁ PROHIBIDO ser narrador. No describas la escena, no cuentes lo que ocurre, solo actúa y habla como un personaje dentro de la historia.
- Mantén la coherencia interna: Si el usuario estableció que estamos en una cocina, no inventes que estamos en Marte. Trata los elementos ya mencionados como realidades físicas.

REGLAS DE ORO DE LA IMPROVISACIÓN:
1. El Mantra del "Sí, y...": Acepta lo que el usuario dijo y añade un detalle que sea una consecuencia lógica de lo anterior. Si el usuario propone una locura, aceptamos la locura, pero mantenemos la lógica interna de esa locura.
2. Acción-Reacción: No cambies de tema drásticamente. Si el usuario habla de un perro, responde sobre el perro, no sobre una pizza.
3. Servicio al Compañero: Tu objetivo es que la escena crezca orgánicamente, no que sea una lucha de egos.
4. Coherencia Absurda: Podemos jugar en un mundo fantástico o disparatado, pero las leyes de ese mundo deben ser constantes. Si algo pasó, sigue siendo verdad.

⚠️ REGLAS ESTRICTAS DE FORMATO:
- HABLA COMO UN PERSONAJE: Di tus frases tal cual, sin guiones, sin nombres de personajes (ej: "¡No toques eso!" y no "Juan: ¡No toques eso!").
- MÁXIMO 20 PALABRAS: Conciso, directo, al grano.
- PROHIBIDO NARRAR: Jamás uses expresiones como "El personaje entra", "La escena transcurre", "El perro mira".
- CERO PUNTUACIÓN DE GUION: Está prohibido incluir acotaciones, paréntesis, asteriscos o emociones entre corchetes.` 
    },
    ...nuevoHistorial
  ],
  temperature: 0.7, // Bajamos un poco la temperatura para mayor coherencia
  max_tokens: 60,
});

      const respuestaIA = response.choices[0]?.message?.content?.trim() || '¡Continúa, te escucho!';
      setHistorialLetra(prev => [...prev, { role: 'assistant', content: respuestaIA }]);
      setLoading(false);

      reproducirVozIA(respuestaIA, () => {
        if (pantallaRef.current === 'jugando') {
          iniciarGrabacionNativa();
        }
      });
    } catch (error) {
      console.error(error);
      setLoading(false);
      if (pantallaRef.current === 'jugando') iniciarGrabacionNativa();
    }
  };

  // 🔄 2. Transiciones de la Máquina de Estados (De 4 saltos a 3)
  const avanzarFaseEstructural = () => {
    const faseTerminada = faseActual;
    const textoDelActo = textoAcumuladoActoRef.current.join(' ');
    
    ejecutarEvaluacionDirectorEnBackstage(faseTerminada, textoDelActo);

    textoAcumuladoActoRef.current = [];

    if (faseTerminada === 'intro') {
      setFaseActual('nudo');
      setTimeLeft(tiemposConfig.nudo);
      iniciarGrabacionNativa();
    } else if (faseTerminada === 'nudo') {
      setFaseActual('desenlace');
      setTimeLeft(tiemposConfig.desenlace);
      iniciarGrabacionNativa();
    } else if (faseTerminada === 'desenlace') {
      finalizarFuncionYMostrarInforme();
    }
  };
  
  // 📋 3. Reconfiguración de los Criterios de Evaluación del Director
  const ejecutarEvaluacionDirectorEnBackstage = async (fase: FaseActo, textoActor: string) => {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      console.error("Falta la API Key para la evaluación.");
      return;
    }
    
    const groq = new OpenAI({ 
      apiKey: apiKey.trim(), 
      baseURL: "https://api.groq.com/openai/v1", 
      dangerouslyAllowBrowser: true 
    });
    
    const propuestaFinal = textoActor.trim() ? textoActor : '[SIN_RESPUESTA]';

    let consignasEspecificas = '';
    if (faseActual === 'intro') {
      consignasEspecificas = `OBJETIVO DE LA EVALUACIÓN:
- Analiza ÚNICAMENTE la propuesta del actor dentro de <texto_del_actor>. El título es fijo y no se juzga.
- Para otorgar "aprobado": true, el actor debe haber propuesto una premisa, acción, personaje o conflicto que guarde una relación lógica, cómica o temática con el título "${titulo}".
- No exijas genialidad artística: si el texto continúa, expande o se inspira coherentemente en el universo del título, dalo por bueno.
🚨 REGLA DE RECHAZO CRÍTICA: Si el usuario evade el título por completo, dice sinsentidos inconexos o un saludo básico, debes poner "aprobado": false de inmediato.`;
      
    } else if (faseActual === 'nudo') {
      // ⚡ COMBINACIÓN DE LOS DOS PUNTOS DE GIRO EN EL NUDO
      consignasEspecificas = `OBJETIVO DE LA EVALUACIÓN DEL NUDO:
- Analiza minuciosamente todo el bloque del libreto en este acto.
- CRITERIO CRÍTICO EXIGIDO: El actor debe haber introducido o reaccionado dinámicamente a DOS PUNTOS DE GIRO DISTINTOS durante este bloque. 
  * GIRO 1: Una revelación, secreto, imprevisto o cambio repentino de dirección sobre lo planteado en la introducción.
  * GIRO 2: Un incremento de la complicación, factor contrarreloj, amenaza absurda o elemento límite de presión que vuelva caótico el conflicto.
- Para otorgar "aprobado": true, debes ver reflejada en la interacción del actor esta doble evolución en la trama. Si la escena se estancó de forma plana en un solo chiste, repite la introducción o carece de estos giros, debes poner "aprobado": false.`;
      
    } else if (faseActual === 'desenlace') {
      consignasEspecificas = `OBJETIVO DE LA EVALUACIÓN:
- Analiza ÚNICAMENTE la propuesta del actor dentro de <texto_del_actor>.
- El actor debe dar un cierre o resolución final, idealmente divertido o inesperado, que concluya la cadena de eventos previos.
- Si el texto carece de sustancia resolutiva o corta la escena abruptamente sin cerrar nada, "aprobado" DEBE ser false.`;
    }

    const libretoDelActo = historialLetra
      .map(m => `${m.role === 'user' ? 'ACTOR (Usuario)' : 'CO-ACTOR (IA)'}: ${m.content}`)
      .join('\n');

    const promptDirector = `
        [ROL]
        Eres un Director de teatro de improvisación hiperactivo, técnico, apasionado y muy exigente. Hablas siempre utilizando jerga teatral ("¡Arriba el telón!", "¡Falta ritmo!", "¡Puro drama!", "¡Eso es actuar!").

        [MISIÓN DE ANÁLISIS]
        Tu único trabajo es juzgar si el desempeño del ACTOR (Usuario) dentro del transcurso del acto cumple con el objetivo técnico solicitado. 

        Evalúa su coherencia, su capacidad de propuesta y su adaptación al juego dramático basándote en el [LIBRETO REAL DEL ACTO] provisto abajo. El título y el hilo conversacional son contextos fijos para medir su rendimiento. Juzga al ACTOR, no al escenario.

        [CONSIGNAS ESPECÍFICAS PARA ESTE ACTO]
        ${consignasEspecificas}

        [DATOS DE ENTRADA DE LA ESCENA]
        <titulo_escena_context>${titulo}</titulo_escena_context>

        [LIBRETO REAL DEL ACTO]
        ${libretoDelActo || 'El actor no ha intervenido.'}

        🚨 [REGLA INQUEBRANTABLE DE MUTISMO]
        - Si el ACTOR (Usuario) no tiene ninguna línea registrada en el libreto o solo el texto "[SIN_RESPUESTA]", el campo "aprobado" DEBE ser false de manera matemática. Lanza una bronca divertida por quedarse congelado.

        [FORMATO DE SALIDA ESTRICTO]
        Devuelve EXCLUSIVAMENTE un objeto JSON con esta estructura exacta:
        {
        "aprobado": true o false,
        "comentario": "Tu crítica teatral breve de máximo 35 palabras utilizando tu jerga, validando objetivamente por qué la propuesta del actor funciona con el co-actor y el título, o detallando qué faltó."
    }`;

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: promptDirector }],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: "json_object" } 
      });

      const textoCrudo = response.choices[0]?.message?.content?.trim() || '{}';
      
      let resultado;
      try {
        resultado = JSON.parse(textoCrudo);
      } catch (parseError) {
        console.warn("Falló el parseo directo, intentando limpiar el JSON...", parseError);
        const inicioJson = textoCrudo.indexOf('{');
        const finJson = textoCrudo.lastIndexOf('}');
        if (inicioJson !== -1 && finJson !== -1) {
          const jsonLimpio = textoCrudo.substring(inicioJson, finJson + 1);
          resultado = JSON.parse(jsonLimpio);
        } else {
          throw new Error("No se detectó estructura JSON elemental.");
        }
      }

      const nombresLegibles: Record<string, string> = { intro: 'Acto I (Intro)', nudo: 'Acto II (Nudo: Dos Giros)', desenlace: 'Acto III (Desenlace)' };

      setInformeFinal(prev => ({
        ...prev,
        [fase]: {
          aprobado: !!resultado.aprobado,
          comentario: resultado.comentario || 'Cumple con el ritmo del libreto.',
          transcripcionAcumulada: propuestaFinal === '[SIN_RESPUESTA]' ? 'Sin intervención de voz.' : propuestaFinal
        }
      }));

      setUltimoFeedbackFijo({
        fase: nombresLegibles[fase] || fase.toUpperCase(),
        texto: resultado.comentario || 'Ritmo de escena adecuado.',
        aprobado: !!resultado.aprobado
      });

    } catch (e) {
      console.error("Error evaluando acto en backstage:", e);
      setInformeFinal(prev => ({
        ...prev,
        [fase]: {
          aprobado: true, 
          comentario: '¡El director asiente desde la oscuridad! El show debe continuar.',
          transcripcionAcumulada: propuestaFinal === '[SIN_RESPUESTA]' ? 'Sin intervención de voz.' : propuestaFinal
        }
      }));
    }
  };

  const finalizarFuncionYMostrarInforme = () => {
    liberarMicrofono();
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setPantalla('final');
  };

  const reiniciarTeatroCompleto = () => {
    liberarMicrofono();
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setTitulo('');
    setHistorialLetra([]);
    setPantalla('config');
    setFaseActual('intro');
    setUltimoFeedbackFijo(null);
    setIaHablando(false);
    setEscuchando(false);
  };

  // 🎨 4. Renderizado de Pantalla de Feedback Final
  if (pantalla === 'final') {
    const actos = [
      { id: 'intro', nombre: 'Acto I: Introducción' },
      { id: 'nudo', nombre: 'Acto II: Nudo (Doble Giro)' },
      { id: 'desenlace', nombre: 'Acto III: Desenlace Final' }
    ];

    const aprobadosTotales = actos.every(acto => informeFinal[acto.id as FaseActo]?.aprobado === true);

    return (
      <div className={styles.teatroPageWrapper}>
        <div className={styles.teatroContainer}>
          <header className={styles.teatroHeader}>
            <h1>{aprobadosTotales ? '💐 ¡FUNCIÓN CONSEGUIDA! 🏆' : '🎬 FIN DE LA FUNCIÓN'}</h1>
            <p className={styles.subtitulo}>Libreto Completo y Calificaciones</p>
          </header>

          <main className={styles.bloqueFeedback}>
            <div className={styles.carteleraTitulo}>
              <h2>OBRA: {titulo}</h2>
            </div>

            <h3 style={{ borderBottom: '2px solid var(--color-telon)', paddingBottom: '5px', color: 'var(--color-telon)' }}>📖 Libreto Completo de la Función</h3>
            <div style={{ 
              backgroundColor: '#fdfbf7', 
              padding: '15px', 
              borderRadius: '6px', 
              border: '1px solid #e2d6b5',
              maxHeight: '250px', 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {historialLetra.length === 0 ? (
                <p style={{ color: '#7f8c8d', fontStyle: 'italic', margin: 0 }}>No se registraron líneas de diálogo.</p>
              ) : (
                historialLetra.map((m, i) => (
                  <p key={i} style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>
                    <strong style={{ color: m.role === 'user' ? '#2980b9' : '#c0392b' }}>
                      {m.role === 'user' ? '👤 Tú: ' : '🤖 Co-Actor: '}
                    </strong>
                    {m.content === "[SIN_RESPUESTA]" ? "..." : m.content}
                  </p>
                ))
              )}
            </div>

            <h3 style={{ borderBottom: '2px solid var(--color-telon)', paddingBottom: '5px', color: 'var(--color-telon)' }}>📋 Cuaderno del Director</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              {actos.map(acto => {
                const evalActo = informeFinal[acto.id as FaseActo];
                return (
                  <div key={acto.id} className={styles.recuadroExplicativo} style={{ backgroundColor: '#fff', border: '1px solid #ddd', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span style={{ color: '#333' }}>{acto.nombre}</span>
                      <span style={{ color: evalActo?.aprobado ? '#27ae60' : '#b92929' }}>
                        {evalActo ? (evalActo.aprobado ? '✅ APTO' : '❌ NO APTO') : '⏸️ No procesado'}
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: '#555' }}>
                      <strong>Director:</strong> {evalActo?.comentario || 'Analizando la estructura narrativa...'}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className={styles.recuadroExplicativo} style={{ backgroundColor: aprobadosTotales ? '#e8f8f5' : '#fdedec', textAlign: 'center', border: 'none', padding: '15px' }}>
              <h4 style={{ margin: 0, color: aprobadosTotales ? '#27ae60' : '#b92929' }}>
                VEREDICTO: {aprobadosTotales ? '🎓 ESTRUCTURA IMPECABLE' : '🎭 REQUIERE REPASO'}
              </h4>
            </div>

            <button className={`${styles.btnTeatro} ${styles.btnComenzar}`} style={{ marginTop: '20px' }} onClick={reiniciarTeatroCompleto}>
              🔄 Nueva Obra
            </button>
          </main>
        </div>
      </div>
    );
  }

  // 🎨 5. Renderizado de Interfaz Principal de Juego y Configuración
  return (
    <div className={styles.teatroPageWrapper}>
      <div className={styles.teatroContainer}>
        <header className={styles.teatroHeader}>
        <h1>🎭 ¡Batalla de Impro! 🎬</h1>
          <p className={styles.subtitulo}>
            {pantalla === 'config' ? 'Ajusta los tiempos del libreto por actos' : `Acto en Curso: ${faseActual.toUpperCase()}`}
          </p>
        </header>

        <main className={styles.escenario}>
          {pantalla === 'config' && (
            <div className={styles.bloqueConfig}>
              <div className={styles.recuadroReglas}>
                <strong>📋 Reglas de la Academia:</strong> Cada acto se cerrará automáticamente al agotarse su tiempo. Habla con fluidez con la IA. El director calificará cada bloque fijando su nota en el monitor de abajo y verás el informe completo al terminar.
              </div>

              <br />
              <div className={styles.controlesGroup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label className={styles.labelStyle}>
                  Tono del Escenario:
                  <select className={styles.selectStyle} value={dificultad} onChange={(e) => setDificultad(e.target.value)}>
                    <option value="fácil">Cotidiano</option>
                    <option value="media">Absurdo</option>
                    <option value="difícil">Surrealista</option>
                  </select>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', width: '100%' }}>
                  <label className={styles.labelStyle}>
                    <span>⏱️ Intro</span>
                    <input type="number" className={styles.inputTiempoNumber} value={tiemposConfig.intro} onChange={(e) => handleTiempoChange('intro', Number(e.target.value))} />
                  </label>
                  <label className={styles.labelStyle}>
                    <span>⚡ Nudo (2 Giros)</span>
                    <input type="number" className={styles.inputTiempoNumber} value={tiemposConfig.nudo} onChange={(e) => handleTiempoChange('nudo', Number(e.target.value))} />
                  </label>
                  <label className={styles.labelStyle}>
                    <span>🏁 Desenlace</span>
                    <input type="number" className={styles.inputTiempoNumber} value={tiemposConfig.desenlace} onChange={(e) => handleTiempoChange('desenlace', Number(e.target.value))} />
                  </label>
                </div>
              </div>

              <button className={`${styles.btnTeatro} ${styles.btnComenzar}`} style={{ marginTop: '25px' }} onClick={iniciarEjercicio} disabled={loading}>
                {loading ? 'Inicializando Libreto...' : '¡Subir el Telón! 🚀'}
              </button>
            </div>
          )}

          {pantalla === 'jugando' && (
            <div className={styles.bloqueJuego}>
              <div className={styles.cronometro}>
                ⏱️ {timeLeft}s
              </div>

              <div className={styles.carteleraTitulo}>
                <h2>{titulo}</h2>
              </div>

              <div className={styles.recuadroExplicativo} style={{ backgroundColor: '#fffdf5', border: '1px solid var(--color-oro)' }}>
                {faseActual === 'intro' && <p style={{ color: '#b92929', textAlign: 'center' }}><strong>🎯 Misión Intro</strong><br/>Entabla el contexto básico, la relación con tu compañero e intégrate con el título.</p>}
                {faseActual === 'nudo' && <p style={{ color: '#b92929', textAlign: 'center' }}><strong>⚡ Misión Nudo (Doble Giro)</strong><br/>¡Desata el caos! Introduce una revelación inesperada Y añade un factor límite o amenaza para complicarlo todo.</p>}
                {faseActual === 'desenlace' && <p style={{ color: '#27ae60', textAlign: 'center' }}><strong>🏁 Misión Desenlace</strong> Guía la improvisación hacia un final ingenioso o divertido.</p>}
              </div>

              <div style={{
                backgroundColor: '#f8f9fa',
                borderLeft: ultimoFeedbackFijo ? (ultimoFeedbackFijo.aprobado ? '5px solid #27ae60' : '5px solid #e74c3c') : '5px solid #bdc3c7',
                padding: '12px 15px',
                borderRadius: '4px',
                marginBottom: '15px',
                fontSize: '0.9rem',
                color: '#333'
              }}>
                <span style={{ fontWeight: 'bold', fontSize: '1rem', display: 'block', color: '#7f8c8d', marginBottom: '3px', textAlign: 'center', paddingBottom: '5px' }}>
                  📡 Revisión del Director
                </span>
                {ultimoFeedbackFijo ? (
                  <p style={{ margin: 0, textAlign: 'center' }}>
                    <strong>{ultimoFeedbackFijo.fase}:</strong> <span style={{ color: ultimoFeedbackFijo.aprobado ? '#27ae60' : '#b92929', fontWeight: 'bold' }}>{ultimoFeedbackFijo.aprobado ? '[APTO]' : '[NO APTO]'}</span> {ultimoFeedbackFijo.texto}
                  </p>
                ) : (
                  <p style={{ margin: 0, color: '#7f8c8d', fontStyle: 'italic' }}>El director está observando en silencio desde el patio de butacas. Dará su primera nota al cambiar de acto...</p>
                )}
              </div>

              <div className={`${styles.recuadroTranscripcion} ${escuchando ? styles.ondaActiva : ''}`}>
                {loading ? (
                  <p className={styles.textoHablado}>⏳ {loadingTexto}</p>
                ) : escuchando ? (
                  <p className={styles.textoHablado}>🎙️ Habla ahora...</p>
                ) : iaHablando ? (
                  <p className={styles.textoHablado}>🔊 Tu compañero responde...</p>
                ) : (
                  <p className={styles.placeholderVoz}>Esperando señal del apuntador...</p>
                )}
              </div>

              <div className={styles.historialRecorte}>
                {historialLetra.slice(-3).map((m, i) => (
                  <div key={i} className={`${styles.lineaDialogo} ${m.role === 'user' ? styles.user : styles.assistant}`}>
                    <strong>{m.role === 'user' ? 'Tú: ' : 'Co-Actor: '}</strong>
                    {m.content === "[SIN_RESPUESTA]" ? "..." : m.content}
                  </div>
                ))}
              </div>

              <div className={styles.panelAcciones}>
                <button 
                  className={`${styles.btnTeatro} ${styles.btnEnviar}`} 
                  onClick={detenerGrabacionYProcesar} 
                  disabled={!escuchando || loading || iaHablando}
                >
                  {escuchando ? '🔔 Enviar' : 'Escuchando...'}
                </button>
                <button className={`${styles.btnTeatro} ${styles.btnReiniciar}`} onClick={finalizarFuncionYMostrarInforme}>
                  🛑 Concluir
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}