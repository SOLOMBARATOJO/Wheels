import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { login, saveSession } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      toast.error("Merci de renseigner votre email et votre mot de passe.");
      return;
    }
    setBusy(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      saveSession(result.user);
      toast.success(`Bienvenue, ${result.user.firstName} !`);
      navigate(result.user.role === "ADMIN" ? "/admin" : "/profil");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connexion impossible pour le moment, veuillez réessayer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header />
      <div className="mw-auth-wrap">
        <div className="mw-auth-hero">
          <img src="/hero-sec.jpg" alt="Espace client MadaWheels" />
        </div>
        <motion.div
          className="mw-auth"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1>Accédez à votre espace personnel</h1>
          <p className="mw-auth-sub">Gérez vos réservations et vos devis MadaWheels en toute simplicité.</p>
          <div className="mw-field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre.email@exemple.com" />
          </div>
          <div className="mw-field">
            <label>Mot de passe</label>
            <div style={{ position: "relative" }}>
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                style={{ paddingRight: 44 }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <span
                onClick={() => setShow(!show)}
                style={{ position: "absolute", right: 12, top: 10, cursor: "pointer", color: "var(--mw-muted)" }}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>
          <div className="mw-auth-row">
            <Link to="/connexion" className="mw-toggle">Mot de passe oublié ?</Link>
          </div>
          <motion.button className="mw-btn btn-block" onClick={submit} disabled={busy} whileTap={{ scale: 0.97 }}>
            {busy ? "Connexion..." : "Se connecter"}
          </motion.button>
          <p className="mw-auth-sub" style={{ marginTop: 18 }}>
            Vous n'avez pas encore de compte ?{" "}
            <Link to="/inscription" className="mw-toggle">Inscrivez-vous !</Link>
          </p>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}