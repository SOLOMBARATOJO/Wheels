import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import VehicleCard from '../components/VehicleCard';
import type { Vehicle } from '../types/vehicle';
import { searchVehicles, formatXml } from '../services/soapService';
import './VehiclesPage.css';

type SortOrder = 'none' | 'asc' | 'desc';

function VehiclesPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [requestXml, setRequestXml] = useState('');
    const [responseXml, setResponseXml] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [typeFilter, setTypeFilter] = useState<string>('Tous');
    const [sortOrder, setSortOrder] = useState<SortOrder>('none');
    const [maxPrice, setMaxPrice] = useState<number>(0);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const departure = searchParams.get('departure') ?? '';
    const destination = searchParams.get('destination') ?? '';
    const date = searchParams.get('date') ?? '';
    const time = searchParams.get('time') ?? '';

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setError(null);
        setTypeFilter('Tous');
        setSortOrder('none');
        setSelectedId(null);

        searchVehicles({ departure, destination, date, time })
            .then((result) => {
                setVehicles(result.vehicles);
                setRequestXml(result.requestXml);
                setResponseXml(result.responseXml);
                const highest = Math.max(0, ...result.vehicles.map((v) => v.price));
                setMaxPrice(highest);
            })
            .catch(() => setError('Impossible de contacter le service. Vérifiez que le serveur est démarré.'))
            .finally(() => setLoading(false));
    }, [departure, destination, date, time]);

    const priceCeiling = useMemo(
        () => Math.max(0, ...vehicles.map((v) => v.price)),
        [vehicles]
    );

    const availableTypes = useMemo(() => {
        const types = Array.from(new Set(vehicles.map((v) => v.type)));
        return ['Tous', ...types];
    }, [vehicles]);

    const displayedVehicles = useMemo(() => {
        let result = vehicles.filter((v) => v.price <= maxPrice);

        if (typeFilter !== 'Tous') {
            result = result.filter((v) => v.type === typeFilter);
        }

        if (sortOrder === 'asc') {
            result = [...result].sort((a, b) => a.price - b.price);
        } else if (sortOrder === 'desc') {
            result = [...result].sort((a, b) => b.price - a.price);
        }

        return result;
    }, [vehicles, typeFilter, sortOrder, maxPrice]);

    const handleChoose = (vehicle: Vehicle) => {
        const isDeselecting = selectedId === vehicle.id;
        setSelectedId(isDeselecting ? null : vehicle.id);
        setToast(isDeselecting ? null : `${vehicle.name} sélectionné`);
        if (!isDeselecting) {
            window.setTimeout(() => setToast(null), 2500);
        }
    };

    return (
        <div className="vehicles-page">
            <NavBar />

            <div className="vehicles-container">
                <div className="vehicles-header">
                    <div>
                        <h1>Véhicules disponibles</h1>
                        <p className="route-summary">
                            {departure} → {destination} · {date} à {time}
                        </p>
                    </div>
                    <button className="back-button" onClick={() => navigate('/')}>
                        ← Nouvelle recherche
                    </button>
                </div>

                {!loading && !error && vehicles.length > 0 && (
                    <div className="toolbar">
                        <div className="filter-chips">
                            {availableTypes.map((type) => (
                                <button
                                    key={type}
                                    className={`chip ${typeFilter === type ? 'chip-active' : ''}`}
                                    onClick={() => setTypeFilter(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="toolbar-right">
                            <div className="price-filter">
                                <label htmlFor="price-range">
                                    Budget max : <strong>{maxPrice.toLocaleString('fr-FR')} Ar</strong>
                                </label>
                                <input
                                    id="price-range"
                                    type="range"
                                    min={0}
                                    max={priceCeiling}
                                    step={5000}
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                                />
                            </div>

                            <select
                                className="sort-select"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                            >
                                <option value="none">Trier par prix</option>
                                <option value="asc">Prix croissant</option>
                                <option value="desc">Prix décroissant</option>
                            </select>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="vehicles-grid">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="skeleton-card" />
                        ))}
                    </div>
                )}

                {error && (
                    <div className="status-message error">
                        <span className="status-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {!loading && !error && vehicles.length === 0 && (
                    <div className="status-message">
                        <span className="status-icon">🚫</span>
                        Aucun véhicule disponible pour ce trajet.
                    </div>
                )}

                {!loading && !error && vehicles.length > 0 && displayedVehicles.length === 0 && (
                    <div className="status-message">
                        <span className="status-icon">🔍</span>
                        Aucun véhicule ne correspond à ces filtres.
                    </div>
                )}

                {!loading && !error && displayedVehicles.length > 0 && (
                    <div className="vehicles-grid">
                        {displayedVehicles.map((vehicle, index) => (
                            <div
                                key={vehicle.id}
                                className="card-enter"
                                style={{ animationDelay: `${index * 60}ms` }}
                            >
                                <VehicleCard
                                    vehicle={vehicle}
                                    selected={selectedId === vehicle.id}
                                    onChoose={() => handleChoose(vehicle)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && (requestXml || responseXml) && (
                    <details className="soap-panel">
                        <summary>🔍 Voir la requête / réponse SOAP (XML)</summary>

                        <div className="soap-block">
                            <h4>Requête envoyée (searchVehiclesRequest)</h4>
                            <pre>{formatXml(requestXml)}</pre>
                        </div>

                        <div className="soap-block">
                            <h4>Réponse reçue (searchVehiclesResponse)</h4>
                            <pre>{formatXml(responseXml)}</pre>
                        </div>
                    </details>
                )}
            </div>

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}

export default VehiclesPage;