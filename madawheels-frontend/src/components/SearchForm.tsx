import { useState, type FormEvent } from 'react';
import type { SearchParams } from '../types/vehicle';
import './SearchForm.css';

interface SearchFormProps {
    onSearch: (params: SearchParams) => void;
}

const MADAGASCAR_CITIES = [
    'Antananarivo',
    'Antsirabe',
    'Fianarantsoa',
    'Toamasina',
    'Mahajanga',
    'Toliara',
    'Antsiranana',
    'Morondava',
    'Ambositra',
    'Nosy Be',
];

function SearchForm({ onSearch }: SearchFormProps) {
    const [departure, setDeparture] = useState('Antananarivo');
    const [destination, setDestination] = useState('Antsirabe');
    const [date, setDate] = useState('2026-09-25');
    const [time, setTime] = useState('08:00');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSearch({ departure, destination, date, time });
    };

    const handleSwap = () => {
        setDeparture(destination);
        setDestination(departure);
    };

    return (
        <form className="search-form" onSubmit={handleSubmit}>
            <h2 className="search-form-title">Rechercher un véhicule</h2>
            <div className="search-form-fields">
                <div className="form-group form-group-route">
                    <label htmlFor="departure">Lieu de départ</label>
                    <input
                        id="departure"
                        type="text"
                        list="city-suggestions"
                        value={departure}
                        onChange={(e) => setDeparture(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="button"
                    className="swap-button"
                    onClick={handleSwap}
                    title="Inverser départ et destination"
                    aria-label="Inverser départ et destination"
                >
                    ⇄
                </button>

                <div className="form-group form-group-route">
                    <label htmlFor="destination">Destination</label>
                    <input
                        id="destination"
                        type="text"
                        list="city-suggestions"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        required
                    />
                </div>

                <datalist id="city-suggestions">
                    {MADAGASCAR_CITIES.map((city) => (
                        <option key={city} value={city} />
                    ))}
                </datalist>

                <div className="form-group">
                    <label htmlFor="date">Date de départ</label>
                    <input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="time">Heure de départ</label>
                    <input
                        id="time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="search-button">
                    Trouver un véhicule
                </button>
            </div>
        </form>
    );
}

export default SearchForm;