import styles from '../../impro-base/base.module.css';
import type { FaseActo } from '../types';

interface FeedbackScreenProps {
  aprobadoPorDirector: boolean;
  faseActual: FaseActo;
  feedbackDirector: string;
  loading: boolean;
  loadingTexto: string;
  onAvanzar: () => void;
  onReiniciar: () => void;
  onReintentar: () => void;
  textoUsuario: string;
}

export function FeedbackScreen({
  aprobadoPorDirector,
  faseActual,
  feedbackDirector,
  loading,
  loadingTexto,
  onAvanzar,
  onReiniciar,
  onReintentar,
  textoUsuario,
}: FeedbackScreenProps) {
  return (
    <div className={styles.bloqueFeedback}>
      <div className={styles.recuadroTuTexto}>
        <h4>📖 Tu Propuesta para este Acto</h4>
        <p className={styles.textoGuardadoUsuario}>
          {loading && !textoUsuario ? (
            <span className={styles.loadingSubtext}>Transcribiendo tu voz... 🎧</span>
          ) : textoUsuario.trim() ? (
            `"${textoUsuario.trim()}"`
          ) : (
            <i>[No se detectó voz o el escenario se quedó en absoluto silencio]</i>
          )}
        </p>
      </div>

      <div className={styles.recuadroFeedback}>
        <h4>
          📝 El Director opina:{' '}
          {!loading && (
            <span style={{ color: aprobadoPorDirector ? '#4cd964' : '#ff3b30', fontWeight: 'bold' }}>
              {aprobadoPorDirector ? '[APROBADO] ✅' : '[RECHAZADO] ❌'}
            </span>
          )}
        </h4>
        {loading ? (
          <p className={styles.loadingText}>🎬 {loadingTexto || 'El jurado procesa la escena...'} 👏</p>
        ) : (
          <p className={styles.textoFeedback}>{feedbackDirector}</p>
        )}
      </div>

      {!loading && (
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
          {aprobadoPorDirector ? (
            <button className={`${styles.btnTeatro} ${styles.btnComenzar}`} style={{ backgroundColor: '#28a745' }} onClick={onAvanzar}>
              {faseActual === 'desenlace' ? '✨ Ver Obra Completa' : 'Siguiente Acto 👉'}
            </button>
          ) : (
            <div style={{ display: 'flex', width: '100%', gap: '15px' }}>
              <button className={`${styles.btnTeatro} ${styles.btnComenzar}`} onClick={onReintentar}>
                🔄 Repetir Acto
              </button>
              <button className={`${styles.btnTeatro} ${styles.btnComenzar}`} onClick={onReiniciar}>
                🎬 Reiniciar Obra
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

