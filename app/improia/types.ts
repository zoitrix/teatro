export type RoleChat = 'user' | 'assistant';

export type FaseActo = 'intro' | 'nudo' | 'desenlace';

export type PantallaChat = 'config' | 'jugando' | 'final';

export type DificultadChat = 'fácil' | 'media' | 'difícil';

export interface MensajeChat {
  role: RoleChat;
  content: string;
}

export interface TiemposConfig {
  intro: number;
  nudo: number;
  desenlace: number;
}

export interface EvaluacionActo {
  aprobado: boolean;
  comentario: string;
  transcripcionAcumulada: string;
}

export interface InformeDirector {
  intro: EvaluacionActo | null;
  nudo: EvaluacionActo | null;
  desenlace: EvaluacionActo | null;
}

export interface FeedbackFijo {
  fase: string;
  texto: string;
  aprobado: boolean;
}

