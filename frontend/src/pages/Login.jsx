import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/conexion.api.js";
import PropTypes from "prop-types";
import { AuthContext } from "../components/AuthContext.jsx";
import { toast } from "react-hot-toast";

const initialState = {
  username: "",
  password: "",
};

const InputField = ({
  label,
  type,
  name,
  id,
  value,
  onChange,
  placeholder,
  icon,
  onIconClick,
  isButtonIcon,
}) => (
  <div
    className={`flex items-center border-2 rounded-md overflow-hidden relative mb-6 ${
      value ? "border-blue-500" : ""
    } focus-within:border-blue-500`}
  >
    <input
      type={type}
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      className="py-1 px-1 w-full text-base text-black bg-transparent focus:outline-none peer"
      placeholder=" "
    />
    <label
      htmlFor={name}
      className="absolute left-2 text-sm text-gray-700 duration-300 transform -translate-y-4 scale-90 top-3 origin-[1] bg-gray-100 px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-4"
    >
      {label}
    </label>
    {icon &&
      (isButtonIcon ? (
        <button
          type="button"
          className="bg-gray-300 p-2 text-gray-500 text-lg"
          onClick={onIconClick}
        >
          {icon}
        </button>
      ) : (
        <span className="bg-gray-300 p-2 text-gray-500 text-lg">{icon}</span>
      ))}
  </div>
);

InputField.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  icon: PropTypes.node,
  onIconClick: PropTypes.func,
  isButtonIcon: PropTypes.bool,
};

export default function Login() {
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuthData } = useContext(AuthContext);
  const navigate = useNavigate();

  const labelMap = {
    username: "Cédula de Identificación",
    password: "Clave de acceso",
  };

  const getErrorMessage = (error) => {
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === "object" && data !== null) {
        if (data.message) return data.message;
        if (data.error) {
          // Si data.error es un array, devuelve el primer elemento
          if (Array.isArray(data.error) && data.error.length > 0) {
            return data.error[0];
          }
          return data.error;
        }
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
    if (isLoading) return;

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      let response;
      response = await loginUser(formData);
      setAuthData({
        isLoggedIn: true,
        user: response, // Actualiza el contexto con los datos del usuario
      });
      setSuccessMessage("Login con éxito!");
      setTimeout(() => setSuccessMessage(""), 10000);
      const message = response.message || "Login con éxito!";
      toast.success(message, {
        position: "bottom-right",
      });
      setTimeout(() => navigate("/"), 4000);
    } catch (error) {
      formData.password = "";
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      toast.error(errorMessage, { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  EstadoMensajes.propTypes = {
    error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    successMessage: PropTypes.string,
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-700 tracking-tight">
          Iniciar Sesión
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <InputField
            htmlFor="username"
            label={labelMap["username"]}
            type="text"
            name="username"
            id="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Cedula de Identidad"
            icon="&#x1F464;"
            isButtonIcon={false}
          />
          <InputField
            htmlFor="password"
            label={labelMap["password"]}
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Contraseña"
            icon={showPassword ? "🙈" : "👁️"}
            onIconClick={() => setShowPassword(!showPassword)}
            isButtonIcon={true}
          />
          <div className="flex items-center justify-between text-sm">
            <Link
              to="/register-user/"
              className="text-blue-600 hover:underline font-medium"
            >
              ¿No tienes cuenta? Regístrate
            </Link>
            <Link
              to="/olvido-clave/"
              className="text-blue-600 hover:underline font-medium"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <button
            type="submit"
            disabled={isLoading || !formData.username || !formData.password}
            className={`w-full py-3 rounded-lg font-semibold text-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400
            ${
              isLoading || !formData.username || !formData.password
                ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isLoading ? "Ingresando..." : "Login"}
          </button>
        </form>
        <div className="mt-4">
          <EstadoMensajes error={error} successMessage={successMessage} />
        </div>
      </div>
    </section>
  );
}
