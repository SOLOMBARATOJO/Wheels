import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { CheckCircle2, Printer, ClipboardList, CreditCard } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { submitPayment } from "../services/reservationService";

export default function Paiement() {
  const [searchParams] = useSearchParams();
  const [reference, setReference] = useState(searchParams.get("ref") ?? "");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!reference || !cardHolder || !cardNumber || !expiry) {
      toast.error("Merci de remplir tous les champs, y compris votre numéro de devis.");
      return;
    }
    setBusy(true);
    try {
      const result = await submitPayment({ reference, cardHolder, cardNumber, expiry });
      if (result.status !== "TERMINEE") {
        toast.error(result.message);
        return;
      }
      setDone(true);
      toast.success("Paiement confirmé !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du paiement.");
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = () => window.print();

  if (done) {
    return (
      <>
        <div className="no-print">
          <Header />
        </div>

        <div style={{ background: "#F4F5F7", minHeight: "70vh", padding: "40px 24px" }}>
          <motion.div
            id="receipt-print-area"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              maxWidth: 640,
              margin: "0 auto",
              fontFamily: "Segoe UI, Arial, Helvetica, sans-serif",
              color: "#1A1A1A",
              boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "#111214",
                color: "#fff",
                padding: "20px 28px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  background: "#F5B301",
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🚗
              </span>
              <span style={{ fontWeight: 800, fontSize: 20 }}>MadaWheels</span>
              <span style={{ color: "#F5B301", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                MADAGASCAR
              </span>
            </div>

            <div style={{ background: "#fff", padding: 36 }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "#E9F9EF",
                    color: "#1E9E5A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <CheckCircle2 size={34} />
                </motion.div>
                <h1 style={{ margin: 0, fontSize: 22, color: "#111214" }}>
                  Paiement confirmé
                </h1>
                <p style={{ margin: "6px 0 0", color: "#555" }}>
                  Votre réservation est maintenant <strong>terminée</strong>.
                </p>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
                <tbody>
                  <tr>
                    <th
                      colSpan={2}
                      style={{
                        textAlign: "left",
                        background: "#F5B301",
                        padding: "8px 12px",
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      Détails du paiement
                    </th>
                  </tr>
                  <ReceiptRow label="Référence" value={reference} />
                  <ReceiptRow label="Titulaire de la carte" value={cardHolder} />
                  <ReceiptRow label="Carte" value={`•••• •••• •••• ${cardNumber.replace(/\s/g, "").slice(-4)}`} />
                  <ReceiptRow label="Date de paiement" value={new Date().toLocaleString("fr-FR")} />
                  <ReceiptRow label="Statut" value="Terminée ✅" />
                </tbody>
              </table>

              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 24 }}>
                Un reçu détaillé de paiement (véhicule, période, options et montants) vous a
                également été envoyé par email à votre adresse.
              </p>

              <div className="no-print" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  onClick={handlePrint}
                  style={{
                    background: "#F5B301",
                    color: "#111214",
                    fontWeight: 700,
                    padding: "12px 24px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Printer size={16} />
                  Imprimer le reçu
                </button>
                <Link
                  to="/mes-reservations"
                  style={{
                    background: "#fff",
                    color: "#111214",
                    fontWeight: 700,
                    padding: "12px 24px",
                    borderRadius: 10,
                    border: "1px solid #d0d5dd",
                    textDecoration: "none",
                    fontSize: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <ClipboardList size={16} />
                  Voir mes réservations
                </Link>
              </div>
            </div>

            <div style={{ background: "#111214", color: "#9a9a9a", padding: "18px 28px", fontSize: 12 }}>
              <strong style={{ color: "#fff" }}>MadaWheels</strong> · Antananarivo, Madagascar ·{" "}
              +261 34 00 000 00 · contact@madauto.mg
              <br />© 2026 MadaWheels — Tous droits réservés.
            </div>
          </motion.div>
        </div>

        <div className="no-print">
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="mw-auth-wrap">
        <div className="mw-auth-hero">
          <img src="/hero-sec.jpg" alt="Paiement MadaWheels" />
        </div>
        <motion.div className="mw-auth" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1>Paiement de votre réservation</h1>
          <p className="mw-auth-sub">
            Votre réservation a été validée par notre équipe. Réglez le montant par carte pour la finaliser.
          </p>

          <div className="mw-field">
            <label>Numéro de devis *</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="DEV-2026..." />
          </div>
          <div className="mw-field">
            <label>Titulaire de la carte *</label>
            <input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="Nom sur la carte" />
          </div>
          <div className="mw-field">
            <label>Numéro de carte *</label>
            <input
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4111 1111 1111 1111"
              inputMode="numeric"
              maxLength={19}
            />
          </div>
          <div className="mw-field">
            <label>Expiration (MM/AA) *</label>
            <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="12/28" maxLength={5} />
          </div>
          <motion.button className="mw-btn btn-block" onClick={submit} disabled={busy} whileTap={{ scale: 0.97 }}>
            <CreditCard size={16} style={{ verticalAlign: -2, marginRight: 6 }} />
            {busy ? "Traitement..." : "Payer"}
          </motion.button>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <th
        style={{
          textAlign: "left",
          background: "#FAFAFA",
          padding: "8px 12px",
          border: "1px solid #E5E7EB",
          width: "40%",
        }}
      >
        {label}
      </th>
      <td style={{ padding: "8px 12px", border: "1px solid #E5E7EB" }}>{value}</td>
    </tr>
  );
}