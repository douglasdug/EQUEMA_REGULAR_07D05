import React, { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
// Importa tu función para enviar la solicitud de recuperación
// import { solicitarRecuperacionClave } from "../api/conexion.api.js";

const OlvidoClave = () => {
  const [username, setUsername] = useState("");
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRecaptcha = (value) => {
    setRecaptchaValue(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username) {
      toast.error("Por favor, ingrese su usuario.", {
        position: "bottom-right",
      });
      return;
    }
    if (!recaptchaValue) {
      toast.error("Por favor, complete el reCAPTCHA.", {
        position: "bottom-right",
      });
      return;
    }
    setLoading(true);
    try {
      // Aquí deberías llamar a tu API para enviar el correo de recuperación
      // await solicitarRecuperacionClave({ username, recaptcha: recaptchaValue });
      toast.success(
        "Si el usuario existe, se enviará un correo para restablecer la contraseña.",
        { position: "bottom-right" }
      );
      setUsername("");
      setRecaptchaValue(null);
    } catch (error) {
      toast.error("Error al procesar la solicitud.", {
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-center text-2xl font-bold mb-4">
          Recuperar contraseña
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="username"
            >
              Usuario (Cédula de Identidad){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingrese su usuario"
              className="border rounded px-3 py-2 w-full"
              autoComplete="username"
              disabled={loading}
            />
          </div>
          <div className="mb-4 flex justify-center">
            <ReCAPTCHA
              sitekey="6LeZMEArAAAAAG9MbletVs1qO75OXYujGaUTVO8p" // Reemplaza con tu clave de sitio reCAPTCHA
              onChange={handleRecaptcha}
            />
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
                loading || !username || !recaptchaValue
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={loading || !username || !recaptchaValue}
            >
              Buscar
            </button>
            <button
              type="button"
              className="ml-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              onClick={() => navigate("/login")}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OlvidoClave;
