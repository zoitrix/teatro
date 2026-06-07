import type { FaseActo, ObraHistorial, TiemposConfig } from './types';

export const TIEMPOS_INICIALES: TiemposConfig = {
  intro: 20,
  giro1: 15,
  giro2: 15,
  desenlace: 10,
};

export const OBRA_VACIA: ObraHistorial = {
  titulo: '',
  intro: '',
  giro1: '',
  giro2: '',
  desenlace: '',
};

export const FASES_EN_ORDEN: FaseActo[] = ['intro', 'giro1', 'giro2', 'desenlace'];

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

