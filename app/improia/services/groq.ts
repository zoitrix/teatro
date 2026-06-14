import { OpenAI } from 'openai';
import { PATRONES_WHISPER_FANTASMA } from '../constants';
import { crearPromptCoactor, crearPromptDirector } from '../prompts';
import type { DificultadChat, EvaluacionActo, FaseActo, MensajeChat } from '../types';
import { generarTituloComun } from '../../shared/titleGeneration';

function crearClienteGroq(): OpenAI {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Falta la API Key.');
  }

  return new OpenAI({
    apiKey: apiKey.trim(),
    baseURL: 'https://api.groq.com/openai/v1',
    dangerouslyAllowBrowser: true,
  });
}

function esAlucinacionAudio(texto: string): boolean {
  const normalizado = texto.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?\u00a1\u00bf]/g, '').trim();

  if (normalizado.length <= 2) {
    return true;
  }

  return PATRONES_WHISPER_FANTASMA.some((patron) => patron.test(normalizado));
}

function ultimoTurnoUsuario(historial: MensajeChat[]): string {
  return [...historial].reverse().find((mensaje) => mensaje.role === 'user')?.content.trim() || '';
}

function desenlacePareceAbierto(historial: MensajeChat[]): boolean {
  const ultimoTurno = ultimoTurnoUsuario(historial);

  if (!ultimoTurno) {
    return true;
  }

  const normalizado = ultimoTurno
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return (
    /[?\u00bf]\s*$/.test(ultimoTurno) ||
    /\b(y si|que pasa si|deberiamos|podriamos|vamos a|voy a|iba a|plan|alarma|nos siguen|nos atrapan|salimos corriendo)\b/.test(
      normalizado,
    )
  );
}

function extraerEvaluacionDirector(textoCrudo: string): Partial<EvaluacionActo> {
  try {
    return JSON.parse(textoCrudo);
  } catch {
    const inicioJson = textoCrudo.indexOf('{');
    const finJson = textoCrudo.lastIndexOf('}');

    if (inicioJson === -1 || finJson === -1 || finJson <= inicioJson) {
      return {};
    }

    try {
      return JSON.parse(textoCrudo.substring(inicioJson, finJson + 1));
    } catch {
      return {};
    }
  }
}

export async function generarTituloChat(dificultad: DificultadChat, titulos: string[]): Promise<string> {
  return generarTituloComun(dificultad, titulos);
}

export async function transcribirTurno(audioBlob: Blob | null): Promise<string> {
  if (!audioBlob) {
    return '';
  }

  const groq = crearClienteGroq();
  const tipoLimpio = audioBlob.type.split(';')[0];
  const extension = tipoLimpio.includes('mp4') || tipoLimpio.includes('m4a') ? 'm4a' : 'webm';
  const archivoAudio = new File([audioBlob], `impro.${extension}`, { type: tipoLimpio });

  const respuestaWhisper = await groq.audio.transcriptions.create({
    file: archivoAudio,
    model: 'whisper-large-v3',
    language: 'es',
    temperature: 0.0,
    prompt: '.',
  });

  const textoCrudo = respuestaWhisper.text?.trim() || '';
  return esAlucinacionAudio(textoCrudo) ? '' : textoCrudo;
}

export async function generarReplicaCoactor(historial: MensajeChat[]): Promise<string> {
  const groq = crearClienteGroq();
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: crearPromptCoactor(historial) },
      ...historial,
    ],
    temperature: 0.6,
    max_tokens: 60,
  });

  return response.choices[0]?.message?.content?.trim() || 'Continua, te escucho.';
}

export async function evaluarActoDirector(params: {
  fase: FaseActo;
  titulo: string;
  historial: MensajeChat[];
  textoActor: string;
}): Promise<EvaluacionActo> {
  const groq = crearClienteGroq();
  const propuestaFinal = params.textoActor.trim() ? params.textoActor : '[SIN_RESPUESTA]';
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: crearPromptDirector(params) }],
    temperature: 0.1,
    max_tokens: 150,
    response_format: { type: 'json_object' },
  });

  const textoCrudo = response.choices[0]?.message?.content?.trim() || '{}';
  const resultado = extraerEvaluacionDirector(textoCrudo);

  const desenlaceAbierto = params.fase === 'desenlace' && desenlacePareceAbierto(params.historial);

  return {
    aprobado: !!resultado.aprobado && !desenlaceAbierto,
    comentario: desenlaceAbierto
      ? 'El nudo tiene energia, pero el ultimo turno deja la accion pendiente o en pregunta. Falta una decision o remate que cierre la obra.'
      : resultado.comentario || 'Cumple con el ritmo del libreto.',
    transcripcionAcumulada: propuestaFinal === '[SIN_RESPUESTA]' ? 'Sin intervencion de voz.' : propuestaFinal,
  };
}
