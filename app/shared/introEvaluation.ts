export function crearCriteriosIntroduccionEscenica(titulo: string): string {
  return `OBJETIVO DE LA EVALUACION:
- Analiza UNICAMENTE la propuesta del actor dentro de <texto_del_actor>. El titulo es fijo y no se juzga.
- Para otorgar "aprobado": true, el actor debe construir una INTRODUCCION ESCENICA completa inspirada en el titulo "${titulo}".
- La introduccion debe incluir TODOS estos elementos de forma reconocible:
  1. Personajes concretos o roles escenicos identificables.
  2. Relacion clara entre esos personajes.
  3. Emocion, actitud o estado interno que condicione la escena.
  4. Conflicto, tension, deseo incompatible o problema activo que pueda impulsar la impro.
- No basta con continuar, repetir, parafrasear o adornar el titulo. El texto debe aportar informacion dramatica nueva y jugable.
- No exijas genialidad artistica: si los cuatro elementos anteriores aparecen de forma simple pero clara y guardan una relacion logica, comica o tematica con el titulo, dalo por bueno.

REGLA DE RECHAZO CRITICA:
- Si el usuario repite el titulo tal cual, solo lo parafrasea, lo convierte en una frase suelta o no plantea personajes, relacion, emociones y conflicto, debes poner "aprobado": false.
- Si el usuario evade el titulo por completo, dice sinsentidos inconexos, palabras sueltas o un saludo basico, debes poner "aprobado": false de inmediato.`;
}
