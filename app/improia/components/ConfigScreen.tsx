import Link from 'next/link';
import styles from '../../structure/base.module.css';
import type { DificultadChat, TiemposConfig } from '../types';

interface ConfigScreenProps {
  dificultad: DificultadChat;
  loading: boolean;
  onDificultadChange: (dificultad: DificultadChat) => void;
  onIniciar: () => void;
  onTiempoChange: (valor: number) => void;
  tiemposConfig: TiemposConfig;
}

export function ConfigScreen({
  dificultad,
  loading,
  onDificultadChange,
  onIniciar,
  onTiempoChange,
  tiemposConfig,
}: ConfigScreenProps) {
  return (
    <div className={styles.bloqueConfig}>
      <div className={styles.recuadroExplicativo}>
        <div className={styles.tituloMision}>Mision de ImprovIA</div>
        Manten una conversacion escenica natural con un co-actor virtual. La IA respondera cuando detecte que has
        dejado de hablar durante un momento.
        <br />
        <br />
        No hay actos cronometrados: improvisa libremente durante el tiempo total y pulsa terminar cuando la obra tenga
        cierre. El director evaluara despues introduccion, nudo y desenlace.
      </div>

      <br />
      <div className={styles.controlesGroup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <label className={styles.labelStyle}>
          Tono del Escenario:
          <select
            className={styles.selectStyle}
            value={dificultad}
            onChange={(event) => onDificultadChange(event.target.value as DificultadChat)}
          >
            <option value="facil">Cotidiano</option>
            <option value="media">Absurdo</option>
            <option value="dificil">Surrealista</option>
          </select>
        </label>

        <label className={styles.labelStyle} style={{ display: 'flex', flexDirection: 'column', margin: 0 }}>
          Tiempo total
          <input
            type="number"
            className={styles.inputTiempoNumber}
            value={tiemposConfig.total}
            min={30}
            max={900}
            onChange={(event) => onTiempoChange(Number(event.target.value))}
          />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '25px' }}>
        <Link
          className={`${styles.btnTeatro} ${styles.btnRepetir}`}
          href="/"
          style={{ textAlign: 'center', textDecoration: 'none' }}
        >
          Volver al menu
        </Link>

        <button className={`${styles.btnTeatro} ${styles.btnComenzar}`} onClick={onIniciar} disabled={loading}>
          {loading ? 'Inicializando...' : 'Subir el Telon'}
        </button>
      </div>
    </div>
  );
}
