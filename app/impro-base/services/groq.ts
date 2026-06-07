import { OpenAI } from 'openai';
import { ALUCINACIONES_WHISPER, TAMANO_MINIMO_VOZ } from '../constants';
import { crearPromptDirector, crearPromptTitulo } from '../prompts';
import type { DificultadImpro, EvaluacionDirector, FaseActo, ObraHistorial } from '../types';

function crearClienteGroq(): OpenAI {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;

  if (!apiKey) {
    throw new Error('La API Key de Groq no esta configurada.');
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
    dangerouslyAllowBrowser: true,
  });
}

export async function generarTituloImpro(dificultad: DificultadImpro, titulos: string[]): Promise<string> {
  const groq = crearClienteGroq();
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: crearPromptTitulo(dificultad, titulos) }],
    max_tokens: 80,
  });

  return response.choices[0]?.message?.content?.trim() || 'Titulo Misterioso';
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
  });

  const textoCrudo = response.choices[0]?.message?.content?.trim() || '{}';
  const inicioJson = textoCrudo.indexOf('{');
  const finJson = textoCrudo.lastIndexOf('}');
  const jsonLimpio = textoCrudo.substring(inicioJson, finJson + 1);
  const objetoJSON = JSON.parse(jsonLimpio);

  return {
    aprobado: !!objetoJSON.aprobado,
    comentario: objetoJSON.comentario || 'Falta contundencia en la propuesta.',
  };
}

