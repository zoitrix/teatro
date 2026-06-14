import styles from '../../structure/base.module.css';
import type { EscenaFinal, TipoFinal } from '../types';

interface PlayingScreenProps {
  escuchando: boolean;
  escena: EscenaFinal;
  loading: boolean;
  onTerminar: () => void;
  timeLeft: number;
  tipoFinal: TipoFinal;
}

export function PlayingScreen({ escuchando, escena, loading, onTerminar, timeLeft, tipoFinal }: PlayingScreenProps) {
  return (
    <div className={styles.bloqueJuego}>
      <div className={styles.cronometro}>Tiempo: {timeLeft}s</div>

      <div className={styles.carteleraTitulo}>
        <h2>{escena.titulo}</h2>
      </div>

      <div className={styles.recuadroExplicativo} style={{ backgroundColor: '#fffdf5' }}>
        <p style={{ marginTop: 0 }}>
          <strong>Planteamiento:</strong> {escena.planteamiento}
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>Nudo:</strong> {escena.nudo}
        </p>
      </div>

      <div className={styles.recuadroExplicativo} style={{ marginBottom: '15px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <p>
          <strong>Objetivo:</strong> Improvisa un <strong>{tipoFinal.tecnica}</strong>.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>Pista:</strong> {tipoFinal.criterioExito}
        </p>
      </div>

      <div className={styles.formularioTextoWrapper} style={{ textAlign: 'center' }}>
        <div className={`indicadorEstadoVoz ${escuchando ? 'grabandoActivoPc' : ''}`}>
          <p className={styles.textoEstado}>
            {escuchando
              ? 'El escenario esta abierto. Di el final en voz alta.'
              : 'Finalizando grabacion de audio...'}
          </p>
        </div>
      </div>

      <button className={`${styles.btnTeatro} ${styles.btnComenzar}`} onClick={onTerminar} disabled={loading}>
        Terminar final
      </button>
    </div>
  );
}
