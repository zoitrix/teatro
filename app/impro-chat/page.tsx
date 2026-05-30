'use client';

import React, { useState, useEffect, useRef } from 'react';
import { OpenAI } from 'openai';
import styles from './impro.module.css';

interface MensajeChat {
  role: 'user' | 'assistant';
  content: string;
}

type FaseActo = 'intro' | 'giro1' | 'giro2' | 'desenlace';

interface TiemposConfig {
  intro: number;
  giro1: number;
  giro2: number;
  desenlace: number;
}

interface EvaluacionActo {
  aprobado: boolean;
  comentario: string;
  transcripcionAcumulada: string;
}

interface InformeDirector {
  intro: EvaluacionActo | null;
  giro1: EvaluacionActo | null;
  giro2: EvaluacionActo | null;
  desenlace: EvaluacionActo | null;
}

export default function ImproChatPage() {
  const [dificultad, setDificultad] = useState<string>('media');
  const [tiemposConfig, setTiemposConfig] = useState<TiemposConfig>({
    intro: 60,
    giro1: 120,
    giro2: 120,
    desenlace: 60
  });

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
    giro1: null,
    giro2: null,
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

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) fragmentosAudioRef.current.push(e.data);
      };

      mediaRecorder.start(250);
      setEscuchando(true);
      setIaHablando(false);
    } catch (error) {
      console.error(error);
    }
  };

  const detenerGrabacionYProcesar = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }
    setEscuchando(false);
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(fragmentosAudioRef.current, { type: 'audio/mpeg' });
      await procesarTurnoConversacional(audioBlob);
    };
    mediaRecorderRef.current.stop();
  };

  const reproducirVozIA = (texto: string, callbackAlTerminar: () => void) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => { setIaHablando(false); callbackAlTerminar(); };
      utterance.onerror = () => { setIaHablando(false); callbackAlTerminar(); };
      setIaHablando(true);
      setEscuchando(false);
      window.speechSynthesis.speak(utterance);
    } else {
      callbackAlTerminar();
    }
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
    setInformeFinal({ intro: null, giro1: null, giro2: null, 'desenlace': null });

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
Nada de dramas oscuros, tragedias ni infidelidades serias. Buscamos comedia de enredos, situaciones ridículas y juego limpio.

[MECANISMO DE INSPIRACIÓN POR NIVEL: ${dificultad.toUpperCase()}]
Fuerza a tu lógica a imitar la estructura y la perfecta ortografía de estos ejemplos reales:

- FÁCIL (Enredos cotidianos y órdenes directas):
  * "¡Saca inmediatamente ese pato del coche!" (Una orden loca)
  * "Mañana cerramos la fábrica de almohadas" (Una noticia bomba)
  * "¿Quién ha metido los pantalones en el lavavajillas?" (Una bronca doméstica)
  * "Por favor, devuélveme mis cejas postizas" (Una súplica ridícula)

- MEDIA (Chismes, sospechas y situaciones incómodas):
  * "Creo que el televisor nos está mintiendo" (Una sospecha absurda - ¡"mintiendo" con I!)
  * "No debiste darle café a ese maniquí" (Un reproche divertido)
  * "Ayer me persiguió un semáforo con prisa" (Una anécdota loca)
  * "¿Desde cuándo los espaguetis tienen opiniones políticas?" (Una duda ridícula)

- DIFÍCIL (Secretos absurdos, conspiraciones cotidianas y exageraciones):
  * "Si parpadeas, el pasillo se hace largo" (Una advertencia misteriosa)
  * "Cuidado con los tomates, huelen el miedo" (Un peligro absurdo)
  * "Tu doble de acción está cobrando más que tú" (Un chisme de camerinos)
  * "Creo que nos está vigilando el panadero" (Una paranoia divertida)

