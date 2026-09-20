import type { Vehicle } from '../types/vehicle';
import './VehicleCard.css';

interface VehicleCardProps {
    vehicle: Vehicle;
    selected?: boolean;
    onChoose?: () => void;
}

function VehicleIcon({ type }: { type: string }) {
    const isBus = type.toLowerCase() === 'bus';

    return (
        <svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg" className="vehicle-icon">
            <rect x="0" y="0" width="200" height="110" rx="12" fill="#fef9c3" />
            {isBus ? (
                <>
                    <rect x="20" y="30" width="160" height="45" rx="8" fill="#111827" />
                    <rect x="30" y="38" width="26" height="18" rx="3" fill="#facc15" />
                    <rect x="62" y="38" width="26" height="18" rx="3" fill="#facc15" />
                    <rect x="94" y="38" width="26" height="18" rx="3" fill="#facc15" />
                    <rect x="126" y="38" width="26" height="18" rx="3" fill="#facc15" />
                    <circle cx="50" cy="80" r="11" fill="#1f2937" />
                    <circle cx="150" cy="80" r="11" fill="#1f2937" />
                </>
            ) : (
                <>
                    <path d="M35 70 L45 42 Q50 33 62 33 L138 33 Q150 33 155 42 L165 70 Z" fill="#111827" />
                    <rect x="58" y="40" width="84" height="24" rx="5" fill="#facc15" />
                    <circle cx="58" cy="78" r="12" fill="#1f2937" />
                    <circle cx="142" cy="78" r="12" fill="#1f2937" />
                </>
            )}
        </svg>
    );
}

function VehicleCard({ vehicle, selected = false, onChoose }: VehicleCardProps) {
    return (
        <div className={`vehicle-card ${selected ? 'vehicle-card-selected' : ''}`}>
            <VehicleIcon type={vehicle.type} />

            <div className="vehicle-card-header">
                <h3>{vehicle.name}</h3>
                <span className={`badge ${vehicle.available ? 'available' : 'unavailable'}`}>
                    {vehicle.available ? 'Disponible' : 'Indisponible'}
                </span>
            </div>
            <p className="vehicle-type">{vehicle.type}</p>
            <p className="vehicle-price">{vehicle.price.toLocaleString('fr-FR')} Ar</p>
            <button className="choose-button" onClick={onChoose}>
                {selected ? '✓ Sélectionné' : 'Choisir'}
            </button>
        </div>
    );
}

export default VehicleCard;