import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Temprano from "./pages/Temprano.jsx";
import Tardio from "./pages/Tardio.jsx";
import Desperdicio from "./pages/Desperdicio.jsx";
import CreateTemprano from "./pages/CreateTemprano.jsx";
import CreateTardio from "./pages/CreateTardio.jsx";
import { Navigation } from "./components/Navigation.jsx";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <div className="container mx-auto">
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/home/" />} />
          <Route path="/home/" element={<Home />} />
          <Route path="/login/" element={<Login />} />
          <Route path="/register/" element={<Register />} />
          <Route path="/temprano/" element={<Temprano />} />
          <Route path="/tardio/" element={<Tardio />} />
          <Route path="/desperdicio/" element={<Desperdicio />} />
          <Route path="/createTemprano/" element={<CreateTemprano />} />
          <Route path="/createTardio/" element={<CreateTardio />} />
        </Routes>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;
