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
      <div className={styles.recuadroExplicativo}>
        <div className={styles.tituloMision}>💡Mision de ImprovIA💡</div>
        Comparte escena con un co-actor virtual. La IA respondera como personaje dentro de la historia y tu objetivo
        será escuchar, aceptar sus propuestas y construir una obra completa por actos.<br /><br />
        Cada acto se cerrara automaticamente al agotarse su tiempo. Habla con fluidez con la IA y responde a lo que te
        propone. El director calificara cada bloque y veras el informe completo al
        terminar la funcion.
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '12px',
            width: '100%',
          }}
        >
          <TiempoInput fase="intro" label="Intro" onTiempoChange={onTiempoChange} value={tiemposConfig.intro} />
          <TiempoInput fase="nudo" label="Nudo (2 Giros)" onTiempoChange={onTiempoChange} value={tiemposConfig.nudo} />
          <TiempoInput
            fase="desenlace"
            label="Desenlace"
            onTiempoChange={onTiempoChange}
            value={tiemposConfig.desenlace}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '25px' }}>
        <button className={`${styles.btnTeatro} ${styles.btnComenzar}`} onClick={onIniciar} disabled={loading}>
          {loading ? 'Inicializando...' : 'Subir el Telon'}
        </button>
        <Link
          className={`${styles.btnTeatro} ${styles.btnRepetir}`}
          href="/"
          style={{ textAlign: 'center', textDecoration: 'none' }}
        >
          Volver al menu
        </Link>
      </div>
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
        max={600}
        onChange={(event) => onTiempoChange(fase, Number(event.target.value))}
      />
    </label>
  );
}
