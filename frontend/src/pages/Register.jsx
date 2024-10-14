import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { registerUser } from "../api/usuario.api.js";

const Register = () => {
  const [formData, setFormData] = useState({
    fun_tipo_iden: "",
    username: "",
    first_name: "",
    last_name: "",
    fun_email: "",
    password1: "",
    password2: "",
    fun_sex: "",
    fun_titu: "",
  });

  const requiredFields = [
    "fun_tipo_iden:",
    "username:",
    "first_name:",
    "last_name:",
    "fun_email:",
    "password1:",
    "password2:",
    "fun_sex:",
    "fun_titu:",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    let isValid = true;
    let formattedValue = value;

    if (e.target.type === "text") {
      formattedValue = value.toUpperCase().replace(/\s{2,}/g, " ");
      isValid = true; // formattedValue.trim() !== ""; Allow empty values for text inputs
    } else if (e.target.type === "number") {
      isValid = value > 0;
    } else if (e.target.type === "date") {
      isValid = !isNaN(new Date(value).getTime());
    }

    if (isValid) {
      setFormData({
        ...formData,
        [name]: formattedValue,
      });
    }

    setIsButtonDisabled(
      !requiredFields.every((field) => {
        const val = field === name ? formattedValue : formData[field];
        if (typeof val === "string") {
          return val.trim() !== "";
        } else if (typeof val === "number") {
          return val > 0;
        } else if (val instanceof Date) {
          return !isNaN(val.getTime());
        }
        return true;
      })
    );
  };

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

  const labelMap = {
    fun_tipo_iden: "Tipo de Identificacion",
    username: "Cédula de Identidad",
    first_name: "Apellidos completos",
    last_name: "Nombres completos",
    fun_email: "Sexo",
    password1: "Correo electrónico",
    password2: "Titulo del Funcionario",
    fun_sex: "Clave",
    fun_titu: "Confirmar Clave",
  };

  const selectOptions = {
    fun_tipo_iden: [
      "NO IDENTIFICADO",
      "CÉDULA DE IDENTIDAD",
      "PASAPORTE",
      "VISA",
      "CARNÉT DE REFUGIADO",
    ],
    fun_sex: ["HOMBRE", "MUJER"],
    fun_titu: [
      "BIOQUÍMICO MÉDICO/A",
      "DOCTOR/A",
      "DOCTOR/A - (RURAL)",
      "ESPECIALISTA",
      "LICENCIADO EN ENFERMERÍA",
      "LICENCIADO EN ENFERMERÍA - (RURAL)",
      "MÉDICO GENERAL/A",
      "MÉDICO GENERAL/A - (RURAL)",
      "OBSTETRICIA",
      "OBSTETRICIA - (RURAL)",
      "ODONTÓLOGO/A",
      "ODONTÓLOGO/A - (RURAL)",
      "PSICÓLOGO CLÍNICO/A",
      "PSICÓLOGO CLÍNICO/A - (RURAL)",
      "OTROS/A",
      "SEÑOR",
      "SEÑORA",
      "SEÑORITA",
    ],
  };

  return (
    <div className="container">
      <div className="max-w-max m-auto mt-5">
        {error && <p style={{ color: "red" }}>{error}</p>}
        {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
        <h2 className="text-center text-2xl font-bold mb-5">
          Registro de Funcionario
        </h2>
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
            placeholder="Tipo de Identificacion"
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
            htmlFor="fun_titu"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Titulo del Funcionario:
          </label>
          <input
            type="text"
            name="fun_titu"
            value={formData.fun_titu}
            onChange={handleChange}
            placeholder="Titulo del Funcionario"
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
    </div>
  );
};
export default Register;
