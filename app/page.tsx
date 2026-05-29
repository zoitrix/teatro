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

  // 🎭 Sujetos u objetos con los que empatizar
  const sujetosLocos = [
    "un calcetín desparejado", "un fontanero", "una tostadora", 
    "un brócoli", "un inspector de nubes", "un billete de monopoly", 
    "un fantasma", "un dentista", "una paloma mensajera"
  ];

  // 🏃‍♂️ Acciones o problemas reales
  const accionesRaras = [
    "busca venganza", "intenta pasar desapercibido", "se obsesionó con el orden", 
    "descubrió el sentido de la vida", "está atrapado en un bucle", "odia su trabajo",
    "habla demasiado", "olvidó cómo parpadear", "busca un cargador"
  ];

  // 📍 Contextos cotidianos o tensos
  const contextosBizarros = [
    "en el ascensor", "durante la cena", "en el peor momento", 
    "en el supermercado", "en el confesionario", "en medio del examen"
  ];

  const sujeto = sujetosLocos[Math.floor(Math.random() * sujetosLocos.length)];
  const accion = accionesRaras[Math.floor(Math.random() * accionesRaras.length)];
  const contexto = contextosBizarros[Math.floor(Math.random() * contextosBizarros.length)];
  
  const letras = "XYZABC";
  const hashAleatorio = letras[Math.floor(Math.random() * letras.length)] + Math.floor(Math.random() * 999);

  // 🔥 NUEVO ENFOQUE: Le pedimos estructuras de oraciones reales del día a día
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
      // Reducimos sutilmente la temperatura de 1.25 a 1.15 para que sea creativo pero respete la gramática humana.
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
    Actúa como un director de teatro de improvisación amateur y divertido.
    Dado el título de la improvisación: "${titulo}" y la descripción recibida:  "${textoUsuario.trim() || '[No le dio tiempo a escribir nada]'}", se pide que des un feedback constructivo, apuntando las cosas positivas pero proponiendo posibles mejoras y soluciones.
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