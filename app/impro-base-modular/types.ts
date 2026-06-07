export type FaseActo = 'intro' | 'giro1' | 'giro2' | 'desenlace';

export type PantallaImpro = 'config' | 'jugando' | 'feedback' | 'final';

export type DificultadImpro = 'facil' | 'media' | 'dificil';

export interface ObraHistorial {
  titulo: string;
  intro: string;
  giro1: string;
  giro2: string;
  desenlace: string;
}

export interface TiemposConfig {
  intro: number;
  giro1: number;
  giro2: number;
  desenlace: number;
}

export interface EvaluacionDirector {
  aprobado: boolean;
  comentario: string;
}