[CONTROL DE CALIDAD FINAL - ANTES DE CONTESTAR]
Revisa tu frase antes de soltarla: ¿Las palabras existen y están bien escritas en castellano? ¿Suena natural? ¿La gritaría alguien del público en un teatro para reírse? ¿Tiene entre 4 y 7 palabras? Si suena a poesía o tiene dudas ortográficas, bórrala y genera otra.

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
    let transcripcionUsuario = '';

    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (!apiKey) { setLoading(false); iniciarGrabacionNativa(); return; }
    const groq = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1", dangerouslyAllowBrowser: true });

    if (audioBlob && audioBlob.size > 4000) {
      try {
        const archivoAudio = new File([audioBlob], "impro.mp3", { type: 'audio/mp3' });
        const respuestaWhisper = await groq.audio.transcriptions.create({
          file: archivoAudio, model: 'whisper-large-v3', language: 'es', temperature: 0.0,
        });
        transcripcionUsuario = respuestaWhisper.text?.trim() || '';
      } catch (err) { console.error(err); }
    }

    if (!transcripcionUsuario) {
      setLoading(false);
      if (pantallaRef.current === 'jugando') iniciarGrabacionNativa();
      return;
    }

    textoAcumuladoActoRef.current.push(transcripcionUsuario);

    const nuevoHistorial: MensajeChat[] = [...historialLetra, { role: 'user', content: transcripcionUsuario }];
    setHistorialLetra(nuevoHistorial);

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: `Eres un actor de improvisación teatral rápido y cómico. Estamos en el acto de ${faseActualRef.current.toUpperCase()} de la obra titulada "${titulo}". Responde directamente al usuario siguiendo el juego dramático. Devuelve SOLO tu línea de diálogo limpia (máximo 20 palabras), sin acotaciones ni paréntesis.` },
          ...nuevoHistorial
        ],
        temperature: 0.8,
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

  const avanzarFaseEstructural = () => {
    const faseTerminada = faseActual;
    const textoDelActo = textoAcumuladoActoRef.current.join(' ');
    
    ejecutarEvaluacionDirectorEnBackstage(faseTerminada, textoDelActo);

    textoAcumuladoActoRef.current = [];

    if (faseTerminada === 'intro') {
      setFaseActual('giro1');
      setTimeLeft(tiemposConfig.giro1);
      iniciarGrabacionNativa();
    } else if (faseTerminada === 'giro1') {
      setFaseActual('giro2');
      setTimeLeft(tiemposConfig.giro2);
      iniciarGrabacionNativa();
    } else if (faseTerminada === 'giro2') {
      setFaseActual('desenlace');
      setTimeLeft(tiemposConfig.desenlace);
      iniciarGrabacionNativa();
    } else if (faseTerminada === 'desenlace') {
      finalizarFuncionYMostrarInforme();
    }
    
  };const ejecutarEvaluacionDirectorEnBackstage = async (fase: FaseActo, textoActor: string) => {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.error("Falta la API Key para la evaluación.");
    return;
  }
  
  // 🔽 CONFIGURACIÓN CAMBIADA PARA EVITAR EL BUG DE URL 🔽
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

🚨 REGLA DE RECHAZO CRÍTICA:
- Si el usuario evade el título por completo, dice sinsentidos inconexos, palabras sueltas o un saludo básico (ej: "hola", "buenas", "¡sube el telón!"), debes poner "aprobado": false de inmediato.`;
      
    } else if (faseActual === 'giro1') {
      consignasEspecificas = `OBJETIVO DE LA EVALUACIÓN:
- Analiza ÚNICAMENTE la propuesta del actor dentro de <texto_del_actor>.
- El actor debe introducir un PRIMER PUNTO DE GIRO (un imprevisto, secreto o revelación repentina) que altere directamente el rumbo de la introducción previa.
- Verifica si la propuesta reacciona al contexto dramático heredado. Si es un saludo, texto vacío o una evasión sin relación, "aprobado" DEBE ser false.`;
      
    } else if (faseActual === 'giro2') {
      consignasEspecificas = `OBJETIVO DE LA EVALUACIÓN:
