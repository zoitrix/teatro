import styles from '../../impro-chat/chat.module.css';
import { ACTOS_FINALES } from '../constants';
import type { FaseActo, InformeDirector, MensajeChat } from '../types';

interface FinalScreenProps {
  historialLetra: MensajeChat[];
  informeFinal: InformeDirector;
  onReiniciar: () => void;
  titulo: string;
}

export function FinalScreen({ historialLetra, informeFinal, onReiniciar, titulo }: FinalScreenProps) {
  const aprobadosTotales = ACTOS_FINALES.every((acto) => informeFinal[acto.id]?.aprobado === true);

  return (
    <div className={styles.teatroPageWrapper}>
      <div className={styles.teatroContainer}>
        <header className={styles.teatroHeader}>
          <h1>{aprobadosTotales ? '💐 ¡FUNCIÓN CONSEGUIDA! 🏆' : '🎬 FIN DE LA FUNCIÓN'}</h1>
          <p className={styles.subtitulo}>Libreto Completo y Calificaciones</p>
        </header>

        <main className={styles.bloqueFeedback}>
          <div className={styles.carteleraTitulo}>
            <h2>OBRA: {titulo}</h2>
          </div>

          <LibretoFinal historialLetra={historialLetra} />
          <CuadernoDirector informeFinal={informeFinal} />

          <div className={styles.recuadroExplicativo} style={{ backgroundColor: aprobadosTotales ? '#e8f8f5' : '#fdedec', textAlign: 'center', border: 'none', padding: '15px' }}>
            <h4 style={{ margin: 0, color: aprobadosTotales ? '#27ae60' : '#b92929' }}>
              VEREDICTO: {aprobadosTotales ? '🎓 ESTRUCTURA IMPECABLE' : '🎭 REQUIERE REPASO'}
            </h4>
          </div>

          <button className={`${styles.btnTeatro} ${styles.btnComenzar}`} style={{ marginTop: '20px' }} onClick={onReiniciar}>
            🔄 Nueva Obra
          </button>
        </main>
      </div>
    </div>
  );
}

function LibretoFinal({ historialLetra }: { historialLetra: MensajeChat[] }) {
  return (
    <>
      <h3 style={{ borderBottom: '2px solid var(--color-telon)', paddingBottom: '5px', color: 'var(--color-telon)' }}>📖 Libreto Completo de la Función</h3>
      <div
        style={{
          backgroundColor: '#fdfbf7',
          padding: '15px',
          borderRadius: '6px',
          border: '1px solid #e2d6b5',
          maxHeight: '250px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {historialLetra.length === 0 ? (
          <p style={{ color: '#7f8c8d', fontStyle: 'italic', margin: 0 }}>No se registraron líneas de diálogo.</p>
        ) : (
          historialLetra.map((mensaje, index) => (
            <p key={index} style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>
              <strong style={{ color: mensaje.role === 'user' ? '#2980b9' : '#c0392b' }}>
                {mensaje.role === 'user' ? '👤 Tú: ' : '🤖 Co-Actor: '}
              </strong>
              {mensaje.content === '[SIN_RESPUESTA]' ? '...' : mensaje.content}
            </p>
          ))
        )}
      </div>
    </>
  );
}

function CuadernoDirector({ informeFinal }: { informeFinal: InformeDirector }) {
  return (
    <>
      <h3 style={{ borderBottom: '2px solid var(--color-telon)', paddingBottom: '5px', color: 'var(--color-telon)' }}>📋 Cuaderno del Director</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
        {ACTOS_FINALES.map((acto) => {
          const evalActo = informeFinal[acto.id as FaseActo];
          return (
            <div key={acto.id} className={styles.recuadroExplicativo} style={{ backgroundColor: '#fff', border: '1px solid #ddd', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span style={{ color: '#333' }}>{acto.nombre}</span>
                <span style={{ color: evalActo?.aprobado ? '#27ae60' : '#b92929' }}>
                  {evalActo ? (evalActo.aprobado ? '✅ APTO' : '❌ NO APTO') : '⏸️ No procesado'}
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: '#555' }}>
                <strong>Director:</strong> {evalActo?.comentario || 'Analizando la estructura narrativa...'}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}

