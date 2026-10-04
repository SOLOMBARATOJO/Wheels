import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Settings2, Fuel, Users, DoorOpen, Snowflake } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchWidget from "../components/SearchWidget";
import { searchVehicles } from "../services/vehicleService";
import { VEHICLE_TYPES } from "../constants";
import type { Vehicle, SearchParams } from "../types/vehicle";

const FUELS = ["Essence", "Diesel"];

function FleetCardSkeleton() {
  return (
    <div className="mw-fcard">
      <Skeleton height={200} />
      <div className="mw-fcard-body">
        <Skeleton width="70%" height={20} />
        <Skeleton width="100%" height={14} count={2} />
        <Skeleton width="40%" height={30} />
      </div>
    </div>
  );
}

export default function Fleet() {
  const navigate = useNavigate();
  const [params, setParams] = useState<SearchParams>({
    departure: "",
    returnLocation: "",
    startDate: "",
    startTime: "10:00",
    endDate: "",
    endTime: "10:00",
    driverAge: 23,
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [transmissionFilter, setTransmissionFilter] = useState("");
  const [fuelFilter, setFuelFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState(0);
  const [sameReturn, setSameReturn] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    searchVehicles({
      departure: "",
      returnLocation: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      driverAge: 23,
      type: typeFilter || undefined,
      transmission: transmissionFilter || undefined,
      fuel: fuelFilter || undefined,
    })
      // .then((v) => {
      //   if (active) setVehicles(v);
      // })
      .then((v) => {
  if (active) setVehicles(v.filter((veh) => veh.available));
})
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Erreur lors du chargement de la flotte.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [typeFilter, transmissionFilter, fuelFilter]);

  const maxPrice = useMemo(
    () => (vehicles.length ? Math.max(...vehicles.map((v) => v.pricePerDay)) : 0),
    [vehicles]
  );
  const effectivePrice = priceFilter > 0 && priceFilter < maxPrice ? priceFilter : maxPrice;
  const filteredVehicles = useMemo(
    () => vehicles.filter((v) => v.pricePerDay <= effectivePrice),
    [vehicles, effectivePrice]
  );

  const handleSearch = () => {
    const effective = sameReturn ? params.departure : params.returnLocation;
    if (!params.departure || !effective || !params.startDate || !params.endDate) {
      toast.error("Veuillez renseigner le lieu de départ, le lieu de retour et les deux dates pour lancer la recherche.");
      return;
    }
    const q = new URLSearchParams();
    Object.entries({ ...params, returnLocation: effective }).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) q.set(k, String(v));
    });
    navigate(`/reserver?${q.toString()}`);
  };

  return (
    <>
      <Header />

      <section className="mw-hero">
        <div className="mw-hero-bg" style={{ backgroundImage: "url(/hero.jpg)" }} />
        <div className="mw-hero-inner">
          <div>
            <div className="mw-eyebrow">Madawheels vous accompagne dans tous vos déplacements à Madagascar</div>
            <h1>Découvrez Madagascar avec nos locations de véhicules</h1>
            <p className="mw-hero-desc">
              De l'aéroport à votre hôtel, en passant par votre lieu de conférence ou votre bureau, notre équipe
              met à votre disposition un service de location de voiture avec chauffeurs professionnels, compétents
              et fiables.
            </p>
          </div>
          <div className="mw-hero-img-wrap">
            <img className="mw-hero-img" src="/hero.jpg" alt="Véhicules MadaWheels" />
          </div>
        </div>
      </section>

      <div className="mw-container">
        <SearchWidget
          values={params}
          onChange={setParams}
          onSearch={handleSearch}
          sameReturn={sameReturn}
          onSameReturn={(b) => {
            setSameReturn(b);
            if (b) setParams({ ...params, returnLocation: params.departure });
          }}
        />
      </div>

      <main className="mw-container" style={{ padding: "32px 24px 72px" }}>
        <h2 className="mw-section-title" style={{ fontSize: 26, marginBottom: 8 }}>
          Notre flotte de véhicules
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 18, maxWidth: 760 }}>
          Louer une voiture avec MadaWheels, c'est choisir un service premium et une large gamme de véhicules
          répondant à tous vos besoins.
        </p>

        <div className="mw-chips">
          <div>
            <div className="mw-section-label">Véhicules :</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className={`mw-chip ${typeFilter === "" ? "active" : ""}`}
                onClick={() => setTypeFilter("")}
              >
                Tous
              </button>
              {VEHICLE_TYPES.map((t) => (
                <button
                  key={t.value}
                  className={`mw-chip ${typeFilter === t.value ? "active" : ""}`}
                  onClick={() => setTypeFilter(typeFilter === t.value ? "" : t.value)}
                >
                  {t.icon} {t.value}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mw-section-label">Transmission :</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className={`mw-chip ${transmissionFilter === "" ? "active" : ""}`}
                onClick={() => setTransmissionFilter("")}
              >
                Tous
              </button>
              {["Automatique", "Manuelle"].map((t) => (
                <button
                  key={t}
                  className={`mw-chip ${transmissionFilter === t ? "active" : ""}`}
                  onClick={() => setTransmissionFilter(transmissionFilter === t ? "" : t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mw-section-label">Carburant :</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className={`mw-chip ${fuelFilter === "" ? "active" : ""}`}
                onClick={() => setFuelFilter("")}
              >
                Tous
              </button>
              {FUELS.map((f) => (
                <button
                  key={f}
                  className={`mw-chip ${fuelFilter === f ? "active" : ""}`}
                  onClick={() => setFuelFilter(fuelFilter === f ? "" : f)}
                >
                  <Fuel size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="mw-price-filter">
            <div className="mw-section-label">Prix maximum :</div>
            {maxPrice > 0 && (
              <>
                <input
                  type="range"
                  min={100}
                  max={maxPrice}
                  step={50}
                  value={effectivePrice}
                  onChange={(e) => setPriceFilter(Number(e.target.value))}
                />
                <div className="mw-price-value">
                  {filteredVehicles.length} véhicule{filteredVehicles.length > 1 ? "s" : ""} à {effectivePrice.toLocaleString()} €
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span className="mw-pag-count">
            Total : {filteredVehicles.length} véhicule{filteredVehicles.length > 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="mw-fleet-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <FleetCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="mw-empty">Aucun véhicule ne correspond à ces critères.</div>
        ) : (
          <div className="mw-fleet-grid">
            {filteredVehicles.map((v, i) => (
              <motion.div
                key={v.id}
                className="mw-fcard"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
              >
                {v.imageUrl ? (
                  <img className="mw-fcard-img" src={v.imageUrl} alt={v.name} />
                ) : (
                  <div className="mw-fcard-img" style={{ background: "var(--mw-bg)" }} />
                )}
                <div className="mw-fcard-body">
                  <div className="mw-fcard-top">
                    <div>
                      <div className="mw-vcard-name">{v.brand} {v.model}</div>
                      <div className="mw-specs" style={{ marginTop: 8 }}>
                        <span className="mw-spec"><Settings2 size={13} /> {v.transmission}</span>
                        <span className="mw-spec"><Fuel size={13} /> {v.fuel}</span>
                        <span className="mw-spec"><Users size={13} /> {v.seats} Personnes</span>
                        <span className="mw-spec"><DoorOpen size={13} /> {v.doors} Portes</span>
                        {v.description && <span className="mw-spec"><Snowflake size={13} /> Climatisation</span>}
                      </div>
                    </div>
                    <span className="mw-vcard-price">{v.pricePerDay.toLocaleString()} €/jour</span>
                  </div>

                  <button
  className="mw-fcard-more"
  onClick={() => navigate(`/vehicules/${v.id}`)}
>
  Plus de détails
</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}