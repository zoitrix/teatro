'use client';

import styles from '../impro-base/base.module.css';
import { ConfigScreen } from './components/ConfigScreen';
import { FeedbackScreen } from './components/FeedbackScreen';
import { FinalScreen } from './components/FinalScreen';
import { PlayingScreen } from './components/PlayingScreen';
import { useImproBaseController } from './hooks/useImproBaseController';

export default function ImproBaseModularPage() {
  const controller = useImproBaseController();

  if (controller.pantalla === 'final') {
    return <FinalScreen obra={controller.obra} onReiniciar={controller.reiniciarTeatroCompleto} />;
  }

  return (
    <div className={styles.teatroContainer}>
      <header className={styles.teatroHeader}>
        <h1>🎭 ¡Impro 60! 🎬</h1>
        <p className={styles.subtitulo}>
          {controller.pantalla === 'config'
            ? '¡Saca un título y construye tu historia!'
            : `Fase Actual: Acto de ${controller.faseActual.toUpperCase()}`}
        </p>
      </header>

      <main className={styles.escenario}>
        {controller.pantalla !== 'config' && controller.titulo && (
          <div className={styles.carteleraTitulo}>
            <h2>{controller.titulo}</h2>
          </div>
        )}

        {controller.pantalla === 'config' && (
          <ConfigScreen
            dificultad={controller.dificultad}
            explicacionInicial={controller.getExplicacionInicial()}
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
            loading={controller.loading}
            obra={controller.obra}
            onTerminarActo={controller.clickBotonTerminarManual}
            tiemposConfig={controller.tiemposConfig}
            timeLeft={controller.timeLeft}
          />
        )}

        {controller.pantalla === 'feedback' && (
          <FeedbackScreen
            aprobadoPorDirector={controller.aprobadoPorDirector}
            faseActual={controller.faseActual}
            feedbackDirector={controller.feedbackDirector}
            loading={controller.loading}
            loadingTexto={controller.loadingTexto}
            onAvanzar={controller.avanzarSiguienteFase}
            onReiniciar={controller.reiniciarTeatroCompleto}
            onReintentar={controller.reintentarActoActual}
            textoUsuario={controller.textoUsuario}
          />
        )}
      </main>
    </div>
  );
}

