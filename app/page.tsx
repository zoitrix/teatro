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
Inventa una frase inicial o título único para que los actores arranquen su escena. 
¡IMPORTANTE! La frase debe estar perfectamente construida en español, tener sentido completo y sonar como algo que diría una persona real en voz alta. Evita palabras sueltas sin conector.
(ID: ${randomSalt})

[CONTEXTO]
- Historial de títulos ya jugados en esta sesión: [${historialTitulos}] (Evita repetir chistes, ideas, escenarios o conceptos previos).

[ESTRUCTURA DE SINTAXIS RECOMENDADA]
Inspírate en estructuras reales como:
- Una queja o acusación: "Me has vuelto a..." / "Tu hermano siempre..."
- Una sospecha incómoda: "Creo que el..." / "Sé lo que hiciste con..."
- Una orden o advertencia: "No toques ese..." / "Saca eso de..."
- Una confesión surrealista: "Nunca te dije que..." / "Me da miedo tu..."

[NIVEL DE EXIGENCIA: ${dificultad.toUpperCase()}]
- FÁCIL: Comedia cotidiana, problemas domésticos o de pareja.
- MEDIA: Declaraciones incómodas, secretos destapados o sospechas absurdas.
- DIFÍCIL: Paradojas divertidas, giros existenciales o locuras poéticas con perfecto sentido.

[REGLAS DE FORMATO CRÍTICAS]
1. Devuelve ÚNICAMENTE la frase del título. Sin introducciones, sin comillas, sin puntos y sin explicaciones.
2. Extensión: Entre 4 y 7 palabras.

Título final:`;

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      if (!apiKey) throw new Error("La API Key de Groq no está configurada.");

      const groq = new OpenAI({ 
        apiKey, 
        baseURL: "https://api.groq.com/openai/v1", 
        dangerouslyAllowBrowser: true 
      });

      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.95,
        presence_penalty: 1.2,
        frequency_penalty: 0.5,
        max_tokens: 20, 
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

    // 🛡️ UMBRAL DE SEGURIDAD (8192 bytes = 8KB). Si pesa menos, es solo ruido estático o silencio absoluto.
    const TAMAÑO_MINIMO_VOZ = 8192; 

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
          // Solo le damos estilo e indicaciones de puntuación, no órdenes
          prompt: "Teatro, actuación, improvisación en español con buena puntuación.", 
        });

        transcripcionFinal = respuestaWhisper.text?.trim() || '';

        // 🛡️ SEGUNDO ESCUDO: Si Whisper alucina con frases típicas de subtítulos de YouTube por el ruido
        const frasesAlucinadasComunes = [
          "subtitulos por", "gracias por ver", "suscríbete", "gracias", 
          "todos los derechos", "diseño de sonido", "reproducir música"
        ];
        
        const contieneAlucinacion = frasesAlucinadasComunes.some(frase => 
          transcripcionFinal.toLowerCase().includes(frase)
        );

        // Si el texto es sospechosamente corto (1 o 2 palabras de cortesía) o contiene alucinaciones, lo vaciamos
        if (contieneAlucinacion || transcripcionFinal.length < 3) {
          transcripcionFinal = '';
        }

      } catch (whisperError) {
        console.error("Error al transcribir con Whisper:", whisperError);
      }
    } else {
      console.log(`Audio descartado por bajo volumen/silencio. Peso: ${audioBlob ? audioBlob.size : 0} bytes`);
    }

    setTextoUsuario(transcripcionFinal);
    const propuestaFinal = transcripcionFinal !== "" ? transcripcionFinal : '[SIN_RESPUESTA]';

    // --- PASO 2: FEEDBACK DEL DIRECTOR DE TEATRO ---
    setLoadingTexto('El Director está preparando sus notas...');
    
    const promptDirector = `
[ROL]
Actúa como un director de teatro de improvisación súper entusiasta, divertido, con mucha energía y jerga teatral alocada.

[CONTEXTO DE ENTRADA]
- Título del ejercicio actual dado por el sistema: "${titulo}"
- Propuesta improvisada por el alumno en ${tiempoConfig} segundos: "${propuestaFinal}"

[INSTRUCCIONES DE EVALUACIÓN (PASO A PASO)]

1. CASO CRÍTICO - SI LA PROPUESTA ES "[SIN_RESPUESTA]":
   El alumno se ha quedado mudo en el escenario. Échale una bronca divertida de director teatral, dile que se ha quedado congelado como una estatua y exígele con energía que vuelva a subir al escenario a intentarlo. Fin.

2. CASO GENERAL - SI EL ALUMNO HA RESPUESTO ALGO DIFERENTE A "[SIN_RESPUESTA]":
   Analiza su propuesta. Revisa si se intuyen estos 4 pilares: ¿Quiénes son? (Relación), ¿Qué sienten? (Ánimo), ¿Cuál es el problema? (Conflicto) y ¿Dónde están? (Lugar).
   - Si están los pilares: ¡Celébralo con locura!
   - Si falta alguno: No critiques. Propón tú un añadido loco e improvisado sobre la marcha para completar la escena.

[REGLAS DE FORMATO ABSOLUTAS]
- Devuelve ÚNICAMENTE el comentario directo del director en primera persona. 
- Prohibido incluir introducciones, saludos, despedidas, comillas o textos de relleno.
- Extensión máxima: 3 frases cortas (máximo 35 palabras en total). ¡Puro ritmo de comedia!`;

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: promptDirector }],
        max_tokens: 80,
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