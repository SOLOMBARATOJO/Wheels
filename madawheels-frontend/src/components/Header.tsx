import { NavLink, Link } from "react-router-dom";
import { getSession } from "../services/authService";
import ClientAccountMenu from "./ClientAccountMenu";
import carImg from "../assets/car-2.png";

const GOLD = "#F5B301";
const INK = "#111214";
const SIZE = 44;

/** Logo client : vraie voiture (car-2.png) dans une tuile jaune + carte de Madagascar. */
function ClientLogo() {
  return (
    <span
      role="img"
      aria-label="MadaWheels"
      style={{ display: "inline-flex", alignItems: "center", gap: SIZE * 0.2, flexShrink: 0 }}
    >
      <span
        style={{
          position: "relative",
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE * 0.27,
          background: GOLD,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <img
          src={carImg}
          alt=""
          draggable={false}
          style={{
            width: "86%",
            height: "60%",
            objectFit: "contain",
            marginTop: SIZE * 0.04,
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.35))",
          }}
        />
        {/* Route en pointillés */}
        <span
          style={{
            position: "absolute",
            left: "14%",
            width: "72%",
            bottom: SIZE * 0.13,
            borderTop: `2px dashed ${INK}`,
            opacity: 0.55,
          }}
        />
        {/* Épingle */}
        <svg
          width={SIZE * 0.32}
          height={SIZE * 0.4}
          viewBox="0 0 24 30"
          aria-hidden="true"
          style={{ position: "absolute", top: -SIZE * 0.12, right: -SIZE * 0.1 }}
        >
          <path
            d="M12 1C6.5 1 2.5 5 2.5 10.2C2.5 17 12 28 12 28s9.5-11 9.5-17.8C21.5 5 17.5 1 12 1z"
            fill={INK}
            stroke={GOLD}
            strokeWidth="2"
          />
          <circle cx="12" cy="10.2" r="3.6" fill={GOLD} />
        </svg>
      </span>

      {/* Carte de Madagascar */}
      <svg height={SIZE * 0.95} viewBox="0 0 90 168" aria-hidden="true" style={{ flexShrink: 0, display: "block" }}>
        <polygon
          fill={GOLD}
          stroke={GOLD}
          strokeWidth="3"
          strokeLinejoin="round"
          points="70.1,1.2 75.7,12 78,20.4 80.2,28.8 82.5,39.6 77.4,45.6 74.6,56.4 72.4,66 71.2,75 70.1,82.8 65.5,96 59.3,111.6 54.2,126 50.8,136.8 45.2,145.2 44.1,157.2 31.7,163.2 23.2,164.4 12.5,158.4 6.4,137.4 3.1,118.2 13.6,100.8 10.5,74 15.8,58.2 36.2,45.6 52.6,32.8 57.7,18 65.5,16.8 70.1,4.8"
        />
        <path
          d="M49.7 70c-6 0-10.5 4.5-10.5 10c0 7 10.5 16 10.5 16s10.5-9 10.5-16c0-5.5-4.5-10-10.5-10z"
          fill={INK}
        />
        <circle cx="49.7" cy="80" r="3.8" fill={GOLD} />
      </svg>
    </span>
  );
}

export default function Header() {
  const session = getSession();
  const isAdmin = session?.role === "ADMIN";

  return (
    <header className="mw-header">
      <div className="mw-header-inner">
        <NavLink to="/" className="mw-brand" aria-label="MadaWheels, retour à l'accueil">
          <ClientLogo />
          <span className="mw-brand-col">
            <span className="mw-brand-name">MadaWheels</span>
            <span className="mw-brand-badge">Madagascar</span>
          </span>
        </NavLink>

        <nav className="mw-nav">
          <NavLink to="/" end>Accueil</NavLink>
          <NavLink to="/vehicules">Nos véhicules</NavLink>
          <NavLink to="/reserver">Réserver</NavLink>
          <a href="/#faq">FAQ</a>
          <a href="/#contact">Contact</a>
        </nav>

        {isAdmin ? (
          <Link to="/admin" className="mw-login">
            <span className="mw-login-icon">🛠️</span>
            <span>Espace admin</span>
          </Link>
        ) : session ? (
          <ClientAccountMenu />
        ) : (
          <Link to="/connexion" className="mw-login">
            <span className="mw-login-icon">👤</span>
            <span>Se connecter / S'inscrire</span>
          </Link>
        )}
      </div>
    </header>
  );
}