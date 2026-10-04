import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Pencil, Trash2, Search, Settings2, Fuel, Users, DoorOpen, ImagePlus,
  Car, MapPin, Eye, EyeOff, Plus, Save, X,
} from "lucide-react";
import AdminHeader from "../../components/AdminHeader";
import Footer from "../../components/Footer";
import { adminSearchVehicles, createVehicle, updateVehicle, deleteVehicle } from "../../services/adminService";
import { uploadVehicleImage } from "../../services/uploadService";
import { VEHICLE_TYPES, AGENCIES } from "../../constants";
import type { Vehicle } from "../../types/vehicle";
import "./AdminVehicles.css";

const MAX_IMAGE_MB = 5;
const ACCEPTED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const TRANSMISSIONS = ["Automatique", "Manuelle"];
const FUELS = ["Essence", "Diesel"];

interface FormState {
  name: string;
  brand: string;
  model: string;
  type: string;
  transmission: string;
  seats: string;
  doors: string;
  fuel: string;
  pricePerDay: string;
  description: string;
  departure: string;
  available: boolean;
}

const emptyForm = (): FormState => ({
  name: "",
  brand: "",
  model: "",
  type: VEHICLE_TYPES[0]?.value ?? "",
  transmission: "Automatique",
  seats: "5",
  doors: "4",
  fuel: "Essence",
  pricePerDay: "",
  description: "",
  departure: AGENCIES[0] ?? "",
  available: true,
});

// Certaines lignes en base contiennent « Gasoline » / « Manual » : on les ramène aux valeurs des listes.
const normalizeFuel = (f: string) => (/gasoline|essence|petrol/i.test(f) ? "Essence" : /diesel/i.test(f) ? "Diesel" : f);
const normalizeTransmission = (t: string) => (/manu/i.test(t) ? "Manuelle" : /auto/i.test(t) ? "Automatique" : t);

type StatusFilter = "all" | "on" | "off";

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <div className="mwa-field">
      <label>{label}{required && <span className="req"> *</span>}</label>
      {children}
      {hint && <span className="mwa-hint">{hint}</span>}
    </div>
  );
}

