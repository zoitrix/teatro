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
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [textoUsuario, setTextoUsuario] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [escuchando, setEscuchando] = useState<boolean>(false); 
  
  // Histórico de títulos sugeridos
  const [titulos, setTitulos] = useState<string[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null); 
  
  // 🛡️ Fuentes de la verdad absolutas para evitar cierres de ámbito (closures) de React
  const textoAcumuladoRef = useRef<string>('');
  const esBotonFinalizarRef = useRef<boolean>(false);
  const deberiaEstarGrabandoRef = useRef<boolean>(false);

// 🎙️ CONFIGURACIÓN DEL RECONOCIMIENTO DE VOZ REPARADO ANTI-DUPLICACIÓN
useEffect(() => {
  if (typeof window === 'undefined') return;
  
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; 
    recognition.lang = 'es-ES';

    recognition.onresult = (event: any) => {
      let textoFinalProcesado = '';
      let textoIntermedioProvisional = '';

      // Recorremos SIEMPRE desde el inicio (0) para dejar que el motor nativo organice las frases limpias
      for (let i = 0; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          textoFinalProcesado += transcript + ' ';
        } else {
          textoIntermedioProvisional += transcript;
        }
      }

      // Combinamos el texto que ya es definitivo con el que se está diciendo en el milisegundo actual
      const textoCompleto = (textoFinalProcesado + textoIntermedioProvisional).trim();
      
      // Limpieza profunda de espacios dobles provocados por los saltos de micro
      const textoLimpio = textoCompleto.replace(/\s+/g, ' ');
      
      // Actualizamos la REF (fuente de verdad para Groq) y el ESTADO (fuente de verdad para la pantalla) al mismo tiempo
      textoAcumuladoRef.current = textoLimpio;
      setTextoUsuario(textoLimpio);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error("Error en el micrófono:", event.error);
      }
    };

    recognition.onend = () => {
      // Sistema anti-corte: Si el navegador apaga el micro por silencio pero seguimos jugando, lo reactivamos
      if (deberiaEstarGrabandoRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log("Reintentando encendido de micrófono...");
        }
      } else {
        setEscuchando(false);
      }
    };

    recognitionRef.current = recognition;
  }
}, []);

  // ⏱️ TEMPORIZADOR Y CONTROLADOR DE FLUJO
  useEffect(() => {
    if (pantalla === 'jugando' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && pantalla === 'jugando') {
      // Si el tiempo llega a 0 y NO se pulsó el botón manualmente, finaliza automáticamente
      if (!esBotonFinalizarRef.current) {
        apagarMicrofonoYFinalizar();
      }
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, pantalla]);

  // Encender micrófono de manera segura (Apto para móvil gracias al click previo de "Subir el Telón")
  const encenderMicrofono = () => {
    if (recognitionRef.current) {
      deberiaEstarGrabandoRef.current = true;
      try {
        recognitionRef.current.start();
        setEscuchando(true);
      } catch (e) {
        console.error("Error al iniciar el micrófono:", e);
      }
    }
  };

  const apagarMicrofonoYFinalizar = () => {
    deberiaEstarGrabandoRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setEscuchando(false);
    }

    // Un mini delay para asegurar que el último evento 'onresult' se procese antes de enviar a la IA
    setTimeout(() => {
      finalizarEscena();
    }, 400);
  };

  const getExplicacion = (): string => {
    if (modalidad === 'inicio de impro') {
      return 'Sal a escena y describe el inicio de una historia a través del título que te den. Muestra la relación de los personajes, el estado anímico, el conflicto y el lugar.';
    }
    return '¡A improvisar!';
  };

  const iniciarEjercicio = async (): Promise<void> => {
    if (tiempoConfig <= 0) {
      alert("Por favor, introduce un tiempo de escena válido (mayor a 0 segundos).");
      return;
    }

    setLoading(true);
    setTextoUsuario('');
    textoAcumuladoRef.current = ''; 
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
- Historial de títulos ya jugados en esta sesión: [${historialTitulos}] (Evita repetir chistes, ideas, escenarios o conceptos que encajen con estos títulos previos).

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
      
      // 🎤 Arrancamos el micrófono inmediatamente para todos los dispositivos
      encenderMicrofono();

    } catch (error) {
      console.error(error);
      alert('¡Fallo en las luces! Revisa tu configuración o tu API Key de Groq.');
    } finally {
      setLoading(false);
    }
  };

  const finalizarEscena = async (): Promise<void> => {
    setLoading(true);
    setPantalla('feedback');

    // 🛡️ LEER DE LA REF: Recuperamos el texto del acumulador real, ignorando estados desactualizados
    const textoFinalSeguro = textoAcumuladoRef.current.trim();
    const propuestaFinal = textoFinalSeguro !== "" ? textoFinalSeguro : '[SIN_RESPUESTA]';

    const prompt = `
[ROL]
Actúa como un director de teatro de improvisación súper entusiasta, divertido, con mucha energía y jerga teatral alocada.

[CONTEXTO DE ENTRADA]
- Título del ejercicio actual dado por el sistema: "${titulo}"
- Propuesta improvisada por el alumno en ${tiempoConfig} segundos: "${propuestaFinal}"

[INSTRUCCIONES DE EVALUACIÓN (PASO A PASO)]

1. CASO CRÍTICO - SI LA PROPUESTA ES "[SIN_RESPUESTA]":
   El alumno se ha quedado mudo en el escenario. Échale una bronca divertida de director teatral, dile que se ha quedado congelado como una estatua y exígele con energía que vuelva a subir al escenario a intentarlo. Fin.

2. CASO GENERAL - SI EL ALUMNO HA RESPUESTO ALGO DIFERENTE A "[SIN_RESPUESTA]":
   Analiza su propuesta. Valora la velocidad y el caos. Revisa si se intuyen estos 4 pilares: ¿Quiénes son? (Relación), ¿Qué sienten? (Ánimo), ¿Cuál es el problema? (Conflicto) y ¿Dónde están? (Lugar).
   - Si están los pilares: ¡Celébralo con locura!
   - Si falta alguno: No critiques. Propón tú un añadido loco e improvisado sobre la marcha para completar la escena.

[REGLAS DE FORMATO ABSOLUTAS]
- Devuelve ÚNICAMENTE el comentario directo del director en primera persona. 
- Prohibido incluir introducciones, saludos, despedidas, comillas o textos de relleno.
- Extensión máxima: 3 frases cortas (máximo 35 palabras en total). ¡Puro ritmo de comedia!`;

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
        max_tokens: 80,
      });

      const nuevoFeedback = response.choices[0]?.message?.content?.trim() || '¡Buena improvisación!';
      setFeedback(nuevoFeedback);
    } catch (error) {
      console.error(error);
      setFeedback('El director se ha despistado tras el escenario...');
    } finally {
      setLoading(false);
    }
  };

  const clickBotonTerminarManual = () => {
    esBotonFinalizarRef.current = true;
    apagarMicrofonoYFinalizar();
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
                  <option value="difícil">Difícil (Locura)</option>
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

            <div className="recuadro-tu-texto">
              <h4>📖 Tu Libreto Improvisado</h4>
              {textoUsuario.trim() && <p className="fade-in-texto">{textoUsuario.trim()}</p>}
            </div>
            <div className="cronometro">
              ⏱️ {timeLeft}s
            </div>

            <div className="formulario-texto-wrapper centralizado">
              <div className={`indicador-estado-voz ${escuchando ? 'grabando-activo-pc' : ''}`}>
                <p className="texto-estado">
                  {escuchando ? "🎙️ El escenario está abierto... ¡Habla directamente! 🎙️" : "🔇 Configurando entorno de audio..."}
                </p>
              </div>
            </div>

            <button className="btn-teatro btn-enviar" onClick={clickBotonTerminarManual} disabled={loading}>
              ¡Terminar Escena! 🔔
            </button>
          </div>
        )}

        {/* PANTALLA 3: FEEDBACK */}
        {pantalla === 'feedback' && (
          <div className="bloque-feedback">
            <div className="recuadro-tu-texto">
              <h4>📖 Tu Libreto Improvisado</h4>
              <p className="texto-guardado-usuario">
                {textoUsuario.trim() ? `"${textoUsuario.trim()}"` : <i>[No ingresaste ningún texto, el escenario se quedó en absoluto silencio]</i>}
              </p>
            </div>

            <div className="recuadro-feedback">
              <h4>📝 El Director opina</h4>
              {loading ? (
                <p className="loading-text">El jurado está leyendo tu propuesta... 👏</p>
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