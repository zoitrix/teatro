import Link from 'next/link';
import styles from '../../structure/base.module.css';
import type { DificultadEnd, TipoFinal } from '../types';

interface ConfigScreenProps {
  dificultad: DificultadEnd;
  loading: boolean;
  loadingTexto: string;
  onDificultadChange: (dificultad: DificultadEnd) => void;
  onIniciar: () => void;
  onTiempoChange: (valor: number) => void;
  onTipoFinalChange: (id: string) => void;
  tiempoConfig: number;
  tipoFinal: TipoFinal;
  tipoFinalId: string;
  tiposFinal: TipoFinal[];
}

export function ConfigScreen({
  dificultad,
  loading,
  loadingTexto,
  onDificultadChange,
  onIniciar,
  onTiempoChange,
  onTipoFinalChange,
  tiempoConfig,
  tipoFinal,
  tipoFinalId,
  tiposFinal,
}: ConfigScreenProps) {
  return (
    <div className={styles.bloqueConfig}>
      <div className={styles.recuadroExplicativo}>
        <div className={styles.tituloMision}>Mision de Finales</div>
        Elige un tipo de final. La IA generara un titulo, un planteamiento y un nudo; tu trabajo sera cerrar la escena en voz alta aplicando la tecnica elegida.
      </div>

      <br />
      <div className={styles.controlesGroup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <label className={styles.labelStyle} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          Tipo de final
          <select
            className={styles.selectStyle}
            value={tipoFinalId}
            onChange={(event) => onTipoFinalChange(event.target.value)}
          >
            {tiposFinal.map((item) => (
              <option key={item.id} value={item.id}>
                {item.tecnica}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.recuadroExplicativo} style={{ backgroundColor: '#fffdf5' }}>
          <p style={{ marginTop: 0 }}>
            <strong>{tipoFinal.tecnica}</strong> ({tipoFinal.enfoque})
          </p>
          <p>
            <strong>Mecanica:</strong> {tipoFinal.mecanica}
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Criterio:</strong> {tipoFinal.criterioExito}
          </p>
        </div>

        <label className={styles.labelStyle} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          Dificultad
          <select
            className={styles.selectStyle}
            value={dificultad}
            onChange={(event) => onDificultadChange(event.target.value as DificultadEnd)}
          >
            <option value="facil">Facil (Cotidiano)</option>
            <option value="media">Medio (Interesante)</option>
            <option value="dificil">Dificil (Locura)</option>
          </select>
        </label>

        <label className={styles.labelStyle} style={{ display: 'flex', flexDirection: 'column', margin: 0 }}>
          Tiempo del final
          <input
            type="number"
            className={styles.inputTiempoNumber}
            value={tiempoConfig}
            min={1}
            max={300}
            onChange={(event) => onTiempoChange(Number(event.target.value))}
          />
        </label>
      </div>

      <button
        className={`${styles.btnTeatro} ${styles.btnComenzar}`}
        style={{ marginTop: '25px' }}
        onClick={onIniciar}
        disabled={loading}
      >
        {loading ? loadingTexto || 'Preparando escena...' : 'Empezar final'}
      </button>

      <Link className={styles.volverMenuLink} href="/">
        Volver al menu principal
      </Link>
    </div>
  );
}
