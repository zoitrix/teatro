import type { EstrategiaInicio } from './types';
import { crearCriteriosIntroduccionEscenica } from '../shared/introEvaluation';

function crearPruebaTecnicaEstrategia(estrategia: EstrategiaInicio): string {
  switch (estrategia.id) {
    case 'estilo-libre':
      return `PRUEBA ESPECIFICA PARA ESTILO LIBRE:
- Para aprobar, el actor debe transformar el titulo en una plataforma escenica clara sin depender de una tecnica concreta.
- Debe verse una decision inicial jugable: quien esta en escena, donde esta, que esta ocurriendo ahora y que tension abre la impro.
- La libertad no permite vaguedad: una ocurrencia aislada, un chiste suelto, una frase bonita o una reaccion generica al titulo NO cuenta.
- Si la propuesta podria ser solo una sinopsis de pelicula o una idea para despues, "aprobado" DEBE ser false.
- Ejemplo insuficiente: "Esto va de una familia que tiene un problema muy raro".
- Ejemplo suficiente: "Entro a la cocina con una factura en la mano y le digo a mi hermana que papa ha vendido la nevera para pagar clases de magia".`;

    case 'asociaciones-satelite':
      return `PRUEBA ESPECIFICA PARA ASOCIACIONES SATELITE:
- Para aprobar, el actor debe arrancar desde un elemento periferico del titulo, no desde su significado literal ni desde una simple reformulacion.
- Debe apreciarse una asociacion indirecta: lugar, sensacion, consecuencia lateral, objeto secundario, sospecha desplazada, ambiente o detalle que orbita alrededor del titulo sin repetir su centro.
- Repetir el hecho central del titulo con sinonimos NO cuenta como tecnica: robo/robaron, billetera/cartera, ayer/noche anterior, perder/perdido o acusar al ladron directo son caminos literales.
- Reutilizar el sujeto principal, la accion principal o la imagen central del titulo de forma directa NO cuenta como satelite aunque anada policia, ventana, localizador u otro detalle.
- Si el comentario honesto seria "la tecnica es limitada", "podria explorar mas la periferia" o "es demasiado literal", entonces "aprobado" DEBE ser false.
- Si el inicio se limita a explicar el titulo con mas contexto, "aprobado" DEBE ser false aunque tenga personajes, relacion, emocion y conflicto.
- Ejemplo insuficiente: "Discuto con el portero porque anoche me robaron la cartera y tengo un localizador".
- Ejemplo insuficiente: "Veo al vecino haciendo exactamente lo que dice el titulo y llamo a la policia".
- Ejemplo suficiente: "Entro a la discoteca contando las monedas exactas para pagar un vaso de agua, reviso compulsivamente cada bolsillo y acuso al guardarropa de oler a cuero nuevo".`;

    case 'disparador-primera-linea':
      return `PRUEBA ESPECIFICA PARA DISPARADOR PRIMERA LINEA:
- Para aprobar, debe existir una primera frase concreta, potente y jugable que rompa o reencuadre la expectativa del titulo.
- La frase debe sonar como algo que un personaje diria dentro de la escena, no como una explicacion del actor sobre lo que haria.
- La primera frase debe abrir premisa, relacion o conflicto de inmediato; no basta con decir "empezaria diciendo algo impactante".
- Si la propuesta describe una situacion pero no incluye una linea inicial clara o la linea no cambia nada, "aprobado" DEBE ser false.
- Ejemplo insuficiente: "Entraria enfadado y diria algo sorprendente sobre el titulo".
- Ejemplo suficiente: "Miro a mi hermano con la maleta abierta y digo: 'No metas al abuelo en la lavadora, esta vez va de copiloto'".`;

    case 'objeto-imaginario':
      return `PRUEBA ESPECIFICA PARA OBJETO IMAGINARIO:
- Para aprobar, el actor debe describir una accion fisica concreta con un objeto o elemento invisible: sostenerlo, levantarlo, abrirlo, apartarlo, arrastrarlo, limpiar restos, sujetar una correa, recoger flores, cerrar una puerta, etc.
- Debe percibirse al menos UNA cualidad fisica del objeto o espacio invisible: peso, tamano, forma, textura, fragilidad, resistencia, distancia, altura, volumen o precision de manos/cuerpo.
- Nombrar objetos, animales, flores, una casa o un jardin NO cuenta como aplicar la tecnica si no hay interaccion mimica precisa.
- Si la propuesta es principalmente narrativa o verbal y no muestra mimo, precision fisica ni peso dramatico, "aprobado" DEBE ser false aunque tenga personajes, relacion, emocion y conflicto.
- Ejemplo insuficiente: "La vecina acusa a mi perro de comerse sus flores y se enfada conmigo".
- Ejemplo suficiente: "Abro la puerta sujetando una correa invisible que tira de mi brazo; recojo del suelo unas flores mordidas, las huelo, las escondo detras de la espalda y miro a la vecina".`;

    case 'modificacion-postura':
      return `PRUEBA ESPECIFICA PARA MODIFICACION DE POSTURA:
- Para aprobar, el actor debe definir una postura corporal, energia fisica o estatus visible que condicione el inicio antes o durante la primera frase.
- Debe haber detalles del cuerpo entero: columna, hombros, mirada, ritmo, peso, respiracion, altura, tension, avance o retirada.
- La postura debe afectar al personaje, a la relacion o al conflicto; no basta con "estoy triste" o "entro enfadado".
- Si solo cambia la voz, la cara o la emocion verbal sin decision corporal clara, "aprobado" DEBE ser false.
- Ejemplo insuficiente: "Entro nervioso y discuto con mi jefe".
- Ejemplo suficiente: "Entro encogido, con los hombros pegados a las orejas y la mirada al suelo; avanzo dos pasos y retrocedo cada vez que mi jefa levanta la mano".`;

    case 'zoom-in':
      return `PRUEBA ESPECIFICA PARA EL ZOOM IN:
- Para aprobar, el actor debe empezar ampliando el mundo con detalles espaciales o sensoriales concretos antes de empujar el conflicto.
- Debe pintar un lugar visible: objetos, luz, olor, textura, temperatura, sonido, distancia, rincones o movimiento dentro del espacio.
- La descripcion debe servir a la escena y desembocar en personajes, relacion y tension; un inventario decorativo no cuenta.
- Si va directo al conflicto sin crear atmosfera, o describe de forma generica ("estamos en una casa normal"), "aprobado" DEBE ser false.
- Ejemplo insuficiente: "Estoy en una discoteca y discuto con el portero".
- Ejemplo suficiente: "La luz azul parpadea sobre el suelo pegajoso; hay pulseras rotas junto al guardarropa y el portero tapa con el pie una cartera de cuero".`;

    case 'in-media-res':
      return `PRUEBA ESPECIFICA PARA IN MEDIA RES:
- Para aprobar, la escena debe empezar ya en mitad de una accion, discusion o consecuencia activa, como si el publico llegara tarde.
- Debe haber urgencia inmediata: una frase a medio conflicto, una accion fisica ya iniciada, una acusacion en marcha, una persecucion, una reparacion desesperada o una decision irreversible.
- No debe dedicar el inicio a explicar antecedentes largos; el pasado se entiende por lo que esta ocurriendo ahora.
- Si la propuesta plantea primero la situacion y luego promete que habra conflicto, "aprobado" DEBE ser false.
- Ejemplo insuficiente: "Primero explico que ayer nos peleamos y despues empezamos a discutir".
- Ejemplo suficiente: "Entro sujetando la puerta con el hombro y grito: 'No abras la nevera, te dije que todavia esta negociando con mama'".`;

    case 'efecto-mariposa':
      return `PRUEBA ESPECIFICA PARA EFECTO MARIPOSA:
- Para aprobar, el actor debe empezar por un primer eslabon pequeno y cotidiano que pueda conducir logicamente al titulo como consecuencia final.
- Debe verse causalidad progresiva: una accion inocente, una decision minima, un habito o un detalle que promete escalar.
- No debe saltar directamente al titulo, al accidente final o al climax; tiene que disfrutar el inicio de la cadena.
- Si la propuesta empieza ya en la consecuencia principal o fuerza el resultado sin camino causal, "aprobado" DEBE ser false.
- Ejemplo insuficiente: "Empiezo con el jarron ya roto y todos gritando".
- Ejemplo suficiente: "Entro practicando patadas suaves con una pelota invisible mientras mi hermana estudia al lado de una mesa llena de porcelana".`;

    case 'flashforward':
      return `PRUEBA ESPECIFICA PARA FLASHFORWARD:
- Para aprobar, el actor debe empezar en el despues: consecuencia, ruina, resaca emocional, juicio, limpieza, despedida o momento posterior al evento sugerido por el titulo.
- Debe sostener la carga del resultado antes de explicar como se llego ahi.
- La escena debe hacer sentir que algo importante ya ocurrio y que los personajes viven sus efectos.
- Si arranca antes del evento, lo cuenta en orden normal o solo anuncia "luego pasara algo", "aprobado" DEBE ser false.
- Ejemplo insuficiente: "Empiezo antes de la boda y veremos como acaba mal".
- Ejemplo suficiente: "Recojo arroz del suelo con la corbata rota y le digo a mi hermana: 'Nunca debimos dejar que el cura eligiera la musica'".`;

    case 'punto-vista-opuesto':
      return `PRUEBA ESPECIFICA PARA PUNTO DE VISTA OPUESTO:
- Para aprobar, el actor debe reaccionar al titulo con una emocion, actitud o valoracion claramente contraria a la esperada.
- El contrapunto debe jugarse con verdad interna: alegria ante algo terrible, calma ante alarma, orgullo ante verguenza, ternura ante amenaza, miedo ante algo inocente, etc.
- Debe quedar claro por que esa emocion opuesta genera juego, misterio o comedia, no solo contradiccion gratuita.
- Si la emocion es la obvia del titulo o se queda en chiste sin personaje que la sostenga, "aprobado" DEBE ser false.
- Ejemplo insuficiente: "Me enfado porque me han despedido".
- Ejemplo suficiente: "Entro celebrando con cava y abrazo a mi pareja: 'Por fin me han despedido, ahora podre arruinar la empresa desde fuera'".`;

    case 'subtexto-oculto':
      return `PRUEBA ESPECIFICA PARA SUBTEXTO OCULTO:
- Para aprobar, el personaje debe ocultar algo relacionado con el titulo mientras sus acciones, evasivas, nervios o contradicciones lo delatan.
- Debe haber doble capa: lo que dice en superficie y lo que intenta tapar por debajo.
- El actor no debe confesar directamente el secreto al inicio; debe rodearlo, negarlo, compensarlo o desviar la atencion.
- Si el secreto es tan invisible que no afecta a la escena, o si lo explica de frente sin subtexto, "aprobado" DEBE ser false.
- Ejemplo insuficiente: "Le digo a mi pareja que me han despedido y discutimos".
- Ejemplo suficiente: "Entro con una sonrisa enorme, escondo una carta arrugada en el bolsillo y ofrezco unas vacaciones carisimas mientras evito mirar el uniforme del trabajo".`;

    case 'metafora-literal':
      return `PRUEBA ESPECIFICA PARA METAFORA LITERAL:
- Para aprobar, el actor debe convertir una expresion figurada, poetica o abstracta del titulo en una realidad fisica concreta dentro de la escena.
- La literalidad debe tener reglas escenicas: peso, peligro, objeto, espacio, efecto corporal o consecuencia material.
- Los personajes deben tratar esa realidad absurda como verdadera, no como una broma explicada desde fuera.
- Si solo comenta la metafora, la interpreta psicologicamente o hace un chiste verbal sin realidad fisica, "aprobado" DEBE ser false.
- Ejemplo insuficiente: "Digo que siento que el mundo se me cae encima porque estoy agobiado".
- Ejemplo suficiente: "Entro agachado sosteniendo un techo invisible que cruje y le suplico a mi hermano que saque primero la mesa antes de que el salon termine de caer".`;

    case 'ritmo-onomatopeya':
      return `PRUEBA ESPECIFICA PARA RITMO Y ONOMATOPEYA:
- Para aprobar, el actor debe extraer del titulo un ritmo, sonido, repeticion, tic fisico, patron vocal o tarea repetitiva que arranque la escena.
- El patron debe mantenerse lo suficiente para ser motor escenico, no una onomatopeya aislada antes de volver a narrar.
- Debe afectar al cuerpo, la voz, la relacion o la tension: tempo, pausas, golpes, respiracion, chasquidos, pasos, silabas o cadencia.
- Si se limita a explicar el significado del titulo o usa un sonido decorativo que desaparece al instante, "aprobado" DEBE ser false.
- Ejemplo insuficiente: "Hago tic tac una vez y luego cuento que estoy nervioso".
- Ejemplo suficiente: "Camino tres pasos secos, hago 'clac' con la lengua, giro la cabeza siempre al mismo lado y mi hermana intenta interrumpir ese patron porque despierta al bebe".`;

    default:
      return `PRUEBA ESPECIFICA DE LA TECNICA:
- Para aprobar, la tecnica elegida debe verse en la forma concreta de arrancar la escena, no solo mencionarse de manera conceptual.
- Si la propuesta podria funcionar igual con cualquier otra estrategia, considera que la tecnica no esta aplicada y "aprobado" DEBE ser false.`;
  }
}

