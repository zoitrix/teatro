// app/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { OpenAI } from 'openai';
import './globals.css';

export default function ImproPage() {
  // Configuración de los controles
  const [modalidad, setModalidad] = useState<string>('inicio de impro');
  const [dificultad, setDificultad] = useState<string>('media');
  const [tiempoConfig, setTiempoConfig] = useState<number>(20); 

  // Estados del flujo de la improvisación
  const [pantalla, setPantalla] = useState<'config' | 'jugando' | 'feedback'>('config');
  const [titulo, setTitulo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTexto, setLoadingTexto] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [textoUsuario, setTextoUsuario] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [escuchando, setEscuchando] = useState<boolean>(false); 
  
  // Histórico de títulos sugeridos
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
      // Si el tiempo llega a 0 de forma orgánica, finaliza la escena automáticamente
      if (!esBotonFinalizarRef.current) {
        detenerGrabacionYProcesar();
      }
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, pantalla]);

  // Limpieza de flujos de audio si el componente se desmonta inesperadamente
  useEffect(() => {
    return () => {
      if (flujoAudioRef.current) {
        flujoAudioRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 🎙️ FUNCIONES DE AUDIO NATIVO (MediaRecorder)
  const iniciarGrabacionNativa = async () => {
    try {
      fragmentosAudioRef.current = [];
      
      // Solicitamos acceso al micrófono (Funciona en PC y móviles gracias a la interacción previa del botón)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      flujoAudioRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          fragmentosAudioRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250); // Captura ráfagas de audio cada 250ms de forma segura
      setEscuchando(true);
    } catch (error) {
      console.error("Error al acceder al micrófono:", error);
      alert("No se pudo acceder al micrófono. Por favor, asegúrate de dar permisos de audio.");
      reiniciarTeatro();
    }
  };

  const detenerGrabacionYProcesar = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setEscuchando(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Al detener el recorder, se disparará indirectamente el procesamiento final
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(fragmentosAudioRef.current, { type: 'audio/mpeg' });
        
        // Apagamos físicamente el hardware del micrófono (el icono de grabación desaparece del móvil)
        if (flujoAudioRef.current) {
          flujoAudioRef.current.getTracks().forEach(track => track.stop());
        }
        
        await procesarEscenaConWhisperYDirector(audioBlob);
      };

      mediaRecorderRef.current.stop();
    } else {
      // Si por alguna razón no había grabación activa
      procesarEscenaConWhisperYDirector(null);
    }
  };

  const getExplicacion = (): string => {
    if (modalidad === 'inicio de impro') {
      return 'Sal a escena y describe el inicio de una historia a través del título que te den. Muestra la relación de los personajes, el estado anímico, el conflicto y el lugar.';
    }
    return '¡A improvisar!';
  };

  // 🚀 GENERAR TÍTULO E INICIAR FUNCIÓN
  const iniciarEjercicio = async (): Promise<void> => {
    if (tiempoConfig <= 0) {
      alert("Por favor, introduce un tiempo de escena válido (mayor a 0 segundos).");
      return;
    }

    setLoading(true);
    setLoadingTexto('Afinando el libreto...');
    setTextoUsuario('');
    esBotonFinalizarRef.current = false;
    setFeedback('');

    const randomSalt = Math.floor(Math.random() * 9999);
    const historialTitulos = titulos.length > 0 ? titulos.join(', ') : 'Ninguno todavía';
    
const prompt = `
[ROL]
Eres un espectador real, ingenioso y muy espontáneo en un show de comedia de improvisación.

[MISIÓN]
Inventa una frase inicial o título único de 4 a 7 palabras para que los actores arranquen su escena. 
¡IMPORTANTE! Debe estar en español, tener sentido completo y sonar natural, como algo dicho en voz alta.

[CONTEXTO / FILTRO ANTI-REPETICIÓN]
- Historial de títulos ya jugados: [${historialTitulos}]
- REGLA DE ORO PROHIBIDA: Está terminantemente prohibido usar las estructuras "Me he enterado de...", "Sé lo que...", "Nunca te...", o sinónimos de secretos/engaños familiares. Ya hemos explotado demasiado ese drama en este show. ¡Cambia radicalmente de tema!

[INSPIRACIÓN TEMÁTICA OBLIGATORIA]
Para romper la monotonía del show, inspírate en una de estas situaciones alternativas:
- Absurdos laborales: "Tu jefe ha descubierto que..." / "Mañana cerramos la fábrica de..."
- Situaciones cotidianas rotas: "No debiste meter eso en..." / "El vecino se ha llevado nuestro..."
- Órdenes extrañas: "Saca ese pingüino del..." / "Llama ahora mismo al..."
- Confesiones cómicas no dramáticas: "Creo que me he tragado el..." / "Tu gato me mira raro..."

[NIVEL DE EXIGENCIA: ${dificultad.toUpperCase()}]
- FÁCIL: Comedia cotidiana, problemas domésticos o de oficina.
- MEDIA: Declaraciones incómodas, obsesiones absurdas o sospechas ridículas.
- DIFÍCIL: Paradojas divertidas, giros existenciales o locuras poéticas con perfecto sentido.

[FORMATO CRÍTICO]
1. Devuelve ÚNICAMENTE la frase. Sin introducciones, sin comillas, sin puntos y sin explicaciones.

Título final:`;

console.log(prompt);

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      if (!apiKey) throw new Error("La API Key de Groq no está configurada.");

      const groq = new OpenAI({ 
        apiKey, 
        baseURL: "https://api.groq.com/openai/v1", 
        dangerouslyAllowBrowser: true 
      });

      const response = await groq.chat.completions.create({
        // 1. Cambiamos al modelo potente de 70B
        model: 'llama-3.3-70b-versatile', 
        messages: [{ role: 'user', content: prompt }],
        
        // 2. Mantenemos un límite prudente para el Director (un veredicto de 3-4 frases ocupa unos 60-80 tokens)
        max_tokens: 120, 
        
        // 3. Bajamos un poco la temperatura para que sea técnico, preciso y no se "vaya por las ramas"
        temperature: 0.5, 
        
        // 4. El seguro de vida: se detiene inmediatamente al poner la claqueta
        stop: ["🎬"]
      });

      const nuevoTitulo = response.choices[0]?.message?.content?.trim() || 'Título Misterioso';
      setTitulo(nuevoTitulo);
      setTitulos((prev) => [...prev, nuevoTitulo]);

      setTimeLeft(tiempoConfig); 
      setPantalla('jugando');
      
      // 🎤 Arrancamos la grabación de audio nativa inmediatamente
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

// 🧠 PIPELINE DE INTELIGENCIA ARTIFICIAL OPTIMIZADO ANTI-ALUCINACIONES
  const procesarEscenaConWhisperYDirector = async (audioBlob: Blob | null) => {
    setLoading(true);
    setPantalla('feedback');
    
    let transcripcionFinal = '';

    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (!apiKey) {
      setFeedback("La API Key de Groq no está configurada.");
      setLoading(false);
      return;
    }

    const groq = new OpenAI({ 
      apiKey, 
      baseURL: "https://api.groq.com/openai/v1", 
      dangerouslyAllowBrowser: true 
    });

    // 🛡️ ESCUDO 1: UMBRAL DE SEGURIDAD (12KB). Si el audio dura 20s y pesa menos de esto, es estática o silencio.
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
          temperature: 0.0, // Obliga a la mayor precisión posible
          prompt: "Teatro, actuación, improvisación en español con buena puntuación.", 
        });

        transcripcionFinal = respuestaWhisper.text?.trim() || '';

        // 🛡️ ESCUDO 2: Filtro estricto de frases típicas que Whisper inventa en el silencio
        const alucinacionesFrecuentes = [
          "subtítulos", "gracias por ver", "suscríbete", "gracias", 
          "todos los derechos", "diseño de sonido", "reproducir música",
          "teatro, actuación", "buena puntuación" // Evita que repita palabras del propio prompt
        ];
        
        const contieneBasura = alucinacionesFrecuentes.some(frase => 
          transcripcionFinal.toLowerCase().includes(frase)
        );

        // Si contiene alucinaciones o es un texto sospechosamente corto (menos de 4 letras), se vacía por completo
        if (contieneBasura || transcripcionFinal.length < 4) {
          transcripcionFinal = '';
        }

      } catch (whisperError) {
        console.error("Error al transcribir con Whisper:", whisperError);
      }
    } else {
      console.log(`Audio descartado por silencio. Peso: ${audioBlob ? audioBlob.size : 0} bytes`);
    }

    setTextoUsuario(transcripcionFinal);
    const propuestaFinal = transcripcionFinal !== "" ? transcripcionFinal : '[SIN_RESPUESTA]';

    // --- PASO 2: FEEDBACK DEL DIRECTOR DE TEATRO ---
    setLoadingTexto('El Director está preparando sus notas...');

