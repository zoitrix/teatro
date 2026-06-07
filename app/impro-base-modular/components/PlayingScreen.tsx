import styles from '../../impro-base/base.module.css';
import type { FaseActo, ObraHistorial, TiemposConfig } from '../types';

interface PlayingScreenProps {
  escuchando: boolean;
  faseActual: FaseActo;
  loading: boolean;
  obra: ObraHistorial;
  onTerminarActo: () => void;
  tiemposConfig: TiemposConfig;
  timeLeft: number;
}

export function PlayingScreen({
  escuchando,
  faseActual,
  loading,
  obra,
  onTerminarActo,
  tiemposConfig,
  timeLeft,
}: PlayingScreenProps) {
  return (
    <div className={styles.bloqueJuego}>
      <PhaseChallenge faseActual={faseActual} obra={obra} tiemposConfig={tiemposConfig} />

      <div className={styles.cronometro}>⏱️ {timeLeft}s</div>

      <div className={styles.formularioTextoWrapper} style={{ textAlign: 'center' }}>
        <div className={`indicadorEstadoVoz ${escuchando ? 'grabandoActivoPc' : ''}`}>
          <p className={styles.textoEstado}>
            {escuchando
              ? '🎙️ El escenario está abierto... ¡Actúa e improvisa en voz alta!'
              : '🔇 Finalizando grabación de audio...'}
          </p>
        </div>
      </div>

      <button className={`${styles.btnTeatro} ${styles.btnComenzar}`} onClick={onTerminarActo} disabled={loading}>
        ¡Terminar Acto! 🔔
      </button>
    </div>
  );
}

interface PhaseChallengeProps {
  faseActual: FaseActo;
  obra: ObraHistorial;
  tiemposConfig: TiemposConfig;
}

function PhaseChallenge({ faseActual, obra, tiemposConfig }: PhaseChallengeProps) {
  return (
    <div className={styles.recuadroExplicativo} style={{ marginBottom: '15px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
      {faseActual === 'intro' && (
        <p>
          <strong>🎯 Objetivo:</strong> Plantea la escena. Muestra claramente la relación de los personajes, el
          estado anímico, el conflicto y el lugar.
        </p>
      )}
      {faseActual === 'giro1' && (
        <div>
          <p style={{ color: '#ff7b00', fontSize: '0.9em', marginBottom: '4px' }}>
            <strong>📖 Tu Comienzo:</strong> "{obra.intro}"
          </p>
          <p>
            <strong>⚡ Reto ({tiemposConfig.giro1}s):</strong> ¡Introduce un cambio brusco o imprevisto que tuerza
            este inicio!
          </p>
        </div>
      )}
      {faseActual === 'giro2' && (
        <div>
          <p style={{ color: '#ff7b00', fontSize: '0.9em', marginBottom: '4px' }}>
            <strong>📖 Tu Comienzo:</strong> "{obra.intro}"
          </p>
          <p style={{ color: '#ff3b30', fontSize: '0.9em', marginBottom: '4px' }}>
            <strong>🔥 Primer Giro:</strong> "... {obra.giro1}"
          </p>
          <p>
            <strong>💥 Reto ({tiemposConfig.giro2}s):</strong> ¡Añade más leña al fuego! Mete una complicación
            extra, peligro o factor contrarreloj.
          </p>
        </div>
      )}
      {faseActual === 'desenlace' && (
        <div>
          <p style={{ color: '#ff7b00', fontSize: '0.9em', marginBottom: '4px' }}>
            <strong>📖 Tu Comienzo:</strong> "{obra.intro}"
          </p>
          <p style={{ color: '#ff3b30', fontSize: '0.9em', marginBottom: '4px' }}>
            <strong>🔥 Primer Giro:</strong> "... {obra.giro1}"
          </p>
          <p style={{ color: '#4cd964', fontSize: '0.9em', marginBottom: '4px' }}>
            <strong>🚀 Segundo Giro:</strong> "... {obra.giro2}"
          </p>
          <p>
            <strong>🏁 Reto ({tiemposConfig.desenlace}s):</strong> ¡Cierra la función! Di cómo se resuelve todo el
            embrollo de golpe de forma divertida.
          </p>
        </div>
      )}
    </div>
  );
}

