import { OpenAI } from 'openai';
import { ALUCINACIONES_WHISPER, TAMANO_MINIMO_VOZ } from '../constants';
import { crearPromptDirector } from '../prompts';
import type { DificultadImpro, EvaluacionDirector, FaseActo, ObraHistorial } from '../types';
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

function extraerEvaluacionDirector(textoCrudo: string): Partial<EvaluacionDirector> {
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

export async function generarTituloImpro(dificultad: DificultadImpro, titulos: string[]): Promise<string> {
  return generarTituloComun(dificultad, titulos);
}

export async function transcribirAudioImpro(audioBlob: Blob | null): Promise<string> {
  if (!audioBlob || audioBlob.size <= TAMANO_MINIMO_VOZ) {
    return '';
  }

  const groq = crearClienteGroq();
  const archivoAudio = new File([audioBlob], 'impro.mp3', { type: 'audio/mp3' });
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

export async function evaluarActoConDirector(params: {
  fase: FaseActo;
  titulo: string;
  obra: ObraHistorial;
  propuestaFinal: string;
}): Promise<EvaluacionDirector> {
  const groq = crearClienteGroq();
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: crearPromptDirector(params) }],
    temperature: 0.2,
    max_tokens: 150,
    response_format: { type: 'json_object' },
  });

  const textoCrudo = response.choices[0]?.message?.content?.trim() || '{}';
  const objetoJSON = extraerEvaluacionDirector(textoCrudo);

  return {
    aprobado: !!objetoJSON.aprobado,
    comentario: objetoJSON.comentario || 'Falta contundencia en la propuesta.',
  };
}
