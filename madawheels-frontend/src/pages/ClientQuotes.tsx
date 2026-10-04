import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { findReservations } from "../services/reservationService";
import { getSession } from "../services/authService";
import { ReservationCard } from "./Reservations";
import type { ReservationSummary } from "../types/reservation";

export default function ClientQuotes() {
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

  if (!session) return null;

  const quotes = reservations.filter((r) => r.status === "PENDING" || r.status === "VALIDEE");

  return (
    <>
      <Header />
      <main className="mw-container" style={{ padding: "40px 24px 72px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--mw-heading)", marginBottom: 8 }}>Mes devis</h1>
        <p style={{ marginBottom: 22 }}>Vos demandes en attente de validation ou en attente de paiement.</p>

        {loading ? (
          <Skeleton height={140} count={2} style={{ marginBottom: 16, borderRadius: 14 }} />
        ) : quotes.length === 0 ? (
          <div className="mw-empty">Aucun devis en cours pour le moment.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {quotes.map((r) => <ReservationCard key={r.reservationId} reservation={r} />)}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}