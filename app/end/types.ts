export type PantallaEnd = 'config' | 'jugando' | 'feedback';

export type DificultadEnd = 'facil' | 'media' | 'dificil';

export interface TipoFinal {
  id: string;
  tecnica: string;
  enfoque: string;
  mecanica: string;
  pensamiento: string;
  idealPara: string;
  criterioExito: string;
  ejemplo: string;
  indicadoresLogro: string;
  lucesRojas: string;
}

export interface EscenaFinal {
  titulo: string;
  planteamiento: string;
  nudo: string;
}

export interface EvaluacionDirector {
  aprobado: boolean;
  comentario: string;
}
