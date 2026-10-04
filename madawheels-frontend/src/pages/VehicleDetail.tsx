import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Settings2, Fuel, Users, DoorOpen, Snowflake, Compass,
  ArrowLeft, MapPin, ShieldCheck,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { searchVehicles } from "../services/vehicleService";
import { franchise, OPTIONS_CATALOG } from "../constants";
import type { Vehicle } from "../types/vehicle";

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    searchVehicles({
      departure: "", returnLocation: "", startDate: "", startTime: "",
      endDate: "", endTime: "", driverAge: 23,
    })
      .then((list) => {
        if (!active) return;
        const found = list.find((v) => v.id === Number(id));
        if (!found) {
          toast.error("Véhicule introuvable.");
          navigate("/vehicules");
          return;
        }
        setVehicle(found);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erreur lors du chargement."))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, navigate]);

  const goToReservation = () => {
    if (!vehicle) return;
    const q = new URLSearchParams(searchParams);
    navigate(`/reserver?${q.toString()}`);
  };

  return (
    <>
      <Header />
      <main className="mw-container" style={{ padding: "32px 24px 72px" }}>
        <Link to="/vehicules" className="mw-btn-ghost" style={{ marginBottom: 18 }}>
          <ArrowLeft size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
          Retour à la flotte
        </Link>

        {loading || !vehicle ? (
          <div className="mw-layout">
            <Skeleton height={360} />
            <Skeleton height={300} />
          </div>
        ) : (
          <motion.div
            className="mw-layout"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              {vehicle.imageUrl && !broken ? (
                <img
                  src={vehicle.imageUrl}
                  alt={vehicle.name}
                  onError={() => setBroken(true)}
                  style={{
                    width: "100%",
                    maxHeight: 420,
                    objectFit: "cover",
                    borderRadius: "var(--mw-radius-lg)",
                    boxShadow: "var(--mw-shadow)",
                    marginBottom: 24,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%", height: 320, borderRadius: "var(--mw-radius-lg)",
                    background: "var(--mw-bg)", display: "grid", placeItems: "center",
                    color: "var(--mw-muted)", marginBottom: 24,
                  }}
                >
                  <Compass size={40} />
                </div>
              )}

              <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--mw-heading)", marginBottom: 6 }}>
                {vehicle.brand} {vehicle.model}
              </h1>
              <p style={{ color: "var(--mw-muted)", marginBottom: 20 }}>
                {vehicle.type} · Disponible à {vehicle.departure}
              </p>

              <div className="mw-specs" style={{ fontSize: 14, marginBottom: 24, gap: "10px 20px" }}>
                <span className="mw-spec"><Settings2 size={15} /> {vehicle.transmission}</span>
                <span className="mw-spec"><Fuel size={15} /> {vehicle.fuel}</span>
                <span className="mw-spec"><Users size={15} /> {vehicle.seats} personnes</span>
                <span className="mw-spec"><DoorOpen size={15} /> {vehicle.doors} portes</span>
                <span className="mw-spec"><Snowflake size={15} /> Climatisation</span>
                <span className="mw-spec"><Compass size={15} /> GPS inclus</span>
              </div>

              {vehicle.description && (
                <>
                  <h3 className="mw-section-label" style={{ fontSize: 15, marginBottom: 8 }}>Description</h3>
                  <p style={{ lineHeight: 1.7, marginBottom: 24 }}>{vehicle.description}</p>
                </>
              )}

              <h3 className="mw-section-label" style={{ fontSize: 15, marginBottom: 10 }}>
                Options de conduite
              </h3>
              <div className="mw-vcard-actions" style={{ marginBottom: 0 }}>
                <div className="mw-driver-box with">
                  <span className="mw-db-title"><Users size={13} /> Avec chauffeur</span>
                  <br />Service professionnel inclus, en ville comme hors de la ville.
                </div>
                <div className="mw-driver-box without">
                  <span className="mw-db-title"><ShieldCheck size={13} /> Sans chauffeur</span>
                  <br />Franchise assurance : {franchise(vehicle.type).toLocaleString()} €
                </div>
              </div>

              <h3 className="mw-section-label" style={{ fontSize: 15, margin: "24px 0 10px" }}>
                Options additionnelles disponibles
              </h3>
              <ul className="mw-contact-list">
                {OPTIONS_CATALOG.map((o) => (
                  <li key={o.id}>{o.name} — {o.price} € / {o.unit}</li>
                ))}
              </ul>
            </div>

            <aside>
              <div className="mw-summary">
                <h3>Résumé du véhicule</h3>
                <div className="mw-sum-row">
                  <MapPin size={15} />
                  <span><span className="mw-sum-label">Agence de départ</span><br />{vehicle.departure}</span>
                </div>
                <div className="mw-sum-row">
                  <ShieldCheck size={15} />
                  <span><span className="mw-sum-label">Franchise sans chauffeur</span><br />{franchise(vehicle.type).toLocaleString()} €</span>
                </div>
              </div>

              <div className="mw-lines" style={{ marginTop: 16 }}>
                <div className="mw-line total">
                  <span>Prix / jour</span>
                  <b>{vehicle.pricePerDay.toLocaleString()} €</b>
                </div>
                <p style={{ fontSize: 12, color: "var(--mw-muted)", marginTop: 8, lineHeight: 1.5 }}>
                  Le prix final dépend de la durée de location, des options choisies et de la franchise.
                </p>
                <motion.button
                  className="mw-btn btn-block"
                  style={{ marginTop: 14 }}
                  onClick={goToReservation}
                  whileTap={{ scale: 0.97 }}
                >
                  Vérifier la disponibilité →
                </motion.button>
              </div>
            </aside>
          </motion.div>
        )}
      </main>
      <Footer />
    </>
  );
}