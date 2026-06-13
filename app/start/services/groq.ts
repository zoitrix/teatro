import { OpenAI } from 'openai';
import { crearPromptDirectorInicio } from '../prompts';
import type { DificultadStart, EstrategiaInicio, EvaluacionDirector } from '../types';
import {
  generarTituloImpro as generarTituloStructure,
  transcribirAudioImpro as transcribirAudioStructure,
} from '../../structure/services/groq';

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

export async function generarTituloInicio(dificultad: DificultadStart, titulos: string[]): Promise<string> {
  return generarTituloStructure(dificultad, titulos);
}

export async function transcribirAudioInicio(audioBlob: Blob | null): Promise<string> {
  return transcribirAudioStructure(audioBlob);
}

export async function evaluarInicioConDirector(params: {
  titulo: string;
  propuestaFinal: string;
  estrategia: EstrategiaInicio;
}): Promise<EvaluacionDirector> {
  const groq = crearClienteGroq();
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: crearPromptDirectorInicio(params) }],
    temperature: 0.2,
    max_tokens: 180,
    response_format: { type: 'json_object' },
  });

  const textoCrudo = response.choices[0]?.message?.content?.trim() || '{}';
  const objetoJSON = extraerEvaluacionDirector(textoCrudo);

  return {
    aprobado: !!objetoJSON.aprobado,
    comentario: objetoJSON.comentario || 'Falta una entrada escenica mas concreta y alineada con la tecnica.',
  };
}
