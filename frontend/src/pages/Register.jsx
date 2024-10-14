import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { registerUser } from "../api/usuario.api.js";

export default function Register() {
  const [formData, setFormData] = useState({
    fun_tipo_iden: "",
    username: "",
    first_name: "",
    last_name: "",
    fun_email: "",
    password1: "",
    password2: "",
    fun_sex: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      const data = await registerUser(formData);
      console.log("Success!", data);
      setSuccessMessage("Registro guardado con éxito!");
      toast.success("Registro guardado con éxito!", {
        position: "bottom-right",
      });
      navigate("/login/");
    } catch (error) {
      console.log("Error durante el Registro!", error.response?.data);
      if (error.response && error.response.data) {
        const errorMessages = Object.values(error.response.data).flat();
        setError(errorMessages.join(", "));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {error && <p style={{ color: "red" }}>{error}</p>}
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
      <h2>Register:</h2>
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="fun_tipo_iden"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Tipo de Identificacion:
        </label>
        <input
          type="text"
          name="fun_tipo_iden"
          value={formData.fun_tipo_iden}
          onChange={handleChange}
          placeholder="Cédula de identidad"
          className="bg-zinc-200 p-1 rounded-lg block w-full mb-1"
        />
        <label
          htmlFor="username"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Cédula de Identidad:
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Cédula de identidad"
          className="bg-zinc-200 p-1 rounded-lg block w-full mb-1"
        />
        <label
          htmlFor="last_name"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Apellidos completos:
        </label>
        <input
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          placeholder="Apellidos completos"
          className="bg-zinc-200 p-1 rounded-lg block w-full mb-1"
        />
        <label
          htmlFor="first_name"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Nombres completos:
        </label>
        <input
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          placeholder="Nombres completos"
          className="bg-zinc-200 p-1 rounded-lg block w-full mb-1"
        />
        <label
          htmlFor="fun_sex"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Sexo:
        </label>
        <input
          type="text"
          name="fun_sex"
          value={formData.fun_sex}
          onChange={handleChange}
          placeholder="HOMBRE / MUJER"
          className="bg-zinc-200 p-1 rounded-lg block w-full mb-1"
        />
        <label
          htmlFor="fun_email"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Correo electrónico:
        </label>
        <input
          type="email"
          name="fun_email"
          value={formData.fun_email}
          onChange={handleChange}
          placeholder="Correo electrónico"
          className="bg-zinc-200 p-1 rounded-lg block w-full mb-1"
        />
        <label
          htmlFor="password1"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Password:
        </label>
        <input
          type="password"
          name="password1"
          value={formData.password1}
          onChange={handleChange}
          placeholder="Contraseña"
          className="bg-zinc-200 p-1 rounded-lg block w-full mb-1"
        />
        <label
          htmlFor="password2"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Confirmar password:
        </label>
        <input
          type="password"
          name="password2"
          value={formData.password2}
          onChange={handleChange}
          placeholder="Contraseña"
          className="bg-zinc-200 p-1 rounded-lg block w-full mb-1"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-500 p-1 rounded-lg block w-full mt-1"
        >
          Registrar
        </button>
      </form>
    </div>
  );
}
