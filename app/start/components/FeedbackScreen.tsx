import styles from '../../structure/base.module.css';
import type { EstrategiaInicio } from '../types';

interface FeedbackScreenProps {
  aprobadoPorDirector: boolean;
  estrategia: EstrategiaInicio;
  feedbackDirector: string;
  loading: boolean;
  loadingTexto: string;
  onReiniciar: () => void;
  onReintentar: () => void;
  textoUsuario: string;
  titulo: string;
}

export function FeedbackScreen({
  aprobadoPorDirector,
  estrategia,
  feedbackDirector,
  loading,
  loadingTexto,
  onReiniciar,
  onReintentar,
  textoUsuario,
  titulo,
}: FeedbackScreenProps) {
  return (
    <div className={styles.bloqueFeedback}>
      <div className={styles.carteleraTitulo}>
        <h2>{titulo}</h2>
      </div>

      <div className={styles.recuadroExplicativo}>
        <strong>Estrategia evaluada:</strong> {estrategia.tecnica}. {estrategia.criterioExito}
      </div>

      <div className={styles.recuadroTuTexto}>
        <h4>Tu inicio propuesto</h4>
        <p className={styles.textoGuardadoUsuario}>
          {loading && !textoUsuario ? (
            <span className={styles.loadingSubtext}>Transcribiendo tu voz...</span>
          ) : textoUsuario.trim() ? (
            `"${textoUsuario.trim()}"`
          ) : (
            <i>[No se detecto voz o el escenario se quedo en silencio]</i>
          )}
        </p>
      </div>

      <div className={styles.recuadroFeedback}>
        <h4>
          El Director opina:{' '}
          {!loading && (
            <span style={{ color: aprobadoPorDirector ? '#4cd964' : '#ff3b30', fontWeight: 'bold' }}>
              {aprobadoPorDirector ? '[APROBADO]' : '[RECHAZADO]'}
            </span>
          )}
        </h4>
        {loading ? (
          <p className={styles.loadingText}>{loadingTexto || 'El jurado procesa tu arranque...'}</p>
        ) : (
          <p className={styles.textoFeedback}>{feedbackDirector}</p>
        )}
      </div>

      {!loading && (
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
          <button className={`${styles.btnTeatro} ${styles.btnComenzar}`} onClick={onReintentar}>
            Repetir inicio
          </button>
          <button className={`${styles.btnTeatro} ${styles.btnReiniciar}`} onClick={onReiniciar}>
            Nuevo ejercicio
          </button>
        </div>
      )}
    </div>
  );
}
