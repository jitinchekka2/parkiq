import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth';
import './Home.css';

const OPERATOR_URL = import.meta.env.VITE_OPERATOR_URL || 'http://localhost:5174';
const ATTENDANT_URL = import.meta.env.VITE_ATTENDANT_URL || 'http://localhost:5175';

export default function Home() {
  const { token } = useAuth();

  const cards = useMemo(
    () => [
      {
        title: 'Driver App',
        desc: 'Find nearby spots, see live availability, and book instantly.',
        action: token ? 'Open Live Map' : 'Login as Driver',
        href: token ? '/map' : '/login',
        internal: true,
      },
      {
        title: 'Operator Dashboard',
        desc: 'Manage parking lots, update slots, and track revenue analytics.',
        action: 'Open Operator',
        href: OPERATOR_URL,
        internal: false,
      },
      {
        title: 'Attendant Panel',
        desc: 'Quickly report FREE/OCCUPIED slot status from the ground.',
        action: 'Open Attendant',
        href: ATTENDANT_URL,
        internal: false,
      },
    ],
    [token]
  );

  return (
    <div className="home-root">
      <header className="home-header">
        <div className="home-logo-wrap">
          <div className="home-logo-mark">P/Q</div>
          <div className="home-logo-text">ParkIQ</div>
        </div>
        <div className="home-header-meta">Unified Access Portal</div>
      </header>

      <main className="home-main">
        <section className="home-hero">
          <span className="home-pill">Urban Mobility - India</span>
          <h1>
            Smart Parking for
            <br />
            <span>Chaotic Cities</span>
          </h1>
          <p>
            One entry point for Drivers, Operators, and Attendants. Choose your role and jump into the ParkIQ workflow.
          </p>
        </section>

        <section className="home-cards">
          {cards.map((card) => (
            <article className="home-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              {card.internal ? (
                <Link to={card.href} className="home-btn">
                  {card.action}
                </Link>
              ) : (
                <a href={card.href} className="home-btn" target="_blank" rel="noreferrer">
                  {card.action}
                </a>
              )}
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}