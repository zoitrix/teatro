import Link from 'next/link';
import styles from '../../structure/base.module.css';
import type { DificultadStart, EstrategiaInicio } from '../types';

interface ConfigScreenProps {
  dificultad: DificultadStart;
  estrategia: EstrategiaInicio;
  estrategiaId: string;
  estrategias: EstrategiaInicio[];
  loading: boolean;
  onDificultadChange: (dificultad: DificultadStart) => void;
  onEstrategiaChange: (id: string) => void;
  onIniciar: () => void;
  onTiempoChange: (valor: number) => void;
  tiempoConfig: number;
}

export function ConfigScreen({
  dificultad,
  estrategia,
  estrategiaId,
  estrategias,
  loading,
  onDificultadChange,
  onEstrategiaChange,
  onIniciar,
  onTiempoChange,
  tiempoConfig,
}: ConfigScreenProps) {
  return (
    <div className={styles.bloqueConfig}>
      <div className={styles.recuadroExplicativo}>
        <div className={styles.tituloMision}>Mision de Inicios</div>
        Elige una estrategia, recibe un titulo y describe en voz alta como arrancarias la escena con detalles claros y
        jugables.
      </div>

      <br />
      <div className={styles.controlesGroup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <label className={styles.labelStyle} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          Estrategia de inicio
          <select
            className={styles.selectStyle}
            value={estrategiaId}
            onChange={(event) => onEstrategiaChange(event.target.value)}
          >
            {estrategias.map((item) => (
              <option key={item.id} value={item.id}>
                {item.tecnica}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.recuadroExplicativo} style={{ backgroundColor: '#fffdf5' }}>
          <p style={{ marginTop: 0 }}>
            <strong>{estrategia.tecnica}</strong> ({estrategia.enfoque})
          </p>
          <p>{estrategia.mecanica}</p>
          <p style={{ marginBottom: 0 }}>
            <strong>Busca:</strong> {estrategia.criterioExito}
          </p>
        </div>

        <label className={styles.labelStyle} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          Dificultad
          <select
            className={styles.selectStyle}
            value={dificultad}
            onChange={(event) => onDificultadChange(event.target.value as DificultadStart)}
          >
            <option value="facil">Facil (Cotidiano)</option>
            <option value="media">Medio (Interesante)</option>
            <option value="dificil">Dificil (Locura)</option>
          </select>
        </label>

        <label className={styles.labelStyle} style={{ display: 'flex', flexDirection: 'column', margin: 0 }}>
          Tiempo del ejercicio
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
        {loading ? 'Afinando el arranque...' : 'Subir el Telon'}
      </button>

      <Link className={styles.volverMenuLink} href="/">
        Volver al menu principal
      </Link>
    </div>
  );
}
