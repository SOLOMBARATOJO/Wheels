import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, ClipboardList, Wallet, FileText, Settings, LogOut,
} from "lucide-react";
import { getSession, clearSession } from "../services/authService";
import LogoutDialog from "./LogoutDialog";

const ITEMS = [
  { to: "/profil", icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/mes-reservations", icon: ClipboardList, label: "Mes réservations" },
  { to: "/mes-transactions", icon: Wallet, label: "Transactions" },
  { to: "/mes-devis", icon: FileText, label: "Mes devis" },
  { to: "/parametres", icon: Settings, label: "Paramètres" },
];

export default function ClientAccountMenu() {
  const session = getSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!session) return null;

  const initials = `${session.firstName?.[0] ?? ""}${session.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  const askLogout = () => {
    setOpen(false);
    setConfirmOpen(true);
  };

  const confirmLogout = () => {
    clearSession();
    setConfirmOpen(false);
    navigate("/");
  };

  return (
    <div className="mw-account" ref={ref}>
      <button className="mw-account-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="mw-account-avatar">{initials}</span>
        <span className="mw-account-name">{session.firstName}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mw-account-menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <div className="mw-account-head">
              <span className="mw-account-avatar big">{initials}</span>
              <div>
                <div className="mw-account-fullname">{session.firstName} {session.lastName}</div>
                <div className="mw-account-email">{session.email}</div>
              </div>
            </div>

            <div className="mw-account-items">
              {ITEMS.map((item) => (
                <Link key={item.to} to={item.to} className="mw-account-item" onClick={() => setOpen(false)}>
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </div>

            <button className="mw-account-item danger" onClick={askLogout}>
              <LogOut size={16} />
              Déconnexion
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <LogoutDialog
        open={confirmOpen}
        message="Êtes-vous sûr de vouloir vous déconnecter de votre espace ?"
        onConfirm={confirmLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}