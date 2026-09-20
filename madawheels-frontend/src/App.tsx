import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import VehiclesPage from './pages/VehiclesPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<SearchPage />} />
                <Route path="/vehicles" element={<VehiclesPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;