- Analiza ÚNICAMENTE la propuesta del actor dentro de <texto_del_actor>.
- El actor debe sumar un SEGUNDO PUNTO DE GIRO (añadir más presión, peligro, complicación extrema o un factor contrarreloj) sobre lo que ya ocurrió en la Intro y el Giro 1 .
- Si el texto está vacío, es inconexo o no añade ninguna complicación a la narrativa previa, "aprobado" DEBE ser false.`;
      
    } else if (faseActual === 'desenlace') {
      consignasEspecificas = `OBJETIVO DE LA EVALUACIÓN:
- Analiza ÚNICAMENTE la propuesta del actor dentro de <texto_del_actor>.
- El actor debe dar un cierre o resolución final, idealmente divertido o inesperado, que concluya la cadena de eventos previos (Intro y Giros:).
- Si el texto carece de sustancia resolutiva o corta la escena abruptamente sin cerrar nada, "aprobado" DEBE ser false.`;
    }

    const promptDirector = `
[ROL]
Eres un Director de teatro de improvisación hiperactivo, técnico, apasionado y muy exigente. Hablas siempre utilizando jerga teatral ("¡Arriba el telón!", "¡Falta ritmo!", "¡Puro drama!", "¡Eso es actuar!").

[MISIÓN DE ANÁLISIS]
Tu único trabajo es juzgar si el <texto_del_actor> cumple con el objetivo técnico del acto actual. El título y el historial son contextos fijos para medir la coherencia; ESTÁ PROHIBIDO evaluar si el título es creativo o lo que aporta. Juzga al ACTOR, no al escenario.

[CONSIGNAS ESPECÍFICAS PARA ESTE ACTO]
${consignasEspecificas}

[DATOS DE ENTRADA DE LA ESCENA]
<titulo_escena_context>${titulo}</titulo_escena_context>
<texto_del_actor>${propuestaFinal}</texto_del_actor>

🚨 [REGLA INQUEBRANTABLE DE MUTISMO]
- Si <texto_del_actor> es exactamente "[SIN_RESPUESTA]", el campo "aprobado" DEBE ser false de manera matemática. Lanza una bronca divertida por quedarse congelado o hacer un mutismo.
- Si hay cualquier otra propuesta escrita, ignora esta regla de mutismo y evalúala bajo los criterios normales detallados arriba.

