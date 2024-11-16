import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import AvisoUser from "./pages/AvisoUser.jsx";
import AdminUser from "./pages/AdminUser.jsx";
import CreateTemprano from "./pages/CreateTemprano.jsx";
import CreateTardio from "./pages/CreateTardio.jsx";
import CreateDesperdicio from "./pages/CreateDesperdicio.jsx";
import CreateRegistroVacunado from "./pages/CreateRegistroVacunado.jsx";
import { Navigation } from "./components/Navigation.jsx";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <div className="container mx-auto">
        <Navigation />
        <div className="mt-24">
          <Routes>
            <Route path="/" element={<Navigate to="/home/" />} />
            <Route path="/home/" element={<Home />} />
            <Route path="/login/" element={<Login />} />
            <Route path="/register/" element={<Register />} />
            <Route path="/aviso-user/" element={<AvisoUser />} />
            <Route path="/admin-user/" element={<AdminUser />} />
            <Route path="/create-temprano/" element={<CreateTemprano />} />
            <Route path="/create-tardio/" element={<CreateTardio />} />
            <Route
              path="/create-desperdicio/"
              element={<CreateDesperdicio />}
            />
            <Route
              path="/create-registro-vacunado/"
              element={<CreateRegistroVacunado />}
            />
          </Routes>
        </div>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;
