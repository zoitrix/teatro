// app/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { OpenAI } from 'openai';
import './globals.css';

// Definimos los tipos de actos por los que pasará la obra
type FaseActo = 'intro' | 'giro1' | 'giro2' | 'desenlace';

interface ObraHistorial {
  titulo: string;
  intro: string;
  giro1: string;
  giro2: string;
  desenlace: string;
}

// Interfaz para controlar el tiempo por separado de cada acto
interface TiemposConfig {
  intro: number;
  giro1: number;
  giro2: number;
  desenlace: number;
}

export default function ImproPage() {
  // Configuración de los controles iniciales
  const [modalidad, setModalidad] = useState<string>('inicio de impro');
  const [dificultad, setDificultad] = useState<string>('media');
  
  // ⏱️ Estado para los tiempos independientes por cada fase
  const [tiemposConfig, setTiemposConfig] = useState<TiemposConfig>({
    intro: 20,
    giro1: 20,
    giro2: 20,
    desenlace: 20
  }); 

  // Estados del flujo y fases
  const [faseActual, setFaseActual] = useState<FaseActo>('intro');
  const [pantalla, setPantalla] = useState<'config' | 'jugando' | 'feedback' | 'final'>('config');
  const [titulo, setTitulo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTexto, setLoadingTexto] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [textoUsuario, setTextoUsuario] = useState<string>('');
  const [feedbackDirector, setFeedbackDirector] = useState<string>('');
  const [aprobadoPorDirector, setAprobadoPorDirector] = useState<boolean>(false);
  const [escuchando, setEscuchando] = useState<boolean>(false); 
  
  // Guardado estructurado de la obra completa
  const [obra, setObra] = useState<ObraHistorial>({
    titulo: '',
    intro: '',
    giro1: '',
    giro2: '',
    desenlace: ''
  });

  const [titulos, setTitulos] = useState<string[]>([]);

  // Referencias para temporizador y grabación de Audio nativo
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fragmentosAudioRef = useRef<Blob[]>([]);
  const flujoAudioRef = useRef<MediaStream | null>(null);
  const esBotonFinalizarRef = useRef<boolean>(false);

  // ⏱️ TEMPORIZADOR DE LA ESCENA
  useEffect(() => {
    if (pantalla === 'jugando' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && pantalla === 'jugando') {
      if (!esBotonFinalizarRef.current) {
        detenerGrabacionYProcesar();
      }
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, pantalla]);

  // Limpieza de flujos de audio al desmontar
  useEffect(() => {
    return () => {
      if (flujoAudioRef.current) {
        flujoAudioRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handler dinámico para cambiar los inputs de tiempo
  const handleTiempoChange = (fase: FaseActo, valor: number) => {
    setTiemposConfig(prev => ({
      ...prev,
      [fase]: valor
    }));
  };

  // 🎙️ FUNCIONES DE AUDIO NATIVO
  const iniciarGrabacionNativa = async () => {
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
      console.error("Error al acceder al micrófono:", error);
      alert("No se pudo acceder al micrófono. Por favor, asegúrate de dar permisos de audio.");
      reiniciarTeatroCompleto();
    }
  };

  const detenerGrabacionYProcesar = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setEscuchando(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(fragmentosAudioRef.current, { type: 'audio/mpeg' });
        
        if (flujoAudioRef.current) {
          flujoAudioRef.current.getTracks().forEach(track => track.stop());
        }
        
        await procesarFaseConWhisperYDirector(audioBlob);
      };

      mediaRecorderRef.current.stop();
    } else {
      procesarFaseConWhisperYDirector(null);
    }
  };

  const getExplicacionInicial = (): string => {
    if (modalidad === 'inicio de impro') {
      return 'Construye una obra de improvisación completa por actos. Configura los tiempos de cada reto abajo (en segundos), asume tu rol ¡y que empiece el espectáculo!';
    }
    return '¡A improvisar por fases!';
  };

  // 🚀 GENERAR TÍTULO E INICIAR FUNCIÓN (ACTO I)
  const iniciarEjercicio = async (): Promise<void> => {
    if (tiemposConfig.intro <= 0 || tiemposConfig.giro1 <= 0 || tiemposConfig.giro2 <= 0 || tiemposConfig.desenlace <= 0) {
      alert("Por favor, introduce tiempos válidos (mayores a 0 segundos) para todos los actos.");
      return;
    }

    setLoading(true);
    setLoadingTexto('Afinando el libreto...');
    setTextoUsuario('');
    setFeedbackDirector('');
    setAprobadoPorDirector(false);
    setFaseActual('intro');
    esBotonFinalizarRef.current = false;

    setObra({ titulo: '', intro: '', giro1: '', giro2: '', desenlace: '' });

    const historialTitulos = titulos.length > 0 ? titulos.join(', ') : 'Ninguno todavía';
    const promptTitulo = `
[ROL]
Eres un espectador real, ingenioso, rápido y muy espontáneo en un show de comedia de improvisación teatral.

[MISIÓN]
Inventa una frase inicial o título único de 4 a 7 palabras en español para que los actores arranquen su escena. 

[REGLAS GRAMATICALES Y DE SENTIDO]
1. La frase DEBE tener sentido completo por sí misma. Debe entenderse perfectamente el contexto cómico al escucharla.
2. Está TERMINANTEMENTE PROHIBIDO devolver palabras sueltas, frases incompletas, conceptos abstractos o estructuras gramaticalmente incorrectas.
3. Debe sonar natural, fluida y realista; exactamente como algo que alguien del público gritaría en voz alta en un arranque de locura o espontaneidad.

[CONTEXTO / FILTRO SEMÁNTICO ULTRA-ESTRICTO]
- Historial de títulos ya jugados en esta sesión: [${historialTitulos}]

🚨 REGLA DE ORO (PROHIBIDO REPETIR):
Analiza minuciosamente el historial anterior. Está prohibido repetir palabras clave, conceptos, temáticas, verbos principales o estructuras sintácticas que ya se hayan usado. Si el historial menciona un animal, un objeto de oficina o una parte de la casa, cambia radicalmente a un universo temático completamente distinto.

🚨 FILTRO DE CONTENIDO:
Descarta por completo el drama doméstico, secretos oscuros, infidelidades, rupturas o tragedias. ¡Buscamos comedia, absurdo y juego!

[MECANISMO DE INSPIRACIÓN ASOCIATIVA]
Fuerza a tu lógica a saltar a un escenario fresco basado en una de estas plantillas de ejemplo (pero inventando una combinación nueva):
- Absurdos laborales cotidianos: "Tu jefe ha descubierto que vendes..." / "Mañana cerramos la fábrica de..."
- Objetos cotidianos que actúan raro: "No debiste meter ese mando en..." / "El microondas nos está comunicando que..."
- Órdenes o urgencias ridículas: "Saca inmediatamente ese pato del..." / "Llama ahora mismo al inspector de..."
- Confesiones incómodas no dramáticas: "Creo que me he tragado el..." / "Tu gato me mira como si..."

[NIVEL DE EXIGENCIA: ${dificultad.toUpperCase()}]
- FÁCIL: Comedia de enredos cotidianos en casa o el trabajo con un giro simple.
- MEDIA: Declaraciones surrealistas, obsesiones absurdas o sospechas ridículas pero muy graciosas.
- DIFÍCIL: Paradojas divertidas, pequeños giros existenciales cómicos o locuras poéticas con perfecto sentido al hablar.

[FORMATO DE SALIDA CRÍTICO]
1. Devuelve ÚNICAMENTE las palabras de la frase/título.
2. Está prohibido incluir introducciones, saludos, comentarios, comillas, puntos finales o explicaciones. 

Título final:`;

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      if (!apiKey) throw new Error("La API Key de Groq no está configurada.");

      const groq = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1", dangerouslyAllowBrowser: true });

      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: promptTitulo }],
        max_tokens: 80,
      });

      const nuevoTitulo = response.choices[0]?.message?.content?.trim() || 'Título Misterioso';
      setTitulo(nuevoTitulo);
      setTitulos((prev) => [...prev, nuevoTitulo]);
      setObra(prev => ({ ...prev, titulo: nuevoTitulo }));

      setTimeLeft(tiemposConfig.intro); 
      setPantalla('jugando');
      
      await iniciarGrabacionNativa();

    } catch (error) {
      console.error(error);
      alert('¡Fallo en las luces! Revisa tu configuración o tu API Key de Groq.');
      setPantalla('config');
    } finally {
      setLoading(false);
      setLoadingTexto('');
    }
  };

  // 🧠 PIPELINE DE IA PARA AUDIO Y DICTAMEN EN JSON EN LAS DIFERENTES FASES
  const procesarFaseConWhisperYDirector = async (audioBlob: Blob | null) => {
    setLoading(true);
    setPantalla('feedback');
    
    let transcripcionFinal = '';

    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (!apiKey) {
      setFeedbackDirector("La API Key de Groq no está configurada.");
      setLoading(false);
      return;
    }

    const groq = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1", dangerouslyAllowBrowser: true });

    const TAMAÑO_MINIMO_VOZ = 12288;

    if (audioBlob && audioBlob.size > TAMAÑO_MINIMO_VOZ) {
      try {
        setLoadingTexto('Escuchando tu grabación con Whisper...');
        const archivoAudio = new File([audioBlob], "impro.mp3", { type: 'audio/mp3' });
        
        const respuestaWhisper = await groq.audio.transcriptions.create({
          file: archivoAudio,
          model: 'whisper-large-v3',
          language: 'es',
          temperature: 0.0, 
          prompt: "Teatro, actuación, improvisación en español con buena puntuación.", 
        });

        transcripcionFinal = respuestaWhisper.text?.trim() || '';

        const alucinacionesFrecuentes = [
          "subtítulos", "gracias por ver", "suscríbete", "gracias", 
          "todos los derechos", "diseño de sonido", "reproducir música",
          "teatro, actuación", "buena puntuación"
        ];
        
        const contieneBasura = alucinacionesFrecuentes.some(frase => 
          transcripcionFinal.toLowerCase().includes(frase)
        );

        if (contieneBasura || transcripcionFinal.length < 4) {
          transcripcionFinal = '';
        }

      } catch (whisperError) {
        console.error("Error al transcribir con Whisper:", whisperError);
      }
    }

    setTextoUsuario(transcripcionFinal);
    const propuestaFinal = transcripcionFinal !== "" ? transcripcionFinal : '[SIN_RESPUESTA]';
// Configurar instrucciones del Director dinámicamente según la fase/acto actual
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
- El actor debe introducir un PRIMER PUNTO DE GIRO (un imprevisto, secreto o revelación repentina) que altere directamente el rumbo de la introducción previa ("${obra.intro}").
- Verifica si la propuesta reacciona al contexto dramático heredado. Si es un saludo, texto vacío o una evasión sin relación, "aprobado" DEBE ser false.`;
      
    } else if (faseActual === 'giro2') {
      consignasEspecificas = `OBJETIVO DE LA EVALUACIÓN:
- Analiza ÚNICAMENTE la propuesta del actor dentro de <texto_del_actor>.
- El actor debe sumar un SEGUNDO PUNTO DE GIRO (añadir más presión, peligro, complicación extrema o un factor contrarreloj) sobre lo que ya ocurrió en la Intro ("${obra.intro}") y el Giro 1 ("${obra.giro1}").
- Si el texto está vacío, es inconexo o no añade ninguna complicación a la narrativa previa, "aprobado" DEBE ser false.`;
      
    } else if (faseActual === 'desenlace') {
      consignasEspecificas = `OBJETIVO DE LA EVALUACIÓN:
- Analiza ÚNICAMENTE la propuesta del actor dentro de <texto_del_actor>.
- El actor debe dar un cierre o resolución final, idealmente divertido o inesperado, que concluya la cadena de eventos previos (Intro: "${obra.intro}" -> Giros: "${obra.giro1}" y "${obra.giro2}").
- Si el texto carece de sustancia resolutiva o corta la escena abruptamente sin cerrar nada, "aprobado" DEBE ser false.`;
    }

    setLoadingTexto('El Director está redactando las notas...');

    const promptDirector = `
[ROL]
Eres un Director de teatro de improvisación hiperactivo, técnico, apasionado y muy exigente. Hablas siempre utilizando jerga teatral ("¡Arriba el telón!", "¡Falta ritmo!", "¡Puro drama!", "¡Eso es actuar!").

[MISIÓN DE ANÁLISIS]
Tu único trabajo es juzgar si el <texto_del_actor> cumple con el objetivo técnico del acto actual. El título y el historial son contextos fijos para medir la coherencia; ESTÁ PROHIBIDO evaluar si el título es creativo o lo que aporta. Juzga al ACTOR, no al escenario.

[CONSIGNAS ESPECÍFICAS PARA ESTE ACTO]
${consignasEspecificas}

[DATOS DE ENTRADA DE LA ESCENA]
<titulo_escena_contexto>${titulo}</titulo_escena_contexto>
<texto_del_actor>${propuestaFinal}</texto_del_actor>

🚨 [REGLA INQUEBRANTABLE DE MUTISMO]
- Si <texto_del_actor> es exactamente "[SIN_RESPUESTA]", el campo "aprobado" DEBE ser false de manera matemática. Lanza una bronca divertida por quedarse congelado o hacer un mutismo.
- Si hay cualquier otra propuesta escrita, ignora esta regla de mutismo y evalúala bajo los criterios normales detallados arriba.

[FORMATO DE SALIDA ESTRICTO]
Devuelve EXCLUSIVAMENTE un objeto JSON válido. No uses bloques markdown, no uses la sintaxis \`\`\`json ni introducciones de texto. Solo el objeto crudo:
{
  "aprobado": true o false,
  "comentario": "Tu crítica teatral breve de máximo 35 palabras utilizando tu jerga, validando por qué la propuesta funciona dramáticamente o detallando qué faltó de forma específica."
}`;

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: promptDirector }],
        temperature: 0.2, 
        max_tokens: 150,
      });

      const textoCrudo = response.choices[0]?.message?.content?.trim() || '{}';
      
      const inicioJson = textoCrudo.indexOf('{');
      const finJson = textoCrudo.lastIndexOf('}');
      const jsonLimpio = textoCrudo.substring(inicioJson, finJson + 1);
      
      const objetoJSON = JSON.parse(jsonLimpio);

      const validado = !!objetoJSON.aprobado;
      setFeedbackDirector(objetoJSON.comentario || '¡Falta contundencia en la propuesta!');
      setAprobadoPorDirector(validado);

      if (validado && propuestaFinal !== '[SIN_RESPUESTA]') {
        setObra(prev => ({ ...prev, [faseActual]: propuestaFinal }));
      }

    } catch (error) {
      console.error("Fallo al parsear la decisión del director:", error);
      setFeedbackDirector('¡El director se ha trabado con el guion! (Fallo de formato). Repitamos el acto.');
      setAprobadoPorDirector(false);
    } finally {
      setLoading(false);
      setLoadingTexto('');
    }
  };

  const clickBotonTerminarManual = () => {
    esBotonFinalizarRef.current = true;
    detenerGrabacionYProcesar();
  };

  const avanzarSiguienteFase = async () => {
    esBotonFinalizarRef.current = false;
    setTextoUsuario('');
    setFeedbackDirector('');

    if (faseActual === 'intro') {
      setFaseActual('giro1');
      setTimeLeft(tiemposConfig.giro1); 
      setPantalla('jugando');
      setTimeout(() => iniciarGrabacionNativa(), 100);
    } else if (faseActual === 'giro1') {
      setFaseActual('giro2');
      setTimeLeft(tiemposConfig.giro2); 
      setPantalla('jugando');
      setTimeout(() => iniciarGrabacionNativa(), 100);
    } else if (faseActual === 'giro2') {
      setFaseActual('desenlace');
      setTimeLeft(tiemposConfig.desenlace); 
      setPantalla('jugando');
      setTimeout(() => iniciarGrabacionNativa(), 100);
    } else if (faseActual === 'desenlace') {
      setPantalla('final');
    }
  };

  const reintentarActoActual = async () => {
    esBotonFinalizarRef.current = false;
    setTextoUsuario('');
    setFeedbackDirector('');
    setAprobadoPorDirector(false);
    
    setTimeLeft(tiemposConfig[faseActual]);
    setPantalla('jugando');
    setTimeout(() => iniciarGrabacionNativa(), 100);
  };

  const reiniciarTeatroCompleto = (): void => {
    setTitulo('');
    setFaseActual('intro');
    setPantalla('config');
  };

  if (pantalla === 'final') {
    return (
      <div className="teatro-container">
        <header className="teatro-header">
          <h1>🏆 ¡GRAN FUNCIÓN COMPLETADA! 💐</h1>
          <p className="subtitulo">El público ovaciona en pie tu capacidad de improvisación</p>
        </header>

        <main className="escenario">
          <div className="cartelera-titulo revelado">
            <h2>🎬 LIBRETO FINAL: "{obra.titulo}"</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '600px', margin: '0 auto 25px auto' }}>
            <div className="recuadro-explicativo" style={{ textAlign: 'left', borderLeft: '5px solid #ffd700' }}>
              <strong>📖 Acto I: Introducción</strong>
              <p style={{ marginTop: '5px', fontStyle: 'italic' }}>"{obra.intro}"</p>
            </div>

            <div className="recuadro-explicativo" style={{ textAlign: 'left', borderLeft: '5px solid #ff7b00' }}>
              <strong>⚡ Acto II: Primer Punto de Giro</strong>
              <p style={{ marginTop: '5px', fontStyle: 'italic' }}>"{obra.giro1}"</p>
            </div>

            <div className="recuadro-explicativo" style={{ textAlign: 'left', borderLeft: '5px solid #ff3b30' }}>
              <strong>🔥 Acto III: Segundo Punto de Giro</strong>
              <p style={{ marginTop: '5px', fontStyle: 'italic' }}>"{obra.giro2}"</p>
            </div>

            <div className="recuadro-explicativo" style={{ textAlign: 'left', borderLeft: '5px solid #4cd964' }}>
              <strong>🏁 Acto IV: Desenlace Final</strong>
              <p style={{ marginTop: '5px', fontStyle: 'italic' }}>"{obra.desenlace}"</p>
            </div>
          </div>

          <div className="recuadro-feedback" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', border: '1px dashed #ffd700', marginBottom: '20px' }}>
            <p className="texto-feedback" style={{ textAlign: 'center', fontWeight: 'bold' }}>
              ✨ ¡Enhorabuena! Has mantenido la coherencia dramática y cómica bajo la presión del cronómetro.
            </p>
          </div>

          <button className="btn-teatro btn-comenzar" onClick={reiniciarTeatroCompleto}>
            🔄 Iniciar Nueva Obra
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="teatro-container">
      <header className="teatro-header">
        <h1>🎭 ¡Impro! 🎬</h1>
        <p className="subtitulo">
          {pantalla === 'config' ? '¡Saca un título y construye tu historia!' : `Fase Actual: Acto de ${faseActual.toUpperCase()}`}
        </p>
      </header>

      <main className="escenario">
        {pantalla !== 'config' && titulo && (
          <div className="cartelera-titulo revelado">
            <h2>{titulo}</h2>
          </div>
        )}

        {/* PANTALLA 1: CONFIGURACIÓN CON DISEÑO UNIFICADO */}
        {pantalla === 'config' && (
          <div className="bloque-config">
            <div className="recuadro-explicativo">
              <div className="titulo-mision">💡Misión de la Obra💡</div>
              {getExplicacionInicial()}
            </div>
            
            <br/>
            {/* Todos los controles agrupados dentro del mismo bloque .controles-group original */}
<div className="controles-group" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
  
  {/* Fila superior: Selector de dificultad a ancho completo */}
  <label style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    Dificultad
    <select value={dificultad} onChange={(e) => setDificultad(e.target.value)}>
      <option value="fácil">Fácil (Cotidiano)</option>
      <option value="media">Media (Interesante)</option>
      <option value="difícil">Difficult (Locura)</option>
    </select>
  </label>

  {/* Sub-rejilla: 2 columnas para que los timers ocupen solo 2 filas en total */}
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
    gap: '12px', 
    width: '100%' 
  }}>
    <label style={{ display: 'flex', flexDirection: 'column', margin: 0 }}>
      <span>⏱️ Inicio</span>
      <input 
        type="number" 
        className="input-tiempo-number"
        value={tiemposConfig.intro} 
        min={1} max={300}
        onChange={(e) => handleTiempoChange('intro', Number(e.target.value))}
      />
    </label>

    <label style={{ display: 'flex', flexDirection: 'column', margin: 0 }}>
      <span>⚡ 1er Giro</span>
      <input 
        type="number" 
        className="input-tiempo-number"
        value={tiemposConfig.giro1} 
        min={1} max={300}
        onChange={(e) => handleTiempoChange('giro1', Number(e.target.value))}
      />
    </label>

    <label style={{ display: 'flex', flexDirection: 'column', margin: 0 }}>
      <span>🔥 2do Giro</span>
      <input 
        type="number" 
        className="input-tiempo-number"
        value={tiemposConfig.giro2} 
        min={1} max={300}
        onChange={(e) => handleTiempoChange('giro2', Number(e.target.value))}
      />
    </label>

    <label style={{ display: 'flex', flexDirection: 'column', margin: 0 }}>
      <span>🏁 Desenlace</span>
      <input 
        type="number" 
        className="input-tiempo-number"
        value={tiemposConfig.desenlace} 
        min={1} max={300}
        onChange={(e) => handleTiempoChange('desenlace', Number(e.target.value))}
      />
    </label>
  </div>

