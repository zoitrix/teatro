import type { FaseActo, ObraHistorial } from './types';
import { crearCriteriosIntroduccionEscenica } from '../shared/introEvaluation';

export function crearConsignasDirector(fase: FaseActo, titulo: string, obra: ObraHistorial): string {
  if (fase === 'intro') {
    return crearCriteriosIntroduccionEscenica(titulo);
  }

  if (fase === 'giro1') {
    return `OBJETIVO DE LA EVALUACION:
- Analiza UNICAMENTE la propuesta del actor dentro de <texto_del_actor>.
- El actor debe introducir un PRIMER PUNTO DE GIRO que altere directamente el rumbo de la introduccion previa ("${obra.intro}").
- Si es un saludo, texto vacio o una evasion sin relacion, "aprobado" DEBE ser false.`;
  }

  if (fase === 'giro2') {
    return `OBJETIVO DE LA EVALUACION:
- Analiza UNICAMENTE la propuesta del actor dentro de <texto_del_actor>.
- El actor debe sumar un SEGUNDO PUNTO DE GIRO sobre la Intro ("${obra.intro}") y el Giro 1 ("${obra.giro1}").
- Si el texto esta vacio, es inconexo o no anade ninguna complicacion a la narrativa previa, "aprobado" DEBE ser false.`;
  }

  return `OBJETIVO DE LA EVALUACION:
- Analiza UNICAMENTE la propuesta del actor dentro de <texto_del_actor>.
- El actor debe dar un cierre o resolucion final que concluya la cadena de eventos previos (Intro: "${obra.intro}" -> Giros: "${obra.giro1}" y "${obra.giro2}").
- Si el texto carece de sustancia resolutiva o corta la escena abruptamente sin cerrar nada, "aprobado" DEBE ser false.`;
}

export function crearPromptDirector(params: {
  fase: FaseActo;
  titulo: string;
  obra: ObraHistorial;
  propuestaFinal: string;
}): string {
  const consignasEspecificas = crearConsignasDirector(params.fase, params.titulo, params.obra);

  return `
[ROL]
Eres un Director de teatro de improvisacion hiperactivo, tecnico, apasionado y muy exigente. Hablas siempre utilizando jerga teatral.

[MISION DE ANALISIS]
Tu unico trabajo es juzgar si el <texto_del_actor> cumple con el objetivo tecnico del acto actual. El titulo y el historial son contextos fijos para medir la coherencia; esta prohibido evaluar si el titulo es creativo. Juzga al ACTOR, no al escenario.

[CONSIGNAS ESPECIFICAS PARA ESTE ACTO]
${consignasEspecificas}

[DATOS DE ENTRADA DE LA ESCENA]
<titulo_escena_contexto>${params.titulo}</titulo_escena_contexto>
<texto_del_actor>${params.propuestaFinal}</texto_del_actor>

[REGLA INQUEBRANTABLE DE MUTISMO]
- Si <texto_del_actor> es exactamente "[SIN_RESPUESTA]", el campo "aprobado" DEBE ser false y nunca mencionar en el comentario la palabra "[SIN_RESPUESTA]".
- Si hay cualquier otra propuesta escrita, evaluala bajo los criterios normales detallados arriba.

[FORMATO DE SALIDA ESTRICTO]
Devuelve EXCLUSIVAMENTE un objeto JSON valido:
{
  "aprobado": true o false,
  "comentario": "Critica teatral breve de maximo 35 palabras."
}`;
}
