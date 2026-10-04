import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Search, Mail, Phone, ClipboardList } from "lucide-react";
import AdminHeader from "../../components/AdminHeader";
import Footer from "../../components/Footer";
import ClientReservationsModal from "../../components/ClientReservationsModal";
import { listClientsForAdmin } from "../../services/adminService";
import type { ClientSummary } from "../../types/admin";
import "./AdminClients.css";

const STATUS_LABELS: Record<string, string> = { ACTIVE: "Actif", PENDING: "Vérification en cours" };

const initials = (c: ClientSummary) =>
  `${c.firstName?.[0] ?? ""}${c.lastName?.[0] ?? ""}`.toUpperCase() || "?";

export default function AdminClients() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ userId: number; name: string } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listClientsForAdmin()
      .then((c) => { if (active) setClients(c); })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erreur lors du chargement."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase().includes(q)
    );
  }, [clients, keyword]);

  return (
    <>
      <AdminHeader />
      <main className="mw-container awc-page">
        <h1 className="awc-title">Clients</h1>
        <p className="awc-subtitle">Comptes clients MadaWheels et leur activité de réservation.</p>

        <div className="awc-toolbar">
          <div className="awc-search">
            <Search size={16} />
            <input
              placeholder="Rechercher par nom, email ou téléphone…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <span className="awc-count">{filtered.length} client{filtered.length > 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <Skeleton height={54} count={5} style={{ marginBottom: 8, borderRadius: 10 }} />
        ) : filtered.length === 0 ? (
          <div className="awc-empty">
            {clients.length === 0 ? "Aucun client inscrit pour le moment." : "Aucun client ne correspond à cette recherche."}
          </div>
        ) : (
          <table className="awc-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Contact</th>
                <th>Statut</th>
                <th>Réservations</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.userId}>
                  <td>
                    <div className="awc-client">
                      <span className="awc-avatar">{initials(c)}</span>
                      <div>
                        <div className="awc-name">{c.firstName} {c.lastName}</div>
                        <div className="awc-sub">ID #{c.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div><Mail size={12} style={{ verticalAlign: -1, marginRight: 5 }} />{c.email}</div>
                    {c.phone && <div className="awc-sub" style={{ marginTop: 2 }}><Phone size={12} style={{ verticalAlign: -1, marginRight: 5 }} />{c.phone}</div>}
                  </td>
                  <td>
                    <span className={`awc-badge ${c.status}`}>{STATUS_LABELS[c.status] ?? c.status}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="awc-count-pill"
                      onClick={() => setSelected({ userId: c.userId, name: `${c.firstName} ${c.lastName}` })}
                      title="Voir les réservations de ce client"
                      style={{ cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", fontFamily: "inherit" }}
                    >
                      <ClipboardList size={14} style={{ color: "var(--mw-gold, #f5b301)" }} />
                      {c.reservationsCount}
                      <span style={{ fontWeight: 500, color: "#B8860B", fontSize: 12, marginLeft: 6 }}>Voir →</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {selected && (
        <ClientReservationsModal
          userId={selected.userId}
          clientName={selected.name}
          onClose={() => setSelected(null)}
        />
      )}

      <Footer />
    </>
  );
}