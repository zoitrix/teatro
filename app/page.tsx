// app/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import './globals.css';

const API_KEY = process.env.GEMINI_API_KEY || "NO_KEY_AVAILABLE";
const ai = new GoogleGenAI({ apiKey: API_KEY });

export default function ImproPage() {
  // Configuración de los controles
  const [modalidad, setModalidad] = useState<string>('inicio de impro');
  const [dificultad, setDificultad] = useState<string>('media');
  const [tiempoConfig, setTiempoConfig] = useState<number>(20); // Estado numérico
  const [metodoEntrada, setMetodoEntrada] = useState<'texto' | 'audio'>('audio'); 

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

  // 🎙️ CONFIGURACIÓN DEL RECONOCIMIENTO DE VOZ
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        let textoFinal = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            textoFinal += event.results[i][0].transcript + ' ';
          }
        }
        if (textoFinal) {
          setTextoUsuario((prev) => prev + textoFinal);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Error en el micrófono:", event.error);
        setEscuchando(false);
      };

      recognition.onend = () => {
        setEscuchando(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // 🚀 EFECTO PARA AUTOMATIZAR EL MICRÓFONO AL EMPEZAR
  useEffect(() => {
    if (pantalla === 'jugando' && metodoEntrada === 'audio') {
      const timerMicro = setTimeout(() => {
        if (recognitionRef.current && !escuchando) {
          try {
            recognitionRef.current.start();
            setEscuchando(true);
          } catch (e) {
            console.error("No se pudo auto-iniciar el micrófono:", e);
          }
        } else if (!recognitionRef.current) {
          alert("Tu navegador no soporta el dictado por voz. ¡Prueba usando el teclado!");
        }
      }, 300);

      return () => clearTimeout(timerMicro);
    }
  }, [pantalla, metodoEntrada]);

  const getExplicacion = (): string => {
    if (modalidad === 'inicio de impro') {
      return 'Describe el inicio de una Improvisación a través del título dado donde se refleje la relación de personajes, el conflicto y el lugar.';
    }
    return '¡A improvisar!';
  };

  const iniciarEjercicio = async (): Promise<void> => {
    // Validación por si el usuario deja el tiempo vacío o en 0
    if (tiempoConfig <= 0) {
      alert("Por favor, introduce un tiempo de escena válido (mayor a 0 segundos).");
      return;
    }

    setLoading(true);
    setTextoUsuario('');
    setFeedback('');

    const prompt = `Actúa como un director de teatro de improvisación amateur y divertido. 
    Genera un título creativo, loco e inspirador para una escena de improvisación.
    Modalidad: ${modalidad}
    Dificultad: ${dificultad}.
    Devuelve SOLO el título, sin comillas ni texto extra. Máximo 6 palabras.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const nuevoTitulo = response.text?.trim() || 'Título Misterioso';
      setTitulo(nuevoTitulo);
      setTimeLeft(tiempoConfig); 
      setPantalla('jugando');
      
    } catch (error) {
      console.error(error);
      alert('¡Fallo en las luces! Revisa tu conexión a internet o tu API Key de Gemini. ' + API_KEY);
    } finally {
      setLoading(false);
    }
  };

  const alternarMicrofono = (): void => {
    if (!recognitionRef.current) {
      alert("Tu navegador no soporta el dictado por voz. ¡Prueba usando el teclado!");
      return;
    }

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
    Actúa como un profesor de teatro de improvisación muy crítico. Recuerda que en el texto te han tenido que reflejar la relación de los personajes, el conflicto entre ellos y el lugar. Dale un feedback constructivo pero sobrio,
    proponiendo posibles mejoras y soluciones. 
    Título de la impro: "${titulo}"
    Lo que escribió el usuario: "${textoUsuario.trim() || '[No le dio tiempo a escribir o hablar nada]'}"
    Devuelve SOLO el feedback, sin comillas ni texto extra. Máximo 4 o 5 frases.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      const nuevoFeedback = response.text?.trim() || '¡Buena improvisación!';
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
                  <option value="difícil">Difficult (Locura)</option>
                </select>
              </label>

              {/* CAMBIADO: Ahora es un input de tipo number */}
              <label>Tiempo de escena:
                <input 
                  type="number" 
                  className="input-tiempo-number"
                  value={tiempoConfig} 
                  min={1}
                  max={300} // Límite opcional de 5 minutos para evitar abusos
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

            <div className="formulario-texto-wrapper">
              <textarea
                className={`caja-texto ${escuchando ? 'borde-grabando' : ''}`}
                placeholder={metodoEntrada === 'audio' ? "¡Empieza a hablar o a escribir lo que se te ocurra! ✍️🎙️🎭" : ""}
                value={textoUsuario}
                onChange={(e) => setTextoUsuario(e.target.value)}
                autoFocus
              />
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