const promptDirector = `
[ROL]
Director de teatro de improvisación hiperactivo y sumamente técnico. Hablas con jerga ("¡Arriba el telón!", "¡Puro drama!").

[CONTEXTO]
- Título de la escena: "${titulo}"
- Texto dictado por el actor: "${propuestaFinal}"

[ANÁLISIS LOGICIAL OBLIGATORIO]
Antes de responder, evalúa mentalmente el texto bajo estas condiciones ultra-flexibles:
1. Relación: ¿Aparecen roles o vínculos familiares/sociales/laborales? (Ej: "mi mujer", "vecino", "amigo", "jefe", "hermano" SI cuentan como relación).
2. Ánimo: ¿Se intuye una emoción, duda, miedo o tensión?
3. Conflicto: ¿Hay un problema, plan, dilema o secreto? (Ej: un secuestro, una sospecha).
4. Lugar: ¿Se nombra o intuye un espacio físico? (Ej: "el portal", "la casa", "la oficina").

[SISTEMA DE RESPUESTA DIRECTA]
- Si el texto es "[SIN_RESPUESTA]": Lanza una bronca divertida por quedarse congelado como una estatua de cera.
- Si SÍ respondió: Lanza una crítica veloz en primera persona (desde la fila 5). Menciona los pilares logrados. Si falta alguno, nómbralo sin rodeos y aporta un giro surrealista para completarlo. ¡Si lo logró todo, monta una fiesta teatral!

[REGLAS DE FORMATO ABSOLUTAS]
- Estructura obligatoria: 1 Frase de jerga inicial + 1 o 2 Frases evaluando las metas + 1 Frase de cierre/giro loco.
- 🚨 REGLA DE AUTO-FRENO: No te extiendas en explicaciones detalladas. Sé ultra-corto. Si ves que vas a escribir más de 45 palabras, DETÉNTE inmediatamente, cierra la idea de golpe y corta la respuesta de forma limpia. Es preferible un veredicto breve que una frase cortada a la mitad.
- Prohibido saludar, usar comillas o introducciones corporativas.

[EJEMPLO DE SALIDA COMPACTA ESPERADA]
¡Arriba el telón! Clavaste la relación de pareja con el vecino, el conflicto del secuestro y el portal como lugar, pero me faltó unánimidad en el Ánimo. ¡Para la próxima ponle más terror al asunto! ¡A escena de nuevo!

Veredicto del Director:`;

    try {
      const response = await groq.chat.completions.create({
        // 1. Cambiamos al modelo potente de 70B
        model: 'llama-3.3-70b-versatile', 
        messages: [{ role: 'user', content: promptDirector }],
        
        // 2. Mantenemos un límite prudente para el Director (un veredicto de 3-4 frases ocupa unos 60-80 tokens)
        max_tokens: 120, 
        
        // 3. Bajamos un poco la temperatura para que sea técnico, preciso y no se "vaya por las ramas"
        temperature: 0.5, 
        
        // 4. El seguro de vida: se detiene inmediatamente al poner la claqueta
        stop: ["🎬"]
      });

      const nuevoFeedback = response.choices[0]?.message?.content?.trim() || '¡Buena improvisación!';
      setFeedback(nuevoFeedback);
    } catch (error) {
      console.error(error);
      setFeedback('El director se ha despistado tras el escenario...');
    } finally {
      setLoading(false);
      setLoadingTexto('');
    }
  };
  const clickBotonTerminarManual = () => {
    esBotonFinalizarRef.current = true;
    detenerGrabacionYProcesar();
  };

  const reiniciarTeatro = (): void => {
    setTitulo('');
    setPantalla('config');
  };

  return (
    <div className="teatro-container">
      <header className="teatro-header">
        <h1>🎭 ¡Impro! 🎬</h1>
        <p className="subtitulo">¡Saca un título y construye tu historia!</p>
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
              <div className="titulo-mision">💡Misión💡</div>{getExplicacion()}
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

              <label>Tiempo (segundos)
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
              ¡Terminar Escena! 🔔
            </button>
          </div>
        )}

        {/* PANTALLA 3: FEEDBACK Y RESULTADOS */}
        {pantalla === 'feedback' && (
          <div className="bloque-feedback">
            <div className="recuadro-tu-texto">
              <h4>📖 Tu Libreto Improvisado</h4>
              <p className="texto-guardado-usuario">
                {loading && !textoUsuario ? (
                  <span className="loading-subtext">Transcribiendo tu genialidad... 🎧</span>
                ) : textoUsuario.trim() ? (
                  `"${textoUsuario.trim()}"`
                ) : (
                  <i>[No se detectó voz o el escenario se quedó en absoluto silencio]</i>
                )}
              </p>
            </div>

            <div className="recuadro-feedback">
              <h4>📝 El Director opina</h4>
              {loading ? (
                <p className="loading-text">🎬 {loadingTexto || 'El jurado procesa la escena...'} 👏</p>
              ) : (
                <p className="texto-feedback">{feedback}</p>
              )}
            </div>

            {!loading && (
              <button className="btn-teatro btn-repetir" onClick={reiniciarTeatro}>
                🔄 Otra Función (Repetir)
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}