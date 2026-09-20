import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import SearchForm from '../components/SearchForm';
import type { SearchParams } from '../types/vehicle';
import './SearchPage.css';

function SearchPage() {
    const navigate = useNavigate();

    const handleSearch = (params: SearchParams) => {
        const query = new URLSearchParams({
            departure: params.departure,
            destination: params.destination,
            date: params.date,
            time: params.time,
        });
        navigate(`/vehicles?${query.toString()}`);
    };
    
    return (
        <div className="search-page">
            <NavBar />

            <section className="hero">
                <div className="hero-text">
                    <span className="hero-kicker">LOCATION DE VÉHICULES À MADAGASCAR</span>
                    <h1>Découvrez Madagascar avec nos locations de véhicules</h1>
                    <p>
                        Véhicules 4x4 certifiés avec ou sans chauffeur depuis nos agences.
                        Recherchez simplement le véhicule disponible pour votre trajet.
                    </p>
                </div>

                <div className="hero-visual">
                    <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" className="car-illustration">
                        <rect x="0" y="0" width="400" height="220" rx="20" fill="#6b7d5f" />
                        <ellipse cx="200" cy="170" rx="150" ry="14" fill="rgba(0,0,0,0.15)" />
                        <path d="M60 150 L90 95 Q100 80 120 80 L280 80 Q300 80 310 95 L340 150 Z" fill="#f3f4f6" />
                        <rect x="70" y="140" width="260" height="35" rx="10" fill="#1f2937" />
                        <rect x="140" y="88" width="120" height="45" rx="10" fill="#6b7d5f" />
                        <circle cx="120" cy="175" r="22" fill="#111827" />
                        <circle cx="120" cy="175" r="9" fill="#d1d5db" />
                        <circle cx="280" cy="175" r="22" fill="#111827" />
                        <circle cx="280" cy="175" r="9" fill="#d1d5db" />
                    </svg>
                    <span className="hero-tag">MADAGASCAR · 4X4 · AVENTURE</span>
                </div>
            </section>

            <div className="search-form-wrapper">
                <SearchForm onSearch={handleSearch} />
            </div>
        </div>
    );
}

export default SearchPage;