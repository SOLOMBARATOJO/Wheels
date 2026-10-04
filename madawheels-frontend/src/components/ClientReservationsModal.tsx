import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { X, MapPin, Calendar, Car, Wallet } from "lucide-react";
import { listReservationsForAdmin } from "../services/adminService";
import type { AdminReservation } from "../types/admin";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  VALIDEE: "Validée (paiement attendu)",
  TERMINEE: "Terminée",
  REFUSEE: "Refusée",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "VALIDEE", label: "Validée" },
  { value: "TERMINEE", label: "Terminée" },
  { value: "REFUSEE", label: "Refusée" },
];

const statusClass = (s: string) =>
  s === "TERMINEE" ? "confirmed" : s === "PENDING" || s === "VALIDEE" ? "pending" : "cancelled";

export default function ClientReservationsModal({
  userId,
  clientName,
  onClose,
}: {
  userId: number;
  clientName: string;
  onClose: () => void;
}) {
  const [all, setAll] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let active = true;
    listReservationsForAdmin()
      .then((list) => { if (active) setAll(list.filter((r) => r.userId === userId)); })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erreur lors du chargement."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const shown = filter ? all.filter((r) => r.status === filter) : all;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000,
        display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 16, overflowY: "auto",
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{ width: "100%", maxWidth: 760, margin: "40px auto", background: "#fff", borderRadius: 14, overflow: "hidden" }}
      >
        <div style={{ background: "#111214", color: "#fff", padding: "18px 24px", display: "flex", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Réservations de {clientName}</div>
            <div style={{ fontSize: 12, color: "#F5B301" }}>
              {loading ? "Chargement…" : `${all.length} réservation${all.length > 1 ? "s" : ""} au total`}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
                  border: "1px solid #E5E7EB",
                  background: filter === f.value ? "#F5B301" : "#fff",
                  color: "#111214",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <Skeleton height={110} count={2} style={{ marginBottom: 12, borderRadius: 12 }} />
          ) : shown.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#777" }}>
              Aucune réservation{filter ? " pour ce statut" : ""}.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {shown.map((r) => (
                <div key={r.reservationId} style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
                  <div
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "12px 16px", background: "#FAFAFA", borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>Référence n°{r.reference}</div>
                      <div style={{ fontSize: 12, color: "#777" }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleString("fr-FR") : ""}
                      </div>
                    </div>
                    <span className={`mw-status ${statusClass(r.status)}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>
                  <div style={{ padding: "12px 16px", fontSize: 14, lineHeight: 1.9 }}>
                    <div><MapPin size={14} style={{ verticalAlign: -2, marginRight: 6 }} />{r.departure} → {r.returnLocation}</div>
                    <div><Calendar size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Du {r.startDate} au {r.endDate}</div>
                    <div><Car size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Véhicule ID : {r.vehicleId}</div>
                    <div>
                      <Wallet size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
                      Total : <b>{r.totalPrice.toLocaleString("fr-FR")} €</b>
                    </div>
                    {r.adminNote && (
                      <div style={{ color: "#555", fontSize: 13 }}>Note admin : {r.adminNote}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}