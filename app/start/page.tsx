'use client';

import styles from '../structure/base.module.css';
import { ConfigScreen } from './components/ConfigScreen';
import { FeedbackScreen } from './components/FeedbackScreen';
import { PlayingScreen } from './components/PlayingScreen';
import { useStartController } from './hooks/useStartController';

export default function StartPage() {
  const controller = useStartController();

  return (
    <div className={styles.teatroContainer}>
      <header className={styles.teatroHeader}>
        <h1>Inicios</h1>
        <p className={styles.subtitulo}>
          {controller.pantalla === 'config'
            ? 'Elige una estrategia y prepara el primer impulso'
            : 'Describe como abririas la escena'}
        </p>
      </header>

      <main className={styles.escenario}>
        {controller.pantalla === 'config' && (
          <ConfigScreen
            dificultad={controller.dificultad}
            estrategia={controller.estrategia}
            estrategiaId={controller.estrategiaId}
            estrategias={controller.estrategias}
            loading={controller.loading}
            onDificultadChange={controller.setDificultad}
            onEstrategiaChange={controller.setEstrategiaId}
            onIniciar={controller.iniciarEjercicio}
            onTiempoChange={controller.handleTiempoChange}
            tiempoConfig={controller.tiempoConfig}
          />
        )}

        {controller.pantalla === 'jugando' && (
          <PlayingScreen
            escuchando={controller.escuchando}
            estrategia={controller.estrategia}
            loading={controller.loading}
            onTerminar={controller.terminarInicio}
            timeLeft={controller.timeLeft}
            titulo={controller.titulo}
          />
        )}

        {controller.pantalla === 'feedback' && (
          <FeedbackScreen
            aprobadoPorDirector={controller.aprobadoPorDirector}
            estrategia={controller.estrategia}
            feedbackDirector={controller.feedbackDirector}
            loading={controller.loading}
            loadingTexto={controller.loadingTexto}
            onReiniciar={controller.reiniciarEjercicio}
            onReintentar={controller.reintentarInicio}
            textoUsuario={controller.textoUsuario}
            titulo={controller.titulo}
          />
        )}
      </main>
    </div>
  );
}
