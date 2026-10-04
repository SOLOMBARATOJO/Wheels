import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Settings2, Fuel, Users, DoorOpen, Snowflake, Compass,
  ShieldCheck, ChevronRight, Car, Euro,
} from "lucide-react";
import { VEHICLE_TYPES, franchise } from "../constants";
import type { Vehicle } from "../types/vehicle";
import "./VehicleCatalog.css";

type SortBy = "priceAsc" | "priceDesc";

interface Props {
  vehicles: Vehicle[];
  loading: boolean;
  agency?: string; // conservé pour compatibilité, non utilisé : la flotte n'est plus filtrée par agence
  onChoose: (v: Vehicle) => void;
}

const TRANSMISSIONS = ["Automatique", "Manuelle"];
const FUELS = ["Essence", "Diesel"];

function CardSkeleton() {
  return (
    <div className="mwc-card">
      <Skeleton height={220} />
      <div className="mwc-body">
        <Skeleton width="50%" height={24} />
        <Skeleton height={16} count={3} />
        <Skeleton height={48} />
      </div>
    </div>
  );
}

function CatalogImage({ vehicle }: { vehicle: Vehicle }) {
  const [broken, setBroken] = useState(false);
  if (!vehicle.imageUrl || broken) {
    return <Car size={44} className="mwc-media-empty" />;
  }
  return <img src={vehicle.imageUrl} alt={vehicle.name} onError={() => setBroken(true)} />;
}

function VehicleCard({ vehicle, onChoose }: { vehicle: Vehicle; onChoose: (v: Vehicle) => void }) {
  return (
    <motion.article
      className="mwc-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mwc-media">
        <span className="mwc-badge">{vehicle.pricePerDay.toLocaleString()} €/jour</span>
        <CatalogImage vehicle={vehicle} />
      </div>

      <div className="mwc-body">
        <div className="mwc-head">
          <h3 className="mwc-name">{vehicle.brand} {vehicle.model}</h3>
          <span className="mwc-type">{vehicle.type}</span>
        </div>

        <ul className="mwc-specs">
          <li><Settings2 size={16} /> {vehicle.transmission}</li>
          <li><Fuel size={16} /> {vehicle.fuel}</li>
          <li><Users size={16} /> {vehicle.seats} personnes</li>
          <li><DoorOpen size={16} /> {vehicle.doors} portes</li>
          <li><Snowflake size={16} /> Climatisation</li>
          <li><Compass size={16} /> GPS</li>
        </ul>

        {vehicle.description && <p className="mwc-desc">{vehicle.description}</p>}

        <div className="mwc-options-title">Options disponibles</div>
        <div className="mwc-drivers">
          <div className="mwc-driver with">
            <strong><Users size={15} /> Avec chauffeur</strong>
            Service chauffeur inclus
          </div>
          <div className="mwc-driver">
            <strong><ShieldCheck size={15} /> Sans chauffeur</strong>
            Franchise : {franchise(vehicle.type).toLocaleString()} €
          </div>
        </div>

        <button className="mwc-cta" onClick={() => onChoose(vehicle)}>
          <span>Réserver</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </motion.article>
  );
}

export default function VehicleCatalog({ vehicles, loading, onChoose }: Props) {
  const [type, setType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [fuel, setFuel] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("priceAsc");

  const visible = useMemo(() => {
    const cap = Number(maxPrice);
    const list = vehicles.filter(
      (v) =>
        (!type || v.type === type) &&
        (!transmission || v.transmission === transmission) &&
        (!fuel || v.fuel === fuel) &&
        (!maxPrice || Number.isNaN(cap) || cap <= 0 || v.pricePerDay <= cap)
    );
    list.sort((a, b) => (sortBy === "priceAsc" ? a.pricePerDay - b.pricePerDay : b.pricePerDay - a.pricePerDay));
    return list;
  }, [vehicles, type, transmission, fuel, maxPrice, sortBy]);

  const resetFilters = () => {
    setType("");
    setTransmission("");
    setFuel("");
    setMaxPrice("");
  };

  return (
    <div>
      <div className="mwc-filters">
        <div className="mwc-filter-row">
          <div className="mwc-filter-group">
            <span className="mwc-filter-label">Types de véhicules :</span>
            <div className="mwc-chips">
              <button className={`mwc-chip ${type === "" ? "active" : ""}`} onClick={() => setType("")}>Tous</button>
              {VEHICLE_TYPES.map((t) => (
                <button
                  key={t.value}
                  className={`mwc-chip ${type === t.value ? "active" : ""}`}
                  onClick={() => setType(type === t.value ? "" : t.value)}
                >
                  {t.icon} {t.value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mwc-filter-row">
          <div className="mwc-filter-group">
            <span className="mwc-filter-label">Transmission :</span>
            <div className="mwc-chips">
              <button className={`mwc-chip ${transmission === "" ? "active" : ""}`} onClick={() => setTransmission("")}>Tous</button>
              {TRANSMISSIONS.map((t) => (
                <button
                  key={t}
                  className={`mwc-chip ${transmission === t ? "active" : ""}`}
                  onClick={() => setTransmission(transmission === t ? "" : t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mwc-filter-group">
            <span className="mwc-filter-label">Carburant :</span>
            <div className="mwc-chips">
              <button className={`mwc-chip ${fuel === "" ? "active" : ""}`} onClick={() => setFuel("")}>Tous</button>
              {FUELS.map((f) => (
                <button
                  key={f}
                  className={`mwc-chip ${fuel === f ? "active" : ""}`}
                  onClick={() => setFuel(fuel === f ? "" : f)}
                >
                  <Fuel size={13} /> {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mwc-filter-group">
            <span className="mwc-filter-label">Prix maximum :</span>
            <label className="mwc-price-input">
              <Euro size={15} />
              <input
                type="number"
                min={0}
                placeholder="Montant / jour"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mwc-toolbar">
        <div className="mwc-count">
          {visible.length} véhicule{visible.length > 1 ? "s" : ""} disponible{visible.length > 1 ? "s" : ""}
        </div>
        <select className="mwc-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
          <option value="priceAsc">Tri : prix croissant</option>
          <option value="priceDesc">Tri : prix décroissant</option>
        </select>
      </div>

      {loading ? (
        <div className="mwc-list">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : visible.length === 0 ? (
        <div className="mwc-empty">
          {vehicles.length === 0
            ? "Aucun véhicule disponible pour ces dates."
            : "Aucun véhicule ne correspond à ces filtres."}
          {vehicles.length > 0 && (
            <div>
              <button className="mw-btn-ghost" onClick={resetFilters}>Réinitialiser les filtres</button>
            </div>
          )}
        </div>
      ) : (
        <div className="mwc-list">
          {visible.map((v) => (
            <VehicleCard key={v.id} vehicle={v} onChoose={onChoose} />
          ))}
        </div>
      )}
    </div>
  );
}