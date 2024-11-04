import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/conexion.api.js";
import PropTypes from "prop-types";
import { toast } from "react-hot-toast";

const InputField = ({
  label,
  type,
  name,
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
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="py-3 px-3 w-full text-sm text-black bg-transparent focus:outline-none peer"
      placeholder=" "
    />
    <label
      htmlFor={name}
      className="absolute left-12 text-sm text-gray-700 duration-300 transform -translate-y-4 scale-90 top-3 origin-[0] bg-gray-100 px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2 peer-focus:scale-75 peer-focus:-translate-y-4"
    >
      {label}
    </label>
  </div>
);

InputField.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  icon: PropTypes.node,
  onIconClick: PropTypes.func,
  isButtonIcon: PropTypes.bool,
};

const FormMessage = ({ message, type }) => (
  <p style={{ color: type === "error" ? "red" : "green" }}>{message}</p>
);

FormMessage.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
};

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        navigate("/home/");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const data = await loginUser(formData);
      setSuccessMessage("Login con éxito!");
      toast.success("Login con éxito!", { position: "bottom-right" });
    } catch (error) {
      const errorMessage =
        error.response?.data?.[Object.keys(error.response.data)[0]]?.[0] ||
        "Error durante el Login!";
      setErrorMessage(errorMessage);
      toast.error(errorMessage, { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const labelMap = {
    username: "Cedula de Identidad",
    password: "Clave de acceso",
  };

  return (
    <section className="container">
      <div className="mx-auto max-w-lg text-center">
        {errorMessage && <FormMessage message={errorMessage} type="error" />}
        {successMessage && (
          <FormMessage message={successMessage} type="success" />
        )}
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="bg-slate-100 p-8 rounded-lg shadow-lg max-w-sm w-full">
          <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label={labelMap["username"]}
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Cedula de Identidad"
              icon="&#x1F464;"
              isButtonIcon={false}
            />
            <InputField
              label={labelMap["password"]}
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Contraseña"
              icon={showPassword ? "🙈" : "👁️"}
              onIconClick={() => setShowPassword(!showPassword)}
              isButtonIcon={true}
            />
            <div className="flex items-center text-center justify-between">
              <p className="text-sm text-gray-700">
                No tienes cuenta?
                <br />
                <Link to="/register/" className="text-blue-500 underline ml-1">
                  Regístrese
                </Link>
              </p>
              <p className="text-sm text-blue-500">
                <Link to="/reiniciar-clave/" className="underline ml-1">
                  Olvido su contraseña?
                </Link>
              </p>
            </div>
            <div className="flex items-center justify-center">
              <button
                type="submit"
                disabled={isLoading || !formData.username || !formData.password}
                className={`inline-block rounded-lg px-5 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 text-white ${
                  isLoading || !formData.username || !formData.password
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-blue-600 cursor-pointer"
                }`}
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
