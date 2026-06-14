'use client';

import styles from '../structure/base.module.css';
import { ConfigScreen } from './components/ConfigScreen';
import { FeedbackScreen } from './components/FeedbackScreen';
import { PlayingScreen } from './components/PlayingScreen';
import { useEndController } from './hooks/useEndController';

export default function EndPage() {
  const controller = useEndController();

  return (
    <div className={styles.teatroContainer}>
      <header className={styles.teatroHeader}>
        <h1>🎭 Finales 🎬</h1>
        <p className={styles.subtitulo}>
          {controller.pantalla === 'config'
            ? 'Elige como quieres cerrar la escena'
            : 'Escucha el nudo y remata la funcion'}
        </p>
      </header>

      <main className={styles.escenario}>
        {controller.pantalla === 'config' && (
          <ConfigScreen
            dificultad={controller.dificultad}
            loading={controller.loading}
            loadingTexto={controller.loadingTexto}
            onDificultadChange={controller.setDificultad}
            onIniciar={controller.iniciarEjercicio}
            onTiempoChange={controller.handleTiempoChange}
            onTipoFinalChange={controller.setTipoFinalId}
            tiempoConfig={controller.tiempoConfig}
            tipoFinal={controller.tipoFinal}
            tipoFinalId={controller.tipoFinalId}
            tiposFinal={controller.tiposFinal}
          />
        )}

        {controller.pantalla === 'jugando' && (
          <PlayingScreen
            escuchando={controller.escuchando}
            escena={controller.escena}
            loading={controller.loading}
            onTerminar={controller.terminarFinal}
            timeLeft={controller.timeLeft}
            tipoFinal={controller.tipoFinal}
          />
        )}

        {controller.pantalla === 'feedback' && (
          <FeedbackScreen
            aprobadoPorDirector={controller.aprobadoPorDirector}
            escena={controller.escena}
            feedbackDirector={controller.feedbackDirector}
            loading={controller.loading}
            loadingTexto={controller.loadingTexto}
            onReiniciar={controller.reiniciarEjercicio}
            onReintentar={controller.reintentarFinal}
            textoUsuario={controller.textoUsuario}
            tipoFinal={controller.tipoFinal}
          />
        )}
      </main>
    </div>
  );
}
