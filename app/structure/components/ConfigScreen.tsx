import Link from 'next/link';
import styles from '../base.module.css';
import type { DificultadImpro, FaseActo, TiemposConfig } from '../types';

interface ConfigScreenProps {
  dificultad: DificultadImpro;
  explicacionInicial: string;
  loading: boolean;
  onDificultadChange: (dificultad: DificultadImpro) => void;
  onIniciar: () => void;
  onTiempoChange: (fase: FaseActo, valor: number) => void;
  tiemposConfig: TiemposConfig;
}

export function ConfigScreen({
  dificultad,
  explicacionInicial,
  loading,
  onDificultadChange,
  onIniciar,
  onTiempoChange,
  tiemposConfig,
}: ConfigScreenProps) {
  return (
    <div className={styles.bloqueConfig}>
      <div className={styles.recuadroExplicativo}>
        <div className={styles.tituloMision}>💡Misión de la Obra💡</div>
        {explicacionInicial}
      </div>

      <br />
      <div className={styles.controlesGroup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <label className={styles.labelStyle} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          Dificultad
          <select
            className={styles.selectStyle}
            value={dificultad}
            onChange={(event) => onDificultadChange(event.target.value as DificultadImpro)}
          >
            <option value="facil">Fácil (Cotidiano)</option>
            <option value="media">Medio (Interesante)</option>
            <option value="dificil">Difícil (Locura)</option>
          </select>
        </label>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            width: '100%',
          }}
        >
          <TiempoInput
            fase="intro"
            label="⏱️ Inicio"
            onTiempoChange={onTiempoChange}
            value={tiemposConfig.intro}
          />
          <TiempoInput
            fase="giro1"
            label="⚡ 1er Giro"
            onTiempoChange={onTiempoChange}
            value={tiemposConfig.giro1}
          />
          <TiempoInput
            fase="giro2"
            label="🔥 2do Giro"
            onTiempoChange={onTiempoChange}
            value={tiemposConfig.giro2}
          />
          <TiempoInput
            fase="desenlace"
            label="🏁 Desenlace"
            onTiempoChange={onTiempoChange}
            value={tiemposConfig.desenlace}
          />
        </div>
      </div>

      <button
        className={`${styles.btnTeatro} ${styles.btnComenzar}`}
        style={{ marginTop: '25px' }}
        onClick={onIniciar}
        disabled={loading}
      >
        {loading ? 'Afinando el libreto...' : '¡Subir el Telón! 🚀'}
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
    <label className={styles.labelStyle} style={{ display: 'flex', flexDirection: 'column', margin: 0 }}>
      <span>{label}</span>
      <input
        type="number"
        className={styles.inputTiempoNumber}
        value={value}
        min={1}
        max={300}
        onChange={(event) => onTiempoChange(fase, Number(event.target.value))}
      />
    </label>
  );
}
