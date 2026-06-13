import type { EstrategiaInicio } from './types';

export const TIEMPO_INICIAL = 30;

export const TAMANO_MINIMO_VOZ = 12288;

export const ALUCINACIONES_WHISPER = [
  'subtitulos',
  'gracias por ver',
  'suscribete',
  'gracias',
  'todos los derechos',
  'diseno de sonido',
  'reproducir musica',
  'teatro, actuacion',
  'buena puntuacion',
];

export const ESTRATEGIAS_INICIO: EstrategiaInicio[] = [
  {
    id: 'asociaciones-satelite',
    tecnica: 'Asociaciones Satelite',
    enfoque: 'Narrativo',
    mecanica: 'Desglosa el titulo en palabras clave secundarias antes de hablar.',
    pensamiento: 'Pensamiento lateral: evita la obviedad.',
    idealPara: 'Formatos largos, drama y misterio.',
    criterioExito: 'Originalidad periferica y coherencia.',
    indicadoresLogro:
      'Arranca con un elemento indirecto pero conectado al universo del titulo. Evita nombrar el titulo de golpe.',
    lucesRojas:
      'Cae en la literalidad absoluta o introduce un elemento tan inconexo que rompe el sentido del titulo.',
  },
  {
    id: 'disparador-primera-linea',
    tecnica: 'Disparador Primera Linea',
    enfoque: 'Narrativo',
    mecanica: 'Lanza una frase de impacto que redefine el significado del titulo.',
    pensamiento: 'Pensamiento verbal e ingenio: crea premisas rapidas.',
    idealPara: 'Comedia, sketches y formatos de juego corto.',
    criterioExito: 'Impacto y justificacion del contexto.',
    indicadoresLogro:
      'La primera frase engancha al publico, rompe la expectativa obvia y plantea una premisa clara para la escena.',
    lucesRojas:
      'Dice una frase ingeniosa pero flotante que no construye plataforma ni da juego a su companero.',
  },
  {
    id: 'objeto-imaginario',
    tecnica: 'Objeto Imaginario',
    enfoque: 'Fisico',
    mecanica: 'Interactua con un elemento invisible del titulo prestando atencion al mimo.',
    pensamiento: 'Pensamiento espacial y kinestesico: baja la ansiedad cerebral.',
    idealPara: 'Teatro gestual, drama y escenas costumbristas.',
    criterioExito: 'Mimo, precision y peso dramatico.',
    indicadoresLogro:
      'El objeto invisible tiene volumen, peso y consistencia fisica. Se toma tiempo para que el publico lo vea antes de hablar.',
    lucesRojas:
      'El objeto desaparece a los dos segundos porque el alumno se pone a hablar y se olvida de su fisicidad.',
  },
  {
    id: 'modificacion-postura',
    tecnica: 'Modificacion de Postura',
    enfoque: 'Fisico',
    mecanica: 'Adopta la energia y el estatus corporal que evoca el titulo.',
    pensamiento: 'Pensamiento emocional y fisico: el cuerpo lidera la mente.',
    idealPara: 'Creacion de personajes e improvisacion de estilo.',
    criterioExito: 'Compromiso corporal y estatus.',
    indicadoresLogro:
      'La energia y la postura del cuerpo entero sostienen la atmosfera del titulo antes, durante y despues de la primera palabra.',
    lucesRojas:
      'Solo cambia la cara o la voz, pero mantiene una postura corporal neutra o cotidiana.',
  },
  {
    id: 'zoom-in',
    tecnica: 'El Zoom In',
    enfoque: 'Atmosfera',
    mecanica: 'Describe el espacio fisico y sensorial sugerido por el titulo.',
    pensamiento: 'Pensamiento descriptivo y visual: pinta la escena.',
    idealPara: 'Monologos de inicio, escenas intimas y realismo magico.',
    criterioExito: 'Capacidad descriptiva e imaginaria.',
    indicadoresLogro:
      'Pinta el espacio con palabras y detalles sensoriales, transportando al espectador antes de meter el conflicto.',
    lucesRojas:
      'Hace una descripcion tipo inventario o se alarga tanto que la escena no avanza.',
  },
  {
    id: 'in-media-res',
    tecnica: 'In Media Res',
    enfoque: 'Atmosfera',
    mecanica: 'Arranca con la accion o el conflicto ya en su punto algido.',
    pensamiento: 'Pensamiento reactivo e impulsivo: accion sin filtro.',
    idealPara: 'Escenas de alta energia, discusiones comicas y accion.',
    criterioExito: 'Manejo del ritmo y de la urgencia.',
    indicadoresLogro:
      'Entra con la accion fisica o el conflicto en su punto algido. El companero puede reaccionar de inmediato.',
    lucesRojas:
      'Entra gritando sin un motivo claro, generando ruido pero no informacion dramatica utilizable.',
  },
  {
    id: 'efecto-mariposa',
    tecnica: 'Efecto Mariposa',
    enfoque: 'Estructural',
    mecanica: 'Juega la rutina previa que causara, inevitablemente, el titulo.',
    pensamiento: 'Pensamiento causal: construccion de plataformas solidas.',
    idealPara: 'Tragedia, comedia de enredo e historias lineales.',
    criterioExito: 'Construccion de tension y progresion.',
    indicadoresLogro:
      'Empieza desde la normalidad y realiza acciones cotidianas que el publico asocia logicamente con el desencadenante del titulo.',
    lucesRojas:
      'Fuerza el accidente o el climax demasiado rapido en lugar de disfrutar del camino.',
  },
  {
    id: 'flashforward',
    tecnica: 'Flashforward',
    enfoque: 'Estructural',
    mecanica: 'Inicia la escena asumiendo las consecuencias posteriores al titulo.',
    pensamiento: 'Pensamiento resignado y reflexivo: sostener el despues.',
    idealPara: 'Dramas profundos, escenas poeticas o de cierre.',
    criterioExito: 'Sostenimiento de la consecuencia.',
    indicadoresLogro:
      'Asume la carga emocional del despues y juega con la melancolia, el alivio o el shock de lo que ya paso.',
    lucesRojas:
      'Se queda sin ideas tras la primera frase y reinicia la escena volviendo al pasado de forma tosca.',
  },
  {
    id: 'punto-vista-opuesto',
    tecnica: 'Punto de Vista Opuesto',
    enfoque: 'Psicologico',
    mecanica: 'Reacciona al titulo con la emocion opuesta a la logica.',
    pensamiento: 'Pensamiento disruptivo: rompe el cliche al cien por cien.',
    idealPara: 'Humor absurdo, humor negro y comedia contemporanea.',
    criterioExito: 'Contrapunto emocional y verdad.',
    indicadoresLogro:
      'La emocion opuesta se juega con honestidad. La desconexion genera comedia o misterio genuino.',
    lucesRojas:
      'Se vuelve una parodia donde el alumno se rie de su propia ocurrencia en lugar de vivir la escena.',
  },
  {
    id: 'subtexto-oculto',
    tecnica: 'Subtexto Oculto',
    enfoque: 'Psicologico',
    mecanica: 'Esconde el titulo. El personaje hace todo lo posible por no hablar de ello.',
    pensamiento: 'Pensamiento estrategico: doble lectura y mascara.',
    idealPara: 'Suspense, drama psicologico e improvisacion estilo Chejov o Pinter.',
    criterioExito: 'Tension interna y juego de mascara.',
    indicadoresLogro:
      'El alumno suda el secreto. Sus acciones intentan tapar el titulo, pero sus ojos y lenguaje corporal lo delatan.',
    lucesRojas:
      'El subtexto es tan oculto que ni el companero ni el publico entienden que esta pasando.',
  },
  {
    id: 'metafora-literal',
    tecnica: 'Metafora Literal',
    enfoque: 'Conceptual',
    mecanica: 'Convierte una frase poetica o abstracta en una realidad fisica real.',
    pensamiento: 'Pensamiento logico-absurdo: crea realidades paralelas.',
    idealPara: 'Estilos surrealistas, comic y realismo sucio.',
    criterioExito: 'Aceptacion del codigo absurdo.',
    indicadoresLogro:
      'Trata la metafora fisica con naturalidad dentro de la logica del personaje. El entorno reacciona a esa literalidad.',
    lucesRojas:
      'Lo juega como un chiste de mimica en lugar de una realidad fisica aplastante para el personaje.',
  },
  {
    id: 'ritmo-onomatopeya',
    tecnica: 'Ritmo y Onomatopeya',
    enfoque: 'Conceptual',
    mecanica: 'Traduce el titulo a un patron sonoro o ritmico corporal constante.',
    pensamiento: 'Pensamiento musical y abstracto: desconecta el texto.',
    idealPara: 'Improvisacion musical, danza-teatro y formatos experimentales.',
    criterioExito: 'Musicalidad y permanencia del patron.',
    indicadoresLogro:
      'Se deja contagiar por el tempo del titulo y mantiene ese patron ritmico en su habla o cuerpo como motor.',
    lucesRojas:
      'El ritmo se diluye en cuanto empieza a pensar en el argumento o en el texto.',
  },
];
