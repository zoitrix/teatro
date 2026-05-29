// app/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { OpenAI } from 'openai';
import './globals.css';

export default function ImproPage() {
  // Configuración de los controles
  const [modalidad, setModalidad] = useState<string>('inicio de impro');
  const [dificultad, setDificultad] = useState<string>('facil');
  const [tiempoConfig, setTiempoConfig] = useState<number>(20); 

  // Estados del flujo de la improvisación
  const [pantalla, setPantalla] = useState<'config' | 'jugando' | 'feedback'>('config');
  const [titulo, setTitulo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [textoUsuario, setTextoUsuario] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [escuchando, setEscuchando] = useState<boolean>(false); 

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null); 

  // 🎙️ CONFIGURACIÓN DEL RECONOCIMIENTO DE VOZ (Versión optimizada para Móviles)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true; // Necesario para fluidez, pero manejado con cuidado
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        let textoDefinitivoAcumulado = '';
        let textoTemporalActual = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcripcion = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            // Si el fragmento es definitivo, lo guardamos de forma limpia
            textoDefinitivoAcumulado += transcripcion + ' ';
          } else {
            // Si es provisional (el móvil aún está procesando), lo dejamos en bypass temporal
            textoTemporalActual += transcripcion;
          }
        }

        // Si hay texto definitivo nuevo, lo añadimos evitando duplicados idénticos en ráfaga
        if (textoDefinitivoAcumulado) {
          setTextoUsuario((prev) => {
            // Limpieza básica: si lo nuevo que llega ya está al final de lo que teníamos, no lo duplicamos
            const prevTrimmed = prev.trim();
            const nuevoTrimmed = textoDefinitivoAcumulado.trim();
            
            if (prevTrimmed.endsWith(nuevoTrimmed)) {
              return prev; 
            }
            return prev + textoDefinitivoAcumulado;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Error en el micrófono:", event.error);
        // El error 'aborted' ocurre a veces de forma nativa en móviles al pausar, lo gestionamos silenciosamente
        if (event.error !== 'aborted') {
          setEscuchando(false);
        }
      };

      recognition.onend = () => {
        setEscuchando(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // 🚀 AUTOMATIZACIÓN DEL MICRÓFONO AL EMPEZAR A JUGAR
  useEffect(() => {
    if (pantalla === 'jugando') {
      const timerMicro = setTimeout(() => {
        if (recognitionRef.current && !escuchando) {
          try {
            recognitionRef.current.start();
            setEscuchando(true);
          } catch (e) {
            console.error("No se pudo auto-iniciar el micrófono:", e);
          }
        } else if (!recognitionRef.current) {
          alert("Tu navegador no soporta el dictado por voz. Asegúrate de dar permisos al micrófono.");
        }
      }, 300);

      return () => clearTimeout(timerMicro);
    }
  }, [pantalla]);

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

    const prompt = `
    Actúa como un director de teatro de improvisación amateur y divertido. 
    Genera un título creativo, loco e inspirador para una escena de improvisación en la que los actores tendrán que improvisar.
    La dificultad del título que propongas tiene que ir en base a la dificultad seleccionada: ${dificultad}.
    Devuelve SOLO el título, sin comillas ni texto extra. Máximo 6 palabras.`;

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

  // Permite pausar o reanudar manualmente si el usuario lo desea
  const alternarMicrofono = (): void => {
    if (!recognitionRef.current) return;

    if (escuchando) {
      recognitionRef.current.stop();
      setEscuchando(false);
    } else {
      recognitionRef.current.start();
      setEscuchando(true);
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
    Actúa como un profesor de teatro de improvisación.
    En el texto te han tenido que reflejar la relación de los personajes, el conflicto entre ellos y el lugar.
    Dale un feedback constructivo, apuntando las cosas positivas pero proponiendo posibles mejoras y soluciones.
    El nivel de exigencia/sobriedad dependerá de la dificultad "${dificultad}", siendo más o menos severo/sobrio en función del nivel (Fácil / Media / Difícil)
    Título de la impro: "${titulo}"
    Lo que escribió el usuario: "${textoUsuario.trim() || '[No le dio tiempo a escribir o hablar nada]'}"
    Devuelve SOLO el feedback, sin comillas ni texto extra. Máximo 4 o 5 frases.`;

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

        {/* PANTALLA 2: JUGANDO (100% POR VOZ) */}
        {pantalla === 'jugando' && (
          <div className="bloque-juego">
            <div className="cronometro">
              ⏱️ {timeLeft}s
            </div>

            <div className="recuadro-explicativo">
              <strong>💡 Tu Misión:</strong> {getExplicacion()}
            </div>

            {/* Contenedor de transcripción fluida */}
            <div className="formulario-texto-wrapper">
              <div className={`recuadro-transcripcion ${escuchando ? 'onda-activa' : ''}`}>
                {textoUsuario.trim() ? (
                  <p className="texto-hablado">{textoUsuario}</p>
                ) : (
                  <p className="placeholder-voz">
                    {escuchando ? "🎙️ El escenario te escucha... ¡Empieza a hablar ahora!" : "🔇 Micrófono en pausa."}
                  </p>
                )}
              </div>

              {/* Botón secundario para pausar/activar el micro manualmente */}
              <button 
                type="button" 
                className={`btn-control-micro ${escuchando ? 'activo' : ''}`} 
                onClick={alternarMicrofono}
              >
                {escuchando ? '⏸️ Pausar Micrófono' : '🎙️ Reanudar Micrófono'}
              </button>
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