import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  ClipboardList, Car, Clock, CheckCircle2, Ban, Users,
  ArrowRight, PlusCircle, Wallet,
} from "lucide-react";
import AdminHeader from "../../components/AdminHeader";
import Footer from "../../components/Footer";
import { listReservationsForAdmin, getAdminStats } from "../../services/adminService";
import { getSession } from "../../services/authService";
import type { AdminReservation, AdminStats } from "../../types/admin";
import "./AdminHome.css";

export default function AdminHome() {
  const session = getSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pending, setPending] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getAdminStats(), listReservationsForAdmin("PENDING")])
      .then(([s, p]) => {
        if (!active) return;
        setStats(s);
        setPending(p);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erreur lors du chargement."))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const recentPending = pending.slice(0, 5);

  return (
    <>
      <AdminHeader />
      <main className="mw-container mwh-page">
        <h1 className="mwh-title">Tableau de bord</h1>
        <p className="mwh-subtitle">
          Vue d'ensemble de l'activité MadaWheels{session ? `, ${session.firstName}` : ""}.
        </p>

        {loading || !stats ? (
          <div className="mwh-stats">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={84} borderRadius={14} />)}
          </div>
        ) : (
          <div className="mwh-stats">
            <div className="mwh-stat brand">
              <div className="mwh-stat-icon"><Users size={20} /></div>
              <div>
                <div className="mwh-stat-value">{stats.totalClients}</div>
                <div className="mwh-stat-label">Clients enregistrés</div>
              </div>
            </div>
            <div className="mwh-stat warn">
              <div className="mwh-stat-icon"><Clock size={20} /></div>
              <div>
                <div className="mwh-stat-value">{stats.pendingReservations}</div>
                <div className="mwh-stat-label">En attente de validation</div>
              </div>
            </div>
            <div className="mwh-stat info">
              <div className="mwh-stat-icon"><CheckCircle2 size={20} /></div>
              <div>
                <div className="mwh-stat-value">{stats.validatedReservations}</div>
                <div className="mwh-stat-label">Validées · paiement attendu</div>
              </div>
            </div>
            <div className="mwh-stat ok">
              <div className="mwh-stat-icon"><Wallet size={20} /></div>
              <div>
                <div className="mwh-stat-value">{stats.completedReservations}</div>
                <div className="mwh-stat-label">Transactions terminées</div>
              </div>
            </div>
            <div className="mwh-stat muted">
              <div className="mwh-stat-icon"><Car size={20} /></div>
              <div>
                <div className="mwh-stat-value">{stats.availableVehicles} / {stats.totalVehicles}</div>
                <div className="mwh-stat-label">Véhicules disponibles</div>
              </div>
            </div>
          </div>
        )}

        <div className="mwh-grid">
          <div className="mwh-panel">
            <div className="mwh-panel-head">
              <h2>Demandes en attente</h2>
              <Link to="/admin/reservations">Voir tout <ArrowRight size={12} style={{ verticalAlign: -1 }} /></Link>
            </div>

            {loading ? (
              <Skeleton count={3} height={40} style={{ marginBottom: 8 }} />
            ) : recentPending.length === 0 ? (
              <div className="mwh-empty-row">Aucune demande en attente pour le moment.</div>
            ) : (
              recentPending.map((r) => (
                <div className="mwh-row" key={r.reservationId}>
                  <div className="mwh-row-main">
                    <div className="mwh-row-ref">{r.reference}</div>
                    <div className="mwh-row-sub">{r.departure} → {r.returnLocation} · Du {r.startDate} au {r.endDate}</div>
                  </div>
                  <div className="mwh-row-price">{r.totalPrice.toLocaleString()} €</div>
                </div>
              ))
            )}

            {!loading && stats && stats.refusedReservations > 0 && (
              <div className="mwh-row">
                <div className="mwh-row-main">
                  <div className="mwh-row-sub">
                    <Ban size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
                    {stats.refusedReservations} demande{stats.refusedReservations > 1 ? "s" : ""} refusée{stats.refusedReservations > 1 ? "s" : ""} au total
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mwh-panel">
            <div className="mwh-panel-head">
              <h2>Accès rapide</h2>
            </div>
            <div className="mwh-actions">
              <Link className="mwh-action" to="/admin/reservations">
                <span className="mwh-action-icon"><ClipboardList size={18} /></span>
                <div>
                  <div className="mwh-action-title">Traiter les réservations</div>
                  <div className="mwh-action-sub">Valider ou refuser les demandes clients</div>
                </div>
              </Link>
              <Link className="mwh-action" to="/admin/clients">
                <span className="mwh-action-icon"><Users size={18} /></span>
                <div>
                  <div className="mwh-action-title">Voir les clients</div>
                  <div className="mwh-action-sub">{stats ? `${stats.totalClients} compte(s) enregistré(s)` : "Comptes et activité"}</div>
                </div>
              </Link>
              <Link className="mwh-action" to="/admin/vehicules">
                <span className="mwh-action-icon"><PlusCircle size={18} /></span>
                <div>
                  <div className="mwh-action-title">Ajouter un véhicule</div>
                  <div className="mwh-action-sub">Enrichir le catalogue proposé aux clients</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}