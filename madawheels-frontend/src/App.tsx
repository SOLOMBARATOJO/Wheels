import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Fleet from "./pages/Fleet";
import VehicleDetail from "./pages/VehicleDetail";
import Reserver from "./pages/Reserver";
import Reservations from "./pages/Reservations";
import Login from "./pages/Login";
import Inscription from "./pages/Inscription";
import ClientDashboard from "./pages/ClientDashboard";
import ClientQuotes from "./pages/ClientQuotes";
import ClientTransactions from "./pages/ClientTransactions";
import ClientSettings from "./pages/ClientSettings";
import Paiement from "./pages/Paiement";
import AdminWelcome from "./pages/admin/AdminWelcome";
import AdminHome from "./pages/admin/AdminHome";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminVehicles from "./pages/admin/AdminVehicles";
import AdminClients from "./pages/admin/AdminClients";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAccount from "./pages/admin/AdminAccount";
import AdminRoute from "./components/AdminRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vehicules" element={<Fleet />} />
        <Route path="/vehicules/:id" element={<VehicleDetail />} />
        <Route path="/reserver" element={<Reserver />} />
        <Route path="/mes-reservations" element={<Reservations />} />
        <Route path="/mes-devis" element={<ClientQuotes />} />
        <Route path="/mes-transactions" element={<ClientTransactions />} />
        <Route path="/parametres" element={<ClientSettings />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/profil" element={<ClientDashboard />} />
        <Route path="/paiement" element={<Paiement />} />

        <Route path="/admin" element={<AdminRoute><AdminWelcome /></AdminRoute>} />
        <Route path="/admin/tableau-de-bord" element={<AdminRoute><AdminHome /></AdminRoute>} />
        <Route path="/admin/reservations" element={<AdminRoute><AdminReservations /></AdminRoute>} />
        <Route path="/admin/vehicules" element={<AdminRoute><AdminVehicles /></AdminRoute>} />
        <Route path="/admin/clients" element={<AdminRoute><AdminClients /></AdminRoute>} />
        <Route path="/admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
        <Route path="/admin/parametres" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        <Route path="/admin/compte" element={<AdminRoute><AdminAccount /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
}