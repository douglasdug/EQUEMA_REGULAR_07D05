import React, { useState, useEffect } from "react";
import { registerUser, buscarUsuarioAdmision } from "../api/conexion.api.js";
import { listaRegistro } from "../components/AllList.jsx";
import { validarDato } from "../api/validadorUtil.js";
import { toast } from "react-hot-toast";

const Register = () => {
  const [formData, setFormData] = useState({
    fun_tipo_iden: "",
    username: "",
    first_name: "",
    last_name: "",
    fun_sex: "",
    fun_titu: "",
    password1: "",
    password2: "",
  });

  const [error, setError] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isUsernameDisabled, setIsUsernameDisabled] = useState(true);
  const [isSearchButtonDisabled, setIsSearchButtonDisabled] = useState(true);
  const [isOtherFieldsDisabled, setIsOtherFieldsDisabled] = useState(true);

  const [variableEstado, setVariableEstado] = useState({
    fun_tipo_iden: false,
    username: true,
    first_name: true,
    last_name: true,
    fun_sex: true,
    fun_titu: true,
    password1: true,
    password2: true,
  });

  const requiredFields = [
    "fun_tipo_iden",
    "username",
    "first_name",
    "last_name",
    "fun_sex",
    "fun_titu",
    "password1",
    "password2",
  ];

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

      // Guardar datos del usuario en el almacenamiento local
      localStorage.setItem(
        "userData",
        JSON.stringify({
          username: formData.username,
          first_name: formData.first_name,
          last_name: formData.last_name,
          fun_titu: formData.fun_titu,
        })
      );

      window.location.href = "/aviso-user/";
    } catch (error) {
      const errorMessage =
        error.response?.data?.[Object.keys(error.response.data)[0]]?.[0] ||
        "Error durante el Registro!";
      setError(errorMessage);
      toast.error(errorMessage, { position: "bottom-right" });
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
    fun_titu: "Titulo del Funcionario",
    password1: "Clave",
    password2: "Confirmar Clave",
  };

  const groupedFields = [];
  const keys = Object.keys(formData).filter((key) => key !== "eniUser");

  for (let i = 0; i < keys.length; i += 2) {
    groupedFields.push(keys.slice(i, i + 2));
  }

  const handleSearch = async () => {
    const username = formData.username;
    if (!username) {
      toast.error("Por favor, ingrese una identificación.", {
        position: "bottom-right",
      });
      return;
    }

    try {
      const data = await buscarUsuarioAdmision(
        formData.fun_tipo_iden,
        username
      );
      console.log("Datos JSON recibidos:", data);

      if (!data) {
        throw new Error("No se pudo obtener una respuesta de la API.");
      }

      const updatedFormData = {
        ...formData,
        first_name: data.adm_dato_pers_apel,
        last_name: data.adm_dato_pers_nomb,
        fun_sex: data.adm_dato_pers_sexo,
      };
      setFormData(updatedFormData);

      //setIsOtherFieldsDisabled(false);
      //setIsUsernameDisabled(true);
      //setIsSearchButtonDisabled(true);
      setVariableEstado({
        username: true,
        first_name: true,
        last_name: true,
        fun_sex: false,
        fun_titu: false,
        password1: false,
        password2: false,
      });

      toast.success("Datos encontrados y actualizados.", {
        position: "bottom-right",
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.[Object.keys(error.response.data)[0]]?.[0] ||
        "Error al buscar el usuario!";
      console.error("Error en handleSearch1:", error);
      console.log("Error en handleSearch2:", errorMessage);
      toast.error(errorMessage, { position: "bottom-right" });

      //setIsOtherFieldsDisabled(false);
      //setIsUsernameDisabled(false);
      //setIsSearchButtonDisabled(false);
      setVariableEstado({
        username: true,
        first_name: false,
        last_name: false,
        fun_sex: false,
        fun_titu: false,
        password1: false,
        password2: false,
      });
      toast.error("Todos los campos son obligatorios", {
        position: "bottom-right",
      });
    }
  };

  const handleChange = (e) => {
    validarDato(e, formData, setFormData, setIsButtonDisabled, requiredFields);
    if (e.target.name === "fun_tipo_iden") {
      const isDisabled = !e.target.value;
      //setIsUsernameDisabled(isDisabled);
      //setIsSearchButtonDisabled(isDisabled);
      //setIsOtherFieldsDisabled(true);
      setVariableEstado({
        username: false,
        first_name: true,
        last_name: true,
        fun_sex: true,
        fun_titu: true,
        password1: true,
        password2: true,
      });

      if (isDisabled) {
        setFormData({
          fun_tipo_iden: "",
          username: "",
          first_name: "",
          last_name: "",
          fun_sex: "",
          fun_titu: "",
          password1: "",
          password2: "",
        });
        setVariableEstado({
          username: true,
          first_name: true,
          last_name: true,
          fun_sex: true,
          fun_titu: true,
          password1: true,
          password2: true,
        });
      }
    } else if (e.target.name === "username") {
      setIsSearchButtonDisabled(!e.target.value);
      setIsOtherFieldsDisabled(true);
    }
  };

  const limpiarVariables = (e) => {
    setFormData({
      fun_tipo_iden: "",
      username: "",
      first_name: "",
      last_name: "",
      fun_sex: "",
      fun_titu: "",
      password1: "",
      password2: "",
    });
  };

  return (
    <div className="container">
      <div className="max-w-max m-auto mt-5">
        {error && <p style={{ color: "red" }}>{error}</p>}
        {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
        <h1 className="text-center text-2xl font-bold mb-5">
          Registro de Funcionario
        </h1>
        <p className="mt-4 text-gray-700">
          ¡La contraseña debe tener de 8 a 15 caracteres y tener una combinación
          entre Mayúsculas, Minúsculas y números!
        </p>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          {groupedFields.map((group, groupIndex) => (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2"
              key={group.join("-")}
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
                        className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                          variableEstado[key]
                            ? "bg-gray-200 text-gray-700"
                            : "bg-white text-gray-700"
                        }`}
                        disabled={variableEstado[key]}
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
                      <div className="flex">
                        <input
                          type={inputType}
                          id={key}
                          name={key}
                          value={formData[key]}
                          onChange={handleChange}
                          placeholder="Información es requerida"
                          className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                            variableEstado[key]
                              ? "bg-gray-200 text-gray-700"
                              : "bg-white text-gray-700"
                          }`}
                          min="0"
                          disabled={variableEstado[key]}
                        />
                        {key === "username" && (
                          <div className="flex">
                            <button
                              type="button"
                              id="btnBuscar"
                              className={`ml-2 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                                isSearchButtonDisabled
                                  ? "bg-gray-300 text-gray-700"
                                  : "bg-blue-500 hover:bg-blue-700 text-white"
                              }`}
                              onClick={handleSearch}
                              disabled={isSearchButtonDisabled}
                            >
                              Buscar
                            </button>
                            <button
                              type="button"
                              id="btnLimpiar"
                              className={
                                "bg-blue-500 hover:bg-blue-700 text-white ml-2 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                              }
                              onClick={limpiarVariables}
                            >
                              Limpiar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          ))}
          <div className="flex flex-col items-center">
            <button
              type="submit"
              id="btnRegistrar"
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
