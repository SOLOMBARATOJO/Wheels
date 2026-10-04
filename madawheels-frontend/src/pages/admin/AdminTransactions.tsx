import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Search, CreditCard, MapPin } from "lucide-react";
import AdminHeader from "../../components/AdminHeader";
import Footer from "../../components/Footer";
import { listTransactionsForAdmin } from "../../services/adminService";
import type { Transaction } from "../../types/admin";
import "./AdminTransactions.css";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listTransactionsForAdmin()
      .then((t) => { if (active) setTransactions(t); })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erreur lors du chargement."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) =>
      `${t.reference} ${t.clientFirstName} ${t.clientLastName} ${t.clientEmail} ${t.vehicleName}`
        .toLowerCase()
        .includes(q)
    );
  }, [transactions, keyword]);

  const totalAmount = filtered.reduce((sum, t) => sum + t.totalPrice, 0);

  return (
    <>
      <AdminHeader />
      <main className="mw-container awt-page">
        <h1 className="awt-title">Transactions</h1>
        <p className="awt-subtitle">Réservations payées par les clients, avec le détail du règlement.</p>

        <div className="awt-toolbar">
          <div className="awt-search">
            <Search size={16} />
            <input
              placeholder="Rechercher par référence, client ou véhicule…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <span className="awt-count">{filtered.length} transaction{filtered.length > 1 ? "s" : ""}</span>
          <span className="awt-total">Total : {totalAmount.toLocaleString()} €</span>
        </div>

        {loading ? (
          <Skeleton height={100} count={3} style={{ marginBottom: 12, borderRadius: 14 }} />
        ) : filtered.length === 0 ? (
          <div className="awt-empty">
            {transactions.length === 0
              ? "Aucune transaction réglée pour le moment."
              : "Aucune transaction ne correspond à cette recherche."}
          </div>
        ) : (
          <div className="awt-list">
            {filtered.map((t) => (
              <article className="awt-card" key={t.reservationId}>
                <div>
                  <div className="awt-card-head">
                    <span className="awt-ref">Réf. {t.reference}</span>
                    <span className="awt-date">{t.paidAt ? new Date(t.paidAt).toLocaleString("fr-FR") : ""}</span>
                  </div>
                  <div className="awt-rows">
                    <div className="awt-client">{t.clientFirstName} {t.clientLastName} · {t.clientEmail}</div>
                    <div>Véhicule : <b>{t.vehicleName}</b></div>
                    <div><MapPin size={12} style={{ verticalAlign: -1, marginRight: 4 }} />{t.departure} → {t.returnLocation} · Du {t.startDate} au {t.endDate}</div>
                    <div>Véhicule {t.vehiclePrice.toLocaleString()} € + options {t.optionsPrice.toLocaleString()} €</div>
                  </div>
                </div>
                <div className="awt-pay">
                  <span className="awt-status-badge">Terminée</span>
                  <div className="awt-pay-total">{t.totalPrice.toLocaleString()} €</div>
                  <div className="awt-pay-method">
                    <CreditCard size={13} /> {t.paymentMethod || "Carte bancaire"}
                  </div>
                  {t.cardLastFour && (
                    <div className="awt-pay-card">•••• •••• •••• {t.cardLastFour} — {t.cardHolder}</div>
                  )}
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