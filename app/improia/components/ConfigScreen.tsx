import Link from 'next/link';
import styles from '../../structure/base.module.css';
import type { DificultadChat, FaseActo, TiemposConfig } from '../types';

interface ConfigScreenProps {
  dificultad: DificultadChat;
  loading: boolean;
  onDificultadChange: (dificultad: DificultadChat) => void;
  onIniciar: () => void;
  onTiempoChange: (fase: FaseActo, valor: number) => void;
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
      <div className={styles.recuadroReglas}>
        <strong>📋 Reglas de la Academia:</strong> Cada acto se cerrará automáticamente al agotarse su tiempo. Habla
        con fluidez con la IA. El director calificará cada bloque fijando su nota en el monitor de abajo y verás el
        informe completo al terminar.
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
            <option value="fácil">Cotidiano</option>
            <option value="media">Absurdo</option>
            <option value="difícil">Surrealista</option>
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', width: '100%' }}>
          <TiempoInput fase="intro" label="⏱️ Intro" onTiempoChange={onTiempoChange} value={tiemposConfig.intro} />
          <TiempoInput fase="nudo" label="⚡ Nudo (2 Giros)" onTiempoChange={onTiempoChange} value={tiemposConfig.nudo} />
          <TiempoInput fase="desenlace" label="🏁 Desenlace" onTiempoChange={onTiempoChange} value={tiemposConfig.desenlace} />
        </div>
      </div>

      <button className={`${styles.btnTeatro} ${styles.btnComenzar}`} style={{ marginTop: '25px' }} onClick={onIniciar} disabled={loading}>
        {loading ? 'Inicializando Libreto...' : '¡Subir el Telón! 🚀'}
      </button>

      <Link className={styles.volverMenuLink} href="/">
        Volver al menu principal
      </Link>
    </div>
  );
}

interface TiempoInputProps {
  fase: FaseActo;
  label: string;
  onTiempoChange: (fase: FaseActo, valor: number) => void;
  value: number;
}

function TiempoInput({ fase, label, onTiempoChange, value }: TiempoInputProps) {
  return (
    <label className={styles.labelStyle}>
      <span>{label}</span>
      <input
        type="number"
        className={styles.inputTiempoNumber}
        value={value}
        onChange={(event) => onTiempoChange(fase, Number(event.target.value))}
      />
    </label>
  );
}
