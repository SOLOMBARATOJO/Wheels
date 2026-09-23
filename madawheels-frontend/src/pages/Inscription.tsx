import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { register, verifyCode, saveSession } from "../services/authService";

const CODE_LENGTH = 6;

export default function Inscription() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [step, setStep] = useState<"form" | "code" | "done">("form");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm({ ...form, [k]: e.target.value });

  const codeParts = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] ?? "");

  const submit = async () => {
    if (!form.lastName || !form.firstName || !form.email || !form.phone || !form.password) {
      setNotice("Merci de remplir tous les champs.");
      return;
    }
    if (form.password !== form.confirm) {
      setNotice("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setNotice("");
    setBusy(true);
    try {
      const result = await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      if (result.status === "ACTIVE") {
        navigate("/connexion");
        return;
      }
      setCodeSent(result.emailSent);
      setStep("code");
      setNotice(
        result.emailSent
          ? `Un code de vérification à 6 chiffres a été envoyé à ${form.email}.`
          : "Impossible d'envoyer le code par email pour le moment. Veuillez réessayer."
      );
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    if (code.length !== CODE_LENGTH) {
      setNotice("Saisissez les 6 chiffres du code reçu par email.");
      return;
    }
    setNotice("");
    setBusy(true);
    try {
      const result = await verifyCode(form.email, code);
      if (!result.success) {
        setNotice(result.message);
        return;
      }
      saveSession(result.user);
      setStep("done");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Code invalide ou expiré.");
    } finally {
      setBusy(false);
    }
  };

  const onCodeChange = (pos: number, value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(-1);
    if (!sanitized) return;
    const next = code.split("");
    next[pos] = sanitized;
    setCode(next.join(""));
    const focusNext = pos + 1 < CODE_LENGTH ? inputs.current[pos + 1] : null;
    if (focusNext) focusNext.focus();
  };

  const onCodeKey = (pos: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[pos] && pos > 0) {
      inputs.current[pos - 1]?.focus();
    }
  };

  return (
    <>
      <Header />
      <div className="mw-auth-wrap">
        <div className="mw-auth-hero">
          <img src="/hero-sec.jpg" alt="Créer un compte MadaWheels" />
        </div>
        <div className="mw-auth">
          <h1>{step === "code" ? "Vérifiez votre adresse email" : "Inscrivez-vous"}</h1>
          <p className="mw-auth-sub">
            {step === "code"
              ? `Saisissez le code à 6 chiffres envoyé à ${form.email}.`
              : "Créez votre compte pour réserver plus vite et suivre vos devis."}
          </p>
          {notice && <div className="mw-error" style={{ margin: "0 0 14px" }}>{notice}</div>}

          {step === "done" ? (
            <div className="mw-note">
              <span>✓</span>
              <span>
                Votre compte a bien été activé !{" "}
                <Link to="/profil" className="mw-toggle">Accédez à votre espace personnel</Link>.
              </span>
            </div>
          ) : step === "code" ? (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  margin: "18px 0 14px",
                  justifyContent: "center",
                }}
              >
                {codeParts.map((value, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    onChange={(e) => onCodeChange(i, e.target.value)}
                    onKeyDown={(e) => onCodeKey(i, e)}
                    aria-label={`Chiffre ${i + 1} du code`}
                    style={{
                      width: 46,
                      height: 54,
                      textAlign: "center",
                      fontSize: 24,
                      fontWeight: 700,
                      border: "1px solid #d0d5dd",
                      borderRadius: 10,
                      backgroundColor: value ? "#fff" : "#fafafa",
                    }}
                  />
                ))}
              </div>
              {!codeSent && (
                <div className="mw-error" style={{ marginBottom: 12 }}>
                  L'envoi du code par email a échoué. Vérifiez la configuration SMTP puis relancez l'inscription.
                </div>
              )}
              <button className="mw-btn btn-block" onClick={submitCode} disabled={busy}>
                {busy ? "Vérification en cours..." : "Activer mon compte"}
              </button>
              <p className="mw-auth-sub" style={{ marginTop: 18 }}>
                Vous n'avez pas reçu le code ?{" "}
                <span className="mw-toggle" style={{ cursor: "pointer" }} onClick={submit}>Renvoyer le code</span>.
              </p>
            </>
          ) : (
            <>
              <div className="mw-form-grid" style={{ marginBottom: 14 }}>
                <div className="mw-field">
                  <label>Nom</label>
                  <input value={form.lastName} onChange={set("lastName")} placeholder="Votre nom" />
                </div>
                <div className="mw-field">
                  <label>Prénom</label>
                  <input value={form.firstName} onChange={set("firstName")} placeholder="Votre prénom" />
                </div>
                <div className="mw-field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={set("email")} placeholder="votre.email@exemple.com" />
                </div>
                <div className="mw-field">
                  <label>Téléphone</label>
                  <input value={form.phone} onChange={set("phone")} placeholder="+261 33 00 000 00" />
                </div>
                <div className="mw-field">
                  <label>Mot de passe</label>
                  <input type="password" value={form.password} onChange={set("password")} placeholder="Votre mot de passe" />
                </div>
                <div className="mw-field">
                  <label>Confirmer</label>
                  <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="Confirmez le mot de passe" />
                </div>
              </div>
              <button className="mw-btn btn-block" onClick={submit} disabled={busy}>
                {busy ? "Envoi en cours..." : "Enregistrer"}
              </button>
              <p className="mw-auth-sub" style={{ marginTop: 18 }}>
                Vous avez déjà un compte ?{" "}
                <Link to="/connexion" className="mw-toggle">Connectez-vous !</Link>
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}