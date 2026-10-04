import { useState } from "react";
import { Info } from "lucide-react";
import AdminHeader from "../../components/AdminHeader";
import Footer from "../../components/Footer";
import { getSession } from "../../services/authService";
import "./AdminSettings.css";

const PREFS_KEY = "mw_admin_prefs";

interface Prefs {
  notifyNewReservation: boolean;
  notifyPayment: boolean;
  soundAlerts: boolean;
}

const defaultPrefs: Prefs = {
  notifyNewReservation: true,
  notifyPayment: true,
  soundAlerts: false,
};

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="aws-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span />
    </label>
  );
}

export default function AdminSettings() {
  const session = getSession();
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

  const update = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  const initials = session ? `${session.firstName?.[0] ?? ""}${session.lastName?.[0] ?? ""}`.toUpperCase() : "A";

  return (
    <>
      <AdminHeader />
      <main className="mw-container aws-page">
        <h1 className="aws-title">Paramètres</h1>
        <p className="aws-subtitle">Préférences de votre compte administrateur.</p>

        <section className="aws-panel">
          <h2>Profil administrateur</h2>
          <p className="aws-panel-sub">Informations du compte connecté.</p>
          <div className="aws-profile">
            <span className="aws-avatar">{initials}</span>
            <div>
              <div className="aws-profile-name">{session ? `${session.firstName} ${session.lastName}` : "Administrateur"}</div>
              <div className="aws-profile-role">Rôle : Administrateur</div>
            </div>
          </div>
          <div className="aws-field-grid">
            <div className="aws-field">
              <label>Email</label>
              <input value={session?.email ?? ""} readOnly />
            </div>
            <div className="aws-field">
              <label>Téléphone</label>
              <input value={session?.phone || "—"} readOnly />
            </div>
          </div>
          <div className="aws-note">
            <Info size={14} />
            <span>La modification du profil administrateur n'est pas encore disponible depuis cette interface.</span>
          </div>
        </section>

        <section className="aws-panel">
          <h2>Notifications</h2>
          <p className="aws-panel-sub">Alertes affichées pendant votre session d'administration.</p>
          <div className="aws-row">
            <div>
              <div className="aws-row-title">Nouvelle réservation</div>
              <div className="aws-row-sub">Être averti quand un client dépose une demande</div>
            </div>
            <Switch checked={prefs.notifyNewReservation} onChange={(v) => update({ notifyNewReservation: v })} />
          </div>
          <div className="aws-row">
            <div>
              <div className="aws-row-title">Paiement reçu</div>
              <div className="aws-row-sub">Être averti quand un client règle sa réservation</div>
            </div>
            <Switch checked={prefs.notifyPayment} onChange={(v) => update({ notifyPayment: v })} />
          </div>
          <div className="aws-row">
            <div>
              <div className="aws-row-title">Alertes sonores</div>
              <div className="aws-row-sub">Jouer un son pour les notifications ci-dessus</div>
            </div>
            <Switch checked={prefs.soundAlerts} onChange={(v) => update({ soundAlerts: v })} />
          </div>
          <div className="aws-note" style={{ marginTop: 12 }}>
            <Info size={14} />
            <span>Ces préférences sont enregistrées sur cet appareil uniquement.</span>
          </div>
        </section>

        <section className="aws-panel">
          <h2>Sécurité</h2>
          <p className="aws-panel-sub">Gestion du mot de passe du compte administrateur.</p>
          <div className="aws-row">
            <div>
              <div className="aws-row-title">Changer le mot de passe</div>
              <div className="aws-row-sub">Fonctionnalité à venir</div>
            </div>
            <button className="aws-btn-disabled" disabled>Modifier</button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}