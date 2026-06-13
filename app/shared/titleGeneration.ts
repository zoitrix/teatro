import { OpenAI } from 'openai';
import { crearAvisoVariedadTitulos, tituloSePareceAHistorial } from './titleSimilarity';

const INTENTOS_TITULO = 6;

const TITULOS_FALLBACK = [
  'La impresora exige vacaciones',
  'Mi maleta voto por mi',
  'El ascensor cobra entrada',
  'La sopa pidio abogado',
  'Hacienda adopto mi fantasma',
  'El semaforo dirige la boda',
  'Mi reloj renuncio ayer',
  'La farmacia vende disculpas',
  'El taxi sabe demasiado',
  'La tarta cancelo el cumpleanos',
  'El banco perdono al cajero',
  'La nevera pide testigos',
  'Mi zapato gano la subasta',
  'El examen denuncio al profesor',
  'La alarma exige aplausos',
  'El menu eligio presidente',
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

function normalizarDificultad(dificultad: string): 'facil' | 'media' | 'dificil' {
  const dificultadNormalizada = dificultad
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (dificultadNormalizada === 'facil') {
    return 'facil';
  }

  if (dificultadNormalizada === 'dificil') {
    return 'dificil';
  }

  return 'media';
}

function crearGuiaDificultadTitulo(dificultad: string): string {
  const dificultadNormalizada = normalizarDificultad(dificultad);

  if (dificultadNormalizada === 'facil') {
    return `FACIL: locura cotidiana y jugable.
- Debe partir de una situacion reconocible: casa, familia, trabajo, compra, colegio, medico, restaurante, transporte, tramite o celebracion.
- La rareza debe ser pequena y facil de actuar: una orden absurda, un malentendido claro, un objeto fuera de lugar.
- Evita amenazas cosmicas, conspiraciones, leyes imposibles o tecnologia rara.
- Salida invalida: El universo exige explicaciones.
- Salida valida: Tu madre escondio mi maleta.`;
  }

  if (dificultadNormalizada === 'media') {
    return `MEDIA: caos social con secreto incomodo.
- Debe incluir una revelacion, sospecha, acusacion o regla absurda que complique una situacion normal.
- La escena debe sonar a chisme de publico, no a fantasia abstracta.
- Puede haber exageracion, pero el conflicto debe entenderse al instante.
- Salida invalida: Me despiertan a medianoche.
- Salida valida: El cura subasta mi cumpleanos.`;
  }

  return `DIFICIL: absurdo extremo pero concreto.
- Debe mezclar un lugar, objeto o tramite cotidiano con una consecuencia imposible.
- La locura debe ser clara y actuable: burocracia absurda, autoridad ridicula, objeto con poder social, norma imposible, secreto desproporcionado.
- Prohibido quedarse en misterio generico: medianoche, alarma, sombra, secreto, destino o sueno no bastan por si solos.
- Prohibido inventar palabras, nombres falsos o terminos que no existan en espanol.
- Salida invalida: Me despiertan a medianoche.
- Salida invalida: Me despierta el leder de la alarma.
- Salida valida: Hacienda reclama mi amigo imaginario.`;
}

function crearPromptTitulo(dificultad: string, titulos: string[]): string {
  const historialTitulos = titulos.length > 0 ? titulos.join(', ') : 'Ninguno todavia';
  const avisoVariedad = crearAvisoVariedadTitulos(titulos);
  const dificultadNormalizada = normalizarDificultad(dificultad).toUpperCase();

  return `
[ROL]
Eres un espectador real, gamberro, divertido y muy espontaneo en un show de comedia de improvisacion teatral. Estas entre el publico y gritas una frase ingeniosa para que los actores arranquen su escena desde una situacion estimulante.

[MISION]
Inventa una frase inicial o titulo unico de exactamente entre 4 y 7 palabras en espanol.

[REGLA CRITICA DE ORTOGRAFIA Y GRAMATICA]
- Queda estrictamente PROHIBIDO inventar palabras o cometer errores de conjugacion. Asegurate de que todos los verbos irregulares esten perfectamente conjugados en espanol real y correcto.
- Usa solo palabras comunes del espanol. Nada de spanglish, nombres inventados, marcas falsas ni terminos deformados.
- La frase debe entenderse en una lectura rapida y tener sujeto, accion y situacion concreta.

[REGLAS DE ORO PARA EL TONO]
1. PROHIBIDO EL TONO POETICO O METAFORICO: Evita frases filosoficas abstractas. Nadie grita poesia en un show de impro.
2. FRASES DE PUBLICO REAL: Debe sonar a chisme, orden, acusacion, queja o confesion absurda.
3. VARIEDAD SINTACTICA: Usa preguntas, imperativos, exclamaciones o pon el tiempo/lugar al principio.

[EVITAR REPETICION]
- Historial de titulos ya jugados: [${historialTitulos}]
- La nueva frase debe alejarse claramente de todos los titulos del historial.
- No repitas conceptos, entornos, objetos, roles, relaciones, conflictos ni palabras clave del historial.
- No generes una variante, sinonimo, inversion de palabras o giro parecido de un titulo anterior.
- ${avisoVariedad}
- Si una palabra aparece en la lista de palabras ya gastadas, evita tambien su masculino, femenino, plural, diminutivo, aumentativo y sinonimos obvios.
- Si un tema aparece en la lista de temas ya gastados, elige otro universo dramatico aunque las palabras exactas sean distintas.

[FILTRO DE CONTENIDO]
Nada de dramas oscuros, tragedias ni infidelidades serias. Buscamos comedia de enredos, situaciones ridiculas y juego limpio.

[MECANISMO DE INSPIRACION POR NIVEL: ${dificultadNormalizada}]
${crearGuiaDificultadTitulo(dificultad)}

[CONTROL DE CALIDAD FINAL]
Revisa que las palabras existan, esten bien escritas y suenen naturales. Debe tener entre 4 y 7 palabras.
Antes de responder, descarta mentalmente cualquier frase que:
- Parezca un titulo generico de pelicula.
- Sea solo una situacion normal sin giro comico.
- Contenga una palabra dudosa o inventada.
- Use Mayusculas En Cada Palabra.
- Se parezca en tema, situacion, rol, objeto, conflicto o vocabulario a cualquier titulo del historial.

[FORMATO DE SALIDA CRITICO]
Devuelve UNICAMENTE las palabras de la frase final.
- Usa mayuscula solo al inicio de la frase o en nombres propios reales.
- Prohibido usar comillas de cualquier tipo.
- Prohibido usar parentesis, corchetes, asteriscos o notas escenicas.
- Prohibido escribir introducciones como "Aqui tienes", "Titulo:", "Frase:" o similares.
- Prohibido explicar tu decision, describir tu pensamiento o anadir comentarios metalinguisticos.
- Salida invalida: "La noche susurra secretos" (suena poetico y generico)
- Salida valida: Tu madre escondio mi maleta

Frase final:`;
}

function limpiarTituloGenerado(textoCrudo: string): string {
  const primeraLinea = textoCrudo
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .find(Boolean) || '';

  const sinPrefijo = primeraLinea.replace(
    /^(?:aqui tienes(?: una frase| un titulo)?|frase final|frase|titulo|propuesta|respuesta)\s*:\s*/i,
    '',
  );

  return sinPrefijo
    .replace(/\s*[\(\[\{][^\)\]\}]*[\)\]\}]\s*/g, ' ')
    .replace(/["'`“”‘’«»]/g, '')
    .replace(/[.。]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTemperaturaTitulo(dificultad: string): number {
  const dificultadNormalizada = normalizarDificultad(dificultad);

  if (dificultadNormalizada === 'facil') {
    return 0.6;
  }

  if (dificultadNormalizada === 'media') {
    return 0.8;
  }

  return 0.95;
}

export async function generarTituloComun(dificultad: string, titulos: string[]): Promise<string> {
  const groq = crearClienteGroq();
  const rechazados: string[] = [];
  let mejorTitulo = '';

  for (let intento = 0; intento < INTENTOS_TITULO; intento += 1) {
    const historialParaPrompt = [...titulos, ...rechazados];
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: crearPromptTitulo(dificultad, historialParaPrompt) }],
      temperature: Math.min(getTemperaturaTitulo(dificultad) + intento * 0.15, 1.2),
      max_tokens: 40,
    });

    const titulo = limpiarTituloGenerado(response.choices[0]?.message?.content?.trim() || '');

    if (!titulo) {
      continue;
    }

    mejorTitulo = mejorTitulo || titulo;

    if (!tituloSePareceAHistorial(titulo, titulos)) {
      return titulo;
    }

    rechazados.push(titulo);
  }

  const fallback = TITULOS_FALLBACK.find((titulo) => !tituloSePareceAHistorial(titulo, titulos));

  return fallback || mejorTitulo || 'Titulo Misterioso';
}
