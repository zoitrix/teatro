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
    mecanica: 'Antes de decir la primera palabra, mentalmente (o en un segundo si estás en el escenario), desglosa el título en tres palabras clave relacionadas.',
    pensamiento: 'Pensamiento lateral: evita la obviedad.',
    idealPara: 'Formatos largos, drama y misterio.',
    criterioExito: 'Originalidad periferica y coherence.',
    ejemplo: 'Título: "El último tren a París". Satélites: frío, billete perdido, humo. El alumno camina frotándose los brazos, busca desesperadamente en sus bolsillos, saca las manos vacías y dice: "No puede ser... tiene que estar aquí...".',
    indicadoresLogro:
      'Arranca con un elemento indirecto pero conectado al universo del titulo. Evita nombrar el titulo de golpe.',
    lucesRojas:
      'Cae en la literalidad absoluta o introduce un elemento tan inconexo que rompe el sentido del titulo.',
  },
  {
    id: 'disparador-primera-linea',
    tecnica: 'Disparador Primera Linea',
    enfoque: 'Narrativo',
    mecanica: 'Utiliza el título para justificar una primera frase impactante que rompa la expectativa.',
    pensamiento: 'Pensamiento verbal e ingenio: crea premisas rapidas.',
    idealPara: 'Comedia, sketches y formatos de juego corto.',
    criterioExito: 'Impacto y justificacion del contexto.',
    ejemplo: 'Título: "Un paraguas bajo el sol". El alumno entra protegiéndose la cabeza con las manos, mira a su compañero con pánico y le dice: "¡Rápido, entra aquí! Dicen que si te da un rayo ultravioleta directo hoy, te derrites los sesos en tres segundos".',
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
    ejemplo: 'Título: "La última carta". El alumno se sienta en silencio, sostiene con extremo cuidado un papel invisible, pasa el dedo por el borde del sobre, lo desdobla despacio y arruga el papel contra su pecho con una respiración cortada.',
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
    ejemplo: 'Título: "La deuda". El alumno arranca de pie con rodillas flexionadas, hombros hundidos y barbilla pegada al pecho como si cargara un gran peso. Camina arrastrando los pies y mira a su compañero de reojo desde una sumisión absoluta.',
    indicadoresLogro:
      'La energia y la postura del cuerpo entero sostienen la atmosfera del titulo antes, durante y despues de la primera palabra.',
    lucesRojas:
      'Solo cambia la cara o la voz, pero mantiene una postura corporal neutra o cotidiana.',
  },
  {
    id: 'zoom-in',
    tecnica: 'El Zoom In',
    enfoque: 'Atmosfera',
    mecanica: 'Empieza describiendo el entorno que sugiere el título como si fueras un narrador o un personaje que observa el espacio.',
    pensamiento: 'Pensamiento descriptivo y visual: pinta la escena.',
    idealPara: 'Monologos de inicio, escenas intimas y realismo magico.',
    criterioExito: 'Capacidad descriptiva e imaginaria.',
    ejemplo: 'Título: "Secretos en el ático". El alumno entra observando el espacio e interactuando con él mientras dice: "Hacía diez años que nadie subía aquí... Mirad esa esquina, la tela de araña parece una cortina. Y este olor a madera vieja...".',
    indicadoresLogro:
      'Pinta el espacio con palabras y detalles sensoriales, transportando al espectador antes de meter el conflicto.',
    lucesRojas:
      'Hace una descripcion tipo inventario o se alarga tanto que la escena no avanza.',
  },
  {
    id: 'in-media-res',
    tecnica: 'In Media Res',
    enfoque: 'Atmosfera',
    mecanica: 'Ignora la introducción. Imagina que el título es el clímax o la consecuencia de algo que ya pasó, y empieza con una discusión o una acción física ya iniciada.',
    pensamiento: 'Pensamiento reactivo e impulsivo: accion sin filtro.',
    idealPara: 'Escenas de alta energia, discusiones comicas y accion.',
    criterioExito: 'Manejo del ritmo y de la urgencia.',
    ejemplo: 'Título: "Cenizas en el café". El alumno entra pegando un bufido, aparta una silla de un golpe, señala una taza imaginaria con rabia y grita: "¡Te juro que esta es la última vez que me haces el desayuno! ¡¿Qué es esto negro que flota?!"',
    indicadoresLogro:
      'Entra con la accion fisica o el conflicto en su punto algido. El companero puede reaccionar de inmediato.',
    lucesRojas:
      'Entra gritando sin un motivo claro, generando ruido pero no informacion dramatica utilizable.',
  },
  {
    id: 'efecto-mariposa',
    tecnica: 'Efecto Mariposa',
    enfoque: 'Estructural',
    mecanica: 'Toma el título como el resultado final de una larga cadena de eventos. Tu improvisación no empieza en el título, sino en el primer eslabón que llevará inevitablemente a él.',
    pensamiento: 'Pensamiento causal: construccion de plataformas solidas.',
    idealPara: 'Tragedia, comedia de enredo e historias lineales.',
    criterioExito: 'Construccion de tension y progresion.',
    ejemplo: 'Título: "El jarrón roto". El alumno entra silbando de forma relajada. Saca un balón invisible y empieza a darle toques con el pie dentro de la habitación, haciéndolos cada vez más altos y difíciles justo al lado de una mesa.',
    indicadoresLogro:
      'Empieza desde la normalidad and realiza acciones cotidianas que el publico asocia logicamente con el desencadenante del titulo.',
    lucesRojas:
      'Fuerza el accidente o el climax demasiado rapido en lugar de disfrutar del camino.',
  },
  {
    id: 'flashforward',
    tecnica: 'Flashforward',
    enfoque: 'Estructural',
    mecanica: 'Empieza mostrando la consecuencia directa del título y luego avanza desde ahí o haz un viaje al pasado.',
    pensamiento: 'Pensamiento resignado y reflexivo: sostener el despues.',
    idealPara: 'Dramas profundos, escenas poeticas o de cierre.',
    criterioExito: 'Sostenimiento de la consecuencia.',
    ejemplo: 'Título: "El último aplauso". El alumno se para en el centro, mira al horizonte con una sonrisa nostálgica, cruza los brazos y dice: "Bueno... pues ya está. Ya han apagado las luces de los palcos. Mañana este teatro será un supermercado...".',
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
    ejemplo: 'Título: "El funeral del payaso". Dos alumnos entran saltando, chocando los cinco y riendo a carcajadas. Uno de ellos simula descorchar una botella de champán con alegría y grita: "¡Por fin se ha muerto! ¡Qué gran día, ponme una copa!"',
    indicadoresLogro:
      'La emocion opuesta se juega con honestidad. La desconexion genera comedia o misterio genuino.',
    lucesRojas:
      'Se vuelve una parodia donde el alumno se rie de su propia ocurrencia en lugar de vivir la escena.',
  },
  {
    id: 'subtexto-oculto',
    tecnica: 'Subtexto Oculto',
    enfoque: 'Psicologico',
    mecanica: 'Utiliza el título como un secreto que tu personaje sabe, pero que no quiere revelar bajo ningún concepto. Toda tu improvisación consistirá en evitar hablar del título, aunque todo lo que hagas esté condicionado por él.',
    pensamiento: 'Pensamiento estrategico: doble lectura y mascara.',
    idealPara: 'Suspense, drama psicologico e improvisacion estilo Chejov o Pinter.',
    criterioExito: 'Tension interna y juego de mascara.',
    ejemplo: 'Título: "La carta de despido". El alumno entra a casa con una sonrisa exagerada y forzada. Saluda a su pareja con entusiasmo desmedido: "¡Cariño! ¡Feliz martes! Te he traído tus bombones favoritos y he reservado un viaje carísimo...". Su mirada refleja pánico.',
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
    ejemplo: 'Título: "Se me cae la casa encima". El alumno empieza agachado, con las manos firmes hacia arriba sosteniendo un techo invisible imaginario que pesa toneladas y grita: "¡Juan, ven aquí! ¡Te dije que las vigas cedían y ya tengo el pladur en las orejas!"',
    indicadoresLogro:
      'Trata la metafora fisica con naturalidad dentro de la logica del personaje. El entorno reacciona a esa literalidad.',
    lucesRojas:
      'Lo juega como un chiste de mimica en lugar de una reality fisica aplastante para el personaje.',
  },
  {
    id: 'ritmo-onomatopeya',
    tecnica: 'Ritmo y Onomatopeya',
    enfoque: 'Conceptual',
    mecanica: 'A veces los títulos tienen una musicalidad. Olvídate del significado de las palabras y concéntrate en su sonido. Empieza la escena repitiendo ese ritmo con un sonido, un tic físico o una tarea repetitiva.',
    pensamiento: 'Pensamiento musical y abstracto: desconecta el texto.',
    idealPara: 'Improvisacion musical, danza-teatro y formatos experimentales.',
    criterioExito: 'Musicalidad y permanencia del patron.',
    ejemplo: 'Título: "Tic-Tac, mecánico". El alumno no habla; camina en líneas rectas y ángulos de 90 grados. Cada tres pasos hace un chasquido seco con la lengua ("¡clac!") y gira la cabeza bruscamente a un lado mientras limpia rítmicamente una mesa invisible.',
    indicadoresLogro:
      'Se deja contagiar por el tempo del titulo y mantiene ese patron ritmico en su habla o cuerpo como motor.',
    lucesRojas:
      'El ritmo se diluye en cuanto empieza a pensar en el argumento o en el texto.',
  },
];