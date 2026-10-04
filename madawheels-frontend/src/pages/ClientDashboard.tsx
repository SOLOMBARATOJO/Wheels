import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  ClipboardList, Wallet, FileText, Settings, ArrowRight, Clock, CheckCircle2, CreditCard,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { findReservations } from "../services/reservationService";
import { getSession } from "../services/authService";
import type { ReservationSummary } from "../types/reservation";
import "./ClientDashboard.css";

const QUICK_ACCESS = [
  { to: "/mes-reservations", icon: ClipboardList, title: "Mes réservations", sub: "Suivre toutes vos demandes" },
  { to: "/mes-devis", icon: FileText, title: "Mes devis", sub: "Demandes en attente ou validées" },
  { to: "/mes-transactions", icon: Wallet, title: "Transactions", sub: "Historique de vos paiements" },
  { to: "/parametres", icon: Settings, title: "Paramètres", sub: "Préférences de votre compte" },
];

export default function ClientDashboard() {
  const session = getSession();
  const [reservations, setReservations] = useState<ReservationSummary[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let active = true;
    findReservations(session.email)
      .then((r) => { if (active) setReservations(r); })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erreur lors du chargement."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.email]);

  if (!session) {
    return (
      <>
        <Header />
        <div className="mw-container" style={{ padding: "80px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--mw-heading)", marginBottom: 12 }}>
            Connectez-vous pour accéder à votre espace
          </h1>
          <p style={{ marginBottom: 22 }}>Votre espace personnel est réservé aux comptes connectés.</p>
          <Link to="/connexion" className="mw-btn">Se connecter</Link>
        </div>
        <Footer />
      </>
    );
  }

  const list = reservations ?? [];
  const pending = list.filter((r) => r.status === "PENDING").length;
  const validated = list.filter((r) => r.status === "VALIDEE").length;
  const completed = list.filter((r) => r.status === "TERMINEE").length;
  const totalSpent = list.filter((r) => r.status === "TERMINEE").reduce((sum, r) => sum + r.totalPrice, 0);

  return (
    <>
      <Header />
      <main className="mw-container mwc-page">
        <h1 className="mwc-title">Tableau de bord</h1>
        <p className="mwc-subtitle">Bienvenue {session.firstName}, voici un aperçu de votre activité MadaWheels.</p>

        {loading ? (
          <div className="mwc-stats">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={84} borderRadius={14} />)}
          </div>
        ) : (
          <div className="mwc-stats">
            <div className="mwc-stat warn">
              <div className="mwc-stat-icon"><Clock size={20} /></div>
              <div>
                <div className="mwc-stat-value">{pending}</div>
                <div className="mwc-stat-label">En attente de validation</div>
              </div>
            </div>
            <div className="mwc-stat info">
              <div className="mwc-stat-icon"><FileText size={20} /></div>
              <div>
                <div className="mwc-stat-value">{validated}</div>
                <div className="mwc-stat-label">Devis validés · à payer</div>
              </div>
            </div>
            <div className="mwc-stat ok">
              <div className="mwc-stat-icon"><CheckCircle2 size={20} /></div>
              <div>
                <div className="mwc-stat-value">{completed}</div>
                <div className="mwc-stat-label">Réservations terminées</div>
              </div>
            </div>
            <div className="mwc-stat brand">
              <div className="mwc-stat-icon"><CreditCard size={20} /></div>
              <div>
                <div className="mwc-stat-value">{totalSpent.toLocaleString()} €</div>
                <div className="mwc-stat-label">Total payé</div>
              </div>
            </div>
          </div>
        )}

        <h2 className="mwc-section-title">Accès rapide</h2>
        <div className="mwc-grid">
          {QUICK_ACCESS.map((item, i) => (
            <motion.div key={item.to} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.05 }}>
              <Link to={item.to} className="mwc-card">
                <span className="mwc-card-icon"><item.icon size={20} /></span>
                <div>
                  <div className="mwc-card-title">{item.title}</div>
                  <div className="mwc-card-sub">{item.sub}</div>
                </div>
                <span className="mwc-card-arrow">Ouvrir <ArrowRight size={12} /></span>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}