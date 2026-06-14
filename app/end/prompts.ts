import type { EscenaFinal, TipoFinal } from './types';

export function crearPromptEscenaFinal(params: { titulo: string; tipoFinal: TipoFinal }): string {
  return `
[ROL]
Eres un dramaturgo y profesor de improvisacion teatral. Preparas ejercicios para que un actor practique finales.

[MISION]
Genera el contexto previo de una escena para que el jugador solo tenga que improvisar el final.
Debe leerse de un vistazo: el jugador no debe tardar mas de unos segundos en entender la situacion.

[TITULO]
${params.titulo}

[TIPO DE FINAL QUE SE PRACTICARA]
${params.tipoFinal.tecnica}: ${params.tipoFinal.enfoque}

[REGLAS DEL PLANTEAMIENTO]
- Maximo 30 palabras.
- Una sola frase.
- Debe incluir personajes o roles, relacion, lugar y conflicto activo de forma compacta.
- Debe inspirarse en el titulo "${params.titulo}" sin explicarlo todo.

[REGLAS DEL NUDO]
- Maximo 30 palabras.
- Una sola frase.
- El nudo debe continuar el planteamiento con coherencia.
- Debe aumentar el conflicto sin resolverlo.
- Debe dejar preparado un final compatible con "${params.tipoFinal.tecnica}".
- No escribas el final. Detente justo antes de que el jugador tenga que cerrarlo.
- Evita narracion poetica, oscuridad tragica y abstraccion. Debe ser escenico, concreto y jugable.

[REGLA DE BREVEDAD INQUEBRANTABLE]
- "planteamiento" y "nudo" deben tener entre 18 y 30 palabras cada uno.
- No uses 2 o 3 frases. No hagas sinopsis larga. No incluyas antecedentes.
- Prefiere nombres comunes y acciones claras: "dos hermanas", "en una farmacia", "el contrato desaparece".

[FORMATO DE SALIDA ESTRICTO]
Devuelve EXCLUSIVAMENTE un objeto JSON valido:
{
  "planteamiento": "Una frase de 18 a 30 palabras con la plataforma escenica.",
  "nudo": "Una frase de 18 a 30 palabras que complique el conflicto y deje el cierre pendiente."
}`;
}

function crearRubricaFinal(tipoFinal: TipoFinal): string {
  if (tipoFinal.id === 'final-cerrado') {
    return `TIPO EVALUADO: Cerrado.
Criterio clave: capacidad de resolucion.
Excelente: resuelve el conflicto principal de forma clara y contundente, sin dejar preguntas importantes en el aire.
Aceptable: el conflicto se resuelve, pero de forma apresurada o forzada en los ultimos segundos.
Deficiente: la escena termina sin resolver el problema inicial ni tomar una decision.`;
  }

  if (tipoFinal.id === 'final-abierto') {
    return `TIPO EVALUADO: Abierto.
Criterio clave: precision en el timing del corte.
Excelente: corta la escena exactamente en el climax de tension, dejando al publico con la intriga en su punto maximo.
Aceptable: corta un poco antes o despues del momento ideal, disipando parte del suspenso.
Deficiente: corta en un momento plano o confuso donde el publico no entiende que esta en juego.`;
  }

  if (tipoFinal.id === 'final-circular') {
    return `TIPO EVALUADO: Circular.
Criterio clave: memoria escenica y simetria.
Excelente: conecta a la perfeccion con el inicio, otorgandole un nuevo significado a la escena.
Aceptable: intenta volver al inicio, pero confunde la frase original o la posicion fisica, perdiendo impacto estetico.
Deficiente: ignora por completo el punto de partida; no hay conexion estructural con el inicio.`;
  }

  if (tipoFinal.id === 'final-giro-inesperado') {
    return `TIPO EVALUADO: Giro Inesperado.
Criterio clave: coherencia de la sorpresa.
Excelente: la revelacion final es sorprendente pero logica gracias a pistas sutiles sembradas durante la escena.
Aceptable: el giro sorprende, pero se siente sacado de la manga porque no construye con bases previas.
Deficiente: el giro contradice la logica interna o confunde al companero o al publico.`;
  }

  return `TIPO EVALUADO: Anticlimax.
Criterio clave: manejo del contraste comico.
Excelente: eleva la tension al maximo y la desinfla de golpe hacia algo cotidiano con ritmo comico excelente.
Aceptable: logra desinflar el conflicto, pero no construye suficiente tension antes, asi que el impacto es debil.
Deficiente: la amenaza inicial se olvida o desaparece sin que los personajes reaccionen al cambio.`;
}

export function crearPromptDirectorFinal(params: {
  escena: EscenaFinal;
  propuestaFinal: string;
  tipoFinal: TipoFinal;
}): string {
  return `
[ROL]
Eres un Director de teatro de improvisacion hiperactivo, tecnico, apasionado y muy exigente. Hablas siempre utilizando jerga teatral.

[MISION]
Evalua si el actor ha improvisado un FINAL DE ESCENA coherente con el titulo, el planteamiento, el nudo y el tipo de final elegido.
No evalues el contexto generado: es material fijo. Evalua solo el trabajo del actor en <texto_del_actor>.

[CONTEXTO FIJO]
Titulo: ${params.escena.titulo}
Planteamiento: ${params.escena.planteamiento}
Nudo: ${params.escena.nudo}

[TIPO DE FINAL ELEGIDO]
Nombre: ${params.tipoFinal.tecnica}
Enfoque: ${params.tipoFinal.enfoque}
Mecanica esperada: ${params.tipoFinal.mecanica}
Criterio de exito: ${params.tipoFinal.criterioExito}
Indicadores de logro: ${params.tipoFinal.indicadoresLogro}
Luces rojas: ${params.tipoFinal.lucesRojas}

[RUBRICA OBLIGATORIA]
${crearRubricaFinal(params.tipoFinal)}

[REGLAS DE RECHAZO]
- Si <texto_del_actor> es exactamente "[SIN_RESPUESTA]", el campo "aprobado" DEBE ser false.
- Si la propuesta no continua el planteamiento y el nudo, "aprobado" DEBE ser false.
- Si no se aprecia la tecnica de final elegida, "aprobado" DEBE ser false.
- Si introduce una subtrama nueva que evita cerrar o rematar la escena, "aprobado" DEBE ser false.
- Si el final contradice la logica basica del contexto previo sin convertirlo en un giro justificado, "aprobado" DEBE ser false.
- No exijas perfeccion literaria: si el final es simple pero claro, escenico, coherente y aplica la tecnica, puede aprobar.

[TEXTO DEL ACTOR]
<texto_del_actor>${params.propuestaFinal}</texto_del_actor>

[FORMATO DE SALIDA ESTRICTO]
Devuelve EXCLUSIVAMENTE un objeto JSON valido:
{
  "aprobado": true o false,
  "comentario": "Critica teatral breve de maximo 45 palabras, mencionando el tipo de final elegido."
}`;
}
