import styles from '../base.module.css';
import type { ObraHistorial } from '../types';

interface FinalScreenProps {
  obra: ObraHistorial;
  onReiniciar: () => void;
}

export function FinalScreen({ obra, onReiniciar }: FinalScreenProps) {
  return (
    <div className={styles.teatroContainer}>
      <header className={styles.teatroHeader}>
        <h1>🏆 ¡GRAN FUNCIÓN COMPLETADA! 💐</h1>
        <p className={styles.subtitulo}>El público ovaciona en pie tu capacidad de improvisación</p>
      </header>

      <main className={styles.escenario}>
        <div className={styles.carteleraTitulo}>
          <h2>🎬 LIBRETO FINAL: "{obra.titulo}"</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '600px', margin: '0 auto 25px auto' }}>
          <ActoFinal color="#ffd700" titulo="📖 Acto I: Introducción" texto={obra.intro} />
          <ActoFinal color="#ff7b00" titulo="⚡ Acto II: Primer Punto de Giro" texto={obra.giro1} />
          <ActoFinal color="#ff3b30" titulo="🔥 Acto III: Segundo Punto de Giro" texto={obra.giro2} />
          <ActoFinal color="#4cd964" titulo="🏁 Acto IV: Desenlace Final" texto={obra.desenlace} />
        </div>

        <div className={styles.recuadroFeedback} style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', border: '1px dashed #ffd700', marginBottom: '20px' }}>
          <p className={styles.textoFeedback} style={{ textAlign: 'center', fontWeight: 'bold' }}>
            ✨ ¡Enhorabuena! Has mantenido la coherencia dramática y cómica bajo la presión del cronómetro.
          </p>
        </div>

        <button className={`${styles.btnTeatro} ${styles.btnComenzar}`} onClick={onReiniciar}>
          🔄 Iniciar Nueva Obra
        </button>
      </main>
    </div>
  );
}

interface ActoFinalProps {
  color: string;
  texto: string;
  titulo: string;
}

function ActoFinal({ color, texto, titulo }: ActoFinalProps) {
  return (
    <div className={styles.recuadroExplicativo} style={{ textAlign: 'left', borderLeft: `5px solid ${color}` }}>
      <strong>{titulo}</strong>
      <p style={{ marginTop: '5px', fontStyle: 'italic' }}>"{texto}"</p>
    </div>
  );
}
