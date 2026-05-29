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
  
  // Detectar si el dispositivo es móvil
  const [esMovil, setEsMovil] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null); 

  // Detectar el tamaño de la pantalla al cargar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMovil = () => setEsMovil(window.innerWidth <= 768);
    checkMovil();
    window.addEventListener('resize', checkMovil);
    return () => window.removeEventListener('resize', checkMovil);
  }, []);

  // 🎙️ CONFIGURACIÓN DEL RECONOCIMIENTO DE VOZ ADAPTATIVO
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      
      // En móvil apagamos resultados provisionales (cero duplicados); en PC los activamos para fluidez visual
      recognition.interimResults = !esMovil; 
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        let textoDefinitivoAcumulado = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            textoDefinitivoAcumulado += event.results[i][0].transcript + ' ';
          }
        }

        if (textoDefinitivoAcumulado) {
          setTextoUsuario((prev) => {
            const prevClean = prev.trim();
            const nuevoClean = textoDefinitivoAcumulado.trim();
            
            if (prevClean.endsWith(nuevoClean)) {
              return prev;
            }
            return prev + (prev ? ' ' : '') + nuevoClean;
          });
        }
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
  }, [esMovil]); 

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

  useEffect(() => {
    if (pantalla === 'jugando' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && pantalla === 'jugando') {
      finalizarEscena();
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, pantalla]);

  // 🎛️ CONTROLES EXCLUSIVOS DE MÓVIL (Pulsar y mantener)
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
      recognitionRef.current.stop();
      setEscuchando(false);
    }
  };

  const getExplicacion = (): string => {
    if (modalidad === 'inicio de impro') {
      return 'Describe el inicio de una historia a través del título que te den, reflejando la relación de los personajes, el estado anímico, el conflicto y el lugar';
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
    setFeedback('');

    const sujetosLocos = [
      "un calcetín desparejado", "un fontanero", "una tostadora", 
      "un brócoli", "un inspector de nubes", "un billete de monopoly", 
      "un fantasma", "un dentista", "una paloma mensajera"
    ];

    const accionesRaras = [
      "busca venganza", "intenta pasar desapercibido", "se obsesionó con el orden", 
      "descubrió el sentido de la vida", "está atrapado en un bucle", "odia su trabajo",
      "habla demasiado", "olvidó cómo parpadear", "busca un cargador"
    ];

    const contextosBizarros = [
      "en el ascensor", "durante la cena", "en el peor momento", 
      "en el supermercado", "en el confesionario", "en medio del examen"
    ];

    const sujeto = sujetosLocos[Math.floor(Math.random() * sujetosLocos.length)];
    const accion = accionesRaras[Math.floor(Math.random() * accionesRaras.length)];
    const contexto = contextosBizarros[Math.floor(Math.random() * contextosBizarros.length)];

    // PROMPT RE-ESTRUCTURADO ANTI-EXPLICACIONES (Formato directo)
    const prompt = `Eres un espectador real en un show de improvisación de comedia. Genera una frase o título muy natural, ingenioso y de calle (máximo 6 o 7 palabras).
Combina vagamente estos elementos: El sujeto "${sujeto}", la acción "${accion}" en el lugar/contexto "${contexto}".

Dificultad requerida [${dificultad}]:
- fácil: Comedia cotidiana/enredo. Ejemplo: "No dejes la tostadora encendida"
- media: Declaración incómoda o sospecha. Ejemplo: "Creo que el fontanero me miente"
- difícil: Paradoja abstracta o locura. Ejemplo: "El tiempo se congela en el ascensor"

REGLA ABSOLUTA: No des explicaciones, ni introducciones, ni hables de tu proceso creativo. Devuelve ÚNICAMENTE las palabras del título final.

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
        temperature: 0.85, // Bajamos la temperatura para que sea más obediente
        presence_penalty: 0.5,
        max_tokens: 20, // 👈 Capa física de seguridad: si intenta explicar algo, se corta de golpe
      });

      const nuevoTitulo = response.choices[0]?.message?.content?.trim() || 'Título Misterioso';
      setTitulo(nuevoTitulo);
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
      recognitionRef.current.stop();
      setEscuchando(false);
    }

    setLoading(true);
    setPantalla('feedback');

    const prompt = `
    Actúa como un director de teatro de improvisación súper entusiasta, divertido y con mucha energía. 
    Tu alumno acaba de hacer un "Inicio de Impro" relámpago basado en el título "${titulo}". 
    Su propuesta ha sido: "${textoUsuario.trim() || '[SIN_RESPUESTA]'}"

    Tu misión: Dale un feedback ultra corto, fresco y motivador. 
    Ten en cuenta que SOLO ha tenido ${tiempoConfig} segundos, ¡así que valora el caos y la velocidad!

    Analiza de golpe si se intuyen estos 4 pilares para poder empezar a actuar ya: ¿Quiénes son? (Relación), ¿Qué sienten? (Estado de ánimo), ¿Qué problema tienen? (Conflicto) y ¿Dónde están? (Lugar).
    - Si lo ha logrado, celébralo con locura.
    - Si le ha faltado algo, proponle un añadido loco y rápido en lugar de criticar (Ej: "¡Faltó el lugar! Pero imagino que están en la cola del súper").

    REGLAS DE FORMATO CRÍTICAS:
    1. Sé alocado, usa jerga teatral divertida y tono de comedia.
    2. NUNCA uses un tono serio, académico, rígido o destructivo.
    3. Devuelve ÚNICAMENTE tu comentario directo, sin introducciones, sin comillas, ni textos de relleno.
    4. Extensión máxima: 3 o 4 frases (30 palabras). ¡Al grano!
    5. Si la propuesta es [SIN_RESPUESTA], ten en cuenta que el alumno no ha entregado la tarea pedida. No menciones [SIN_RESPUESTA]. Échale la bronca y que vuelva a intentarlo.`;

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
        max_tokens: 80, // 👈 Limita también el tamaño máximo del feedback para ahorrar tokens
      });

      const nuevoFeedback = response.choices[0]?.message?.content?.trim() || '¡Buena improvisación!';
      setFeedback(nuevoFeedback);
    } catch (error) {
      console.error(error);
      setFeedback('El director se ha despistado tras el escenario... (Fallo al obtener feedback)');
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
                  {escuchando ? '🔴 GRABANDO... SUELTA PARA PAUSAR' : '🎤 MANTÉN PULSADO PARA HABLAR'}
                </button>
              ) : (
                /* 💻 VISTA ESCRITORIO: Sin botones. El micro se abre solo y muestra una sutil alerta de estado */
                <div className={`indicador-estado-voz ${escuchando ? 'grabando-activo-pc' : ''}`}>
                  <p className="texto-estado">
                    {escuchando ? "🎙️ El escenario está abierto... ¡Habla directamente!" : "🔇 Configurando entorno de audio..."}
                  </p>
                </div>
              )}
              
            </div>

            <button className="btn-teatro btn-enviar" onClick={finalizarEscena} disabled={loading}>
              ¡Terminar Escena! 🔔
            </button>
          </div>
        )}

        {/* PANTALLA 3: FEEDBACK */}
        {pantalla === 'feedback' && (
          <div className="bloque-feedback">
            <div className="recuadro-tu-texto">
              <h4>📖 Tu Libreto Improvisado:</h4>
              <p className="texto-guardado-usuario">
                {textoUsuario.trim() ? `"${textoUsuario.trim()}"` : <i>[No ingresaste ningún texto, el escenario se quedó en absoluto silencio]</i>}
              </p>
            </div>

            <div className="recuadro-feedback">
              <h3>📝 El Director opina:</h3>
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