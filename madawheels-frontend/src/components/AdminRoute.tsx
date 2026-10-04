import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { getSession } from "../services/authService";
import Header from "./Header";
import Footer from "./Footer";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const session = getSession();

  if (!session || session.role !== "ADMIN") {
    return (
      <>
        <Header />
        <motion.div
          className="mw-container"
          style={{ padding: "80px 24px", textAlign: "center" }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--mw-soft)",
              color: "var(--mw-danger)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
            }}
          >
            <ShieldAlert size={30} />
          </motion.div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--mw-heading)", marginBottom: 12 }}>
            Accès réservé à l'administration
          </h1>
          <p style={{ marginBottom: 22 }}>
            Cette page nécessite un compte administrateur.
          </p>
          <Link to="/connexion" className="mw-btn">Se connecter</Link>
        </motion.div>
        <Footer />
      </>
    );
  }

  return <>{children}</>;
}