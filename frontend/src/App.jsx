import "./App.css";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "./components/Navigation.jsx";
import Home from "./pages/Home.jsx";
import RegisterUser from "./pages/RegisterUser.jsx";
import Login from "./pages/Login.jsx";
import OlvidoClave from "./pages/OlvidoClave.jsx";
import NewPassword from "./pages/NewPassword.jsx";
import AvisoUser from "./pages/AvisoUser.jsx";
import AdminUser from "./pages/AdminUser.jsx";
import Admision from "./pages/Admision.jsx";
import Form008Emergencia from "./pages/Form008Emergencia.jsx";
import AgendaTurnoPaciente from "./pages/AgendaTurnoPaciente.jsx";
import ReporteAtenciones from "./pages/ReporteAtenciones.jsx";
import Contacto from "./pages/Contacto.jsx";
import CertificadoMedico from "./pages/CertificadoMedico.jsx";
import AdminAgendaTurno from "./pages/AdminAgendaTurno.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RequireRole from "./routes/RequireRole.jsx";
import { ROLES } from "./auth/roles.js";
import { AuthProvider } from "./components/AuthContext.jsx";
import { Toaster } from "react-hot-toast";

function Unauthorized() {
  return (
    <div className="max-w-md mx-auto mt-24 rounded-md border border-red-300 bg-red-50 p-6 text-center shadow">
      <div className="mb-3 text-5xl">🚫</div>
      <h1 className="mb-2 text-xl font-semibold text-red-700">
        Acceso denegado
      </h1>
      <p className="text-sm text-red-600">
        No tienes permiso para acceder a esta página.
      </p>
      <p className="mt-4 text-xs text-red-500">
        Si crees que es un error, contacta al administrador del sistema.
      </p>
    </div>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="mt-4 w-full text-center py-2 text-xs md:text-sm text-gray-600 border-t border-gray-200 bg-white/70 backdrop-blur"
      role="contentinfo"
    >
      <p className="tracking-wide">
        Copyright © {year}. Todos los derechos reservados -{" "}
        <span className="font-semibold">DDOM</span>
      </p>
    </footer>
  );
}

function App() {
  return (
    <AuthProvider>
      <Navigation />
      <Routes>
        <Route path="/login/" element={<Login />} />
        <Route
          path="*"
          element={
            <main className="mx-auto mt-20">
              <Routes>
                <Route path="/" element={<Navigate to="/home/" />} />
                <Route path="/home/" element={<Home />} />
                <Route path="/olvido-clave/" element={<OlvidoClave />} />
                <Route
                  path="/new-password/:uid/:token"
                  element={<NewPassword />}
                />
                <Route path="/register-user/" element={<RegisterUser />} />
                <Route path="/aviso-user/" element={<AvisoUser />} />
                <Route path="/contacto/" element={<Contacto />} />

                <Route path="/medico/" element={<CertificadoMedico />} />
                <Route path="/dashboard/" element={<Dashboard />} />

                {/* Rutas protegidas por rol */}
                <Route
                  element={
                    <RequireRole
                      allowed={[
                        ROLES.ADMINISTRADOR,
                        ROLES.REPORTES,
                        ROLES.ATENCION_FORM_008,
                        ROLES.REPORTES_Y_ADMISION,
                      ]}
                    />
                  }
                >
                  <Route
                    path="/reporte-atenciones/"
                    element={<ReporteAtenciones />}
                  />
                </Route>
                <Route
                  element={<RequireRole allowed={[ROLES.ADMINISTRADOR]} />}
                >
                  <Route path="/admin-user/" element={<AdminUser />} />
                </Route>
                <Route
                  element={
                    <RequireRole
                      allowed={[
                        ROLES.ATENCION_FORM_008,
                        ROLES.REPORTES_Y_ADMISION,
                        ROLES.AGENDAR_TURNOS,
                        ROLES.REPORTES_Y_ADMISION,
                      ]}
                    />
                  }
                >
                  <Route path="/admision/" element={<Admision />} />
                </Route>
                <Route
                // element={
                //   <RequireRole
                //     allowed={[
                //       ROLES.ATENCION_FORM_008,
                //       ROLES.REPORTES_Y_ADMISION,
                //     ]}
                //   />
                // }
                >
                  <Route
                    path="/form-008-emergencia/"
                    element={<Form008Emergencia />}
                  />
                </Route>
                <Route
                  element={
                    <RequireRole
                      allowed={[
                        ROLES.ATENCION_FORM_008,
                        ROLES.ADMINISTRAR_AGENDA_DE_TURNOS,
                        ROLES.AGENDAR_TURNOS,
                        ROLES.RESULTADOS_DE_TURNOS,
                      ]}
                    />
                  }
                >
                  <Route
                    path="/agenda-turno-paciente/"
                    element={<AgendaTurnoPaciente />}
                  />
                </Route>
                <Route
                  element={
                    <RequireRole
                      allowed={[ROLES.ADMINISTRAR_AGENDA_DE_TURNOS]}
                    />
                  }
                >
                  <Route
                    path="/admin-agenda-turno/"
                    element={<AdminAgendaTurno />}
                  />
                </Route>
                {/* fallback de no autorizado */}
                <Route path="/unauthorized" element={<Unauthorized />} />
              </Routes>
            </main>
          }
        />
      </Routes>
      <Footer />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
