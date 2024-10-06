import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import CreateTemprano from "./pages/CreateTemprano.jsx";
import CreateTardio from "./pages/CreateTardio.jsx";
import CreateDesperdicio from "./pages/CreateDesperdicio.jsx";
import CreateRegistroVacunado from "./pages/CreateRegistroVacunado.jsx";
import CreateUsuario from "./pages/CreateUsuario.jsx";
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
            <Route path="/createTemprano/" element={<CreateTemprano />} />
            <Route path="/createTardio/" element={<CreateTardio />} />
            <Route path="/createDesperdicio/" element={<CreateDesperdicio />} />
            <Route
              path="/createRegistroVacunado/"
              element={<CreateRegistroVacunado />}
            />
            <Route path="/createUsuario/" element={<CreateUsuario />} />
          </Routes>
        </div>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;
