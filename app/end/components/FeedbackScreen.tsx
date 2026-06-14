import styles from '../../structure/base.module.css';
import type { EscenaFinal, TipoFinal } from '../types';

interface FeedbackScreenProps {
  aprobadoPorDirector: boolean;
  escena: EscenaFinal;
  feedbackDirector: string;
  loading: boolean;
  loadingTexto: string;
  onReiniciar: () => void;
  onReintentar: () => void;
  textoUsuario: string;
  tipoFinal: TipoFinal;
}

export function FeedbackScreen({
  aprobadoPorDirector,
  escena,
  feedbackDirector,
  loading,
  loadingTexto,
  onReiniciar,
  onReintentar,
  textoUsuario,
  tipoFinal,
}: FeedbackScreenProps) {
  return (
    <div className={styles.bloqueFeedback}>
      <div className={styles.carteleraTitulo}>
        <h2>{escena.titulo}</h2>
      </div>

      <div className={styles.recuadroExplicativo}>
        <strong>Final evaluado:</strong> {tipoFinal.tecnica}. {tipoFinal.criterioExito}
      </div>

      <div className={styles.recuadroTuTexto}>
        <h4>Tu final propuesto</h4>
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
          <p className={styles.loadingText}>{loadingTexto || 'El jurado procesa tu final...'}</p>
        ) : (
          <p className={styles.textoFeedback}>{feedbackDirector}</p>
        )}
      </div>

      {!loading && (
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
          <button className={`${styles.btnTeatro} ${styles.btnComenzar}`} onClick={onReintentar}>
            Repetir final
          </button>
          <button className={`${styles.btnTeatro} ${styles.btnReiniciar}`} onClick={onReiniciar}>
            Nuevo ejercicio
          </button>
        </div>
      )}
    </div>
  );
}
