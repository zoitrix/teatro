import Link from 'next/link';
import styles from './home.module.css';

const menuItems = [
  {
    title: 'Arco Dramático',
    description:
      'Entrena la construccion de una historia por actos: inicio, giros y desenlace.',
    href: '/structure',
    action: 'Practica arco',
  },
  {
    title: 'Inicios',
    description:
      'Practica como arrancar una escena desde un titulo usando estrategias concretas de apertura.',
    href: '/start',
    action: 'Practica inicios',
  },
  {
    title: 'Finales',
    description:
      'Entrena los diferentes finales desde una escena ya planteada.',
    href: '/end',
    action: 'Practica finales',
  },
  {
    title: 'ImprovIA',
    description:
      '¡El gran reto! Comparte escena con un co-actor vIArtual y desarrolla tu propia historia.',
    href: '/improia',
    action: 'Improvisa ahora',
  },
];

export default function HomePage() {
  return (
    <main className={styles.teatroContainer}>
      <header className={styles.teatroHeader}>
        <h1>Impro Trainer</h1>
        <p className={styles.subtitulo}>Elige tu escenario de entrenamiento (v0.11)</p>
      </header>

      <section className={styles.escenario} aria-label="Menu principal">
        {menuItems.map((item) => (
          <Link key={item.href} className={styles.menuCard} href={item.href}>
            <span className={styles.cardContent}>
              <span className={styles.cardTitle}>{item.title}</span>
              <span className={styles.cardDescription}>{item.description}</span>
            </span>
            <span className={styles.cardAction}>{item.action}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
