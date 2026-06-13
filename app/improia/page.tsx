'use client';

import styles from '../structure/base.module.css';
import { ConfigScreen } from './components/ConfigScreen';
import { FinalScreen } from './components/FinalScreen';
import { PlayingScreen } from './components/PlayingScreen';
import { useImproChatController } from './hooks/useImproChatController';

export default function ImproChatModularPage() {
  const controller = useImproChatController();

  if (controller.pantalla === 'final') {
    return (
      <FinalScreen
        historialLetra={controller.historialLetra}
        informeFinal={controller.informeFinal}
        onReiniciar={controller.reiniciarTeatroCompleto}
        titulo={controller.titulo}
      />
    );
  }

  return (
    <div className={styles.teatroPageWrapper}>
      <div className={styles.teatroContainer}>
        <header className={styles.teatroHeader}>
          <h1>🎭 ImprovIA 🎬</h1>
          <p className={styles.subtitulo}>
            {controller.pantalla === 'config'
              ? 'Ajusta los tiempos del libreto por actos'
              : `Acto en Curso: ${controller.faseActual.toUpperCase()}`}
          </p>
        </header>

        <main className={styles.escenario}>
          {controller.pantalla === 'config' && (
            <ConfigScreen
              dificultad={controller.dificultad}
              loading={controller.loading}
              onDificultadChange={controller.setDificultad}
              onIniciar={controller.iniciarEjercicio}
              onTiempoChange={controller.handleTiempoChange}
              tiemposConfig={controller.tiemposConfig}
            />
          )}

          {controller.pantalla === 'jugando' && (
            <PlayingScreen
              escuchando={controller.escuchando}
              faseActual={controller.faseActual}
              historialLetra={controller.historialLetra}
              iaHablando={controller.iaHablando}
              loading={controller.loading}
              loadingTexto={controller.loadingTexto}
              onConcluir={controller.finalizarFuncionYMostrarInforme}
              onEnviar={controller.detenerGrabacionYProcesar}
              tiemposConfig={controller.tiemposConfig}
              timeLeft={controller.timeLeft}
              titulo={controller.titulo}
              ultimoFeedbackFijo={controller.ultimoFeedbackFijo}
            />
          )}
        </main>
      </div>
    </div>
  );
}
