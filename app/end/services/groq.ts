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

function limitarPalabras(texto: string, maxPalabras = 30): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();

  if (!limpio) {
    return '';
  }

  const palabras = limpio.split(' ');

  if (palabras.length <= maxPalabras) {
    return limpio;
  }

  return `${palabras.slice(0, maxPalabras).join(' ').replace(/[,:;]+$/g, '')}.`;
}

const PALABRAS_VACIAS_TITULO = new Set([
  'a',
  'al',
  'como',
  'con',
  'de',
  'del',
  'el',
  'en',
  'es',
  'esta',
  'este',
  'hay',
  'la',
  'las',
  'lo',
  'los',
  'para',
  'por',
  'que',
  'se',
  'sin',
  'su',
  'sus',
  'un',
  'una',
  'y',
]);

function normalizarTextoComparacion(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:"'()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function raizComparacion(palabra: string): string {
  if (palabra.length > 6 && palabra.endsWith('es')) {
    return palabra.slice(0, -2);
  }

  if (palabra.length > 5 && palabra.endsWith('s')) {
    return palabra.slice(0, -1);
  }

  return palabra;
}

function extraerAnclasTitulo(titulo: string): string[] {
  return normalizarTextoComparacion(titulo)
    .split(' ')
    .map(raizComparacion)
    .filter((palabra) => palabra.length > 3 && !PALABRAS_VACIAS_TITULO.has(palabra));
}

function contextoEstaAncladoAlTitulo(titulo: string, contexto: Pick<EscenaFinal, 'planteamiento' | 'nudo'>): boolean {
  const anclas = extraerAnclasTitulo(titulo);

  if (anclas.length === 0) {
    return true;
  }

  const textoContexto = normalizarTextoComparacion(`${contexto.planteamiento} ${contexto.nudo}`);
  const anclasPresentes = anclas.filter((ancla) => textoContexto.includes(ancla));
  const minimoAnclas = anclas.length >= 3 ? 2 : 1;
  const rarezaCentral = [...anclas].sort((a, b) => b.length - a.length)[0];

  return anclasPresentes.length >= minimoAnclas && textoContexto.includes(rarezaCentral);
}

function crearFallbackAnclado(titulo: string): Pick<EscenaFinal, 'planteamiento' | 'nudo'> {
  const tituloLimpio = titulo.replace(/[¿?¡!]/g, '').trim();

  return {
    planteamiento: limitarPalabras(
      `En escena, dos trabajadores convierten "${tituloLimpio}" en una norma real que afecta directamente al publico y bloquea la situacion.`,
    ),
    nudo: limitarPalabras(
      `La autoridad del lugar exige cumplir la norma de inmediato, mientras alguien descubre una forma peligrosa de esquivarla.`,
    ),
  };
}

export async function generarTituloFinal(dificultad: DificultadEnd, titulos: string[]): Promise<string> {
  return generarTituloComun(dificultad, titulos);
}

export async function generarEscenaParaFinal(params: {
  titulo: string;
  tipoFinal: TipoFinal;
}): Promise<Pick<EscenaFinal, 'planteamiento' | 'nudo'>> {
  const groq = crearClienteGroq();

  for (let intento = 0; intento < 3; intento += 1) {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: crearPromptEscenaFinal(params) }],
      temperature: Math.min(0.75 + intento * 0.1, 0.95),
      max_tokens: 180,
      response_format: { type: 'json_object' },
    });

    const textoCrudo = response.choices[0]?.message?.content?.trim() || '{}';
    const objetoJSON = extraerObjetoJSON<Pick<EscenaFinal, 'planteamiento' | 'nudo'>>(textoCrudo);
    const contexto = {
      planteamiento: limitarPalabras(objetoJSON.planteamiento || ''),
      nudo: limitarPalabras(objetoJSON.nudo || ''),
    };

    if (contexto.planteamiento && contexto.nudo && contextoEstaAncladoAlTitulo(params.titulo, contexto)) {
      return contexto;
    }
  }

  return crearFallbackAnclado(params.titulo);
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
