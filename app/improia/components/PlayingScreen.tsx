import styles from '../../structure/base.module.css';
import type { MensajeChat } from '../types';

interface PlayingScreenProps {
  escuchando: boolean;
  historialLetra: MensajeChat[];
  iaHablando: boolean;
  loading: boolean;
  loadingTexto: string;
  onConcluir: () => void;
  timeLeft: number;
  titulo: string;
}

export function PlayingScreen({
  escuchando,
  historialLetra,
  iaHablando,
  loading,
  loadingTexto,
  onConcluir,
  timeLeft,
  titulo,
}: PlayingScreenProps) {
  return (
    <div className={styles.bloqueJuego}>
      <div className={styles.cronometro}>{timeLeft}s</div>

      <div className={styles.carteleraTitulo}>
        <h2>{titulo}</h2>
      </div>

      <MissionPanel />
      <VoiceStatus escuchando={escuchando} iaHablando={iaHablando} loading={loading} loadingTexto={loadingTexto} />
      <RecentDialogue historialLetra={historialLetra} />

      <button className={`${styles.btnTeatro} ${styles.btnReiniciar}`} onClick={onConcluir} disabled={loading}>
        {loading ? 'Evaluando...' : 'Terminar obra'}
      </button>
    </div>
  );
}

function MissionPanel() {
  return (
    <div className={styles.recuadroExplicativo} style={{ backgroundColor: '#fffdf5', border: '1px solid var(--color-oro)' }}>
      <p style={{ color: '#b92929', textAlign: 'center', marginTop: 0 }}>
        <strong>Conversacion continua</strong>
      </p>
      <p style={{ marginBottom: 0 }}>
        Habla con naturalidad. Cuando calles un momento, la IA respondera como co-actor. Pulsa terminar cuando la obra
        tenga introduccion, desarrollo y cierre.
      </p>
    </div>
  );
}

function VoiceStatus({
  escuchando,
  iaHablando,
  loading,
  loadingTexto,
}: {
  escuchando: boolean;
  iaHablando: boolean;
  loading: boolean;
  loadingTexto: string;
}) {
  return (
    <div className={`${styles.recuadroTranscripcion} ${escuchando ? styles.ondaActiva : ''}`}>
      {loading ? (
        <p className={styles.textoHablado}>{loadingTexto}</p>
      ) : escuchando ? (
        <p className={styles.textoHablado}>Habla ahora. La IA respondera cuando detecte silencio.</p>
      ) : iaHablando ? (
        <p className={styles.textoHablado}>Tu co-actor responde...</p>
      ) : (
        <p className={styles.placeholderVoz}>Preparando el siguiente turno...</p>
      )}
    </div>
  );
}

function RecentDialogue({ historialLetra }: { historialLetra: MensajeChat[] }) {
  return (
    <div className={styles.historialRecorte}>
      {historialLetra.length === 0 ? (
        <div className={`${styles.lineaDialogo} ${styles.assistant}`}>
          <strong>Co-Actor: </strong>
          Empieza cuando quieras; estoy escuchando.
        </div>
      ) : (
        historialLetra.slice(-5).map((mensaje, index) => (
          <div key={index} className={`${styles.lineaDialogo} ${mensaje.role === 'user' ? styles.user : styles.assistant}`}>
            <strong>{mensaje.role === 'user' ? 'Tu: ' : 'Co-Actor: '}</strong>
            {mensaje.content}
          </div>
        ))
      )}
    </div>
  );
}
