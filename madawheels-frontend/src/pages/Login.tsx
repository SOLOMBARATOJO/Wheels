import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { login, saveSession } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      setNotice("Merci de renseigner votre email et votre mot de passe.");
      return;
    }
    setNotice("");
    setBusy(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setNotice(result.message);
        return;
      }
      saveSession(result.user);
      navigate("/profil");
    } catch (err) {
      setNotice(
        err instanceof Error
          ? err.message
          : "Connexion impossible pour le moment, veuillez réessayer."
      );
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
        <div className="mw-auth">
          <h1>Accédez à votre espace personnel</h1>
          <p className="mw-auth-sub">Gérez vos réservations et vos devis MadaWheels en toute simplicité.</p>
          {notice && <div className="mw-error" style={{ margin: "0 0 14px" }}>{notice}</div>}
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
                style={{ position: "absolute", right: 12, top: 10, cursor: "pointer" }}
              >
                <img src="/icons/oeil.png" alt="Afficher le mot de passe" style={{ width: 18 }} />
              </span>
            </div>
          </div>
          <div className="mw-auth-row">
            <Link to="/connexion" className="mw-toggle">Mot de passe oublié ?</Link>
          </div>
          <button className="mw-btn btn-block" onClick={submit} disabled={busy}>
            {busy ? "Connexion..." : "Se connecter"}
          </button>
          <p className="mw-auth-sub" style={{ marginTop: 18 }}>
            Vous n'avez pas encore de compte ?{" "}
            <Link to="/inscription" className="mw-toggle">Inscrivez-vous !</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}