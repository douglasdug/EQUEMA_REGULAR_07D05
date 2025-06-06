import React, { useState } from "react";
import { olvidoClave } from "../api/conexion.api.js";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
// Importa tu función para enviar la solicitud de recuperación
// import { solicitarRecuperacionClave } from "../api/conexion.api.js";

const OlvidoClave = () => {
  const [username, setUsername] = useState("");
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState(""); // Nuevo estado
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
      // Envía el parámetro como identificacion[username]
      const data = await olvidoClave({ username });
      if (data.email) {
        setEmailRecuperacion(data.email);
      } else {
        setEmailRecuperacion("");
        toast.success(
          "Si el usuario existe, se enviará un correo para restablecer la contraseña.",
          { position: "bottom-right" }
        );
      }
      setUsername("");
      setRecaptchaValue(null);
    } catch (error) {
      console.error("Error en la solicitud de recuperación de clave:", error);
      setEmailRecuperacion("");
      toast.error("Error al procesar la solicitud.", {
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container min-h-screen flex items-start justify-center">
      <div className="flex flex-col items-center justify-center">
        <div className="bg-slate-100 p-8 rounded-lg shadow-lg max-w-sm w-full">
          <h2 className="text-center text-2xl font-bold mb-4">
            Recuperar contraseña
          </h2>
          {emailRecuperacion && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-6 rounded mb-6 text-center text-lg">
              <p>
                Se ha enviado un correo de recuperación a: <br />
                <span className="font-bold">{emailRecuperacion}</span>
              </p>
              <p className="mt-4">
                Por favor, revisa tu bandeja de entrada y sigue las
                instrucciones para restablecer tu contraseña. Si no ves el
                correo, revisa también la carpeta de spam o correo no deseado.
              </p>
            </div>
          )}
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
    </section>
  );
};

export default OlvidoClave;
