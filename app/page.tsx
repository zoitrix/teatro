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

export default function ImproPage() {
  // Configuración de los controles iniciales
  const [modalidad, setModalidad] = useState<string>('inicio de impro');
  const [dificultad, setDificultad] = useState<string>('media');
  const [tiempoConfig, setTiempoConfig] = useState<number>(20); 

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
      return 'Construye una obra de improvisación completa por actos. Fase 1: Describe el inicio (relación, ánimo, conflicto y lugar). Si apruebas, ¡tendrás 10 segundos por cada punto de giro y desenlace!';
    }
    return '¡A improvisar por fases!';
  };

  // 🚀 GENERAR TÍTULO E INICIAR FUNCIÓN (ACTO I)
  const iniciarEjercicio = async (): Promise<void> => {
    if (tiempoConfig <= 0) {
      alert("Por favor, introduce un tiempo de escena válido.");
      return;
    }

    setLoading(true);
    setLoadingTexto('Afinando el libreto...');
    setTextoUsuario('');
    setFeedbackDirector('');
    setAprobadoPorDirector(false);
    setFaseActual('intro');
    esBotonFinalizarRef.current = false;

    // Resetear el libreto de la obra actual
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

      setTimeLeft(tiempoConfig); 
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

    // --- PASO 1: TRANSCRIPCIÓN CON WHISPER ---
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

// Configurar instrucciones del Director dinámicamente según la fase/acto actual (Criterios flexibilizados)
// Configurar instrucciones del Director dinámicamente según la fase/acto actual (Criterios Equilibrados)
    let consignasEspecificas = '';
    if (faseActual === 'intro') {
      consignasEspecificas = `CRITERIO EVALUACIÓN: El actor debe iniciar la historia basándose en el título "${titulo}". 
- Evalúa con criterio teatral pero de forma abierta.
- Para ser APROBADO, el usuario DEBE desarrollar una idea, premisa, personaje o situación mínimamente vinculada al título o al contexto de la escena.
- Acepta como RELACIÓN cualquier vínculo, enemistad, antagonismo o hilo dramático (incluso implícito en la acción o intenciones).
🚨 REGLA DE RECHAZO CRÍTICA: Si el usuario solo dice un saludo suelto (ej: "hola", "buenas"), una única palabra, una frase genérica que no aporta nada a la historia o evade por completo el título, DEBES poner "aprobado": false. Un "¡Hola!" sin más historia NO es suficiente para subir el telón.`;
    } else if (faseActual === 'giro1') {
      consignasEspecificas = `CONTEXTO: Introducción previa: "${obra.intro}". CRITERIO EVALUACIÓN: El actor debe proponer un PRIMER PUNTO DE GIRO (un imprevisto o revelación). Debe aportar algo nuevo que cambie la dirección de la historia presentada en la introducción. Si solo saluda, no aporta nada o evade el contexto, "aprobado" DEBE ser false.`;
    } else if (faseActual === 'giro2') {
      consignasEspecificas = `CONTEXTO: Intro: "${obra.intro}" | Giro 1: "${obra.giro1}". CRITERIO EVALUACIÓN: El actor debe añadir un SEGUNDO PUNTO DE GIRO que eleve la complicación y haga que la dirección de la historia cambie. Si es un texto vacío, inconexo o un saludo, "aprobado" DEBE ser false.`;
    } else if (faseActual === 'desenlace') {
      consignasEspecificas = `CONTEXTO: Intro: "${obra.intro}" | Giros: "${obra.giro1}" -> "${obra.giro2}". CRITERIO EVALUACIÓN: El actor debe dar un cierre final que cierre el conflicto planteado en la introducción. Si no concluye nada de la historia planteada en la introducción o el texto carece de sustancia, "aprobado" DEBE ser false.`;
    }

    setLoadingTexto('El Director está redactando las notas...');

const promptDirector = `
[ROL]
Eres un Director de teatro de improvisación hiperactivo, técnico, apasionado y muy exigente. Hablas siempre utilizando jerga teatral ("¡Arriba el telón!", "¡Falta ritmo!", "¡Puro drama!", "¡Eso es actuar!").

[CONSIGNAS DE EVALUACIÓN MULTI-FASE PARA ESTE ACTO]
${consignasEspecificas}

[DATOS DE ENTRADA DE LA ESCENA]
<titulo_base>${titulo}</titulo_base>
<texto_del_actor>${propuestaFinal}</texto_del_actor>

🚨 [REGLA INQUEBRANTABLE DE MUTISMO]
Analiza el contenido exacto dentro de <texto_del_actor>. 
- SÓLO si el texto es exactamente "[SIN_RESPUESTA]", el campo "aprobado" DEBE ser false de manera matemática y obligatoria, y ahí es cuando debes lanzar una bronca divertida por quedarse congelado o hacer un mutismo en el escenario.
- Si hay CUALQUIER otra frase escrita dentro de <texto_del_actor> (como resolver el conflicto con unas gafas), evalúala bajo los criterios normales de la fase actual y NO apliques esta regla de mutismo.

[FORMATO DE SALIDA ESTRICTO]
Devuelve EXCLUSIVAMENTE un objeto JSON válido. No uses bloques markdown, no uses la sintaxis \`\`\`json ni introducciones de texto. Solo el objeto crudo:
{
  "aprobado": true o false,
  "comentario": "Tu crítica teatral breve de máximo 35 palabras utilizando tu jerga, validando por qué la propuesta funciona cinematográficamente o detallando qué faltó de forma específica."
}`;

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: promptDirector }],
        temperature: 0.2, // Reducimos temperatura para asegurar el JSON limpio
        max_tokens: 150,
      });

      const textoCrudo = response.choices[0]?.message?.content?.trim() || '{}';
      
      // Filtro quirúrgico para extraer el objeto JSON ignorando textos satélite o markdown accidental
      const inicioJson = textoCrudo.indexOf('{');
      const finJson = textoCrudo.lastIndexOf('}');
      const jsonLimpio = textoCrudo.substring(inicioJson, finJson + 1);
      
      const objetoJSON = JSON.parse(jsonLimpio);

      const validado = !!objetoJSON.aprobado;
      setFeedbackDirector(objetoJSON.comentario || '¡Falta contundencia en la propuesta!');
      setAprobadoPorDirector(validado);

      // Si el acto es aprobado, guardamos la porción del libreto correspondiente
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

  // 🔄 AVANCES SEGUROS ENTRE FASES
  const avanzarSiguienteFase = async () => {
    esBotonFinalizarRef.current = false;
    setTextoUsuario('');
    setFeedbackDirector('');

    if (faseActual === 'intro') {
      setFaseActual('giro1');
      setTimeLeft(10); // Límite estricto de 10s para el Reto
      setPantalla('jugando');
      setTimeout(() => iniciarGrabacionNativa(), 100);
    } else if (faseActual === 'giro1') {
      setFaseActual('giro2');
      setTimeLeft(10);
      setPantalla('jugando');
      setTimeout(() => iniciarGrabacionNativa(), 100);
    } else if (faseActual === 'giro2') {
      setFaseActual('desenlace');
      setTimeLeft(10);
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
    
    // Si repite la intro usa su tiempo configurado; si repite giros o desenlace usa los 10 segundos obligatorios
    setTimeLeft(faseActual === 'intro' ? tiempoConfig : 10);
    setPantalla('jugando');
    setTimeout(() => iniciarGrabacionNativa(), 100);
  };

  const reiniciarTeatroCompleto = (): void => {
    setTitulo('');
    setFaseActual('intro');
    setPantalla('config');
  };

  // --- RENDERS DE PANTALLA ---

  // PANTALLA EXCLUSIVA: OBRA EXITOSA FINALIZADA (Resumen en bloques)
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

        {/* PANTALLA 1: CONFIGURACIÓN */}
        {pantalla === 'config' && (
          <div className="bloque-config">
            <div className="recuadro-explicativo">
              <div className="titulo-mision">💡Misión de la Obra💡</div>
              {getExplicacionInicial()}
            </div>
            <br/>
            <div className="controles-group">
              <label>Dificultad
                <select value={dificultad} onChange={(e) => setDificultad(e.target.value)}>
                  <option value="fácil">Fácil (Cotidiano)</option>
                  <option value="media">Media (Interesante)</option>
                  <option value="difícil">Difficult (Locura)</option>
                </select>
              </label>

              <label>Tiempo Intro (segundos)
                <input 
                  type="number" 
                  className="input-tiempo-number"
                  value={tiempoConfig} 
                  min={1}
                  max={300} 
                  step={1}
                  onChange={(e) => setTiempoConfig(Number(e.target.value))}
                />
              </label>
            </div>

            <button className="btn-teatro btn-comenzar" onClick={iniciarEjercicio} disabled={loading}>
              {loading ? 'Afinando el libreto...' : '¡Subir el Telón! 🚀'}
            </button>
          </div>
        )}

        {/* PANTALLA 2: JUGANDO */}
        {pantalla === 'jugando' && (
          <div className="bloque-juego">
            
            {/* Contexto dinámico según la fase para guiar al improvisador */}
            <div className="recuadro-explicativo" style={{ marginBottom: '15px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
              {faseActual === 'intro' && (
                <p><strong>🎯 Objetivo:</strong> Plantea la escena. Muestra claramente la relación de los personajes, el estado anímico, el conflicto y el lugar.</p>
              )}
              {faseActual === 'giro1' && (
                <div>
                  <p style={{ color: '#ff7b00', fontSize: '0.9em', marginBottom: '4px' }}><strong>📖 Tu Comienzo:</strong> "{obra.intro}"</p>
                  <p><strong>⚡ Reto (10s):</strong> ¡Introduce un cambio brusco o imprevisto que tuerza este inicio!</p>
                </div>
              )}
              {faseActual === 'giro2' && (
                <div>
                  <p style={{ color: '#ff7b00', fontSize: '0.9em', marginBottom: '4px' }}><strong>📖 Tu Comienzo:</strong> "{obra.intro}"</p>
                  <p style={{ color: '#ff3b30', fontSize: '0.9em', marginBottom: '4px' }}><strong>🔥 Primer Giro:</strong> "... {obra.giro1}"</p>
                  <p><strong>💥 Reto (10s):</strong> ¡Añade más leña al fuego! Mete una complicación extra, peligro o factor contrarreloj.</p>
                </div>
              )}
              {faseActual === 'desenlace' && (
                <div>
                  <p style={{ color: '#ff7b00', fontSize: '0.9em', marginBottom: '4px' }}><strong>📖 Tu Comienzo:</strong> "{obra.intro}"</p>
                  <p style={{ color: '#ff3b30', fontSize: '0.9em', marginBottom: '4px' }}><strong>🔥 Primer Giro:</strong> "... {obra.giro1}"</p>
                  <p style={{ color: '#4cd964', fontSize: '0.9em', marginBottom: '4px' }}><strong>🚀 Segundo Giro:</strong> "... {obra.giro2}"</p>
                  <p><strong>🏁 Reto (10s):</strong> ¡Cierra la función! Di cómo se resuelve todo el embrollo de golpe de forma divertida.</p>
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