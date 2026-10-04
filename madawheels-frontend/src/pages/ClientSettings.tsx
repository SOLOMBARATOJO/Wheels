import { useState } from "react";
import { Info } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getSession } from "../services/authService";
import "./admin/AdminSettings.css";

const PREFS_KEY = "mw_client_prefs";
interface Prefs { emailUpdates: boolean; smsUpdates: boolean; }
const defaultPrefs: Prefs = { emailUpdates: true, smsUpdates: false };

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : defaultPrefs;
  } catch { return defaultPrefs; }
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="aws-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span />
    </label>
  );
}

export default function ClientSettings() {
  const session = getSession();
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

  const update = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  if (!session) return null;
  const initials = `${session.firstName?.[0] ?? ""}${session.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <>
      <Header />
      <main className="mw-container aws-page">
        <h1 className="aws-title">Paramètres</h1>
        <p className="aws-subtitle">Préférences de votre compte MadaWheels.</p>

        <section className="aws-panel">
          <h2>Profil</h2>
          <div className="aws-profile">
            <span className="aws-avatar">{initials}</span>
            <div>
              <div className="aws-profile-name">{session.firstName} {session.lastName}</div>
              <div className="aws-profile-role">{session.email}</div>
            </div>
          </div>
          <div className="aws-field-grid">
            <div className="aws-field"><label>Email</label><input value={session.email} readOnly /></div>
            <div className="aws-field"><label>Téléphone</label><input value={session.phone || "—"} readOnly /></div>
          </div>
          <div className="aws-note"><Info size={14} /><span>La modification du profil n'est pas encore disponible.</span></div>
        </section>

        <section className="aws-panel">
          <h2>Notifications</h2>
          <div className="aws-row">
            <div><div className="aws-row-title">Mises à jour par email</div><div className="aws-row-sub">Statut de vos devis et réservations</div></div>
            <Switch checked={prefs.emailUpdates} onChange={(v) => update({ emailUpdates: v })} />
          </div>
          <div className="aws-row">
            <div><div className="aws-row-title">Mises à jour par SMS</div><div className="aws-row-sub">Fonctionnalité à venir</div></div>
            <Switch checked={prefs.smsUpdates} onChange={(v) => update({ smsUpdates: v })} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}