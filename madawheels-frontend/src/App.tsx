import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Fleet from "./pages/Fleet";
import Reserver from "./pages/Reserver";
import Reservations from "./pages/Reservations";
import Login from "./pages/Login";
import Inscription from "./pages/Inscription";
import Profil from "./pages/Profil";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vehicules" element={<Fleet />} />
        <Route path="/reserver" element={<Reserver />} />
        <Route path="/mes-reservations" element={<Reservations />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/profil" element={<Profil />} />
      </Routes>
    </BrowserRouter>
  );
}