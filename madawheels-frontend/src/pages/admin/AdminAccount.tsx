import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Wallet, Settings, LogOut, ShieldAlert } from "lucide-react";
import AdminHeader from "../../components/AdminHeader";
import Footer from "../../components/Footer";
import { getSession, clearSession } from "../../services/authService";
import "./AdminAccount.css";

const OPTIONS = [
  {
    icon: LayoutDashboard,
    title: "Tableau de bord",
    sub: "Statistiques de l'activité et des clients",
    to: "/admin/tableau-de-bord",
  },
  {
    icon: Wallet,
    title: "Transactions",
    sub: "Historique des paiements clients",
    to: "/admin/transactions",
  },
  {
    icon: Settings,
    title: "Paramètres",
    sub: "Préférences de votre compte administrateur",
    to: "/admin/parametres",
  },
];

export default function AdminAccount() {
  const navigate = useNavigate();
  const session = getSession();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const initials = session ? `${session.firstName?.[0] ?? ""}${session.lastName?.[0] ?? ""}`.toUpperCase() : "A";

  const confirmLogout = () => {
    clearSession();
    navigate("/connexion");
  };

  return (
    <>
      <AdminHeader />
      <main className="mw-container awa-page">
        <div className="awa-head">
          <span className="awa-avatar">{initials}</span>
          <div>
            <div className="awa-name">{session ? `${session.firstName} ${session.lastName}` : "Administrateur"}</div>
            <div className="awa-email">{session?.email}</div>
          </div>
        </div>

        <div className="awa-grid">
          {OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.to}
              className="awa-card"
              onClick={() => navigate(opt.to)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="awa-card-icon"><opt.icon size={20} /></span>
              <div>
                <div className="awa-card-title">{opt.title}</div>
                <div className="awa-card-sub">{opt.sub}</div>
              </div>
            </motion.button>
          ))}

          <motion.button
            className="awa-card danger"
            onClick={() => setConfirmOpen(true)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: OPTIONS.length * 0.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="awa-card-icon"><LogOut size={20} /></span>
            <div>
              <div className="awa-card-title">Déconnexion</div>
              <div className="awa-card-sub">Fermer votre session administrateur</div>
            </div>
          </motion.button>
        </div>
      </main>

      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            className="awa-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmOpen(false)}
          >
            <motion.div
              className="awa-dialog"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="awa-dialog-icon"><ShieldAlert size={24} /></div>
              <h3>Se déconnecter ?</h3>
              <p>Êtes-vous sûr de vouloir vous déconnecter de votre espace administrateur ?</p>
              <div className="awa-dialog-actions">
                <button className="awa-btn-no" onClick={() => setConfirmOpen(false)}>Non</button>
                <button className="awa-btn-yes" onClick={confirmLogout}>Oui</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}