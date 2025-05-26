import React, { useState } from "react";
import { resetPasswordWithToken } from "../api/conexion.api.js"; // Debes crear esta función
import PropTypes from "prop-types";
import { useParams, useNavigate } from "react-router-dom";

const passwordRules = [
  {
    label: "Entre 10 y 20 caracteres",
    test: (pw) => pw.length >= 10 && pw.length <= 20,
  },
  {
    label: "Al menos una mayúscula",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    label: "Al menos una minúscula",
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    label: "Al menos un número",
    test: (pw) => /\d/.test(pw),
  },
  {
    label: "Al menos un carácter especial (# * - +)",
    test: (pw) => /[#*\-+]/.test(pw),
  },
];

const isPasswordValid = (pw) => passwordRules.every((rule) => rule.test(pw));

const NewPassword = () => {
  const { uid, token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Estado para mostrar/ocultar claves
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch =
    newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setNewPassword("");
    setConfirmPassword("");

    if (!newPassword || !confirmPassword) {
      setMessage("Por favor, completa todos los campos.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Las nuevas claves no coinciden.");
      return;
    }

    if (!isPasswordValid(newPassword)) {
      setMessage("La nueva clave no cumple con los requisitos.");
      return;
    }

    if (!token) {
      setMessage("El enlace es inválido o ha expirado.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithToken({ uid, token, password: newPassword });
      setMessage("¡Clave cambiada exitosamente!");
    } catch (error) {
      // Si hay respuesta del backend y tiene un mensaje de error, muéstralo
      if (error.response?.data?.error) {
        setMessage(error.response.data.error);
      } else {
        setMessage(error.message || "Error al cambiar la clave.");
      }
    }
    setLoading(false);
  };

  React.useEffect(() => {
    if (message === "¡Clave cambiada exitosamente!") {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [message, navigate]);

  const canSubmit =
    !loading &&
    newPassword &&
    confirmPassword &&
    passwordsMatch &&
    isPasswordValid(newPassword);
  // Icono de ojo SVG
  const EyeIcon = ({ open }) =>
    open ? (
      <svg
        className="w-5 h-5 text-gray-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ) : (
      <svg
        className="w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95m3.25-2.568A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.197M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
      </svg>
    );

  EyeIcon.propTypes = {
    open: PropTypes.bool.isRequired,
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border border-gray-300 rounded-lg shadow bg-white">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Restablecer Clave
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-gray-700 mb-1">
            Nueva Clave
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ingrese su nueva clave"
              autoComplete="new-password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-400 pr-10"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowNewPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 focus:outline-none"
              aria-label={showNewPassword ? "Ocultar clave" : "Mostrar clave"}
            >
              <EyeIcon open={showNewPassword} />
            </button>
          </div>
          <div className="mt-2 space-y-1">
            {passwordRules.map((rule) => {
              const passed = rule.test(newPassword);
              return (
                <div key={rule.label} className="flex items-center text-sm">
                  <span
                    className={`inline-block w-4 h-4 mr-2 rounded-full border-2 ${
                      passed
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300 bg-white"
                    } flex items-center justify-center`}
                  >
                    {passed ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : null}
                  </span>
                  <span className={passed ? "text-green-600" : "text-gray-600"}>
                    {rule.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="confirmPassword" className="block text-gray-700 mb-1">
            Confirmar Nueva Clave
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme su clave"
              autoComplete="new-password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-400 pr-10"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 focus:outline-none"
              aria-label={
                showConfirmPassword ? "Ocultar clave" : "Mostrar clave"
              }
            >
              <EyeIcon open={showConfirmPassword} />
            </button>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center text-sm">
              <span
                className={`inline-block w-4 h-4 mr-2 rounded-full border-2 ${
                  passwordsMatch
                    ? "border-green-500 bg-green-500"
                    : "border-gray-300 bg-white"
                } flex items-center justify-center`}
              >
                {passwordsMatch ? (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : null}
              </span>
              <span
                className={passwordsMatch ? "text-green-600" : "text-gray-600"}
              >
                Las claves coinciden
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Cambiando..." : "Cambiar Clave"}
          </button>
          <button
            type="button"
            className="ml-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            onClick={() => navigate("/login")}
          >
            Cancelar
          </button>
        </div>
        {message && (
          <div
            className={`mt-4 text-center font-medium ${
              message.includes("exitosamente")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default NewPassword;
