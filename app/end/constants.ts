import type { EscenaFinal, TipoFinal } from './types';

export const TIEMPO_INICIAL_FINAL = 30;

export const ESCENA_FINAL_VACIA: EscenaFinal = {
  titulo: '',
  planteamiento: '',
  nudo: '',
};

export const TIPOS_FINAL: TipoFinal[] = [
  {
    id: 'final-cerrado',
    tecnica: 'Final Cerrado',
    enfoque: 'Resolucion / Conclusion',
    mecanica:
      'Identifica el conflicto principal de la escena y ejecuta una accion o toma una decision definitiva que responda a la gran pregunta de la historia, eliminando la necesidad de continuidad.',
    pensamiento:
      'Pensamiento convergente y resolutivo: cerrar hilos narrativos en lugar de abrir nuevas subtramas.',
    idealPara:
      'Formatos cortos de improvisacion, escenas independientes y entrenamiento de estructura clasica aristotelica.',
    criterioExito:
      'Resolucion del conflicto principal de forma clara y contundente, sin dejar preguntas importantes en el aire.',
    ejemplo:
      'En una escena sobre una pareja discutiendo si mudarse juntos al extranjero, el alumno mira fijamente a su companero, saca un pasaporte del bolsillo y dice con firmeza: "Ya compre mi boleto. Me voy solo manana por la manana".',
    indicadoresLogro:
      'Resuelve el motor de la escena de manera definitiva, ofrece una conclusion satisfactoria para el espectador y limpia los cabos sueltos argumentales antes del apagon.',
    lucesRojas:
      'La escena termina por inercia o aburrimiento sin resolver el problema inicial, se introduce un conflicto nuevo en el ultimo segundo que invalida el cierre o se alarga el dialogo en un bucle repetitivo.',
  },
  {
    id: 'final-abierto',
    tecnica: 'Final Abierto',
    enfoque: 'Tension / Cliffhanger',
    mecanica:
      'Eleva el conflicto al punto de maxima tension o revela un elemento critico inminente, cortando la escena justo antes de que se produzca la resolucion.',
    pensamiento:
      'Pensamiento estrategico y de suspension: sostener la incertidumbre y proyectar el futuro en la mente del publico.',
    idealPara:
      'Formatos largos, transiciones de capitulos, estructura serial y escenas que entrenan ritmo y timing.',
    criterioExito:
      'Cortar la escena exactamente en el climax de tension, dejando al publico con la intriga en su punto maximo.',
    ejemplo:
      'Dos espias intentan desactivar una bomba. Tras una tensa discusion sobre que cable cortar, uno agarra las tijeras, mira al otro y dice: "Si me equivoco, dile a mi familia que...". Corta el cable, la luz de la bomba...',
    indicadoresLogro:
      'Identifica el pico mas alto de la accion dramatica para congelar o detener la escena, y plantea una situacion donde las consecuencias futuras quedan claras y sugeridas para el espectador.',
    lucesRojas:
      'Cortar la escena en un momento plano o confuso, retardar tanto el corte que el misterio se resuelva solo, o transformar el final abierto en un final cerrado.',
  },
  {
    id: 'final-circular',
    tecnica: 'Final Circular',
    enfoque: 'Simetria / Retorno',
    mecanica:
      'Utiliza la memoria escenica para recuperar con precision mimetica el elemento inicial de la escena y otorgarle un nuevo significado tras el viaje de los personajes.',
    pensamiento:
      'Pensamiento asociativo: conectar desenlace con la plataforma inicial de la historia.',
    idealPara:
      'Formatos de comedia, improvisaciones poeticas y entrenamiento de escucha a largo plazo y memoria espacial.',
    criterioExito:
      'Conectar a la perfeccion con el inicio, otorgandole un nuevo significado a la escena.',
    ejemplo:
      'La escena comienza con un alumno barriendo el suelo con la mirada perdida. Pasa toda una historia donde confiesa que odia su trabajo, decide rebelarse y es despedido. Al final, regresa al mismo punto exacto, agarra la escoba y sonrie por primera vez.',
    indicadoresLogro:
      'Demuestra una excelente memoria escenica al replicar el inicio y justifica organicamente por que los personajes regresan al origen, mostrando el impacto del cambio o el bucle que habitan.',
    lucesRojas:
      'Ignorar por completo el punto de partida, intentar hacer un cierre circular entrando en la frase original o en la posicion fisica sin que conecte con el publico, o destruir la simetria estetica.',
  },
  {
    id: 'final-giro-inesperado',
    tecnica: 'Final de Giro Inesperado',
    enfoque: 'Sorpresa / Recontextualizacion',
    mecanica:
      'Introduce una revelacion o informacion oculta en los ultimos segundos que cambia por completo el sentido de todo lo que el publico ha visto, apoyandose en pistas sutiles dejadas previamente.',
    pensamiento:
      'Pensamiento lateral y de doble codificacion: construir una realidad aparente mientras se siembran pistas de la realidad oculta.',
    idealPara:
      'Formatos de misterio, suspense, drama o comedia inteligente, y alumnos avanzados que dominan la sutileza.',
    criterioExito:
      'La revelacion final es sorprendente pero logica gracias a las pistas sutiles que se sembraron durante la escena.',
    ejemplo:
      'Dos cientificos discuten acaloradamente sobre como el especimen no responde a los estimulos. Al final de la escena, uno de ellos suspira, abre una reja imaginaria y dice: "Esta bien, ponlo en libertad".',
    indicadoresLogro:
      'Siembra pistas validas durante el desarrollo sin hacerlas evidentes, y ejecuta la revelacion final con total coherencia, provocando una recontextualizacion inmediata en la mente del espectador.',
    lucesRojas:
      'Sacarse de la manga un final tramposo que no tiene relacion con lo anterior, generar un giro que contradice la logica interna de la escena o confunde al companero de juego.',
  },
  {
    id: 'final-anticlimax',
    tecnica: 'Final Anticlimax',
    enfoque: 'Contraste / Ruptura Comica',
    mecanica:
      'Construye y exagera una atmosfera de extrema gravedad, peligro o drama epico para, en el ultimo segundo, desinflar la tension por completo resolviendo el conflicto con un elemento cotidiano, banal o ridiculo.',
    pensamiento:
      'Pensamiento del absurdo y manejo del ritmo: sostener la verdad de la tragedia para potenciar el remate comico.',
    idealPara:
      'Escenas comicas, parodias de genero y entrenamiento de modulacion de energia e intensidad en escena.',
    criterioExito:
      'Elevar la tension al maximo y desinflarla de golpe hacia algo cotidiano con un ritmo comico excelente.',
    ejemplo:
      'Un guerrero arrodillado ante su rey en mitad de una musica dramatica imaginaria: "Mi senor, el ejercito oscuro ha cruzado la muralla, el reino arde, todo esta perdido... que hacemos?". El rey lo mira con solemnidad, hace una pausa y dice: "Primero, cambiaremos el wifi".',
    indicadoresLogro:
      'Mantiene una actuacion honesta y de alta intensidad dramatica durante el nudo de la escena y ejecuta la caida de tension de forma drastica y rapida, clavando el timing del chiste.',
    lucesRojas:
      'No construir suficiente tension dramatica previa, abandonar la verdad del personaje antes del remate o romper la magia comica de la escena.',
  },
];
