import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { MapPin, Calendar, Car, UserRound, Wallet, FileText, Check, X } from "lucide-react";
import AdminHeader from "../../components/AdminHeader";
import Footer from "../../components/Footer";
import { listReservationsForAdmin, validateReservation, refuseReservation } from "../../services/adminService";
import type { AdminReservation } from "../../types/admin";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  VALIDEE: "Validée (paiement attendu)",
  REFUSEE: "Refusée",
  TERMINEE: "Terminée",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "pending",
  VALIDEE: "pending",
  TERMINEE: "confirmed",
  REFUSEE: "cancelled",
};

function ReservationCardSkeleton() {
  return (
    <div className="mw-resv-card">
      <div className="mw-resv-head">
        <div>
          <Skeleton width={160} height={16} />
          <Skeleton width={100} height={12} style={{ marginTop: 6 }} />
        </div>
        <Skeleton width={90} height={22} />
      </div>
      <div className="mw-resv-body">
        <Skeleton width="100%" height={70} />
      </div>
    </div>
  );
}

export default function AdminReservations() {
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async (status: string) => {
    setLoading(true);
    try {
      setReservations(await listReservationsForAdmin(status || undefined));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleValidate = async (id: number) => {
    setBusyId(id);
    try {
      const res = await validateReservation(id);
      if (!res.emailSent) {
        toast.error("Réservation validée, mais l'email n'a pas pu être envoyé au client. Vérifiez les logs SMTP.");
      } else {
        toast.success("Réservation validée et email envoyé au client.");
      }
      await load(statusFilter);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la validation.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRefuse = async (id: number) => {
    const reason = window.prompt("Motif du refus (optionnel) :") ?? "";
    setBusyId(id);
    try {
      await refuseReservation(id, reason);
      toast.success("Réservation refusée.");
      await load(statusFilter);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du refus.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <AdminHeader />
      <main className="mw-container" style={{ padding: "40px 24px 72px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--mw-heading)", marginBottom: 16 }}>
          Administration · Réservations
        </h1>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {["PENDING", "VALIDEE", "TERMINEE", "REFUSEE", ""].map((s) => (
            <button
              key={s || "ALL"}
              className={`mw-chip ${statusFilter === s ? "active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s ? STATUS_LABELS[s] : "Tous"}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Array.from({ length: 3 }).map((_, i) => <ReservationCardSkeleton key={i} />)}
          </div>
        ) : reservations.length === 0 ? (
          <div className="mw-empty">Aucune réservation à ce statut.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <AnimatePresence>
              {reservations.map((r) => (
                <motion.div
                  key={r.reservationId}
                  className="mw-resv-card"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mw-resv-head">
                    <div>
                      <div className="mw-resv-ref">Référence n°{r.reference}</div>
                      <div className="mw-resv-date">{r.createdAt ? new Date(r.createdAt).toLocaleString("fr-FR") : ""}</div>
                    </div>
                    <span className={`mw-status ${STATUS_CLASS[r.status] ?? "pending"}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>
                  <div className="mw-resv-body">
                    <div style={{ fontSize: 13, lineHeight: 1.9 }}>
                      <div><MapPin size={13} style={{ verticalAlign: -2, marginRight: 6 }} />{r.departure} → {r.returnLocation}</div>
                      <div><Calendar size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Du {r.startDate} au {r.endDate}</div>
                      <div><Car size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Véhicule ID : {r.vehicleId} · <UserRound size={13} style={{ verticalAlign: -2, marginRight: 4, marginLeft: 4 }} />Client ID : {r.userId}</div>
                      <div><Wallet size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Total : <b>{r.totalPrice.toLocaleString()} €</b></div>
                      {r.adminNote && (
                        <div><FileText size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Note : {r.adminNote}</div>
                      )}
                    </div>
                    {r.status === "PENDING" && (
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <motion.button
                          className="mw-btn"
                          disabled={busyId === r.reservationId}
                          onClick={() => handleValidate(r.reservationId)}
                          whileTap={{ scale: 0.96 }}
                        >
                          <Check size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
                          Accepter
                        </motion.button>
                        <motion.button
                          className="mw-btn-ghost"
                          disabled={busyId === r.reservationId}
                          onClick={() => handleRefuse(r.reservationId)}
                          whileTap={{ scale: 0.96 }}
                        >
                          <X size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
                          Refuser
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}