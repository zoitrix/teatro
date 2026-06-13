const PALABRAS_VACIAS = new Set([
  'a',
  'al',
  'ante',
  'bajo',
  'cada',
  'como',
  'con',
  'contra',
  'de',
  'del',
  'desde',
  'el',
  'en',
  'entre',
  'es',
  'esa',
  'ese',
  'esta',
  'este',
  'la',
  'las',
  'le',
  'lo',
  'los',
  'me',
  'mi',
  'mis',
  'no',
  'nos',
  'para',
  'por',
  'que',
  'se',
  'sin',
  'su',
  'sus',
  'te',
  'tu',
  'tus',
  'un',
  'una',
  'y',
  'ya',
]);

const FAMILIAS_TEMATICAS: Record<string, string[]> = {
  casa: ['casa', 'piso', 'habitacion', 'cocina', 'bano', 'salon', 'sof', 'cama', 'mudanza'],
  barrio: ['barrio', 'portal', 'escalera', 'vecino', 'vecina', 'vecinos', 'vecinas', 'casero', 'portero', 'portera'],
  familia: ['madre', 'mama', 'padre', 'papa', 'abuelo', 'abuela', 'tio', 'tia', 'primo', 'prima', 'hermano', 'hermana', 'hijo', 'hija', 'suegro', 'suegra'],
  trabajo: ['jefe', 'oficina', 'trabajo', 'empleo', 'reunion', 'curriculum', 'despido', 'empresa', 'becario'],
  colegio: ['colegio', 'clase', 'profesor', 'profesora', 'alumno', 'examen', 'deber', 'recreo'],
  restaurante: ['bar', 'cafe', 'camarero', 'camarera', 'restaurante', 'mesa', 'menu', 'sopa', 'pizza'],
  compra: ['compra', 'tienda', 'supermercado', 'mercado', 'carrito', 'caja', 'ticket', 'rebaja', 'zapato', 'ropa'],
  salud: ['medico', 'medica', 'doctor', 'doctora', 'hospital', 'farmacia', 'dentista', 'ambulancia'],
  tramite: ['hacienda', 'multa', 'banco', 'notario', 'licencia', 'permiso', 'juzgado', 'ayuntamiento'],
  celebracion: ['boda', 'cumpleano', 'fiesta', 'regalo', 'brindis', 'tarta'],
  autoridad: ['policia', 'juez', 'guardia', 'alcalde', 'cura', 'director', 'inspectora', 'inspector'],
  tecnologia: ['movil', 'telefono', 'ordenador', 'pantalla', 'robot', 'app', 'wifi', 'contrasena', 'impresora'],
  comida: ['comida', 'cena', 'almuerzo', 'desayuno', 'pan', 'tortilla', 'croqueta', 'paella', 'nevera'],
  dinero: ['dinero', 'factura', 'deuda', 'prestamo', 'precio', 'moneda', 'billete', 'cobro', 'sueldo'],
  animales: ['perro', 'gato', 'pez', 'mascota', 'hamster', 'loro'],
  transporte: ['coche', 'taxi', 'bus', 'autobus', 'tren', 'metro', 'avion', 'maleta'],
  tiempo: ['ayer', 'manana', 'medianoche', 'reloj', 'alarma', 'calendario', 'lunes', 'verano'],
  secreto: ['secreto', 'mentira', 'confesion', 'sospecha', 'culpa', 'prueba', 'coartada'],
};

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function raizSimple(palabra: string): string {
  if (palabra.length > 6 && palabra.endsWith('es')) {
    return palabra.slice(0, -2);
  }

  if (palabra.length > 5 && palabra.endsWith('s')) {
    return palabra.slice(0, -1);
  }

  return palabra;
}

function extraerTerminos(texto: string): Set<string> {
  return new Set(
    normalizarTexto(texto)
      .split(' ')
      .map(raizSimple)
      .filter((palabra) => palabra.length > 2 && !PALABRAS_VACIAS.has(palabra)),
  );
}

