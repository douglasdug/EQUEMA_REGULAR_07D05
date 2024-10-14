import React, { useState } from "react";
import { registerUser } from "../api/usuario.api.js";
import { listaRegistro } from "../components/AllList.jsx";
import { toast } from "react-hot-toast";

const Register = () => {
  const [formData, setFormData] = useState({
    fun_tipo_iden: "",
    username: "",
    first_name: "",
    last_name: "",
    fun_sex: "",
    fun_email: "",
    fun_titu: "",
    password1: "",
    password2: "",
  });

  const [error, setError] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const requiredFields = [
    "fun_tipo_iden",
    "username",
    "first_name",
    "last_name",
    "fun_sex",
    "fun_email",
    "fun_titu",
    "password1",
    "password2",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    let isValid = true;
    let formattedValue = value;

    if (e.target.type === "text") {
      formattedValue = value.toUpperCase().replace(/\s{2,}/g, " ");
      isValid = true; // Allow empty values for text inputs
    } else if (e.target.type === "number") {
      isValid = value > 0;
    } else if (e.target.type === "date") {
      isValid = !isNaN(new Date(value).getTime());
    } else if (e.target.type === "password") {
      formattedValue = value.replace(/\s/g, ""); // Remove spaces
      isValid = /^[A-Za-z0-9]*$/.test(formattedValue); // Allow only alphanumeric characters
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

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

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
      window.location.href = "/login/";
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

  const handleButtonClick = (e) => {
    if (isButtonDisabled) {
      e.preventDefault();
      console.log("Todos los campos con * en rojo tienen que estar llenos!");
      toast.error("Todos los campos con * en rojo tienen que estar llenos!", {
        position: "bottom-right",
      });
    }
  };

  const labelMap = {
    fun_tipo_iden: "Tipo de Identificacion",
    username: "Cédula de Identidad",
    first_name: "Apellidos completos",
    last_name: "Nombres completos",
    fun_sex: "Sexo",
    fun_email: "Correo electrónico",
    fun_titu: "Titulo del Funcionario",
    password1: "Clave",
    password2: "Confirmar Clave",
  };

  const groupedFields = [];
  const keys = Object.keys(formData).filter((key) => key !== "eniUser");

  for (let i = 0; i < keys.length; i += 2) {
    groupedFields.push(keys.slice(i, i + 2));
  }

  return (
    <div className="container">
      <div className="max-w-max m-auto mt-5">
        {error && <p style={{ color: "red" }}>{error}</p>}
        {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
        <h1 className="text-center text-2xl font-bold mb-5">
          Registro de Funcionario
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          {groupedFields.map((group, groupIndex) => (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2"
              key={groupIndex}
            >
              {group.map((key) => {
                let inputType;
                if (listaRegistro[key]) {
                  return (
                    <div className="mb-2" key={key}>
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor={key}
                      >
                        {labelMap[key]}
                        {requiredFields.includes(key) && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      <select
                        id={key}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      >
                        <option value="">Seleccione una opción</option>
                        {listaRegistro[key].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                } else {
                  if (key === "password1" || key === "password2") {
                    inputType = "password";
                  } else if (key === "fun_email") {
                    inputType = "email";
                  } else {
                    inputType = "text";
                  }
                  return (
                    <div className="mb-2" key={key}>
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor={key}
                      >
                        {labelMap[key]}
                        {requiredFields.includes(key) && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      <input
                        type={inputType}
                        id={key}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        placeholder="Información es requerida"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        min="0"
                      />
                    </div>
                  );
                }
              })}
            </div>
          ))}
          <div className="flex flex-col items-center">
            <button
              type="submit"
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isButtonDisabled}
              onClick={handleButtonClick}
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Register;
