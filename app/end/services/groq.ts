import { OpenAI } from 'openai';
import { ALUCINACIONES_WHISPER, TAMANO_MINIMO_VOZ } from '../../structure/constants';
import { crearPromptDirectorFinal, crearPromptEscenaFinal } from '../prompts';
import type { DificultadEnd, EscenaFinal, EvaluacionDirector, TipoFinal } from '../types';
import { generarTituloComun } from '../../shared/titleGeneration';

function crearClienteGroq(): OpenAI {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('La API Key de Groq no esta configurada.');
  }

  return new OpenAI({
    apiKey: apiKey.trim(),
    baseURL: 'https://api.groq.com/openai/v1',
    dangerouslyAllowBrowser: true,
  });
}

function extraerObjetoJSON<T>(textoCrudo: string): Partial<T> {
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

export async function generarTituloFinal(dificultad: DificultadEnd, titulos: string[]): Promise<string> {
  return generarTituloComun(dificultad, titulos);
}

export async function generarEscenaParaFinal(params: {
  titulo: string;
  tipoFinal: TipoFinal;
}): Promise<Pick<EscenaFinal, 'planteamiento' | 'nudo'>> {
  const groq = crearClienteGroq();
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: crearPromptEscenaFinal(params) }],
    temperature: 0.75,
    max_tokens: 320,
    response_format: { type: 'json_object' },
  });

  const textoCrudo = response.choices[0]?.message?.content?.trim() || '{}';
  const objetoJSON = extraerObjetoJSON<Pick<EscenaFinal, 'planteamiento' | 'nudo'>>(textoCrudo);

  return {
    planteamiento:
      objetoJSON.planteamiento ||
      'Dos familiares se encuentran en una cocina despues de una discusion antigua. Uno intenta mantener la calma mientras el otro exige una explicacion inmediata.',
    nudo:
      objetoJSON.nudo ||
      'La conversacion revela que ambos necesitan el mismo objeto para resolver un problema urgente, pero solo uno puede salir de la casa con el.',
  };
}

export async function transcribirAudioFinal(audioBlob: Blob | null): Promise<string> {
  if (!audioBlob || audioBlob.size <= TAMANO_MINIMO_VOZ) {
    return '';
  }

  const groq = crearClienteGroq();
  const archivoAudio = new File([audioBlob], 'final.mp3', { type: 'audio/mp3' });
  const respuestaWhisper = await groq.audio.transcriptions.create({
    file: archivoAudio,
    model: 'whisper-large-v3',
    language: 'es',
    temperature: 0.0,
    prompt: 'Teatro, actuacion, improvisacion en espanol con buena puntuacion.',
  });

  const transcripcion = respuestaWhisper.text?.trim() || '';
  const normalizada = transcripcion.toLowerCase();
  const contieneBasura = ALUCINACIONES_WHISPER.some((frase) => normalizada.includes(frase));

  if (contieneBasura || transcripcion.length < 4) {
    return '';
  }

  return transcripcion;
}

export async function evaluarFinalConDirector(params: {
  escena: EscenaFinal;
  propuestaFinal: string;
  tipoFinal: TipoFinal;
}): Promise<EvaluacionDirector> {
  const groq = crearClienteGroq();
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: crearPromptDirectorFinal(params) }],
    temperature: 0.2,
    max_tokens: 190,
    response_format: { type: 'json_object' },
  });

  const textoCrudo = response.choices[0]?.message?.content?.trim() || '{}';
  const objetoJSON = extraerObjetoJSON<EvaluacionDirector>(textoCrudo);

  return {
    aprobado: !!objetoJSON.aprobado,
    comentario: objetoJSON.comentario || 'Falta un cierre mas claro, coherente y alineado con el tipo de final elegido.',
  };
}
