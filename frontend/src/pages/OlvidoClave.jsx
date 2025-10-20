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
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleRecaptcha = (value) => {
    setRecaptchaValue(value);
  };

  const getErrorMessage = (error) => {
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === "object" && data !== null) {
        if (data.message) return data.message;
        if (data.error) return data.error;
        const firstKey = Object.keys(data)[0];
        const firstError = data[firstKey];
        if (Array.isArray(firstError) && firstError.length > 0) {
          return firstError[0];
        } else if (typeof firstError === "string") {
          return firstError;
        }
        return JSON.stringify(data);
      } else if (typeof data === "string") {
        return data;
      }
    } else if (error.request) {
      return "No se recibió respuesta del servidor";
    } else if (error.message) {
      return error.message;
    }
    return "Error desconocido";
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
      const response = await olvidoClave({ username });
      if (response.email) {
        setEmailRecuperacion(response.email);
      } else {
        setEmailRecuperacion("");
        setSuccessMessage(
          response.message ||
            "Si el usuario existe, se enviará un correo para restablecer la contraseña."
        );
        setTimeout(() => setSuccessMessage(""), 30000);
        toast.success(
          response.message ||
            "Si el usuario existe, se enviará un correo para restablecer la contraseña.",
          { position: "bottom-right" }
        );
      }
      setUsername("");
      setRecaptchaValue(null);
      setTimeout(() => navigate("/login/"), 20000);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setTimeout(() => setError(""), 30000);
      setSuccessMessage("");
      console.error("Error en la solicitud de recuperación de clave:", error);
      setEmailRecuperacion("");
      toast.error(errorMessage || "Error al procesar la solicitud.", {
        position: "bottom-right",
      });
      setUsername("");
    } finally {
      setLoading(false);
    }
  };

  const EstadoMensajes = ({ error, successMessage }) => (
    <div className="bg-white rounded-lg shadow-md">
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2"
          role="alert"
        >
          <strong className="font-bold">
            {typeof error === "object" && error.type === "validacion"
              ? "¡Error de Validación! "
              : "¡Error! "}
          </strong>
          <span className="block sm:inline">
            {typeof error === "object" ? error.message : error}
          </span>
        </div>
      )}
      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-2"
          role="alert"
        >
          <strong className="font-bold">¡Éxito! </strong>
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
    </div>
  );

  return (
    <section className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-sky-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="relative rounded-2xl shadow-xl bg-white/80 backdrop-blur border border-slate-200 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-sky-200/40 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-indigo-200/40 rounded-full blur-3xl" />
          </div>

          <div className="relative p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 mb-3 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-500 flex items-center justify-center shadow-lg text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75A4.5 4.5 0 0012 2.25 4.5 4.5 0 007.5 6.75v3.75m-3 0h15m-12.75 0h10.5l.878 10.536a2.25 2.25 0 01-2.244 2.464H8.866a2.25 2.25 0 01-2.244-2.464L7.5 10.5"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                Recuperar contraseña
              </h2>
              <p className="text-sm text-slate-500 mt-2 text-center">
                Ingresa tu usuario (cédula). Te enviaremos un enlace seguro para
                restablecer tu contraseña.
              </p>
            </div>

            {emailRecuperacion && (
              <div className="animate-fade-in rounded-lg border border-emerald-300 bg-emerald-50 px-5 py-4 mb-6 text-emerald-700 text-sm shadow-inner">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">
                      Correo de recuperación enviado
                    </p>
                    <p className="mt-1">
                      Revisa:{" "}
                      <span className="font-medium">{emailRecuperacion}</span>.
                      Si no llega en pocos minutos, revisa spam.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
              noValidate
              autoComplete="off"
            >
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Usuario (Cédula de Identidad){" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 20a8 8 0 0116 0"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.trimStart())}
                    placeholder="Ej: 0102030405"
                    className="w-full rounded-lg border border-slate-300 bg-white/70 backdrop-blur px-10 py-2.5 text-sm text-slate-700 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200/50 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
                    autoComplete="username"
                    disabled={loading}
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <ReCAPTCHA
                  sitekey="6LeZMEArAAAAAG9MbletVs1qO75OXYujGaUTVO8p"
                  onChange={handleRecaptcha}
                />
                <p className="text-[11px] text-slate-400">
                  Protegido por reCAPTCHA de Google
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                <button
                  type="submit"
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-600 text-white text-sm font-semibold px-5 py-2.5 shadow-lg shadow-indigo-600/20 hover:from-indigo-500 hover:to-sky-500 focus:outline-none focus:ring-4 focus:ring-indigo-300/50 transition disabled:opacity-60 disabled:cursor-not-allowed`}
                  disabled={loading || !username || !recaptchaValue}
                >
                  {loading && (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {loading ? "Buscando..." : "Buscar"}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium px-5 py-2.5 shadow hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 transition"
                  onClick={() => navigate("/login")}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-400">
                Al continuar confirmas que eres el titular de la cuenta.
              </p>
            </form>
            <EstadoMensajes error={error} successMessage={successMessage} />
          </div>
        </div>
      </div>
      <script
        src="https://www.google.com/recaptcha/api.js"
        async
        defer
      ></script>
    </section>
  );
};

export default OlvidoClave;