[FORMATO DE SALIDA ESTRICTO]
Devuelve EXCLUSIVAMENTE un objeto JSON con esta estructura exacta:
{
  "aprobado": true o false,
  "comentario": "Tu crítica teatral..."
}`;

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: promptDirector }],
        temperature: 0.1,
        max_tokens: 150,
        // ✨ FUERZA EL MODO JSON NATIVO EN GROQ ✨
        response_format: { type: "json_object" } 
      });

      const textoCrudo = response.choices[0]?.message?.content?.trim() || '{}';
      
      let resultado;
      try {
        // Al usar response_format, el texto viene limpio en un 99.9% de los casos
        resultado = JSON.parse(textoCrudo);
      } catch (parseError) {
        console.warn("Fallo el parseo directo, intentando limpiar el JSON...", parseError);
        // Fallback por si acaso vienen caracteres raros alrededor del JSON
        const inicioJson = textoCrudo.indexOf('{');
        const finJson = textoCrudo.lastIndexOf('}');
        if (inicioJson !== -1 && finJson !== -1) {
          const jsonLimpio = textoCrudo.substring(inicioJson, finJson + 1);
          resultado = JSON.parse(jsonLimpio);
        } else {
          throw new Error("No se detectó estructura JSON elemental.");
        }
      }

      setInformeFinal(prev => ({
        ...prev,
        [fase]: {
          aprobado: !!resultado.aprobado,
          comentario: resultado.comentario || 'Cumple con el ritmo del libreto.',
          transcripcionAcumulada: propuestaFinal === '[SIN_RESPUESTA]' ? 'Sin intervención de voz.' : propuestaFinal
        }
      }));

      const nombresLegibles: Record<string, string> = { intro: 'Acto I (Intro)', giro1: 'Acto II (1er Giro)', giro2: 'Acto III (2do Giro)', desenlace: 'Acto IV (Desenlace)' };
      setUltimoFeedbackFijo({
        fase: nombresLegibles[fase] || fase.toUpperCase(),
        texto: resultado.comentario || 'Ritmo de escena adecuado.',
        aprobado: !!resultado.aprobado
      });

    } catch (e) {
      console.error("Error evaluando acto en backstage:", e);
      // 🛡️ CONTROL DE DAÑOS: Si la IA explota, la app continúa y no se congela
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

  // 💐 PANTALLA 3: RESUMEN FINAL CON DIÁLOGO COMPLETO
  if (pantalla === 'final') {
    const actos = [
      { id: 'intro', nombre: 'Acto I: Introducción' },
      { id: 'giro1', nombre: 'Acto II: Primer Giro' },
      { id: 'giro2', nombre: 'Acto III: Segundo Giro' },
      { id: 'desenlace', nombre: 'Acto IV: Desenlace Final' }
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

            {/* 📖 SECCIÓN NUEVA: EL GUION COMPLETO DE LA OBRA */}
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
                    {m.content}
                  </p>
                ))
              )}
            </div>

            {/* 📋 EVALUACIÓN POR ACTOS */}
            <h3 style={{ borderBottom: '2px solid var(--color-telon)', paddingBottom: '5px', color: 'var(--color-telon)' }}>📋 Cuaderno del Director</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              {actos.map(acto => {
                const evalActo = informeFinal[acto.id as FaseActo];
                return (
                  <div key={acto.id} className={styles.recuadroExplicativo} style={{ backgroundColor: '#fff', border: '1px solid #ddd', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span style={{ color: '#333' }}>{acto.nombre}</span>
                      <span style={{ color: evalActo?.aprobado ? '#27ae60' : '#b92929' }}>
                        {evalActo ? (evalActo.aprobado ? '✅ APTO' : '❌ NO APTO') : '⏳ Procesando...'}
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

  return (
    <div className={styles.teatroPageWrapper}>
      <div className={styles.teatroContainer}>
        <header className={styles.teatroHeader}>
          <h1>🎭 Laboratorio de Impro</h1>
          <p className={styles.subtitulo}>
            {pantalla === 'config' ? 'Ajusta los tiempos del libreto por actos' : `Acto en Curso: ${faseActual.toUpperCase()}`}
          </p>
        </header>

        <main className={styles.escenario}>
          {/* PANTALLA 1: CONFIGURACIÓN */}
          {pantalla === 'config' && (
            <div className={styles.bloqueConfig}>
              <div className={styles.recuadroExplicativo}>
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
                    <span>⚡ 1er Giro</span>
                    <input type="number" className={styles.inputTiempoNumber} value={tiemposConfig.giro1} onChange={(e) => handleTiempoChange('giro1', Number(e.target.value))} />
                  </label>
                  <label className={styles.labelStyle}>
                    <span>🔥 2do Giro</span>
                    <input type="number" className={styles.inputTiempoNumber} value={tiemposConfig.giro2} onChange={(e) => handleTiempoChange('giro2', Number(e.target.value))} />
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

          {/* PANTALLA 2: JUEGO */}
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
                {faseActual === 'giro1' && <p style={{ color: '#b92929', textAlign: 'center' }}><strong>⚡ Misión Primer Giro</strong><br/>¡Introduce un secreto o hecho imprevisto que cambie el rumbo de la conversación!</p>}
                {faseActual === 'giro2' && <p style={{ color: '#b92929', textAlign: 'center' }}><strong>🔥 Misión Segundo Giro</strong><br/>¡Aumenta la tensión! Pon una cuenta atrás, una amenaza o un factor límite.</p>}
                {faseActual === 'desenlace' && <p style={{ color: '#27ae60', textAlign: 'center' }}><strong>🏁 Misión Desenlace</strong> Guía la improvisación hacia un final ingenioso o divertido.</p>}
              </div>

              {/* Monitor del Director */}
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

              {/* 🎙️ TEXTO RECORTE / DIRECTO LIMPIO */}
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
                    <strong>{m.role === 'user' ? 'Tú: ' : 'Co-Actor: '}</strong>{m.content}
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