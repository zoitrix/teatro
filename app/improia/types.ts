export type RoleChat = 'user' | 'assistant';

export type FaseActo = 'intro' | 'nudo' | 'desenlace';

export type PantallaChat = 'config' | 'jugando' | 'final';

export type DificultadChat = 'facil' | 'media' | 'dificil';

export interface MensajeChat {
  role: RoleChat;
  content: string;
}

export interface TiemposConfig {
  total: number;
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
