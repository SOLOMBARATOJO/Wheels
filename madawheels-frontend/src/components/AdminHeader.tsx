import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList, Car, LayoutDashboard, Users } from "lucide-react";
import Logo from "./Logo";
import AdminAccountMenu from "./AdminAccountMenu";

/**
 * Nav dédiée à l'espace administrateur : accueil admin, réservations, flotte
 * et clients. Le bouton compte ouvre une boîte déroulante (tableau de bord,
 * transactions, paramètres, déconnexion), comme côté client.
 */
export default function AdminHeader() {
  return (
    <header className="mw-header">
      <div className="mw-header-inner">
        <NavLink to="/admin" className="mw-brand">
          <motion.span
            whileHover={{ rotate: -6, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{ display: "inline-flex" }}
          >
            <Logo />
          </motion.span>
          <span className="mw-brand-col">
            <span className="mw-brand-name">MadaWheels</span>
            <span className="mw-brand-badge">Administration</span>
          </span>
        </NavLink>

        <nav className="mw-nav">
          <NavLink to="/admin" end>
            <LayoutDashboard size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
            Accueil
          </NavLink>
          <NavLink to="/admin/reservations">
            <ClipboardList size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
            Réservations
          </NavLink>
          <NavLink to="/admin/vehicules">
            <Car size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
            Flotte
          </NavLink>
          <NavLink to="/admin/clients">
            <Users size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
            Clients
          </NavLink>
        </nav>

        <AdminAccountMenu />
      </div>
    </header>
  );
}