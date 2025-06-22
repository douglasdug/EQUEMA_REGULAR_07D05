import "./App.css";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "./components/Navigation.jsx";
import Home from "./pages/Home.jsx";
import RegisterUser from "./pages/RegisterUser.jsx";
import Login from "./pages/Login.jsx";
import OlvidoClave from "./pages/OlvidoClave.jsx";
import NewPassword from "./pages/newPassword.jsx";
import AvisoUser from "./pages/AvisoUser.jsx";
import AdminUser from "./pages/AdminUser.jsx";
import Admision from "./pages/Admision.jsx";
import Form008Emergencia from "./pages/Form008Emergencia.jsx";
import CreateTemprano from "./pages/CreateTemprano.jsx";
import CreateTardio from "./pages/CreateTardio.jsx";
import CreateDesperdicio from "./pages/CreateDesperdicio.jsx";
import CreateInfluenza from "./pages/CreateInfluenza.jsx";
import CreateReporteENI from "./pages/CreateReporteENI.jsx";
import CreateRegistroVacunado from "./pages/CreateRegistroVacunado.jsx";
import { AuthProvider } from "./components/AuthContext.jsx";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <div className="container mx-auto">
        <Navigation />
        <div className="mt-24">
          <Routes>
            <Route path="/" element={<Navigate to="/home/" />} />
            <Route path="/home/" element={<Home />} />
            <Route path="/login/" element={<Login />} />
            <Route path="/olvido-clave/" element={<OlvidoClave />} />
            <Route path="/new-password/:uid/:token" element={<NewPassword />} />
            <Route path="/register-user/" element={<RegisterUser />} />
            <Route path="/aviso-user/" element={<AvisoUser />} />
            <Route path="/admin-user/" element={<AdminUser />} />
            <Route path="/admision/" element={<Admision />} />
            <Route
              path="/form-008-emergencia/"
              element={<Form008Emergencia />}
            />
            <Route path="/create-temprano/" element={<CreateTemprano />} />
            <Route path="/create-tardio/" element={<CreateTardio />} />
            <Route
              path="/create-desperdicio/"
              element={<CreateDesperdicio />}
            />
            <Route path="/create-influenza/" element={<CreateInfluenza />} />
            <Route path="/create-reporte-eni/" element={<CreateReporteENI />} />
            <Route
              path="/create-registro-vacunado/"
              element={<CreateRegistroVacunado />}
            />
          </Routes>
        </div>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;