function extraerFamilias(terminos: Set<string>): Set<string> {
  const familias = new Set<string>();

  Object.entries(FAMILIAS_TEMATICAS).forEach(([familia, palabras]) => {
    if (palabras.some((palabra) => terminos.has(raizSimple(palabra)))) {
      familias.add(familia);
    }
  });

  return familias;
}

function contarFrecuencias(valores: string[]): Map<string, number> {
  const frecuencias = new Map<string, number>();

  valores.forEach((valor) => {
    frecuencias.set(valor, (frecuencias.get(valor) || 0) + 1);
  });

  return frecuencias;
}

function contarInterseccion(a: Set<string>, b: Set<string>): number {
  let coincidencias = 0;

  a.forEach((valor) => {
    if (b.has(valor)) {
      coincidencias += 1;
    }
  });

  return coincidencias;
}

function esTituloParecido(titulo: string, anterior: string): boolean {
  const tituloNormalizado = normalizarTexto(titulo);
  const anteriorNormalizado = normalizarTexto(anterior);

  if (!tituloNormalizado || !anteriorNormalizado) {
    return false;
  }

  if (tituloNormalizado === anteriorNormalizado) {
    return true;
  }

  const terminosTitulo = extraerTerminos(titulo);
  const terminosAnterior = extraerTerminos(anterior);
  const coincidencias = contarInterseccion(terminosTitulo, terminosAnterior);
  const union = new Set([...terminosTitulo, ...terminosAnterior]).size;
  const jaccard = union > 0 ? coincidencias / union : 0;

  if (coincidencias >= 2 || (coincidencias >= 1 && jaccard >= 0.34)) {
    return true;
  }

  const familiasTitulo = extraerFamilias(terminosTitulo);
  const familiasAnterior = extraerFamilias(terminosAnterior);
  const coincidenciasFamilia = contarInterseccion(familiasTitulo, familiasAnterior);

  return coincidenciasFamilia >= 2 || (coincidenciasFamilia >= 1 && coincidencias >= 1);
}

export function tituloSePareceAHistorial(titulo: string, historial: string[]): boolean {
  if (historial.some((anterior) => esTituloParecido(titulo, anterior))) {
    return true;
  }

  const restricciones = crearRestriccionesVariedad(historial);
  const terminosTitulo = extraerTerminos(titulo);
  const familiasTitulo = extraerFamilias(terminosTitulo);

  return (
    restricciones.palabrasVetadas.some((palabra) => terminosTitulo.has(palabra)) ||
    restricciones.familiasVetadas.some((familia) => familiasTitulo.has(familia))
  );
}

export function crearRestriccionesVariedad(historial: string[]): {
  palabrasVetadas: string[];
  familiasVetadas: string[];
} {
  const terminos = historial.flatMap((titulo) => [...extraerTerminos(titulo)]);
  const familias = historial.flatMap((titulo) => [...extraerFamilias(extraerTerminos(titulo))]);
  const frecuenciasTerminos = contarFrecuencias(terminos);
  const frecuenciasFamilias = contarFrecuencias(familias);

  const palabrasVetadas = [...frecuenciasTerminos.entries()]
    .filter(([, veces]) => veces >= 1)
    .map(([palabra]) => palabra)
    .slice(0, 18);

  const familiasVetadas = [...frecuenciasFamilias.entries()]
    .filter(([, veces]) => veces >= 1)
    .map(([familia]) => familia)
    .slice(0, 8);

  return { palabrasVetadas, familiasVetadas };
}

export function crearAvisoVariedadTitulos(historial: string[]): string {
  const { palabrasVetadas, familiasVetadas } = crearRestriccionesVariedad(historial);
  const palabras = palabrasVetadas.length > 0 ? palabrasVetadas.join(', ') : 'ninguna todavia';
  const familias = familiasVetadas.length > 0 ? familiasVetadas.join(', ') : 'ninguna todavia';

  return `Palabras ya gastadas que debes evitar: [${palabras}]. Temas ya gastados que debes abandonar: [${familias}].`;
}
