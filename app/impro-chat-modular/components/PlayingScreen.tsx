import styles from '../../impro-chat/chat.module.css';
import type { FaseActo, FeedbackFijo, MensajeChat, TiemposConfig } from '../types';

interface PlayingScreenProps {
  escuchando: boolean;
  faseActual: FaseActo;
  historialLetra: MensajeChat[];
  iaHablando: boolean;
  loading: boolean;
  loadingTexto: string;
  onConcluir: () => void;
  onEnviar: () => void;
  tiemposConfig: TiemposConfig;
  timeLeft: number;
  titulo: string;
  ultimoFeedbackFijo: FeedbackFijo | null;
}

export function PlayingScreen({
  escuchando,
  faseActual,
  historialLetra,
  iaHablando,
  loading,
  loadingTexto,
  onConcluir,
  onEnviar,
  tiemposConfig,
  timeLeft,
  titulo,
  ultimoFeedbackFijo,
}: PlayingScreenProps) {
  return (
    <div className={styles.bloqueJuego}>
      <div className={styles.cronometro}>⏱️ {timeLeft}s</div>

      <div className={styles.carteleraTitulo}>
        <h2>{titulo}</h2>
      </div>

      <MissionPanel faseActual={faseActual} tiemposConfig={tiemposConfig} />
      <DirectorMonitor ultimoFeedbackFijo={ultimoFeedbackFijo} />
      <VoiceStatus escuchando={escuchando} iaHablando={iaHablando} loading={loading} loadingTexto={loadingTexto} />
      <RecentDialogue historialLetra={historialLetra} />

      <div className={styles.panelAcciones}>
        <button
          className={`${styles.btnTeatro} ${styles.btnEnviar}`}
          onClick={onEnviar}
          disabled={!escuchando || loading || iaHablando}
        >
          {escuchando ? '🔔 Enviar' : 'Escuchando...'}
        </button>
        <button className={`${styles.btnTeatro} ${styles.btnReiniciar}`} onClick={onConcluir}>
          🛑 Concluir
        </button>
      </div>
    </div>
  );
}

function MissionPanel({ faseActual, tiemposConfig }: { faseActual: FaseActo; tiemposConfig: TiemposConfig }) {
  return (
    <div className={styles.recuadroExplicativo} style={{ backgroundColor: '#fffdf5', border: '1px solid var(--color-oro)' }}>
      {faseActual === 'intro' && (
        <p style={{ color: '#b92929', textAlign: 'center' }}>
          <strong>🎯 Misión Intro</strong>
          <br />
          Entabla el contexto básico, la relación con tu compañero e intégrate con el título.
        </p>
      )}
      {faseActual === 'nudo' && (
        <p style={{ color: '#b92929', textAlign: 'center' }}>
          <strong>⚡ Misión Nudo (Doble Giro)</strong>
          <br />
          ¡Desata el caos! Introduce una revelación inesperada Y añade un factor límite o amenaza para complicarlo todo.
          <br />
          <small>{tiemposConfig.nudo}s para sostener los dos giros.</small>
        </p>
      )}
      {faseActual === 'desenlace' && (
        <p style={{ color: '#27ae60', textAlign: 'center' }}>
          <strong>🏁 Misión Desenlace</strong> Guía la improvisación hacia un final ingenioso o divertido.
        </p>
      )}
    </div>
  );
}

function DirectorMonitor({ ultimoFeedbackFijo }: { ultimoFeedbackFijo: FeedbackFijo | null }) {
  return (
    <div
      style={{
        backgroundColor: '#f8f9fa',
        borderLeft: ultimoFeedbackFijo ? (ultimoFeedbackFijo.aprobado ? '5px solid #27ae60' : '5px solid #e74c3c') : '5px solid #bdc3c7',
        padding: '12px 15px',
        borderRadius: '4px',
        marginBottom: '15px',
        fontSize: '0.9rem',
        color: '#333',
      }}
    >
      <span style={{ fontWeight: 'bold', fontSize: '1rem', display: 'block', color: '#7f8c8d', marginBottom: '3px', textAlign: 'center', paddingBottom: '5px' }}>
        📡 Revisión del Director
      </span>
      {ultimoFeedbackFijo ? (
        <p style={{ margin: 0, textAlign: 'center' }}>
          <strong>{ultimoFeedbackFijo.fase}:</strong>{' '}
          <span style={{ color: ultimoFeedbackFijo.aprobado ? '#27ae60' : '#b92929', fontWeight: 'bold' }}>
            {ultimoFeedbackFijo.aprobado ? '[APTO]' : '[NO APTO]'}
          </span>{' '}
          {ultimoFeedbackFijo.texto}
        </p>
      ) : (
        <p style={{ margin: 0, color: '#7f8c8d', fontStyle: 'italic' }}>
          El director está observando en silencio desde el patio de butacas. Dará su primera nota al cambiar de acto...
        </p>
      )}
    </div>
  );
}

function VoiceStatus({ escuchando, iaHablando, loading, loadingTexto }: {
  escuchando: boolean;
  iaHablando: boolean;
  loading: boolean;
  loadingTexto: string;
}) {
  return (
    <div className={`${styles.recuadroTranscripcion} ${escuchando ? styles.ondaActiva : ''}`}>
      {loading ? (
        <p className={styles.textoHablado}>⏳ {loadingTexto}</p>
      ) : escuchando ? (
        <p className={styles.textoHablado}>🎙️ Habla ahora...</p>
      ) : iaHablando ? (
        <p className={styles.textoHablado}>🔊 Tu compañero responde...</p>
      ) : (
        <p className={styles.placeholderVoz}>Esperando señal del apuntador...</p>
      )}
    </div>
  );
}

function RecentDialogue({ historialLetra }: { historialLetra: MensajeChat[] }) {
  return (
    <div className={styles.historialRecorte}>
      {historialLetra.slice(-3).map((mensaje, index) => (
        <div key={index} className={`${styles.lineaDialogo} ${mensaje.role === 'user' ? styles.user : styles.assistant}`}>
          <strong>{mensaje.role === 'user' ? 'Tú: ' : 'Co-Actor: '}</strong>
          {mensaje.content === '[SIN_RESPUESTA]' ? '...' : mensaje.content}
        </div>
      ))}
    </div>
  );
}