function Thumb({ src, alt }: { src?: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return <Car size={40} className="ph" />;
  return <img src={src} alt={alt} onError={() => setBroken(true)} />;
}

function CardSkeleton() {
  return (
    <div className="mwa-card">
      <Skeleton height={150} />
      <div className="mwa-card-body">
        <Skeleton width="60%" height={18} />
        <Skeleton height={13} />
        <Skeleton height={34} />
      </div>
    </div>
  );
}

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");
  const [existingImage, setExistingImage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef("");

  const preview = localPreview || existingImage;

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const load = async (kw = "") => {
    setLoading(true);
    try {
      setVehicles(await adminSearchVehicles(kw));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setLocalImage = (file: File | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = file ? URL.createObjectURL(file) : "";
    setImageFile(file);
    setLocalPreview(previewRef.current);
  };

  const pickFile = (file?: File) => {
    if (!file) return;
    if (!ACCEPTED_IMAGES.includes(file.type)) {
      toast.error("Format non supporté : utilisez une image JPG, PNG, WEBP ou GIF.");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image trop volumineuse (${MAX_IMAGE_MB} Mo maximum).`);
      return;
    }
    setLocalImage(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setLocalImage(null);
    setExistingImage("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const startEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setForm({
      name: v.name,
      brand: v.brand,
      model: v.model,
      type: v.type,
      transmission: normalizeTransmission(v.transmission),
      seats: String(v.seats),
      doors: String(v.doors),
      fuel: normalizeFuel(v.fuel),
      pricePerDay: String(v.pricePerDay),
      description: v.description ?? "",
      departure: v.departure,
      available: v.available,
    });
    setLocalImage(null);
    setExistingImage(v.imageUrl ?? "");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async () => {
    const brand = form.brand.trim();
    const model = form.model.trim();
    const seats = Number(form.seats);
    const doors = Number(form.doors);
    const price = Number(form.pricePerDay);

    if (!brand || !model) {
      toast.error("La marque et le modèle sont obligatoires.");
      return;
    }
    if (!(price > 0)) {
      toast.error("Indiquez un prix par jour supérieur à 0.");
      return;
    }
    if (!(seats >= 1) || !(doors >= 1)) {
      toast.error("Le nombre de places et de portes doit être d'au moins 1.");
      return;
    }

    setBusy(true);
    try {
      // 1) Import de l'image choisie sur l'appareil (le cas échéant).
      const imageUrl = imageFile ? await uploadVehicleImage(imageFile) : existingImage;

      // 2) Enregistrement du véhicule.
      const payload: Omit<Vehicle, "id"> = {
        name: form.name.trim() || `${brand} ${model}`,
        brand,
        model,
        type: form.type,
        transmission: form.transmission,
        seats,
        doors,
        fuel: form.fuel,
        pricePerDay: price,
        imageUrl,
        description: form.description.trim(),
        departure: form.departure,
        available: form.available,
      };

      if (editingId) {
        await updateVehicle(editingId, payload);
        toast.success("Véhicule modifié : le catalogue client est à jour.");
      } else {
        await createVehicle(payload);
        toast.success("Véhicule ajouté au catalogue client.");
      }
      resetForm();
      await load(keyword);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (v: Vehicle) => {
    if (!window.confirm(`Confirmer la suppression de « ${v.brand} ${v.model} » ?`)) return;
    setBusy(true);
    try {
      toast.success(await deleteVehicle(v.id));
      if (editingId === v.id) resetForm();
      await load(keyword);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setBusy(false);
    }
  };

  const toggleAvailability = async (v: Vehicle) => {
    setBusy(true);
    try {
      await updateVehicle(v.id, { available: !v.available });
      toast.success(v.available ? "Véhicule masqué du catalogue client." : "Véhicule visible dans le catalogue client.");
      await load(keyword);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour.");
    } finally {
      setBusy(false);
    }
  };

  const visible = useMemo(
    () =>
      vehicles.filter((v) =>
        statusFilter === "all" ? true : statusFilter === "on" ? v.available : !v.available
      ),
    [vehicles, statusFilter]
  );
  const countOn = vehicles.filter((v) => v.available).length;

  return (
    <>
      <AdminHeader />
      <main className="mw-container mwa-page">
        <h1 className="mwa-title">Administration · Véhicules</h1>
        <p className="mwa-subtitle">
          Les véhicules « Disponibles » sont affichés dans le catalogue client. Toute modification s'applique immédiatement.
        </p>

        <div className="mwa-layout">
          {/* ---------- Formulaire ---------- */}
          <div className="mwa-form" ref={formRef}>
            <div className="mwa-form-head">
              <h2>{editingId ? "Modifier le véhicule" : "Ajouter un véhicule"}</h2>
              {editingId && <span className="mwa-edit-badge">Édition #{editingId}</span>}
            </div>

            <div className="mwa-section">
              <div className="mwa-section-title">Identité</div>
              <div className="mwa-grid2">
                <Field label="Marque" required>
                  <input value={form.brand} onChange={(e) => setField("brand", e.target.value)} placeholder="Ex : Toyota" />
                </Field>
                <Field label="Modèle" required>
                  <input value={form.model} onChange={(e) => setField("model", e.target.value)} placeholder="Ex : RAV4" />
                </Field>
              </div>
              <Field label="Nom" hint="Facultatif : par défaut « Marque Modèle ».">
                <input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Nom interne du véhicule" />
              </Field>
              <Field label="Type" required>
                <select value={form.type} onChange={(e) => setField("type", e.target.value)}>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.value}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mwa-section">
              <div className="mwa-section-title">Caractéristiques</div>
              <div className="mwa-grid2">
                <Field label="Transmission" required>
                  <select value={form.transmission} onChange={(e) => setField("transmission", e.target.value)}>
                    {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Carburant" required>
                  <select value={form.fuel} onChange={(e) => setField("fuel", e.target.value)}>
                    {FUELS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
              </div>
              <div className="mwa-grid3">
                <Field label="Places" required>
                  <input type="number" min={1} value={form.seats} onChange={(e) => setField("seats", e.target.value)} />
                </Field>
                <Field label="Portes" required>
                  <input type="number" min={1} value={form.doors} onChange={(e) => setField("doors", e.target.value)} />
                </Field>
                <Field label="Prix / jour" required>
                  <div className="mwa-input-suffix">
                    <input type="number" min={0} value={form.pricePerDay} onChange={(e) => setField("pricePerDay", e.target.value)} placeholder="0" />
                    <span>€</span>
                  </div>
                </Field>
              </div>
            </div>

            <div className="mwa-section">
              <div className="mwa-section-title">Disponibilité</div>
              <Field label="Agence d'attache" required hint="Informatif : le catalogue client affiche la flotte complète pour toutes les agences.">
                <select value={form.departure} onChange={(e) => setField("departure", e.target.value)}>
                  {AGENCIES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Visible dans le catalogue client">
                <div className="mwa-segment">
                  <button type="button" className={form.available ? "on" : ""} onClick={() => setField("available", true)}>Disponible</button>
                  <button type="button" className={!form.available ? "off" : ""} onClick={() => setField("available", false)}>Indisponible</button>
                </div>
              </Field>
            </div>

            <div className="mwa-section">
              <div className="mwa-section-title">Image & description</div>
              <Field label="Image du véhicule" hint={`JPG, PNG, WEBP ou GIF · ${MAX_IMAGE_MB} Mo maximum · importée depuis votre appareil`}>
                <div
                  className={`mwa-drop ${dragging ? "drag" : ""}`}
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                >
                  {preview ? (
                    <img src={preview} alt="Aperçu du véhicule" />
                  ) : (
                    <div>
                      <ImagePlus size={30} />
                      <strong>Cliquez ou déposez une image ici</strong>
                      <small>Importer depuis l'appareil</small>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept={ACCEPTED_IMAGES.join(",")}
                  hidden
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {preview && (
                  <div className="mwa-image-actions">
                    <button type="button" className="mwa-btn" onClick={() => fileInput.current?.click()}>
                      <ImagePlus size={13} /> Changer l'image
                    </button>
                    {imageFile && (
                      <button type="button" className="mwa-btn" onClick={() => setLocalImage(null)}>
                        <X size={13} /> Annuler l'import
                      </button>
                    )}
                  </div>
                )}
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Points forts, équipements, usage conseillé…"
                />
              </Field>
            </div>

            <div className="mwa-form-actions">
              {editingId && (
                <button type="button" className="mw-btn-ghost" onClick={resetForm} disabled={busy}>Annuler</button>
              )}
              <motion.button className="mw-btn" onClick={submit} disabled={busy} whileTap={{ scale: 0.97 }}>
                {editingId ? <Save size={15} /> : <Plus size={15} />}
                {busy ? "Enregistrement..." : editingId ? "Enregistrer" : "Ajouter le véhicule"}
              </motion.button>
            </div>
          </div>

          {/* ---------- Liste ---------- */}
          <section>
            <div className="mwa-toolbar">
              <div className="mwa-search">
                <Search size={16} />
                <input
                  placeholder="Rechercher par nom, marque ou modèle…"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load(keyword)}
                />
              </div>
              <button className="mw-btn" onClick={() => load(keyword)}>Rechercher</button>
            </div>

            <div className="mwa-chips">
              <button className={`mwa-chip ${statusFilter === "all" ? "active" : ""}`} onClick={() => setStatusFilter("all")}>
                Tous ({vehicles.length})
              </button>
              <button className={`mwa-chip ${statusFilter === "on" ? "active" : ""}`} onClick={() => setStatusFilter("on")}>
                Disponibles ({countOn})
              </button>
              <button className={`mwa-chip ${statusFilter === "off" ? "active" : ""}`} onClick={() => setStatusFilter("off")}>
                Indisponibles ({vehicles.length - countOn})
              </button>
              <span className="mwa-count">{visible.length} affiché{visible.length > 1 ? "s" : ""}</span>
            </div>

            {loading ? (
              <div className="mwa-grid">
                {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : visible.length === 0 ? (
              <div className="mwa-empty">Aucun véhicule trouvé.</div>
            ) : (
              <div className="mwa-grid">
                {visible.map((v, i) => (
                  <motion.article
                    key={v.id}
                    className={`mwa-card ${v.available ? "" : "off"} ${editingId === v.id ? "editing" : ""}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                  >
                    <div className="mwa-thumb">
                      <Thumb src={v.imageUrl} alt={`${v.brand} ${v.model}`} />
                      <span className={`mwa-status ${v.available ? "on" : "off"}`}>
                        {v.available ? "Disponible" : "Indisponible"}
                      </span>
                      <span className="mwa-price">{v.pricePerDay.toLocaleString()} €/jour</span>
                    </div>
                    <div className="mwa-card-body">
                      <div className="mwa-card-top">
                        <div>
                          <h3 className="mwa-card-name">{v.brand} {v.model}</h3>
                          <div className="mwa-card-meta">
                            <span>{v.type}</span>
                            <span>·</span>
                            <span><MapPin size={11} style={{ verticalAlign: -1 }} /> {v.departure}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mwa-specs">
                        <span><Settings2 size={14} /> {normalizeTransmission(v.transmission)}</span>
                        <span><Fuel size={14} /> {normalizeFuel(v.fuel)}</span>
                        <span><Users size={14} /> {v.seats} places</span>
                        <span><DoorOpen size={14} /> {v.doors} portes</span>
                      </div>
                      {v.description && <p className="mwa-card-desc">{v.description}</p>}
                      <div className="mwa-card-actions">
                        <button className="mwa-btn" onClick={() => startEdit(v)} disabled={busy}>
                          <Pencil size={13} /> Modifier
                        </button>
                        <button className="mwa-btn" onClick={() => toggleAvailability(v)} disabled={busy}>
                          {v.available ? <><EyeOff size={13} /> Masquer</> : <><Eye size={13} /> Afficher</>}
                        </button>
                        <button className="mwa-btn danger" onClick={() => handleDelete(v)} disabled={busy}>
                          <Trash2 size={13} /> Supprimer
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}