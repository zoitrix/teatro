export type PantallaStart = 'config' | 'jugando' | 'feedback';

export type DificultadStart = 'facil' | 'media' | 'dificil';

export interface EstrategiaInicio {
  id: string;
  tecnica: string;
  enfoque: string;
  mecanica: string;
  pensamiento: string;
  idealPara: string;
  criterioExito: string;
  indicadoresLogro: string;
  lucesRojas: string;
}

export interface EvaluacionDirector {
  aprobado: boolean;
  comentario: string;
}
