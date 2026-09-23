import { NavLink, Link } from "react-router-dom";
import { getSession } from "../services/authService";

export default function Header() {
  const session = getSession();

  return (
    <header className="mw-header">
      <div className="mw-header-inner">
        <NavLink to="/" className="mw-brand">
          <span className="mw-logo">🚗</span>
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

        {session ? (
          <Link to="/profil" className="mw-login">
            <span className="mw-login-icon">👤</span>
            <span>{session.firstName} {session.lastName} / Mon compte</span>
          </Link>
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