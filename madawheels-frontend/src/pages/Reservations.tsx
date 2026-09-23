import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { findReservations } from "../services/reservationService";
import { getSession } from "../services/authService";
import type { ReservationSummary } from "../types/reservation";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
};

export default function Reservations() {
  const [email, setEmail] = useState(() => getSession()?.email ?? "");
  const [reference, setReference] = useState("");
  const [reservations, setReservations] = useState<ReservationSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!email) {
      setError("Merci de renseigner votre email.");
      return;
    }
    setLoading(true);
    setError("");
    setReservations(null);
    try {
      setReservations(await findReservations(email));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la recherche.");
    } finally {
      setLoading(false);
    }
  };

  let filtered = reservations ?? [];
  if (reference.trim()) {
    const needle = reference.trim().toLowerCase();
    filtered = filtered.filter(
      (r) => r.reference.toLowerCase().includes(needle) || String(r.reservationId) === needle
    );
  }

  return (
    <>
      <Header />

      <main className="mw-container" style={{ padding: "40px 24px 72px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--mw-heading)", marginBottom: 8 }}>
          Mes réservations
        </h1>
        <p style={{ marginBottom: 22 }}>
          Retrouvez vos réservations MadaWheels en renseignant l'email utilisé lors de la location.
        </p>

        <div className="mw-form-card">
          <div className="mw-form-grid">
            <div className="mw-field">
              <label>✉️ Email de réservation *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
              />
            </div>
            <div className="mw-field">
              <label># Référence (facultatif)</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="DEV-2026..."
              />
            </div>
          </div>
          <button className="mw-btn" onClick={handleSearch} disabled={loading} style={{ marginTop: 16 }}>
            {loading ? "Recherche..." : "Rechercher"}
          </button>
        </div>

        {error && <div className="mw-error">{error}</div>}

        {reservations !== null && !loading && filtered.length === 0 && (
          <div className="mw-empty">
            {reference.trim()
              ? "Aucune réservation ne correspond à cette référence."
              : "Aucune réservation trouvée pour cet email."}
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map((r) => (
              <ReservationCard key={r.reservationId} reservation={r} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

function ReservationCard({ reservation: r }: { reservation: ReservationSummary }) {
  const days = Math.max(
    1,
    Math.round((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 86_400_000)
  );
  const status = r.status === "PENDING" ? "pending" : r.status === "CONFIRMED" ? "confirmed" : "cancelled";
  const statusLabel = STATUS_LABELS[r.status] ?? r.status;
  const formattedDate = r.createdAt ? new Date(r.createdAt).toLocaleString("fr-FR") : "";

  return (
    <div className="mw-resv-card">
      <div className="mw-resv-head">
        <div>
          <div className="mw-resv-ref">Référence n°{r.reference}</div>
          <div className="mw-resv-date">{formattedDate}</div>
        </div>
        <span className={`mw-status ${status}`}>{statusLabel}</span>
      </div>

      <div className="mw-resv-body">
        <div className="mw-resv-vehicle">
          {r.vehicleImage ? (
            <img className="mw-resv-img" src={r.vehicleImage} alt={r.vehicleName} />
          ) : (
            <div className="mw-resv-img mw-resv-img-empty">🚗</div>
          )}
          <div>
            <div style={{ fontWeight: 700, color: "var(--mw-heading)", marginBottom: 6 }}>{r.vehicleName}</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              Du {r.startDate} à {r.startTime} au {r.endDate} à {r.endTime} ({days} jour{days > 1 ? "s" : ""})
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>🏁 {r.departure} → {r.returnLocation}</div>
          </div>
        </div>

        <div className="mw-lines" style={{ boxShadow: "none", minWidth: 280 }}>
          <div className="mw-line"><span>Véhicule</span><b>{r.vehiclePrice.toLocaleString()} €</b></div>
          {r.options.length === 0 ? (
            <div className="mw-line"><span>Aucune option</span><span>—</span></div>
          ) : (
            r.options.map((o) => (
              <div key={o.optionId} className="mw-line">
                <span>{o.name}{o.quantity > 1 ? ` ×${o.quantity}` : ""}</span>
                <b>+{o.totalPrice.toLocaleString()} €</b>
              </div>
            ))
          )}
          <div className="mw-line total"><span>Total</span><b>{r.totalPrice.toLocaleString()} €</b></div>
        </div>
      </div>
    </div>
  );
}