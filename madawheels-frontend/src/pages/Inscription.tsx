import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";
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
  const [busy, setBusy] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm({ ...form, [k]: e.target.value });

  const codeParts = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] ?? "");

  const submit = async () => {
    if (!form.lastName || !form.firstName || !form.email || !form.phone || !form.password) {
      toast.error("Merci de remplir tous les champs.");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }
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
        toast.success("Compte créé, vous pouvez vous connecter.");
        navigate("/connexion");
        return;
      }
      setCodeSent(result.emailSent);
      setStep("code");
      if (result.emailSent) {
        toast.success(`Un code de vérification a été envoyé à ${form.email}.`);
      } else {
        toast.error("Impossible d'envoyer le code par email pour le moment. Veuillez réessayer.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    if (code.length !== CODE_LENGTH) {
      toast.error("Saisissez les 6 chiffres du code reçu par email.");
      return;
    }
    setBusy(true);
    try {
      const result = await verifyCode(form.email, code);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      saveSession(result.user);
      setStep("done");
      toast.success("Compte activé !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Code invalide ou expiré.");
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

          <AnimatePresence mode="wait">
            {step === "done" ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mw-note"
              >
                <CheckCircle2 size={18} color="var(--mw-green)" />
                <span>
                  Votre compte a bien été activé !{" "}
                  <Link to="/profil" className="mw-toggle">Accédez à votre espace personnel</Link>.
                </span>
              </motion.div>
            ) : step === "code" ? (
              <motion.div key="code" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <div style={{ display: "flex", gap: 8, margin: "18px 0 14px", justifyContent: "center" }}>
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
                  <div className="mw-note" style={{ marginBottom: 12 }}>
                    <span>L'envoi du code par email a échoué. Vérifiez la configuration SMTP puis relancez l'inscription.</span>
                  </div>
                )}
                <motion.button className="mw-btn btn-block" onClick={submitCode} disabled={busy} whileTap={{ scale: 0.97 }}>
                  {busy ? "Vérification en cours..." : "Activer mon compte"}
                </motion.button>
                <p className="mw-auth-sub" style={{ marginTop: 18 }}>
                  Vous n'avez pas reçu le code ?{" "}
                  <span className="mw-toggle" style={{ cursor: "pointer" }} onClick={submit}>Renvoyer le code</span>.
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
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
                <motion.button className="mw-btn btn-block" onClick={submit} disabled={busy} whileTap={{ scale: 0.97 }}>
                  {busy ? "Envoi en cours..." : "Enregistrer"}
                </motion.button>
                <p className="mw-auth-sub" style={{ marginTop: 18 }}>
                  Vous avez déjà un compte ?{" "}
                  <Link to="/connexion" className="mw-toggle">Connectez-vous !</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </>
  );
}