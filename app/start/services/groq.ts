import { OpenAI } from 'openai';
import { crearPromptDirectorInicio } from '../prompts';
import type { DificultadStart, EstrategiaInicio, EvaluacionDirector } from '../types';
import {
  generarTituloImpro as generarTituloStructure,
  transcribirAudioImpro as transcribirAudioStructure,
} from '../../structure/services/groq';

const PALABRAS_VACIAS_LITERALIDAD = new Set([
  'a',
  'al',
  'como',
  'con',
  'de',
  'del',
  'el',
  'en',
  'la',
  'las',
  'le',
  'lo',
  'los',
  'me',
  'mi',
  'mis',
  'para',
  'por',
  'que',
  'se',
  'su',
  'sus',
  'tu',
  'un',
  'una',
  'y',
]);

const GRUPOS_SINONIMOS_LITERALIDAD = [
  ['billetera', 'cartera', 'monedero'],
  ['ayer', 'anoche', 'noche', 'anterior'],
  ['robar', 'robo', 'robaron', 'robado', 'ladron'],
  ['mujer', 'esposa', 'femenina', 'femenino'],
  ['vestir', 'viste', 'vestido', 'ropa', 'disfraz'],
  ['cocina', 'cocinar', 'cocinado', 'cocinados', 'olla', 'sarten'],
  ['gato', 'gatos', 'felino', 'felinos'],
  ['perro', 'perros', 'can', 'mascota'],
  ['vecino', 'vecina', 'vecinos', 'vecinas'],
  ['tio', 'tia', 'familiar'],
];

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

function comentarioIndicaTecnicaInsuficiente(comentario: string): boolean {
  const normalizado = comentario
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return [
    'tecnica limitada',
    'aplicacion limitada',
    'podria haber explorado mas',
    'podria explorar mas',
    'demasiado literal',
    'muy literal',
    'no se aprecia la tecnica',
    'falta la tecnica',
    'sin aplicar la tecnica',
    'tecnica insuficiente',
  ].some((patron) => normalizado.includes(patron));
}

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
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

function extraerTerminosLiteralidad(texto: string): string[] {
  return normalizarTexto(texto)
    .split(' ')
    .map(raizComparacion)
    .filter((palabra) => palabra.length > 2 && !PALABRAS_VACIAS_LITERALIDAD.has(palabra));
}

function compartenRaiz(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }

  const longitud = Math.min(a.length, b.length);
  return longitud >= 5 && a.slice(0, 5) === b.slice(0, 5);
}

function estanEnMismoGrupoSemantico(a: string, terminosPropuesta: Set<string>): boolean {
  return GRUPOS_SINONIMOS_LITERALIDAD.some((grupo) => {
    const grupoNormalizado = grupo.map(raizComparacion);
    const contieneTitulo = grupoNormalizado.some((termino) => compartenRaiz(a, termino));

    if (!contieneTitulo) {
      return false;
    }

    return grupoNormalizado.some((termino) =>
      [...terminosPropuesta].some((terminoPropuesta) => compartenRaiz(termino, terminoPropuesta)),
    );
  });
}

function propuestaEsLiteralParaAsociacionesSatelite(titulo: string, propuesta: string): boolean {
  const terminosTitulo = [...new Set(extraerTerminosLiteralidad(titulo))];
  const terminosPropuesta = new Set(extraerTerminosLiteralidad(propuesta));

  if (terminosTitulo.length === 0 || terminosPropuesta.size === 0) {
    return false;
  }

  const coincidencias = terminosTitulo.filter((terminoTitulo) => {
    const coincidePorRaiz = [...terminosPropuesta].some((terminoPropuesta) =>
      compartenRaiz(terminoTitulo, terminoPropuesta),
    );

    return coincidePorRaiz || estanEnMismoGrupoSemantico(terminoTitulo, terminosPropuesta);
  }).length;

  return coincidencias >= 2 && coincidencias / terminosTitulo.length >= 0.5;
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
  const comentario = objetoJSON.comentario || 'Falta una entrada escenica mas concreta y alineada con la tecnica.';
  const tecnicaInsuficiente = comentarioIndicaTecnicaInsuficiente(comentario);
  const literalidadSatelite =
    params.estrategia.id === 'asociaciones-satelite' &&
    propuestaEsLiteralParaAsociacionesSatelite(params.titulo, params.propuestaFinal);

  return {
    aprobado: !!objetoJSON.aprobado && !tecnicaInsuficiente && !literalidadSatelite,
    comentario: literalidadSatelite
      ? 'La introduccion es jugable, pero va al nucleo literal del titulo. Para Asociaciones Satelite necesitas arrancar desde una asociacion periferica.'
      : comentario,
  };
}
