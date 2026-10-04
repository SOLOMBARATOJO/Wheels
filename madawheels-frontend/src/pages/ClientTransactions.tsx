import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { CreditCard, MapPin } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { findReservations } from "../services/reservationService";
import { getSession } from "../services/authService";
import type { ReservationSummary } from "../types/reservation";
import "./ClientTransactions.css";

export default function ClientTransactions() {
  const session = getSession();
  const [reservations, setReservations] = useState<ReservationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let active = true;
    findReservations(session.email)
      .then((r) => { if (active) setReservations(r); })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erreur lors du chargement."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.email]);

  const paid = useMemo(() => reservations.filter((r) => r.status === "TERMINEE"), [reservations]);
  const total = paid.reduce((sum, r) => sum + r.totalPrice, 0);

  if (!session) return null;

  return (
    <>
      <Header />
      <main className="mw-container mwct-page">
        <h1 className="mwct-title">Mes transactions</h1>
        <p className="mwct-subtitle">Historique de vos réservations réglées par carte bancaire.</p>

        <div className="mwct-summary">
          <span>{paid.length} transaction{paid.length > 1 ? "s" : ""}</span>
          <span className="mwct-total">Total payé : {total.toLocaleString()} €</span>
        </div>

        {loading ? (
          <Skeleton height={100} count={2} style={{ marginBottom: 12, borderRadius: 14 }} />
        ) : paid.length === 0 ? (
          <div className="mw-empty">Aucune transaction réglée pour le moment.</div>
        ) : (
          <div className="mwct-list">
            {paid.map((t) => (
              <article className="mwct-card" key={t.reservationId}>
                <div>
                  <div className="mwct-ref">Réf. {t.reference}</div>
                  <div className="mwct-date">{t.paidAt ? new Date(t.paidAt).toLocaleString("fr-FR") : ""}</div>
                  <div className="mwct-vehicle">{t.vehicleName}</div>
                  <div className="mwct-route"><MapPin size={12} /> {t.departure} → {t.returnLocation}</div>
                </div>
                <div className="mwct-pay">
                  <div className="mwct-pay-total">{t.totalPrice.toLocaleString()} €</div>
                  <div className="mwct-pay-method"><CreditCard size={13} /> {t.paymentMethod || "Carte bancaire"}</div>
                  {t.cardLast4 && <div className="mwct-pay-card">•••• {t.cardLast4}</div>}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

