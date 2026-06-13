import Link from 'next/link';
import styles from './home.module.css';

const menuItems = [
  {
    title: 'Practicar estructuras',
    description:
      'Entrena la construccion de una escena por actos: inicio, giros y desenlace, con feedback del director.',
    href: '/structure',
    action: 'Entrena estructuras',
  },
  {
    title: 'Inicios',
    description:
      'Practica como arrancar una escena desde un titulo usando estrategias concretas de apertura.',
    href: '/start',
    action: 'Practica inicios',
  },
  {
    title: 'Improvisar con la IA',
    description:
      'Comparte escena con un co-actor virtual y practica reaccion, escucha y continuidad dramatica en voz alta.',
    href: '/improia',
    action: 'Improvisa ahora',
  },
];

export default function HomePage() {
  return (
    <main className={styles.teatroContainer}>
      <header className={styles.teatroHeader}>
        <h1>Impro Match</h1>
        <p className={styles.subtitulo}>Elige tu escenario de entrenamiento</p>
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
