import { NavLink } from 'react-router-dom';
import './NavBar.css';

function NavBar() {
    return (
        <header className="navbar">
            <div className="navbar-inner">
                <div className="brand">
                    <span className="brand-name">MadaWheels</span>
                    <span className="brand-badge">MADAGASCAR</span>
                </div>

                <nav className="nav-links">
                    <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
                        Recherche
                    </NavLink>
                    <NavLink to="/vehicles" className={({ isActive }) => (isActive ? 'active' : '')}>
                        Véhicules
                    </NavLink>
                </nav>
            </div>
        </header>
    );
}

export default NavBar;