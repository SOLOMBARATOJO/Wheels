import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList, Car, Users, Wallet, ArrowRight } from "lucide-react";
import AdminHeader from "../../components/AdminHeader";
import Footer from "../../components/Footer";
import { getSession } from "../../services/authService";
import "./AdminWelcome.css";

const QUICK_ACCESS = [
  {
    to: "/admin/reservations",
    icon: ClipboardList,
    title: "Réservations",
    sub: "Valider ou refuser les demandes clients",
  },
  {
    to: "/admin/vehicules",
    icon: Car,
    title: "Flotte",
    sub: "Ajouter, modifier ou masquer un véhicule",
  },
  {
    to: "/admin/clients",
    icon: Users,
    title: "Clients",
    sub: "Consulter les comptes et leur activité",
  },
  {
    to: "/admin/transactions",
    icon: Wallet,
    title: "Transactions",
    sub: "Voir les paiements et devis réglés",
  },
];

/** Voiture animée en CSS/SVG pur : pas de fichier vidéo, léger et sans dépendance externe. */
function AnimatedRoadScene() {
  return (
    <div className="awl-scene" aria-hidden="true">
      <div className="awl-stars" />
      <div className="awl-skyline" />
      <div className="awl-road" />
      <div className="awl-car">
        <div className="awl-car-body">
          <div className="awl-wheel front" />
          <div className="awl-wheel back" />
        </div>
      </div>
    </div>
  );
}

export default function AdminWelcome() {
  const session = getSession();

  return (
    <>
      <AdminHeader />
      <main className="mw-container awl-page">
        <motion.section
          className="awl-hero"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="awl-hero-text">
            <div className="awl-hero-eyebrow">MadaWheels · Espace administrateur</div>
            <h1 className="awl-hero-title">
              Bienvenue{session ? `, ${session.firstName}` : ""} 👋
            </h1>
            <p className="awl-hero-sub">
              Pilotez les réservations, la flotte et les clients de MadaWheels depuis un seul
              endroit. Toute modification est visible immédiatement côté client.
            </p>
          </div>
          <AnimatedRoadScene />
        </motion.section>

        <h2 className="awl-section-title">Accès rapide</h2>
        <div className="awl-quick-grid">
          {QUICK_ACCESS.map((item, i) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
            >
              <Link className="awl-quick-card" to={item.to}>
                <span className="awl-quick-icon"><item.icon size={20} /></span>
                <div>
                  <div className="awl-quick-title">{item.title}</div>
                  <div className="awl-quick-sub">{item.sub}</div>
                </div>
                <span style={{ marginTop: "auto", fontSize: 12, fontWeight: 700, color: "var(--mw-gold, #b98500)" }}>
                  Ouvrir <ArrowRight size={12} style={{ verticalAlign: -1 }} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}