</div>

            <button className="btn-teatro btn-comenzar" style={{ marginTop: '25px' }} onClick={iniciarEjercicio} disabled={loading}>
              {loading ? 'Afinando el libreto...' : '¡Subir el Telón! 🚀'}
            </button>
          </div>
        )}

        {/* PANTALLA 2: JUGANDO */}
        {pantalla === 'jugando' && (
          <div className="bloque-juego">
            <div className="recuadro-explicativo" style={{ marginBottom: '15px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
              {faseActual === 'intro' && (
                <p><strong>🎯 Objetivo:</strong> Plantea la escena. Muestra claramente la relación de los personajes, el estado anímico, el conflicto y el lugar.</p>
              )}
              {faseActual === 'giro1' && (
                <div>
                  <p style={{ color: '#ff7b00', fontSize: '0.9em', marginBottom: '4px' }}><strong>📖 Tu Comienzo:</strong> "{obra.intro}"</p>
                  <p><strong>⚡ Reto ({tiemposConfig.giro1}s):</strong> ¡Introduce un cambio brusco o imprevisto que tuerza este inicio!</p>
                </div>
              )}
              {faseActual === 'giro2' && (
                <div>
                  <p style={{ color: '#ff7b00', fontSize: '0.9em', marginBottom: '4px' }}><strong>📖 Tu Comienzo:</strong> "{obra.intro}"</p>
                  <p style={{ color: '#ff3b30', fontSize: '0.9em', marginBottom: '4px' }}><strong>🔥 Primer Giro:</strong> "... {obra.giro1}"</p>
                  <p><strong>💥 Reto ({tiemposConfig.giro2}s):</strong> ¡Añade más leña al fuego! Mete una complicación extra, peligro o factor contrarreloj.</p>
                </div>
              )}
              {faseActual === 'desenlace' && (
                <div>
                  <p style={{ color: '#ff7b00', fontSize: '0.9em', marginBottom: '4px' }}><strong>📖 Tu Comienzo:</strong> "{obra.intro}"</p>
                  <p style={{ color: '#ff3b30', fontSize: '0.9em', marginBottom: '4px' }}><strong>🔥 Primer Giro:</strong> "... {obra.giro1}"</p>
                  <p style={{ color: '#4cd964', fontSize: '0.9em', marginBottom: '4px' }}><strong>🚀 Segundo Giro:</strong> "... {obra.giro2}"</p>
                  <p><strong>🏁 Reto ({tiemposConfig.desenlace}s):</strong> ¡Cierra la función! Di cómo se resuelve todo el embrollo de golpe de forma divertida.</p>
                </div>
              )}
            </div>

            <div className="cronometro">
              ⏱️ {timeLeft}s
            </div>

            <div className="formulario-texto-wrapper centralizado">
              <div className={`indicador-estado-voz ${escuchando ? 'grabando-activo-pc' : ''}`}>
                <p className="texto-estado">
                  {escuchando ? "🎙️ El escenario está abierto... ¡Actúa e improvisa en voz alta!" : "🔇 Finalizando grabación de audio..."}
                </p>
              </div>
            </div>

            <button className="btn-teatro btn-enviar" onClick={clickBotonTerminarManual} disabled={loading}>
              ¡Terminar Acto! 🔔
            </button>
          </div>
        )}

        {/* PANTALLA 3: FEEDBACK DINÁMICO */}
        {pantalla === 'feedback' && (
          <div className="bloque-feedback">
            <div className="recuadro-tu-texto">
              <h4>📖 Tu Propuesta para este Acto</h4>
              <p className="texto-guardado-usuario">
                {loading && !textoUsuario ? (
                  <span className="loading-subtext">Transcribiendo tu voz... 🎧</span>
                ) : textoUsuario.trim() ? (
                  `"${textoUsuario.trim()}"`
                ) : (
                  <i>[No se detectó voz o el escenario se quedó en absoluto silencio]</i>
                )}
              </p>
            </div>

            <div className="recuadro-feedback">
              <h4>
                📝 El Director opina: {' '}
                {!loading && (
                  <span style={{ color: aprobadoPorDirector ? '#4cd964' : '#ff3b30', fontWeight: 'bold' }}>
                    {aprobadoPorDirector ? '[APROBADO] ✅' : '[RECHAZADO] ❌'}
                  </span>
                )}
              </h4>
              {loading ? (
                <p className="loading-text">🎬 {loadingTexto || 'El jurado procesa la escena...'} 👏</p>
              ) : (
                <p className="texto-feedback">{feedbackDirector}</p>
              )}
            </div>

            {!loading && (
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
                {aprobadoPorDirector ? (
                  <button className="btn-teatro btn-enviar" style={{ backgroundColor: '#28a745' }} onClick={avanzarSiguienteFase}>
                    {faseActual === 'desenlace' ? '✨ Ver Obra Completa' : 'Siguiente Acto 👉'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', width: '100%', gap: '15px' }}>
                    <button className="btn-teatro btn-repetir" onClick={reintentarActoActual}>
                      🔄 Repetir Acto
                    </button>
                    <button className="btn-teatro btn-reiniciar" onClick={reiniciarTeatroCompleto}>
                      🎬 Reiniciar Obra
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}