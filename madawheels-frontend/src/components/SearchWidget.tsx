import { AGENCIES } from "../constants";
import type { SearchParams } from "../types/vehicle";

interface Props {
  values: SearchParams;
  onChange: (p: SearchParams) => void;
  onSearch: () => void;
  loading?: boolean;
  sameReturn?: boolean;
  onSameReturn?: (b: boolean) => void;
  overlap?: boolean;
  buttonLabel?: string;
}

export default function SearchWidget({
  values,
  onChange,
  onSearch,
  loading,
  sameReturn,
  onSameReturn,
  overlap,
  buttonLabel = "🔍 Trouver un véhicule",
}: Props) {
  const set = (name: keyof SearchParams, value: string | number) =>
    onChange({ ...values, [name]: value });

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className={`mw-widget ${overlap ? "overlap" : ""}`}>
      <div className="mw-field">
        <label>📍 Lieu de départ</label>
        <select value={values.departure} onChange={(e) => set("departure", e.target.value)}>
          <option value="">Sélectionner un lieu</option>
          {AGENCIES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="mw-field">
        <label>📍 Lieu de retour</label>
        <select
          value={sameReturn ? values.departure : values.returnLocation}
          onChange={(e) => set("returnLocation", e.target.value)}
          disabled={sameReturn}
        >
          <option value="">Sélectionner un lieu</option>
          {AGENCIES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="mw-field">
        <label>📅 Date de départ</label>
        <input
          type="date"
          min={today}
          value={values.startDate}
          onChange={(e) => {
            set("startDate", e.target.value);
            if (values.endDate && e.target.value > values.endDate) set("endDate", "");
          }}
        />
      </div>

      <div className="mw-field">
        <label>🕐 Heure de départ</label>
        <input type="time" value={values.startTime} onChange={(e) => set("startTime", e.target.value)} />
      </div>

      <div className="mw-field">
        <label>📅 Date de retour</label>
        <input
          type="date"
          min={values.startDate || today}
          value={values.endDate}
          onChange={(e) => set("endDate", e.target.value)}
        />
      </div>

      <div className="mw-field">
        <label>🕐 Heure de retour</label>
        <input type="time" value={values.endTime} onChange={(e) => set("endTime", e.target.value)} />
      </div>

      <div className="mw-field">
        <label>Âge</label>
        <div className="mw-age">
          <input
            type="number"
            min={23}
            title="L'âge minimum du conducteur est 23 ans"
            value={values.driverAge}
            onChange={(e) => set("driverAge", Number(e.target.value))}
          />
          <span className="mw-age-plus">+</span>
        </div>
      </div>

      {sameReturn !== undefined && onSameReturn && (
        <label className="mw-same-return">
          <input type="checkbox" checked={sameReturn} onChange={(e) => onSameReturn(e.target.checked)} />
          <span>Retour au même endroit</span>
        </label>
      )}

      <button className="mw-widget-btn" onClick={onSearch} disabled={loading}>
        {loading ? "Recherche..." : buttonLabel}
      </button>
    </div>
  );
}