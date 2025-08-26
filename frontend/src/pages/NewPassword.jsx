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
      setTimeout(() => navigate("/login/"), 20000);
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
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-indigo-100 via-white to-sky-100">
      <div className="w-full max-w-lg relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 via-sky-400 to-violet-400 rounded-2xl blur opacity-40 animate-pulse"></div>
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-500 flex items-center justify-center shadow-md mb-3">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m5-6V9a5 5 0 10-10 0v2m12 0H5v8a2 2 0 002 2h10a2 2 0 002-2v-8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent tracking-wide">
              Restablecer Clave
            </h2>
            <p className="text-sm text-gray-500 mt-1 text-center">
              Crea una nueva clave segura siguiendo los requisitos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NUEVA CLAVE */}
            <div>
              <label
                htmlFor="newPassword"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
              >
                Nueva Clave
                {newPassword && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isPasswordValid(newPassword)
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {isPasswordValid(newPassword) ? "Lista" : "En progreso"}
                  </span>
                )}
              </label>
              <div className="relative group">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingrese su nueva clave"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/70 focus:bg-white outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-500 transition shadow-sm pr-12"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={
                    showNewPassword ? "Ocultar clave" : "Mostrar clave"
                  }
                >
                  <EyeIcon open={showNewPassword} />
                </button>
              </div>

              {/* Barra de progreso reglas */}
              <div className="mt-4">
                {(() => {
                  const passed = passwordRules.filter((r) =>
                    r.test(newPassword)
                  ).length;
                  const percent = (passed / passwordRules.length) * 100 || 0;
                  const colors =
                    percent === 100
                      ? "from-green-400 via-emerald-400 to-green-500"
                      : percent >= 60
                      ? "from-yellow-400 via-amber-400 to-orange-400"
                      : "from-rose-400 via-red-400 to-pink-500";
                  return (
                    <>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${colors} transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1 text-[11px] font-medium text-gray-500">
                        <span>
                          {passed} / {passwordRules.length} reglas
                        </span>
                        <span>
                          {percent === 100
                            ? "Fuerte"
                            : percent >= 60
                            ? "Media"
                            : "Débil"}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Reglas */}
              <div className="mt-3 grid gap-2">
                {passwordRules.map((rule) => {
                  const passed = rule.test(newPassword);
                  return (
                    <div
                      key={rule.label}
                      className={`flex items-center text-xs rounded-lg px-2 py-1.5 border ${
                        passed
                          ? "bg-green-50 border-green-200 text-green-600"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      } transition`}
                    >
                      <span
                        className={`mr-2 inline-flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                          passed
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-gray-300 text-transparent"
                        }`}
                      >
                        <svg
                          className="w-3 h-3"
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
                      </span>
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CONFIRMAR CLAVE */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
              >
                Confirmar Nueva Clave
                {confirmPassword && null}
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/70 focus:bg-white outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm pr-12"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={
                    showConfirmPassword ? "Ocultar clave" : "Mostrar clave"
                  }
                >
                  <EyeIcon open={showConfirmPassword} />
                </button>
              </div>
              <div className="mt-3">
                <div
                  className={`flex items-center text-xs rounded-lg px-2 py-1.5 border transition ${
                    passwordsMatch
                      ? "bg-green-50 border-green-200 text-green-600"
                      : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  <span
                    className={`mr-2 inline-flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                      passwordsMatch
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 text-transparent"
                    }`}
                  >
                    <svg
                      className="w-3 h-3"
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
                  </span>
                  Las claves coinciden
                </div>
              </div>
            </div>

            {/* BOTONES */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full relative overflow-hidden rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 shadow-lg shadow-blue-300/40 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-200 transition"
              >
                <span className="relative z-10">
                  {loading ? "Cambiando..." : "Cambiar Clave"}
                </span>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 transition"></div>
              </button>
              <button
                type="button"
                className="w-full rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 transition shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-200"
                onClick={() => navigate("/login")}
              >
                Cancelar
              </button>
            </div>

            {/* MENSAJE */}
            {message && (
              <div
                className={`mt-2 text-center text-sm font-semibold tracking-wide ${
                  message.includes("exitosamente")
                    ? "text-green-600"
                    : "text-rose-600"
                }`}
              >
                {message}
                {message.includes("exitosamente") && (
                  <div className="mt-1 text-xs font-normal text-gray-500">
                    Redirigiendo al inicio de sesión...
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewPassword;