export function crearPromptDirectorInicio(params: {
  titulo: string;
  propuestaFinal: string;
  estrategia: EstrategiaInicio;
}): string {
  return `
[ROL]
Eres un Director de teatro de improvisacion hiperactivo, tecnico, apasionado y muy exigente. Hablas siempre utilizando jerga teatral.

[MISION]
Evalua si el actor ha planteado un INICIO DE ESCENA jugable a partir del titulo y de la tecnica elegida.
No evalues el titulo: el titulo es contexto fijo. Evalua solo el trabajo del actor en <texto_del_actor>.

[TITULO DE LA ESCENA]
${params.titulo}

[TECNICA ELEGIDA]
Nombre: ${params.estrategia.tecnica}
Enfoque: ${params.estrategia.enfoque}
Mecanica que debia usar: ${params.estrategia.mecanica}
Tipo de pensamiento: ${params.estrategia.pensamiento}
Ideal para: ${params.estrategia.idealPara}

[CRITERIOS DE EVALUACION ESPECIFICOS]
Criterio de exito: ${params.estrategia.criterioExito}
Indicadores de logro: ${params.estrategia.indicadoresLogro}
Luces rojas / errores comunes: ${params.estrategia.lucesRojas}

[CRITERIOS OBLIGATORIOS DE INTRODUCCION ESCENICA]
${crearCriteriosIntroduccionEscenica(params.titulo)}

[CRITERIO OBLIGATORIO DE TECNICA DE INICIO]
- Ademas de construir una introduccion escenica completa, el actor debe aplicar de forma visible la tecnica elegida.
- La tecnica no sustituye a la introduccion escenica: una idea ingeniosa pero sin personajes, relacion, emocion y conflicto debe suspender.
- La introduccion escenica no sustituye a la tecnica: una escena completa pero sin la estrategia elegida debe suspender.

[PRUEBA TECNICA ESPECIFICA]
${crearPruebaTecnicaEstrategia(params.estrategia)}

[REGLAS DE RECHAZO]
- Si <texto_del_actor> es exactamente "[SIN_RESPUESTA]", el campo "aprobado" DEBE ser false.
- Si solo repite o parafrasea el titulo, "aprobado" DEBE ser false.
- Si no hay personajes o roles escenicos identificables, "aprobado" DEBE ser false.
- Si no hay relacion clara entre personajes o roles, "aprobado" DEBE ser false.
- Si no hay emocion, actitud o estado interno jugable, "aprobado" DEBE ser false.
- Si no hay conflicto, tension, deseo incompatible o problema activo, "aprobado" DEBE ser false.
- Si no se aprecia la tecnica elegida, "aprobado" DEBE ser false aunque haya una idea escenica.
- Si la propuesta cumple la introduccion escenica pero falla la prueba tecnica especifica, "aprobado" DEBE ser false.
- Si la tecnica aparece de forma limitada, superficial, accidental, demasiado literal o mejorable, "aprobado" DEBE ser false. No escribas "aprobado": true junto a una critica de tecnica insuficiente.
- Si es una idea inconexa, demasiado vaga o sin detalles accionables para empezar a improvisar, "aprobado" DEBE ser false.
- No exijas perfeccion literaria: si la propuesta es simple pero jugable, conectada al titulo, contiene los cuatro elementos de introduccion y usa la tecnica, puede aprobar.

[TEXTO DEL ACTOR]
<texto_del_actor>${params.propuestaFinal}</texto_del_actor>

[FORMATO DE SALIDA ESTRICTO]
Devuelve EXCLUSIVAMENTE un objeto JSON valido:
{
  "aprobado": true o false,
  "comentario": "Critica teatral breve de maximo 45 palabras, mencionando la tecnica elegida."
}`;
}
