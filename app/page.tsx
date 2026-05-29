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
  }, [esMovil]); // Se reinicia la configuración si cambia el tipo de dispositivo

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
      return 'Describe el inicio de una Improvisación a través del título dado donde se refleje la relación de personajes, el conflicto y el lugar.';
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
    
    const letras = "XYZABC";
    const hashAleatorio = letras[Math.floor(Math.random() * letras.length)] + Math.floor(Math.random() * 999);

    const prompt = `
    Eres un espectador real, ingenioso y con mucha calle en un show de improvisación. Tienes un humor natural, rápido y te encanta proponer títulos que suenen a frases ingeniosas que diría una persona real, no un robot de inteligencia artificial.
    Misión: Sugiere una frase corta (máximo 6 palabras) para que los actores actúen.
    Para inspirarte de forma totalmente única en esta función, tu mente va a conectar vagamente estas tres ideas:
    - Alguien o algo: ${sujeto}
    - Lo que le pasa: ${accion}
    - Dónde ocurre: ${contexto}
    (Código de variación del sistema: ${hashAleatorio})
    Construye el título para que tenga la estructura gramatical de una frase natural (como una confesión, una queja, un titular o una orden). Ajústate al nivel de exigencia [${dificultad}]:
    - fácil: Una frase con un tono de comedia costumbrista o enredo cotidiano (ej: "No dejes la tostadora encendida").
    - media: Una declaración incómoda, una sospecha o un dilema divertido (ej: "Creo que el fontanero me miente").
    - difícil: Una frase profunda, una paradoja existencial o un pensamiento filosófico poético pero abstracto (ej: "El tiempo se congela en el ascensor").
    REGLAS CRÍTICAS DE NATURALIDAD:
    1. El título debe sonar como una frase fluida y orgánica que diría un ser humano en voz alta. 
    2. Prohibido usar patrones trillados de IA como "El misterio de...", "Las crónicas de...", "El hombre que...".
    3. Devuelve ÚNICAMENTE las palabras de la frase. Sin comillas, sin puntos finales, sin texto de relleno. Máximo 6 palabras.`;

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      if (!apiKey) throw new Error("La API Key de Groq no está configurada.");

      const groq = new OpenAI({ 
        apiKey, 
        baseURL: "https://api.groq.com/openai/v1", 
        dangerouslyAllowBrowser: true 
      });

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1.15, 
        presence_penalty: 1.6,   
        frequency_penalty: 1.4,  
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

  const finalizarEscena = async (): Promise<void> => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setEscuchando(false);
    }

    setLoading(true);
    setPantalla('feedback');

    const prompt = `
    Actúa como un director de teatro de improvisación amateur y divertido.
    Dado el título de la improvisación: "${titulo}" y la descripción recibida:  "${textoUsuario.trim() || '[No le dio tiempo a hablar nada]'}", se pide que des un feedback constructivo, apuntando las cosas positivas pero proponiendo posibles mejoras y soluciones.
    El objetivo del ejercicio es que, en esas primeras descripciones se refleje la relación de los personajes, el conflicto entre ellos y el lugar. Esto es lo más importante y la clave. El feedback tiene que estar relacionado con estas premisas.
    Tienes que ser divertido, alocado y creativo en tus respuestas.
    Devuelve SOLO el feedback, sin comillas ni texto extra. Máximo 3 o 4 frases.`;

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      if (!apiKey) throw new Error("La API Key de Groq no está configurada.");

      const groq = new OpenAI({ 
        apiKey, 
        baseURL: "https://api.groq.com/openai/v1", 
        dangerouslyAllowBrowser: true 
      });

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
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
        <h1>🎭 ¡Impro Match! 🎬</h1>
        <p className="subtitulo">Saca al actor amateur que llevas dentro entrenando tu velocidad de improvisación</p>
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
            <div className="controles-group">
              <label>Modalidad:
                <select value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
                  <option value="inicio de impro">Inicio de Impro</option>
                </select>
              </label>

              <label>Dificultad:
                <select value={dificultad} onChange={(e) => setDificultad(e.target.value)}>
                  <option value="fácil">Fácil (Cotidiano)</option>
                  <option value="media">Media (Interesante)</option>
                  <option value="difícil">Difícil (Locura)</option>
                </select>
              </label>

              <label>Tiempo de escena:
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

            <div className="recuadro-explicativo">
              <strong>💡 Tu Misión:</strong> {getExplicacion()}
            </div>

            <div className="formulario-texto-wrapper centralizado">
              
              {/* 📱 VISTA MÓVIL: Botón Walkie-Talkie (No hay texto visible) */}
              {esMovil ? (
                <>
                  <div className={`indicador-estado-voz ${escuchando ? 'grabando-activo' : ''}`}>
                    <p className="texto-estado">
                      {escuchando ? "🔴 ESCENARIO ABIERTO... ¡HABLA!" : "🎤 MANTÉN PULSADO PARA HABLAR"}
                    </p>
                  </div>

                  <button 
                    type="button" 
                    className={`btn-walkie-talkie ${escuchando ? 'pulsado' : ''}`}
                    onMouseDown={iniciarGrabacionMovil}
                    onMouseUp={detenerGrabacionMovil}
                    onTouchStart={iniciarGrabacionMovil}
                    onTouchEnd={detenerGrabacionMovil}
                  >
                    {escuchando ? '🔊 Suelta para pausar' : '🎙️ Pulsar y Mantener'}
                  </button>
                </>
              ) : (
                /* 💻 VISTA ORDENADOR: Manos libres automático (Tampoco hay caja de texto, solo estado) */
                <div className={`indicador-estado-voz ${escuchando ? 'grabando-activo' : ''}`}>
                  <p className="texto-estado">
                    {escuchando ? "🎙️ El escenario te escucha de continuo... ¡Improvisa!" : "🔇 Configurando micrófono..."}
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