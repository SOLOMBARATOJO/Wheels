import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Car, CreditCard, FileText, Settings, LogOut } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getSession, clearSession } from "../services/authService";

const MENU = [
  { id: "tableau", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "reservation", label: "Mes reservation", icon: Car },
  { id: "transaction", label: "Transaction", icon: CreditCard },
  { id: "devis", label: "Mes devis", icon: FileText },
  { id: "parametre", label: "Paramètre", icon: Settings },
  { id: "deconnexion", label: "Déconnexion", icon: LogOut },
];

export default function Profil() {
  const navigate = useNavigate();
  const session = getSession();

  const [active, setActive] = useState("tableau");

  if (!session) {
    return (
      <>
        <Header />
        <div className="mw-container" style={{ padding: "80px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--mw-heading)", marginBottom: 12 }}>
            Connectez-vous pour accéder à votre espace
          </h1>
          <p style={{ marginBottom: 22 }}>
            Votre espace personnel est réservé aux comptes connectés.
          </p>
          <Link to="/connexion" className="mw-btn">Se connecter</Link>
        </div>
        <Footer />
      </>
    );
  }

  const firstName = session.firstName || "";
  const initials = ((firstName[0] ?? "") + (session.lastName[0] ?? "")).toUpperCase();

  const handleMenu = (id: string) => {
    if (id === "deconnexion") {
      clearSession();
      navigate("/");
      return;
    }
    if (id === "reservation") {
      navigate("/mes-reservations");
      return;
    }
    setActive(id);
  };

  return (
    <>
      <Header />
      <div className="mw-profile-layout">
        <aside className="mw-profile-side">
          <div className="mw-prof-head">
            <span className="mw-avatar">{initials}</span>
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>{firstName} {session.lastName}</div>
              <div style={{ color: "#b6b6b6", fontSize: 12 }}>{session.email}</div>
            </div>
          </div>
          <nav className="mw-prof-menu">
            {MENU.map((m) => (
              <motion.button
                key={m.id}
                className={`mw-prof-item ${active === m.id && m.id !== "deconnexion" ? "active" : ""}`}
                onClick={() => handleMenu(m.id)}
                whileHover={{ x: 3 }}
              >
                <m.icon size={16} /> {m.label}
              </motion.button>
            ))}
          </nav>
        </aside>
        <motion.div
          className="mw-prof-main"
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--mw-heading)", marginBottom: 16 }}>
            {MENU.find((m) => m.id === active)?.label}
          </h1>
          <div className="mw-form-card">
            <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
              Bienvenue dans votre espace personnel, {firstName || session.lastName}. Retrouvez ici
              l'ensemble de vos réservations, transactions et devis MadaWheels.
            </p>
            <Link to="/mes-reservations" className="mw-btn">
              Voir mes réservations →
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}