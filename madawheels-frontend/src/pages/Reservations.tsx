import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
// import { Mail, Hash, Car, MapPin, CreditCard, Trash2, Receipt, Printer, X } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { findReservations, deleteReservation } from "../services/reservationService";
import { getSession } from "../services/authService";
import type { ReservationSummary } from "../types/reservation";

import { Mail, Hash, Car, MapPin, CreditCard, Trash2, Receipt, Printer, CheckCircle2 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente de validation",
  VALIDEE: "Validée — paiement attendu",
  REFUSEE: "Refusée",
  TERMINEE: "Terminée",
};

export function ReservationCardSkeleton() {
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
        <Skeleton width="100%" height={96} />
      </div>
    </div>
  );
}

export default function Reservations() {
  const [email, setEmail] = useState(() => getSession()?.email ?? "");
  const [reference, setReference] = useState("");
  const [reservations, setReservations] = useState<ReservationSummary[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!email) {
      toast.error("Merci de renseigner votre email.");
      return;
    }
    setLoading(true);
    setReservations(null);
    try {
      setReservations(await findReservations(email));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la recherche.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleted = (id: number) =>
    setReservations((prev) => (prev ? prev.filter((x) => x.reservationId !== id) : prev));

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
              <label><Mail size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Email de réservation *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
              />
            </div>
            <div className="mw-field">
              <label><Hash size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Référence (facultatif)</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="DEV-2026..."
              />
            </div>
          </div>
          <motion.button className="mw-btn" onClick={handleSearch} disabled={loading} style={{ marginTop: 16 }} whileTap={{ scale: 0.97 }}>
            {loading ? "Recherche..." : "Rechercher"}
          </motion.button>
        </div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            <ReservationCardSkeleton />
          </div>
        )}

        {reservations !== null && !loading && filtered.length === 0 && (
          <div className="mw-empty">
            {reference.trim()
              ? "Aucune réservation ne correspond à cette référence."
              : "Aucune réservation trouvée pour cet email."}
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AnimatePresence>
              {filtered.map((r, i) => (
                <motion.div
                  key={r.reservationId}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                >
                  <ReservationCard reservation={r} onDeleted={handleDeleted} />
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

export function ReservationCard({
  reservation: r,
  onDeleted,
}: {
  reservation: ReservationSummary;
  /** Si fourni, affiche les boutons « Reçu de paiement » et « Supprimer ». */
  onDeleted?: (id: number) => void;
}) {
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const days = Math.max(
    1,
    Math.round((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 86_400_000)
  );

  const statusClass =
    r.status === "PENDING" ? "pending" :
    r.status === "VALIDEE" ? "pending" :
    r.status === "TERMINEE" ? "confirmed" :
    "cancelled"; // REFUSEE

  const statusLabel = STATUS_LABELS[r.status] ?? r.status;
  const formattedDate = r.createdAt ? new Date(r.createdAt).toLocaleString("fr-FR") : "";

  const handleReceipt = () => {
    if (r.status === "TERMINEE") {
      setReceiptOpen(true);
      return;
    }
    const messages: Record<string, string> = {
      PENDING: "Votre réservation n'a pas encore été payée : elle est en attente de validation.",
      VALIDEE: "Votre réservation n'a pas encore été payée. Cliquez sur « Payer maintenant ».",
      REFUSEE: "Cette réservation a été refusée : aucun paiement n'a été effectué.",
    };
    toast.error(messages[r.status] ?? "Votre réservation n'a pas été payée.");
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer cette réservation de votre historique ?")) return;
    setDeleting(true);
    try {
      toast.success(await deleteReservation(r.reservationId));
      onDeleted?.(r.reservationId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mw-resv-card">
      <div className="mw-resv-head">
        <div>
          <div className="mw-resv-ref">Référence n°{r.reference}</div>
          <div className="mw-resv-date">{formattedDate}</div>
        </div>
        <span className={`mw-status ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className="mw-resv-body">
        <div className="mw-resv-vehicle">
          {r.vehicleImage ? (
            <img className="mw-resv-img" src={r.vehicleImage} alt={r.vehicleName} />
          ) : (
            <div className="mw-resv-img mw-resv-img-empty"><Car size={22} /></div>
          )}
          <div>
            <div style={{ fontWeight: 700, color: "var(--mw-heading)", marginBottom: 6 }}>{r.vehicleName}</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              Du {r.startDate} à {r.startTime} au {r.endDate} à {r.endTime} ({days} jour{days > 1 ? "s" : ""})
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <MapPin size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
              {r.departure} → {r.returnLocation}
            </div>

            {r.status === "VALIDEE" && (
              <Link to={`/paiement?ref=${r.reference}`} className="mw-btn" style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <CreditCard size={14} />
                Payer maintenant →
              </Link>
            )}
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

      {onDeleted && (
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "0 20px 18px", flexWrap: "wrap" }}>
          <button
            onClick={handleReceipt}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10,
              border: "1px solid #d0d5dd", background: "#fff", color: "#111214", fontWeight: 600, cursor: "pointer",
            }}
          >
            <Receipt size={15} /> Reçu de paiement
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10,
              border: "1px solid #f3c1c1", background: "#fff5f5", color: "#c0392b", fontWeight: 600,
              cursor: deleting ? "not-allowed" : "pointer",
            }}
          >
            <Trash2 size={15} /> {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      )}

      {receiptOpen && <ReceiptModal reservation={r} onClose={() => setReceiptOpen(false)} />}
    </div>
  );
}

function ReceiptModal({ reservation: r, onClose }: { reservation: ReservationSummary; onClose: () => void }) {
  const paidAt = r.paidAt ? new Date(r.paidAt).toLocaleString("fr-FR") : "—";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000,
        display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 16, overflowY: "auto",
      }}
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-modal-print, #receipt-modal-print * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #receipt-modal-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <motion.div
        id="receipt-modal-print"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: "100%",
          maxWidth: 640,
          margin: "auto",
          fontFamily: "Segoe UI, Arial, Helvetica, sans-serif",
          color: "#1A1A1A",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ background: "#111214", color: "#fff", padding: "20px 28px", display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              background: "#F5B301", width: 34, height: 34, borderRadius: 8,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          >
            🚗
          </span>
          <span style={{ fontWeight: 800, fontSize: 20 }}>MadaWheels</span>
          <span style={{ color: "#F5B301", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>MADAGASCAR</span>
        </div>

        <div style={{ background: "#fff", padding: 36 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
              style={{
                width: 64, height: 64, borderRadius: "50%", background: "#E9F9EF", color: "#1E9E5A",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
              }}
            >
              <CheckCircle2 size={34} />
            </motion.div>
            <h1 style={{ margin: 0, fontSize: 22, color: "#111214" }}>Paiement confirmé</h1>
            <p style={{ margin: "6px 0 0", color: "#555" }}>
              Votre réservation est maintenant <strong>terminée</strong>.
            </p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
            <tbody>
              <tr>
                <th
                  colSpan={2}
                  style={{ textAlign: "left", background: "#F5B301", padding: "8px 12px", border: "1px solid #E5E7EB" }}
                >
                  Détails du paiement
                </th>
              </tr>
              <ReceiptRow label="Référence" value={r.reference} />
              <ReceiptRow label="Titulaire de la carte" value={r.cardHolder || "—"} />
              <ReceiptRow label="Carte" value={r.cardLast4 ? `•••• •••• •••• ${r.cardLast4}` : "—"} />
              <ReceiptRow label="Date de paiement" value={paidAt} />
              <ReceiptRow label="Statut" value="Terminée ✅" />
            </tbody>
          </table>

          <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 24 }}>
            Un reçu détaillé de paiement (véhicule, période, options et montants) vous a également été envoyé
            par email à votre adresse.
          </p>

          <div className="no-print" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => window.print()}
              style={{
                background: "#F5B301", color: "#111214", fontWeight: 700, padding: "12px 24px", borderRadius: 10,
                border: "none", cursor: "pointer", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              <Printer size={16} />
              Imprimer le reçu
            </button>
            <button
              onClick={onClose}
              style={{
                background: "#fff", color: "#111214", fontWeight: 700, padding: "12px 24px", borderRadius: 10,
                border: "1px solid #d0d5dd", cursor: "pointer", fontSize: 14,
              }}
            >
              Fermer
            </button>
          </div>
        </div>

        <div style={{ background: "#111214", color: "#9a9a9a", padding: "18px 28px", fontSize: 12 }}>
          <strong style={{ color: "#fff" }}>MadaWheels</strong> · Antananarivo, Madagascar ·{" "}
          +261 34 00 000 00 · contact@madauto.mg
          <br />© 2026 MadaWheels — Tous droits réservés.
        </div>
      </motion.div>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <th
        style={{
          textAlign: "left", background: "#FAFAFA", padding: "8px 12px",
          border: "1px solid #E5E7EB", width: "40%",
        }}
      >
        {label}
      </th>
      <td style={{ padding: "8px 12px", border: "1px solid #E5E7EB" }}>{value}</td>
    </tr>
  );
}