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
  
  // Histórico de títulos sugeridos durante la sesión
  const [titulos, setTitulos] = useState<string[]>([]);

  // Detectar si el dispositivo es móvil
  const [esMovil, setEsMovil] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null); 
  
  // 🛡️ Almacén seguro para evitar que el estado asíncrono borre el texto anterior
  const textoAcumuladoRef = useRef<string>('');

  // Detectar el tamaño de la pantalla al cargar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMovil = () => setEsMovil(window.innerWidth <= 768);
    checkMovil();
    window.addEventListener('resize', checkMovil);
    return () => window.removeEventListener('resize', checkMovil);
  }, []);

  // 🎙️ CONFIGURACIÓN DEL RECONOCIMIENTO DE VOZ ADAPTATIVO (MÓVIL Y PC BLINDADO)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      // Dejamos interimResults siempre en true para capturar hasta el microsegundo final
      recognition.interimResults = true; 
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        let fraseActualProvisional = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          fraseActualProvisional += event.results[i][0].transcript;
        }

        // Concatenamos lo que ya teníamos guardado históricamente con lo que está entrando ahora
        const textoCompleto = (textoAcumuladoRef.current + ' ' + fraseActualProvisional).trim();
        
        // Limpiamos espacios dobles extraños que ensucian el diseño
        const textoLimpio = textoCompleto.replace(/\s+/g, ' ');
        
        setTextoUsuario(textoLimpio);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.error("Error en el micrófono:", event.error);
        }
      };

      recognition.onend = () => {
        setEscuchando(false);
      };

      recognitionRef.current = recognition;
    }
  }, []); 

  // 🚀 AUTOMATIZACIÓN PARA PC (Se activa solo al entrar en modo juego si no es móvil)
  useEffect(() => {
    if (pantalla === 'jugando' && !esMovil) {
      const timerMicro = setTimeout(() => {
        if (recognitionRef.current && !escuchando) {
          try {
            recognitionRef.current.start();
            setEscuchando(true);
          } catch (e) {
            console.error("No se pudo auto-iniciar el micrófono en PC:", e);
          }
        }
      }, 300);

      return () => clearTimeout(timerMicro);
    }
  }, [pantalla, esMovil]);

  // ⏱️ TEMPORIZADOR MODIFICADO: Captura el audio asíncronamente en el segundo 0
  useEffect(() => {
    if (pantalla === 'jugando' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && pantalla === 'jugando') {
      // Forzar apagado del micrófono inmediatamente para que vuelque los buffers de audio residuales
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
        setEscuchando(false);
      }

      // Pequeño margen estratégico (500ms) para que el estado de React se entere de las últimas palabras
      const retrasoVaciado = setTimeout(() => {
        finalizarEscena();
      }, 500);

      return () => clearTimeout(retrasoVaciado);
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, pantalla]);

  // 🎛️ CONTROLES EXCLUSIVOS DE MÓVIL (Pulsar y mantener blindado)
  const iniciarGrabacionMovil = (e: React.MouseEvent | React.TouchEvent) => {
    if (!esMovil) return;
    e.preventDefault(); 
    
    if (recognitionRef.current && !escuchando) {
      try {
        recognitionRef.current.start();
        setEscuchando(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const detenerGrabacionMovil = (e: React.MouseEvent | React.TouchEvent) => {
    if (!esMovil) return;
    e.preventDefault();
    
    if (recognitionRef.current && escuchando) {
      // Antes de apagar el micro, congelamos de manera segura lo que el usuario ha dicho
      // para que la siguiente pulsación sume en lugar de sobreescribir.
      textoAcumuladoRef.current = textoUsuario.trim();
      
      recognitionRef.current.stop();
      setEscuchando(false);
    }
  };

  const getExplicacion = (): string => {
    if (modalidad === 'inicio de impro') {
      return 'Sal a escena y describe el inicio de una historia a través del título que te den. Muestra la relación de los personajes, el estado anímico, el conflicto y el lugar';
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
    textoAcumuladoRef.current = ''; // Reseteamos el acumulador histórico para la nueva escena
    setFeedback('');

    const randomSalt = Math.floor(Math.random() * 9999);

    const prompt = `
[ROL]
Eres un espectador real, ingenioso y muy espontáneo en un show de comedia de improvisación.

[MISIÓN]
Inventa una frase inicial o título único para que los actores arranquen su escena. 
¡IMPORTANTE! La frase debe estar perfectamente construida en español, tener sentido completo y sonar como algo que diría una persona real en voz alta. Evita palabras sueltas sin conector.
(ID: ${randomSalt})

[ESTRUCTURA DE SINTAXIS RECOMENDADA]
Para que tenga sentido orgánico, inspírate en estructuras reales como:
- Una queja o acusación: "Me has vuelto a..." / "Tu hermano siempre..."
- Una sospecha incómoda: "Creo que el..." / "Sé lo que hiciste con..."
- Una orden o advertencia: "No toques ese..." / "Saca eso de..."
- Una confesión surrealista: "Nunca te dije que..." / "Me da miedo tu..."

[NIVEL DE EXIGENCIA: ${dificultad.toUpperCase()}]
- FÁCIL: Comedia cotidiana, problemas domésticos o de pareja. (Ej: "No dejes la tostadora encendida" o "Te has gastado el dinero del alquiler").
- MEDIA: Declaraciones incómodas, secretos destapados o sospechas absurdas. (Ej: "Creo que el gato nos está vigilando" o "Tu madre descubrió el sótano").
- DIFÍCIL: Paradojas divertidas, giros existenciales o locuras poéticas con perfecto sentido. (Ej: "El tiempo se ha congelado en la oficina" o "Tus plantas están planeando algo").

[REGLAS DE FORMATO CRÍTICAS]
1. Devuelve ÚNICAMENTE la frase del título. Sin introducciones, sin comillas, sin puntos y sin explicaciones.
2. Extensión: Entre 4 y 7 palabras. Usa más si necesitas que la frase tenga todos los artículos y esté bien estructurada gramaticalmente.

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

    } catch (error) {
      console.error(error);
      alert('¡Fallo en las luces! Revisa tu configuración o tu API Key de Groq.');
    } finally {
      setLoading(false);
    }
  };

  const finalizarEscena = async (): Promise<void> => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setEscuchando(false);
    }

    setLoading(true);
    setPantalla('feedback');

    // Comprobación de texto limpia y directa usando el estado reactivo unificado
    let textoFinalSeguro = textoUsuario.trim();
    if (!textoFinalSeguro) {
      const contenedor = document.querySelector('.texto-guardado-usuario');
      if (contenedor && contenedor.textContent) {
        textoFinalSeguro = contenedor.textContent.replace(/[\[\]"']/g, "").trim();
      }
    }

    const propuestaFinal = textoFinalSeguro && textoFinalSeguro !== "" ? textoFinalSeguro : '[SIN_RESPUESTA]';
    const historialTitulos = titulos.length > 0 ? titulos.join(', ') : 'Ninguno todavía';

    const prompt = `
[ROL]
Actúa como un director de teatro de improvisación súper entusiasta, divertido, con mucha energía y jerga teatral alocada.

[CONTEXTO DE ENTRADA]
- Título del ejercicio actual dado por el sistema: "${titulo}" (Ojo: Este título NO lo ha creado el alumno, no le felicites por él).
- Historial de títulos ya jugados en esta sesión: [${historialTitulos}] (Evita repetir chistes, ideas, escenarios o conceptos que encajen con estos títulos previos).
- Propuesta improvisada por el alumno en ${tiempoConfig} segundos: "${propuestaFinal}"

[INSTRUCCIONES DE EVALUACIÓN (PASO A PASO)]

1. CASO CRÍTICO - SI LA PROPUESTA ES "[SIN_RESPUESTA]":
   El alumno se ha quedado mudo en el escenario y no ha dicho absolutamente nada. No intentes buscarle el lado positivo ni inventar un contexto. Échale una bronca divertida de director teatral, dile que se ha quedado congelado como una estatua y exígele con energía que vuelva a subir al escenario a intentarlo. Fin.

2. CASO GENERAL - SI EL ALUMNO HA RESPUESTO ALGO DIFERENTE A "[SIN RESPUESTA]":
   Analiza EXCLUSIVAMENTE su propuesta. Valora la velocidad y el caos. Revisa de golpe si se intuyen estos 4 pilares: ¿Quiénes son? (Relación), ¿Qué sienten? (Ánimo), ¿Cuál es el problema? (Conflicto) y ¿Dónde están? (Lugar).
   - Si están los pilares: ¡Celébralo con locura!
   - Si falta alguno: No critiques. Propón tú un añadido loco e improvisado sobre la marcha para completar la escena, pero que sea una idea TOTALMENTE NUEVA y diferente a lo visto en el [Historial de títulos ya jugados].

[REGLAS DE FORMATO ABSOLUTAS]
- Devuelve ÚNICAMENTE el comentario directo del director en primera persona. 
- Prohibido incluir introducciones, saludos, despedidas, comillas o textos de relleno.
- Extensión máxima: 3 frases cortas (máximo 35 palabras en total). ¡Puro ritmo de comedia!`;

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
            <div className="cronometro">
              ⏱️ {timeLeft}s
            </div>

            <div className="formulario-texto-wrapper centralizado">
              {/* 📱 VISTA MÓVIL: Botón táctil integrado */}
              {esMovil ? (
                <button 
                  type="button" 
                  className={`btn-teatro btn-walkie-talkie-recto ${escuchando ? 'grabando-activo' : ''}`}
                  onMouseDown={iniciarGrabacionMovil}
                  onMouseUp={detenerGrabacionMovil}
                  onTouchStart={iniciarGrabacionMovil}
                  onTouchEnd={detenerGrabacionMovil}
                >
                  {escuchando ? '🔴 ESCUCHANDO... SUELTA PARA PAUSAR' : '🎤 MANTÉN PULSADO PARA HABLAR'}
                </button>
              ) : (
                /* 💻 VISTA ESCRITORIO: Autostart activo */
                <div className={`indicador-estado-voz ${escuchando ? 'grabando-activo-pc' : ''}`}>
                  <p className="texto-estado">
                    {escuchando ? "🎙️ El escenario está abierto... ¡Habla directamente!" : "🔇 Configurando entorno de audio..."}
                  </p>
                </div>
              )}
            </div>

            {/*<div className="previsualizacion-texto-temporal">
              {textoUsuario && <p className="fade-in-texto">✍️ {textoUsuario}</p>}
            </div>*/}

            <button className="btn-teatro btn-enviar" onClick={finalizarEscena} disabled={loading}>
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