import { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchWidget from "../components/SearchWidget";
import { searchVehicles } from "../services/vehicleService";
import { getSession } from "../services/authService";
import { createReservation } from "../services/reservationService";
import { OPTIONS_CATALOG, VEHICLE_TYPES, franchise, RESTITUTION_FEE } from "../constants";
import type { Vehicle, SearchParams, SelectedOption } from "../types/vehicle";
import type { ReservationResult } from "../types/reservation";

type Step = "search" | "vehicles" | "options" | "devis" | "confirmed";
type SortBy = "default" | "priceAsc" | "priceDesc";

const STEPS: { id: Step; title: string; sub: string }[] = [
  { id: "search", title: "Rechercher", sub: "Trouvez votre véhicule" },
  { id: "vehicles", title: "Véhicules", sub: "Comparez les prix" },
  { id: "options", title: "Options", sub: "Personnalisez votre location" },
  { id: "devis", title: "Devis", sub: "Réservez votre véhicule" },
  { id: "confirmed", title: "Confirmer", sub: "Finalisez votre devis" },
];

const emptyParams: SearchParams = {
  departure: "",
  returnLocation: "",
  startDate: "",
  startTime: "10:00",
  endDate: "",
  endTime: "10:00",
  driverAge: 23,
};

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 1;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

function optionTotal(optionId: number, days: number): number {
  const option = OPTIONS_CATALOG.find((o) => o.id === optionId);
  if (!option) return 0;
  return (option.unit === "jour" ? option.price * days : option.price);
}

function readParams(search: string): SearchParams {
  const qp = new URLSearchParams(search);
  return {
    departure: qp.get("departure") ?? "",
    returnLocation: qp.get("returnLocation") ?? "",
    startDate: qp.get("startDate") ?? "",
    startTime: qp.get("startTime") ?? "10:00",
    endDate: qp.get("endDate") ?? "",
    endTime: qp.get("endTime") ?? "10:00",
    driverAge: Number(qp.get("driverAge") ?? 23),
  };
}

export default function Reserver() {
  const location = useLocation();
  const [step, setStep] = useState<Step>("search");
  const [params, setParams] = useState<SearchParams>(() => readParams(location.search));
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);

  const [sameReturn, setSameReturn] = useState(false);
  const [filters, setFilters] = useState({ type: "", transmission: "", fuel: "" });
  const [sortBy, setSortBy] = useState<SortBy>("default");
  const [priceFilter, setPriceFilter] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [locataire, setLocataire] = useState(() => {
    const session = getSession();
    return session
      ? { firstName: session.firstName, lastName: session.lastName, email: session.email, phone: session.phone }
      : { firstName: "", lastName: "", email: "", phone: "" };
  });
  const [acceptedCGV, setAcceptedCGV] = useState(false);
  const [result, setResult] = useState<ReservationResult | null>(null);

  const effectiveReturn = sameReturn ? params.departure : params.returnLocation;

  const handleSearch = async (withFilters = filters) => {
    const effective = sameReturn ? params.departure : params.returnLocation;
    if (!params.departure || !effective || !params.startDate || !params.endDate) {
      setError("Veuillez renseigner le lieu de départ, le lieu de retour et les deux dates pour lancer la recherche.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const results = await searchVehicles({
        ...params,
        returnLocation: effective,
        type: withFilters.type || undefined,
        transmission: withFilters.transmission || undefined,
        fuel: withFilters.fuel || undefined,
      });
      setVehicles(results);
      setPage(1);
      setPriceFilter(0);
      setStep("vehicles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la recherche.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    if (qp.get("departure") && qp.get("startDate") && qp.get("endDate") && step === "search") {
      void (async () => {
        await handleSearch();
      })();
    }
    // Le formulaire vient d'être initialisé depuis l'URL : on lance la recherche une seule fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChooseVehicle = (v: Vehicle) => {
    setSelectedVehicle(v);
    setSelectedOptions([]);
    setError("");
    setStep("options");
  };

  const isOptionSelected = (id: number) => selectedOptions.some((o) => o.optionId === id);

  const toggleOption = (id: number) => {
    setSelectedOptions((prev) =>
      isOptionSelected(id) ? prev.filter((o) => o.optionId !== id) : [...prev, { optionId: id, quantity: 1 }]
    );
  };

  const days = daysBetween(params.startDate, params.endDate);
  const vehiclePriceEstimate = selectedVehicle ? selectedVehicle.pricePerDay * days : 0;
  const franchiseValue = selectedVehicle ? franchise(selectedVehicle.type) : 0;
  const optionsPriceEstimate = selectedOptions.reduce((sum, sel) => sum + optionTotal(sel.optionId, days), 0);
  const totalEstimate = vehiclePriceEstimate + optionsPriceEstimate + franchiseValue + RESTITUTION_FEE;

  const handleSubmitDevis = async () => {
    if (!selectedVehicle) return;
    if (!locataire.firstName || !locataire.lastName || !locataire.email || !locataire.phone) {
      setError("Merci de compléter vos coordonnées.");
      return;
    }
    if (!acceptedCGV) {
      setError("Merci d'accepter les conditions générales de vente.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await createReservation({
        ...locataire,
        vehicleId: selectedVehicle.id,
        departure: params.departure,
        returnLocation: effectiveReturn,
        startDate: params.startDate,
        startTime: params.startTime,
        endDate: params.endDate,
        endTime: params.endTime,
        driverAge: params.driverAge,
        options: selectedOptions,
      });
      setResult(res);
      setStep("confirmed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la demande de devis.");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setStep("search");
    setParams(emptyParams);
    setVehicles([]);
    setSelectedVehicle(null);
    setSelectedOptions([]);
    setSameReturn(false);
    setFilters({ type: "", transmission: "", fuel: "" });
    setSortBy("default");
    setPriceFilter(0);
    setPageSize(10);
    setPage(1);
    setLocataire({ firstName: "", lastName: "", email: "", phone: "" });
    setAcceptedCGV(false);
    setResult(null);
    setError("");
  };

  const priceCap = useMemo(
    () => (vehicles.length ? Math.max(...vehicles.map((v) => v.pricePerDay)) : 0),
    [vehicles]
  );
  const effectivePrice = priceFilter > 0 && priceFilter < priceCap ? priceFilter : priceCap;

  const sortedVehicles = useMemo(() => {
    const list = vehicles.filter((v) => v.pricePerDay <= effectivePrice);
    if (sortBy === "priceAsc") list.sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (sortBy === "priceDesc") list.sort((a, b) => b.pricePerDay - a.pricePerDay);
    return list;
  }, [vehicles, sortBy, effectivePrice]);

  const pageCount = Math.max(1, Math.ceil(sortedVehicles.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedVehicles = sortedVehicles.slice((safePage - 1) * pageSize, safePage * pageSize);

  const uniqueTransmissions = Array.from(new Set(vehicles.map((v) => v.transmission).filter(Boolean))).sort();

  return (
    <>
      <Header />

      <section className="mw-hero">
        <div className="mw-hero-bg" style={{ backgroundImage: "url(/hero.jpg)" }} />
        <div className="mw-hero-inner" style={{ paddingBottom: 36 }}>
          <div>
            <div className="mw-eyebrow">Madawheels vous accompagne dans tous vos déplacements à Madagascar</div>
            <h1>Découvrez Madagascar avec nos locations de véhicules</h1>
          </div>
        </div>
        <div className="mw-container">
          <SearchWidget
            values={params}
            onChange={setParams}
            onSearch={() => handleSearch()}
            loading={loading}
            sameReturn={sameReturn}
            onSameReturn={(b) => {
              setSameReturn(b);
              if (b) setParams({ ...params, returnLocation: params.departure });
            }}
            overlap
          />
        </div>
      </section>

      <div className="mw-steps">
        {STEPS.map((s, i) => (
          <div key={s.id} className={`mw-step ${step === s.id ? "active" : ""}`}>
            <div className="mw-step-num">{i + 1}</div>
            <div className="mw-step-label">
              <span className="mw-step-title">{s.title}</span>
              <span className="mw-step-sub">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="mw-error">{error}</div>}

      {step === "search" && (
        <div className="mw-layout single" style={{ paddingTop: 24 }}>
          <p style={{ fontSize: 15, lineHeight: 1.7, maxWidth: 720 }}>
            Sélectionnez un lieu de départ, un lieu de retour et vos dates pour découvrir nos véhicules
            disponibles et comparer les prix.
          </p>
        </div>
      )}

      {step === "vehicles" && (
        <div className="mw-layout">
          <div>
            <div className="mw-chips">
              <div>
                <div className="mw-section-label">Véhicules :</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className={`mw-chip ${filters.type === "" ? "active" : ""}`} onClick={() => setFilters({ ...filters, type: "" })}>
                    Tous
                  </button>
                  {VEHICLE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      className={`mw-chip ${filters.type === t.value ? "active" : ""}`}
                      onClick={() => setFilters({ ...filters, type: filters.type === t.value ? "" : t.value })}
                    >
                      {t.icon} {t.value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mw-section-label">Transmission :</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className={`mw-chip ${filters.transmission === "" ? "active" : ""}`} onClick={() => setFilters({ ...filters, transmission: "" })}>
                    Tous
                  </button>
                  {uniqueTransmissions.length > 0
                    ? uniqueTransmissions.map((t) => (
                        <button
                          key={t}
                          className={`mw-chip ${filters.transmission === t ? "active" : ""}`}
                          onClick={() => setFilters({ ...filters, transmission: filters.transmission === t ? "" : t })}
                        >
                          {t}
                        </button>
                      ))
                    : ["Automatique", "Manuelle"].map((t) => (
                        <button key={t} className="mw-chip" onClick={() => setFilters({ ...filters, transmission: t })}>
                          {t}
                        </button>
                      ))}
                </div>
              </div>
              <div>
                <div className="mw-section-label">Carburant :</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className={`mw-chip ${filters.fuel === "" ? "active" : ""}`}
                    onClick={() => setFilters({ ...filters, fuel: "" })}
                  >
                    Tous
                  </button>
                  {["Essence", "Diesel"].map((f) => (
                    <button
                      key={f}
                      className={`mw-chip ${filters.fuel === f ? "active" : ""}`}
                      onClick={() => setFilters({ ...filters, fuel: filters.fuel === f ? "" : f })}
                    >
                      ⛽ {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {priceCap > 0 && (
              <div className="mw-price-filter">
                <div className="mw-section-label">Prix maximum :</div>
                <input
                  type="range"
                  min={100}
                  max={priceCap}
                  step={50}
                  value={effectivePrice}
                  onChange={(e) => {
                    setPriceFilter(Number(e.target.value));
                    setPage(1);
                  }}
                />
                <div className="mw-price-value">
                  {sortedVehicles.length} véhicule{sortedVehicles.length > 1 ? "s" : ""} à {effectivePrice.toLocaleString()} €
                </div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
              <div className="mw-pag-count">
                {sortedVehicles.length} véhicule{sortedVehicles.length > 1 ? "s" : ""} disponible{sortedVehicles.length > 1 ? "s" : ""}
              </div>
              <select
                className="mw-chip"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortBy);
                  setPage(1);
                }}
              >
                <option value="default">Tri : par défaut</option>
                <option value="priceAsc">Tri : prix croissant</option>
                <option value="priceDesc">Tri : prix décroissant</option>
              </select>
            </div>

            {pagedVehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} onChoose={handleChooseVehicle} />
            ))}

            {sortedVehicles.length === 0 && !loading && (
              <div className="mw-empty">Aucun véhicule disponible pour ce trajet avec ces critères.</div>
            )}

            {sortedVehicles.length > 0 && (
              <div className="mw-pagination">
                <div className="mw-pag-count">
                  {sortedVehicles.length} véhicules · page {safePage} / {pageCount}
                </div>
                <div className="mw-pag-controls">
                  <div className="mw-pag-sizes">
                    {[10, 30, 50].map((size) => (
                      <button
                        key={size}
                        className={pageSize === size ? "active" : ""}
                        onClick={() => {
                          setPageSize(size);
                          setPage(1);
                        }}
                      >
                        {size} / page
                      </button>
                    ))}
                  </div>
                  <button className="mw-pag-btn" onClick={() => setPage(safePage - 1)} disabled={safePage <= 1}>←</button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                    <button key={n} className={`mw-pag-num ${n === safePage ? "active" : ""}`} onClick={() => setPage(n)}>
                      {n}
                    </button>
                  ))}
                  <button className="mw-pag-btn" onClick={() => setPage(safePage + 1)} disabled={safePage >= pageCount}>→</button>
                </div>
              </div>
            )}
          </div>

          <aside>
            <SummaryPanel departure={params.departure} returnLocation={effectiveReturn} params={params} />
          </aside>
        </div>
      )}

      {step === "options" && selectedVehicle && (
        <div className="mw-layout">
          <div>
            <div className="mw-options-head">Option sans chauffeur</div>
            <div className="mw-opt-card">
              <div className="mw-opt-ic">🚗</div>
              <div className="mw-opt-main">
                <div className="mw-opt-title">Option sans chauffeur</div>
                <div className="mw-opt-desc">Conduisez vous-même le véhicule sans services additionnels de chauffeur.</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mw-opt-price">{franchiseValue.toLocaleString()} €</div>
                <div className="mw-included">Inclus</div>
              </div>
            </div>

            <div className="mw-options-head">Options disponibles</div>
            {OPTIONS_CATALOG.map((option) => {
              const selected = isOptionSelected(option.id);
              return (
                <div key={option.id} className="mw-opt-card">
                  <div className="mw-opt-ic">📍</div>
                  <div className="mw-opt-main">
                    <div className="mw-opt-title">{option.name}</div>
                    <div className="mw-opt-desc">{option.description}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="mw-opt-price">{option.price} €</div>
                    <div className="mw-opt-per">par jour</div>
                  </div>
                  <button className={`mw-opt-add ${selected ? "added" : ""}`} onClick={() => toggleOption(option.id)}>
                    {selected ? "Ajouté ✓" : "Ajouter ⊕"}
                  </button>
                </div>
              );
            })}

            <div className="mw-note">
              <span>ℹ️</span>
              <span>
                Veuillez noter que la sélection d'une heure de prise en charge ou de retour en dehors des heures
                d'ouverture de l'agence ne permettra que des « demandes de réservation ». Pour des confirmations
                immédiates, veuillez réserver pendant les heures d'ouverture de l'agence.
              </span>
            </div>

            <div className="mw-nav-row">
              <button className="mw-btn-ghost" onClick={() => setStep("vehicles")}>← Revenir à l'étape précédente</button>
              <button className="mw-btn" onClick={() => setStep("devis")}>Étape suivante →</button>
            </div>
          </div>

          <aside>
            <SummaryPanel departure={params.departure} returnLocation={effectiveReturn} params={params} />
            <SummaryVehicle vehicle={selectedVehicle} days={days} />
            <OptionsDetails
              vehiclePrice={vehiclePriceEstimate}
              days={days}
              franchise={franchiseValue}
              restitution={RESTITUTION_FEE}
              optionsPrice={optionsPriceEstimate}
            />
          </aside>
        </div>
      )}

      {step === "devis" && selectedVehicle && (
        <div className="mw-layout">
          <div>
            <div className="mw-form-card">
              <h2>Vos coordonnées</h2>
              <div className="mw-form-grid">
                <div className="mw-field">
                  <label>Nom *</label>
                  <input value={locataire.lastName} onChange={(e) => setLocataire({ ...locataire, lastName: e.target.value })} placeholder="Votre nom" />
                </div>
                <div className="mw-field">
                  <label>Prénom *</label>
                  <input value={locataire.firstName} onChange={(e) => setLocataire({ ...locataire, firstName: e.target.value })} placeholder="Votre prénom" />
                </div>
                <div className="mw-field">
                  <label>Email *</label>
                  <input type="email" value={locataire.email} onChange={(e) => setLocataire({ ...locataire, email: e.target.value })} placeholder="votre.email@exemple.com" />
                </div>
                <div className="mw-field">
                  <label>Téléphone *</label>
                  <input value={locataire.phone} onChange={(e) => setLocataire({ ...locataire, phone: e.target.value })} placeholder="+261 33 00 000 00" />
                </div>
              </div>
              <div className="mw-cgv-card">
                <div className="mw-cgv-head">
                  <div>
                    <div className="mw-cgv-title">Conditions générales</div>
                    <div className="mw-cgv-sub">Consultez nos conditions générales de vente</div>
                  </div>
                  <a className="mw-cgv-link" href="/#contact">Consulter</a>
                </div>
                <p className="mw-cgv-note">Veuillez lire nos conditions avant de les accepter</p>
                <label className="mw-check">
                  <input type="checkbox" checked={acceptedCGV} onChange={(e) => setAcceptedCGV(e.target.checked)} />
                  <span>J'accepte les conditions générales de vente</span>
                </label>
              </div>
            </div>

            <div className="mw-note" style={{ marginTop: 16 }}>
              <span>ℹ️</span>
              <span>
                Dans les 24 heures ouvrables suivant votre réservation, notre équipe vous contactera pour
                finaliser les détails de votre location.
              </span>
            </div>

            <div className="mw-nav-row">
              <button className="mw-btn-ghost" onClick={() => setStep("options")}>← Revenir à l'étape précédente</button>
              <button className="mw-btn" onClick={handleSubmitDevis} disabled={loading}>
                {loading ? "Envoi..." : "Demander un devis ✓"}
              </button>
            </div>
          </div>

          <aside>
            <SummaryVehicle vehicle={selectedVehicle} days={days} />
            <div className="mw-lines">
              <h4>Options détails</h4>
              <div className="mw-line"><span className="mw-included">Inclus</span></div>
              <div className="mw-line"><span>Franchise</span><b>{franchiseValue.toFixed(2)} €</b></div>
              <div className="mw-line"><span>Frais de restitution</span><b>{RESTITUTION_FEE.toFixed(2)} €</b></div>
              <div className="mw-sep" />
              <div className="mw-line"><span>Nombre de jours</span><b>{days} jour{days > 1 ? "s" : ""}</b></div>
              <div className="mw-line"><span>Prix journalier du véhicule</span><b>{selectedVehicle.pricePerDay.toFixed(2)} € TTC</b></div>
              <div className="mw-line"><span>Prix du véhicule</span><b>{vehiclePriceEstimate.toFixed(2)} € TTC</b></div>
              <div className="mw-line"><span>Prix des options</span><b>{optionsPriceEstimate.toFixed(2)} € TTC</b></div>
              <div className="mw-line total"><span>Prix Total à payer</span><b>{totalEstimate.toFixed(2)} € TTC</b></div>
            </div>
          </aside>
        </div>
      )}

      {step === "confirmed" && result && (
        <ConfirmScreen result={result} email={locataire.email} onReset={resetAll} />
      )}

      <Footer />
    </>
  );
}

function VehicleImage({ vehicle, className }: { vehicle: Vehicle; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!vehicle.imageUrl || broken) {
    return <div className={className} style={{ background: "var(--mw-bg)", display: "grid", placeItems: "center", color: "var(--mw-muted)" }}>🚗</div>;
  }
  return <img className={className} src={vehicle.imageUrl} alt={vehicle.name} onError={() => setBroken(true)} />;
}

function VehicleCard({ vehicle, onChoose }: { vehicle: Vehicle; onChoose: (v: Vehicle) => void }) {
  return (
    <div className="mw-vcard">
      <div className="mw-vcard-left">
        <span className="mw-vcard-price">{vehicle.pricePerDay.toLocaleString()} €/jour</span>
        <div className="mw-vcard-name">{vehicle.brand} {vehicle.model}</div>
        <div className="mw-specs">
          <span className="mw-spec">⚙️ {vehicle.transmission}</span>
          <span className="mw-spec">⛽ {vehicle.fuel}</span>
          <span className="mw-spec">👥 {vehicle.seats} Personnes</span>
          <span className="mw-spec">🚪 {vehicle.doors} Portes</span>
          <span className="mw-spec">❄️ Climatisation</span>
          <span className="mw-spec">🧭 GPS</span>
        </div>
        <div className="mw-options-label">Options disponibles</div>
        <div className="mw-vcard-actions">
          <div className="mw-driver-box with">
            <span className="mw-db-title">👥 Avec chauffeur</span>
            <br />Service chauffeur inclus
          </div>
          <div className="mw-driver-box without">
            <span className="mw-db-title">🚗 Sans chauffeur</span>
            <br />Franchise : {franchise(vehicle.type).toLocaleString()} €
          </div>
          <button className="mw-re-server-btn" onClick={() => onChoose(vehicle)}>Réserver</button>
        </div>
      </div>
      <VehicleImage vehicle={vehicle} className="mw-vcard-img" />
    </div>
  );
}

function SummaryPanel(props: { departure: string; returnLocation: string; params?: SearchParams }) {
  const { departure, returnLocation, params } = props;
  return (
    <div className="mw-summary">
      <h3>Mes infos de réservation</h3>
      <div className="mw-sum-row"><span>🏁</span><span><span className="mw-sum-label">Départ</span><br />{departure || "—"}{params?.departure ? ` · ${params.startDate || "—"} à ${params.startTime || "—"}` : ""}</span></div>
      <div className="mw-sum-row"><span>🏁</span><span><span className="mw-sum-label">Retour</span><br />{returnLocation || "—"}{params?.departure ? ` · ${params.endDate || "—"} à ${params.endTime || "—"}` : ""}</span></div>
      {params?.departure && (
        <div className="mw-sum-row"><span>👤</span><span><span className="mw-sum-label">Conducteur</span><br />Âge : {params.driverAge} ans</span></div>
      )}
    </div>
  );
}

function SummaryVehicle({ vehicle, days }: { vehicle: Vehicle; days: number }) {
  return (
    <div style={{ background: "var(--mw-white)", borderRadius: "var(--mw-radius-lg)", boxShadow: "var(--mw-shadow)", overflow: "hidden" }}>
      <VehicleImage vehicle={vehicle} className="mw-svcard-img" />
      <div className="mw-svcard-body">
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--mw-heading)" }}>{vehicle.brand} {vehicle.model}</div>
        <span className="mw-svcard-type">{vehicle.type} · {days} jour{days > 1 ? "s" : ""}</span>
        <div className="mw-specs" style={{ fontSize: 12 }}>
          <span className="mw-spec">⚙️ {vehicle.transmission}</span>
          <span className="mw-spec">⛽ {vehicle.fuel}</span>
          <span className="mw-spec">👥 {vehicle.seats} P.</span>
          <span className="mw-spec">🚪 {vehicle.doors} Portes</span>
        </div>
      </div>
    </div>
  );
}

function OptionsDetails({
  vehiclePrice,
  days,
  franchise: franchiseValue,
  restitution,
  optionsPrice,
}: {
  vehiclePrice: number;
  days: number;
  franchise: number;
  restitution: number;
  optionsPrice: number;
}) {
  const total = vehiclePrice + franchiseValue + restitution + optionsPrice;
  return (
    <div className="mw-lines">
      <h4>Options détails</h4>
      <div className="mw-line"><span className="mw-included">Inclus</span></div>
      <div className="mw-line"><span>Franchise</span><b>{franchiseValue.toFixed(2)} €</b></div>
      <div className="mw-line"><span>Frais de restitution</span><b>{restitution.toFixed(2)} €</b></div>
      <div className="mw-sep" />
      <div className="mw-line"><span>Nombre de jours</span><b>{days} jours</b></div>
      <div className="mw-line"><span>Prix journalier du véhicule</span><b>{days > 0 ? (vehiclePrice / days).toFixed(2) : "0.00"} € TTC</b></div>
      <div className="mw-line"><span>Prix du véhicule</span><b>{vehiclePrice.toFixed(2)} € TTC</b></div>
      <div className="mw-line"><span>Prix de la franchise</span><b>{franchiseValue.toFixed(2)} € TTC</b></div>
      <div className="mw-line"><span>Prix des frais de restitution</span><b>{restitution.toFixed(2)} € TTC</b></div>
      <div className="mw-line"><span>Prix des options</span><b>{optionsPrice.toFixed(2)} € TTC</b></div>
      <div className="mw-note" style={{ marginTop: 8 }}>
        <span>ℹ️</span>
        <span>Détails du prix HT et TVA (information)</span>
      </div>
      <div className="mw-line total"><span>Prix Total à payer</span><b>{total.toFixed(2)} € TTC</b></div>
      <p style={{ fontSize: 10, lineHeight: 1.5, marginTop: 8, color: "var(--mw-muted)" }}>
        Veuillez noter que la somme payable au moment de la réservation comprend l'intégralité de la location
        ainsi que le montant de la franchise assurance qui couvre le conducteur, les passagers et les dommages
        causés au véhicule.
      </p>
    </div>
  );
}

function ConfirmScreen({ result, email, onReset }: { result: ReservationResult; email: string; onReset: () => void }) {
  return (
    <div className="mw-confirm">
      <div className="mw-confirm-icon">✓</div>
      <h1>Demande de réservation envoyée</h1>
      <div className="mw-ref">Votre numéro de devis est le {result.reference}</div>
      <p className="mw-confirm-note">
        Dans les 24 heures ouvrées après votre réservation, vous recevrez un devis et un lien de paiement à
        votre adresse <strong>{email}</strong>.
      </p>
      <div className="mw-note" style={{ textAlign: "left", marginBottom: 14 }}>
        <span>ℹ️</span>
        <span>Vous pouvez gérer votre réservation à tout moment depuis votre espace client.</span>
      </div>
      <button className="mw-btn" onClick={onReset}>Retour à la recherche</button>

      <div className="mw-support-grid">
        <div className="mw-support">
          <h4>📞 Assistance téléphonique</h4>
          <p>+261 45 78 894 45<br />Disponible 24h/24 et 7j/7</p>
        </div>
        <div className="mw-support">
          <h4>✉️ Support par email</h4>
          <p>assistance@madawheels.mg<br />Nous répondons dans les meilleurs délais</p>
        </div>
        <div className="mw-support">
          <h4>📍 Agences</h4>
          <p>Trouvez l'agence la plus proche<br />
            <a className="mw-toggle" href="/#contact">Voir la carte des agences</a>
          </p>
        </div>
      </div>
    </div>
  );
}