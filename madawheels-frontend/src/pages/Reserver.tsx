import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  MapPin, Settings2, Fuel, Users, DoorOpen, Compass,
  Info, CheckCircle2, Phone, Mail, UserRound, Car, ShieldCheck,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchWidget from "../components/SearchWidget";
import VehicleCatalog from "../components/VehicleCatalog";
import { searchVehicles } from "../services/vehicleService";
import { getSession } from "../services/authService";
import { createReservation } from "../services/reservationService";
import { OPTIONS_CATALOG, franchise, RESTITUTION_FEE } from "../constants";
import type { Vehicle, SearchParams, SelectedOption } from "../types/vehicle";
import type { ReservationResult } from "../types/reservation";

type Step = "search" | "vehicles" | "options" | "devis" | "confirmed";
type DriverMode = "with" | "without";

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

// Un service "chauffeur" est identifié par son nom dans le catalogue d'options.
const isDriverOption = (name: string) => /chauffeur/i.test(name);

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 1;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

function optionTotal(optionId: number, days: number): number {
  const option = OPTIONS_CATALOG.find((o) => o.id === optionId);
  if (!option) return 0;
  return option.unit === "jour" ? option.price * days : option.price;
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
  // Agence effectivement utilisée pour la dernière recherche (affichée dans le catalogue).
  const [searchedAgency, setSearchedAgency] = useState("");

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [driverMode, setDriverModeState] = useState<DriverMode>("without");

  const [sameReturn, setSameReturn] = useState(false);

  const [locataire, setLocataire] = useState(() => {
    const session = getSession();
    return session
      ? { firstName: session.firstName, lastName: session.lastName, email: session.email, phone: session.phone }
      : { firstName: "", lastName: "", email: "", phone: "" };
  });
  const [acceptedCGV, setAcceptedCGV] = useState(false);
  const [result, setResult] = useState<ReservationResult | null>(null);

  const effectiveReturn = sameReturn ? params.departure : params.returnLocation;

  const driverOptions = OPTIONS_CATALOG.filter((o) => isDriverOption(o.name));
  const extraOptions = OPTIONS_CATALOG.filter((o) => !isDriverOption(o.name));
  const driverOptionIds = new Set(driverOptions.map((o) => o.id));
  const selectedDriverCount = selectedOptions.filter((o) => driverOptionIds.has(o.optionId)).length;

  const setDriverMode = (mode: DriverMode) => {
    setDriverModeState(mode);
    if (mode === "without") {
      // On retire les services chauffeur déjà ajoutés si on repasse en "sans chauffeur".
      setSelectedOptions((prev) => prev.filter((o) => !driverOptionIds.has(o.optionId)));
    }
  };

  const handleSearch = async () => {
    const effective = sameReturn ? params.departure : params.returnLocation;
    if (!params.departure || !effective || !params.startDate || !params.endDate) {
      toast.error("Veuillez renseigner le lieu de départ, le lieu de retour et les deux dates pour lancer la recherche.");
      return;
    }
    setLoading(true);
    setStep("vehicles");
    setVehicles([]);
    try {
      // Le serveur ne renvoie que les véhicules de l'agence de départ,
      // libres sur la période demandée.
      const results = await searchVehicles({ ...params, returnLocation: effective });
      setVehicles(results);
      setSearchedAgency(params.departure);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la recherche.");
      setStep("search");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    if (qp.get("departure") && qp.get("startDate") && qp.get("endDate") && step === "search") {
      void handleSearch();
    }
    // Le formulaire vient d'être initialisé depuis l'URL : on lance la recherche une seule fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChooseVehicle = (v: Vehicle) => {
    setSelectedVehicle(v);
    setSelectedOptions([]);
    setDriverModeState("without");
    setStep("options");
  };

  const isOptionSelected = (id: number) => selectedOptions.some((o) => o.optionId === id);

  const toggleOption = (id: number) => {
    setSelectedOptions((prev) =>
      isOptionSelected(id) ? prev.filter((o) => o.optionId !== id) : [...prev, { optionId: id, quantity: 1 }]
    );
  };

  const handleNextFromOptions = () => {
    if (driverMode === "with" && selectedDriverCount === 0) {
      toast.error("Sélectionnez au moins un service chauffeur (en ville ou hors ville) pour continuer.");
      return;
    }
    setStep("devis");
  };

  const days = daysBetween(params.startDate, params.endDate);
  const vehiclePriceEstimate = selectedVehicle ? selectedVehicle.pricePerDay * days : 0;
  // La franchise ne s'applique qu'en mode "sans chauffeur" : avec chauffeur, le
  // conducteur professionnel de MadaWheels couvre la conduite du véhicule.
  const franchiseValue = selectedVehicle && driverMode === "without" ? franchise(selectedVehicle.type) : 0;
  const optionsPriceEstimate = selectedOptions.reduce((sum, sel) => sum + optionTotal(sel.optionId, days), 0);
  const totalEstimate = vehiclePriceEstimate + optionsPriceEstimate + franchiseValue + RESTITUTION_FEE;

  const handleSubmitDevis = async () => {
    if (!selectedVehicle) return;
    if (!locataire.firstName || !locataire.lastName || !locataire.email || !locataire.phone) {
      toast.error("Merci de compléter vos coordonnées.");
      return;
    }
    if (!acceptedCGV) {
      toast.error("Merci d'accepter les conditions générales de vente.");
      return;
    }
    setLoading(true);
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
      toast.success("Demande de devis envoyée avec succès !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la demande de devis.");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setStep("search");
    setParams(emptyParams);
    setVehicles([]);
    setSearchedAgency("");
    setSelectedVehicle(null);
    setSelectedOptions([]);
    setDriverModeState("without");
    setSameReturn(false);
    setLocataire({ firstName: "", lastName: "", email: "", phone: "" });
    setAcceptedCGV(false);
    setResult(null);
  };

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
            <motion.div
              className="mw-step-num"
              animate={step === s.id ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {i + 1}
            </motion.div>
            <div className="mw-step-label">
              <span className="mw-step-title">{s.title}</span>
              <span className="mw-step-sub">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
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
              <VehicleCatalog
                vehicles={vehicles}
                loading={loading}
                agency={searchedAgency}
                onChoose={handleChooseVehicle}
              />
              <aside>
                <SummaryPanel departure={params.departure} returnLocation={effectiveReturn} params={params} />
              </aside>
            </div>
          )}

          {step === "options" && selectedVehicle && (
            <div className="mw-layout">
              <div>
                {/* ---------- Choix du mode de conduite ---------- */}
                <label className="mw-radio-row">
                  <input
                    type="radio"
                    name="driverMode"
                    checked={driverMode === "without"}
                    onChange={() => setDriverMode("without")}
                  />
                  <span><Car size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Option sans chauffeur</span>
                </label>

                {driverMode === "without" && (
                  <div className="mw-opt-card">
                    <div className="mw-opt-ic"><Compass size={20} /></div>
                    <div className="mw-opt-main">
                      <div className="mw-opt-title">Option sans chauffeur</div>
                      <div className="mw-opt-desc">Conduisez vous-même le véhicule. Une franchise assurance s'applique.</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="mw-opt-price">{franchiseValue.toLocaleString()} €</div>
                      <div className="mw-included">Franchise</div>
                    </div>
                  </div>
                )}

                <label className="mw-radio-row" style={{ marginTop: 18 }}>
                  <input
                    type="radio"
                    name="driverMode"
                    checked={driverMode === "with"}
                    onChange={() => setDriverMode("with")}
                  />
                  <span><Users size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Avec chauffeur</span>
                </label>

                {driverMode === "with" && (
                  <>
                    {driverOptions.map((option) => {
                      const selected = isOptionSelected(option.id);
                      return (
                        <div key={option.id} className="mw-opt-card">
                          <div className="mw-opt-ic"><MapPin size={20} /></div>
                          <div className="mw-opt-main">
                            <div className="mw-opt-title">{option.name}</div>
                            <div className="mw-opt-desc">{option.description}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div className="mw-opt-price">{option.price} €</div>
                            <div className="mw-opt-per">par jour</div>
                          </div>
                          <motion.button
                            className={`mw-opt-add ${selected ? "added" : ""}`}
                            onClick={() => toggleOption(option.id)}
                            whileTap={{ scale: 0.94 }}
                          >
                            {selected ? "Ajouté ✓" : "Ajouter ⊕"}
                          </motion.button>
                        </div>
                      );
                    })}
                    {selectedDriverCount === 0 && (
                      <div className="mw-note">
                        <Info size={15} />
                        <span>Sélectionnez au moins un service chauffeur (en ville et/ou hors ville) pour continuer.</span>
                      </div>
                    )}
                  </>
                )}

                {/* ---------- Options additionnelles, indépendantes du mode ---------- */}
                {extraOptions.length > 0 && (
                  <>
                    <div className="mw-options-head">Options additionnelles</div>
                    {extraOptions.map((option) => {
                      const selected = isOptionSelected(option.id);
                      return (
                        <div key={option.id} className="mw-opt-card">
                          <div className="mw-opt-ic"><MapPin size={20} /></div>
                          <div className="mw-opt-main">
                            <div className="mw-opt-title">{option.name}</div>
                            <div className="mw-opt-desc">{option.description}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div className="mw-opt-price">{option.price} €</div>
                            <div className="mw-opt-per">par jour</div>
                          </div>
                          <motion.button
                            className={`mw-opt-add ${selected ? "added" : ""}`}
                            onClick={() => toggleOption(option.id)}
                            whileTap={{ scale: 0.94 }}
                          >
                            {selected ? "Ajouté ✓" : "Ajouter ⊕"}
                          </motion.button>
                        </div>
                      );
                    })}
                  </>
                )}

                <div className="mw-note">
                  <Info size={15} />
                  <span>
                    Veuillez noter que la sélection d'une heure de prise en charge ou de retour en dehors des heures
                    d'ouverture de l'agence ne permettra que des « demandes de réservation ». Pour des confirmations
                    immédiates, veuillez réserver pendant les heures d'ouverture de l'agence.
                  </span>
                </div>

                <div className="mw-nav-row">
                  <button className="mw-btn-ghost" onClick={() => setStep("vehicles")}>← Revenir à l'étape précédente</button>
                  <button className="mw-btn" onClick={handleNextFromOptions}>Étape suivante →</button>
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
                  driverMode={driverMode}
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
                  <Info size={15} />
                  <span>
                    Dans les 24 heures ouvrables suivant votre réservation, notre équipe vous contactera pour
                    finaliser les détails de votre location.
                  </span>
                </div>

                <div className="mw-nav-row">
                  <button className="mw-btn-ghost" onClick={() => setStep("options")}>← Revenir à l'étape précédente</button>
                  <motion.button className="mw-btn" onClick={handleSubmitDevis} disabled={loading} whileTap={{ scale: 0.96 }}>
                    {loading ? "Envoi..." : "Demander un devis ✓"}
                  </motion.button>
                </div>
              </div>

              <aside>
                <SummaryVehicle vehicle={selectedVehicle} days={days} />
                <div className="mw-lines">
                  <h4>Options détails</h4>
                  <div className="mw-line">
                    <span>{driverMode === "with" ? "Avec chauffeur" : "Sans chauffeur"}</span>
                    <span className="mw-included">{driverMode === "with" ? "Sélectionné" : "Inclus"}</span>
                  </div>
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
        </motion.div>
      </AnimatePresence>

      <Footer />
    </>
  );
}

function VehicleImage({ vehicle, className }: { vehicle: Vehicle; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!vehicle.imageUrl || broken) {
    return (
      <div className={className} style={{ background: "var(--mw-bg)", display: "grid", placeItems: "center", color: "var(--mw-muted)" }}>
        <MapPin size={22} />
      </div>
    );
  }
  return <img className={className} src={vehicle.imageUrl} alt={vehicle.name} onError={() => setBroken(true)} />;
}

function SummaryPanel(props: { departure: string; returnLocation: string; params?: SearchParams }) {
  const { departure, returnLocation, params } = props;
  return (
    <div className="mw-summary">
      <h3>Mes infos de réservation</h3>
      <div className="mw-sum-row">
        <MapPin size={15} />
        <span><span className="mw-sum-label">Départ</span><br />{departure || "—"}{params?.departure ? ` · ${params.startDate || "—"} à ${params.startTime || "—"}` : ""}</span>
      </div>
      <div className="mw-sum-row">
        <MapPin size={15} />
        <span><span className="mw-sum-label">Retour</span><br />{returnLocation || "—"}{params?.departure ? ` · ${params.endDate || "—"} à ${params.endTime || "—"}` : ""}</span>
      </div>
      {params?.departure && (
        <div className="mw-sum-row">
          <UserRound size={15} />
          <span><span className="mw-sum-label">Conducteur</span><br />Âge : {params.driverAge} ans</span>
        </div>
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
          <span className="mw-spec"><Settings2 size={12} /> {vehicle.transmission}</span>
          <span className="mw-spec"><Fuel size={12} /> {vehicle.fuel}</span>
          <span className="mw-spec"><Users size={12} /> {vehicle.seats} P.</span>
          <span className="mw-spec"><DoorOpen size={12} /> {vehicle.doors} Portes</span>
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
  driverMode,
}: {
  vehiclePrice: number;
  days: number;
  franchise: number;
  restitution: number;
  optionsPrice: number;
  driverMode: DriverMode;
}) {
  const total = vehiclePrice + franchiseValue + restitution + optionsPrice;
  return (
    <div className="mw-lines">
      <h4>Options détails</h4>
      <div className="mw-line">
        <span>{driverMode === "with" ? <><Users size={13} style={{ verticalAlign: -2, marginRight: 4 }} />Avec chauffeur</> : <><Car size={13} style={{ verticalAlign: -2, marginRight: 4 }} />Sans chauffeur</>}</span>
      </div>
      {driverMode === "without" ? (
        <div className="mw-line"><span>Franchise</span><b>{franchiseValue.toFixed(2)} €</b></div>
      ) : (
        <div className="mw-line"><span className="mw-included"><ShieldCheck size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Sans franchise, chauffeur inclus</span></div>
      )}
      <div className="mw-line"><span>Frais de restitution</span><b>{restitution.toFixed(2)} €</b></div>
      <div className="mw-sep" />
      <div className="mw-line"><span>Nombre de jours</span><b>{days} jours</b></div>
      <div className="mw-line"><span>Prix journalier du véhicule</span><b>{days > 0 ? (vehiclePrice / days).toFixed(2) : "0.00"} € TTC</b></div>
      <div className="mw-line"><span>Prix du véhicule</span><b>{vehiclePrice.toFixed(2)} € TTC</b></div>
      <div className="mw-line"><span>Prix de la franchise</span><b>{franchiseValue.toFixed(2)} € TTC</b></div>
      <div className="mw-line"><span>Prix des frais de restitution</span><b>{restitution.toFixed(2)} € TTC</b></div>
      <div className="mw-line"><span>Prix des options</span><b>{optionsPrice.toFixed(2)} € TTC</b></div>
      <div className="mw-note" style={{ marginTop: 8 }}>
        <Info size={14} />
        <span>Détails du prix HT et TVA (information)</span>
      </div>
      <div className="mw-line total"><span>Prix Total à payer</span><b>{total.toFixed(2)} € TTC</b></div>
      <p style={{ fontSize: 10, lineHeight: 1.5, marginTop: 8, color: "var(--mw-muted)" }}>
        {driverMode === "without"
          ? "Veuillez noter que la somme payable au moment de la réservation comprend l'intégralité de la location ainsi que le montant de la franchise assurance qui couvre le conducteur, les passagers et les dommages causés au véhicule."
          : "Un chauffeur professionnel MadaWheels prend en charge la conduite du véhicule : aucune franchise assurance conducteur ne s'applique dans ce mode."}
      </p>
    </div>
  );
}

function ConfirmScreen({ result, email, onReset }: { result: ReservationResult; email: string; onReset: () => void }) {
  return (
    <motion.div
      className="mw-confirm"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="mw-confirm-icon"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
      >
        <CheckCircle2 size={40} />
      </motion.div>
      <h1>Demande de réservation envoyée</h1>
      <div className="mw-ref">Votre numéro de devis est le {result.reference}</div>
      <p className="mw-confirm-note">
        Dans les 24 heures ouvrées après votre réservation, vous recevrez un devis et un lien de paiement à
        votre adresse <strong>{email}</strong>.
      </p>
      <div className="mw-note" style={{ textAlign: "left", marginBottom: 14 }}>
        <Info size={15} />
        <span>Vous pouvez gérer votre réservation à tout moment depuis votre espace client.</span>
      </div>
      <button className="mw-btn" onClick={onReset}>Retour à la recherche</button>

      <div className="mw-support-grid">
        <div className="mw-support">
          <h4><Phone size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Assistance téléphonique</h4>
          <p>+261 45 78 894 45<br />Disponible 24h/24 et 7j/7</p>
        </div>
        <div className="mw-support">
          <h4><Mail size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Support par email</h4>
          <p>assistance@madawheels.mg<br />Nous répondons dans les meilleurs délais</p>
        </div>
        <div className="mw-support">
          <h4><MapPin size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Agences</h4>
          <p>Trouvez l'agence la plus proche<br />
            <a className="mw-toggle" href="/#contact">Voir la carte des agences</a>
          </p>
        </div>
      </div>
    </motion.div>
  );
}