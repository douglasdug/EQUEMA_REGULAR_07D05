import React, { useState, useEffect } from "react";
import Select from "react-select";
import { registerUser, identificacionUsuario } from "../api/conexion.api.js";
import { listaRegistro } from "../components/AllList.jsx";
import { validarDato } from "../api/validadorUtil.js";
import TablaUsers from "../components/TablaUsers.jsx";
import { toast } from "react-hot-toast";

const AdminUser = () => {
  const [formData, setFormData] = useState({
    fun_tipo_iden: "",
    username: "",
    first_name: "",
    last_name: "",
    fun_sex: "",
    email: "",
    fun_titu: "",
    password1: "",
    password2: "",
    fun_admi_rol: "",
    uni_unic: [],
    fun_esta: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const initialVariableEstado = {
    fun_tipo_iden: false,
    username: true,
    first_name: true,
    last_name: true,
    fun_sex: true,
    email: true,
    fun_titu: true,
    password1: true,
    password2: true,
    fun_admi_rol: true,
    uni_unic: true,
    fun_esta: true,
  };
  const initialBotonEstado = {
    btnBuscar: true,
    btnLimpiar: false,
    btnRegistrar: true,
  };

  const [variableEstado, setVariableEstado] = useState(initialVariableEstado);
  const [botonEstado, setBotonEstado] = useState(initialBotonEstado);

  const requiredFields = [
    "fun_tipo_iden",
    "username",
    "first_name",
    "last_name",
    "fun_sex",
    "email",
    "fun_titu",
    "password1",
    "password2",
    "fun_admi_rol",
    "uni_unic",
    "fun_esta",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const data = await registerUser(formData);
      console.log("Success!", data);
      setSuccessMessage("Registro guardado con éxito!");
      toast.success("Registro guardado con éxito!", {
        position: "bottom-right",
      });
      window.location.reload("/admin-user/");
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
    if (botonEstado.btnRegistrar) {
      e.preventDefault();
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
    email: "Correo Electrónico",
    fun_titu: "Titulo del Funcionario",
    password1: "Clave",
    password2: "Confirmar Clave",
    fun_admi_rol: "Rol del Funcionario",
    uni_unic: "Unicodigo",
    fun_esta: "Activar la cuenta",
  };

  const groupedFields = [];
  const keys = Object.keys(formData).filter((key) => key !== "eniUser");

  for (let i = 0; i < keys.length; i += 4) {
    groupedFields.push(keys.slice(i, i + 4));
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
      const data = await identificacionUsuario(
        formData.fun_tipo_iden,
        username
      );
      if (!data) throw new Error("No se pudo obtener una respuesta de la API.");

      setFormData((prevData) => ({
        ...prevData,
        first_name: data.adm_dato_pers_apel,
        last_name: data.adm_dato_pers_nomb,
        fun_sex: data.adm_dato_pers_sexo,
        email: data.adm_dato_pers_corr_elec,
      }));
      setVariableEstado((prevState) => ({
        ...prevState,
        username: true,
        first_name: true,
        last_name: true,
        fun_sex: false,
        email: false,
        fun_titu: false,
        password1: false,
        password2: false,
        fun_admi_rol: false,
        uni_unic: false,
        fun_esta: false,
      }));
      setBotonEstado((prevState) => ({
        btnBuscar: true,
      }));
      toast.success("Datos encontrados y actualizados.", {
        position: "bottom-right",
      });
    } catch (error) {
      let errorMessage = "Hubo un error en la operación";
      if (error.response) {
        if (error.response.data && error.response.data.error) {
          setError(error.response.data.error);
          errorMessage = error.response.data.error;
        } else if (error.response.data && error.response.data.message) {
          setError(error.response.data.message);
          errorMessage = error.response.data.message;
        } else {
          setError("Error del servidor");
        }
      } else if (error.request) {
        setError("No se recibió respuesta del servidor");
      } else {
        setError("Error desconocido");
      }
      setVariableEstado((prevState) => ({
        ...prevState,
        username: true,
        first_name: false,
        last_name: false,
        fun_sex: false,
        email: false,
        fun_titu: false,
        password1: false,
        password2: false,
        fun_admi_rol: false,
        uni_unic: false,
        fun_esta: false,
      }));
      setBotonEstado((prevState) => ({
        btnBuscar: true,
      }));
      toast.error(errorMessage, {
        position: "bottom-right",
      });
    }
  };

  const handleChange = (e) => {
    validarDato(e, formData, setFormData);
    const { name, value } = e.target;

    if (name === "fun_tipo_iden") {
      setVariableEstado((prevState) => ({
        ...prevState,
        username: !value,
      }));
      if (!value) {
        setFormData({
          fun_tipo_iden: "",
          username: "",
          first_name: "",
          last_name: "",
          fun_sex: "",
          email: "",
          fun_titu: "",
          password1: "",
          password2: "",
          fun_admi_rol: "",
          uni_unic: [],
          fun_esta: "",
        });
        setVariableEstado(initialVariableEstado);
        setBotonEstado(initialBotonEstado);
      }
    } else if (name === "username") {
      setBotonEstado((prevState) => ({
        ...prevState,
        btnBuscar: !value,
      }));
    }
    checkFormValidity();
  };

  const handleSelectChange = (selectedOptions) => {
    setFormData((prevData) => ({
      ...prevData,
      uni_unic: selectedOptions,
    }));
    checkFormValidity();
  };

  const checkFormValidity = () => {
    const isValid = requiredFields.every((field) => formData[field]);
    setBotonEstado((prevState) => ({
      ...prevState,
      btnRegistrar: !isValid,
    }));
  };

  const limpiarVariables = () => {
    setFormData({
      fun_tipo_iden: "",
      username: "",
      first_name: "",
      last_name: "",
      fun_sex: "",
      email: "",
      fun_titu: "",
      password1: "",
      password2: "",
      fun_admi_rol: "",
      uni_unic: [],
      fun_esta: "",
    });
    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
  };

  useEffect(() => {
    checkFormValidity();
  }, [formData]);

  return (
    <div className="container">
      <div className="max-w-max m-auto mt-5">
        {error && <p style={{ color: "red" }}>{error}</p>}
        {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
        <h1 className="text-center text-2xl font-bold mb-5">
          Administrador de Usuarios
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          {groupedFields.map((group) => (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2"
              key={group.join("-")}
            >
              {group.map((key) => {
                let inputType;
                if (key === "password1" || key === "password2") {
                  inputType = "password";
                } else if (key === "email") {
                  inputType = "email";
                } else {
                  inputType = "text";
                }
                let inputElement;
                if (key === "uni_unic") {
                  inputElement = (
                    <Select
                      id={key}
                      name={key}
                      value={formData[key]}
                      onChange={handleSelectChange}
                      options={listaRegistro[key]}
                      isMulti
                      className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                        variableEstado[key]
                          ? "bg-gray-200 text-gray-700"
                          : "bg-white text-gray-700"
                      }`}
                      isDisabled={variableEstado[key]}
                    />
                  );
                } else if (listaRegistro[key]) {
                  inputElement = (
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
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  );
                } else {
                  inputElement = (
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
                            name="btnBuscar"
                            className={`ml-2 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-black ${
                              botonEstado.btnBuscar
                                ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
                            }`}
                            onClick={handleSearch}
                            disabled={botonEstado.btnBuscar}
                          >
                            Buscar
                          </button>
                          <button
                            type="button"
                            id="btnLimpiar"
                            name="btnLimpiar"
                            className="bg-blue-500 hover:bg-blue-700 text-white ml-2 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            onClick={limpiarVariables}
                          >
                            Limpiar
                          </button>
                        </div>
                      )}
                    </div>
                  );
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
                    {inputElement}
                  </div>
                );
              })}
            </div>
          ))}
          <div className="flex flex-col items-center">
            <button
              type="submit"
              id="btnRegistrar"
              name="btnRegistrar"
              className={`ml-2 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-black ${
                botonEstado.btnRegistrar
                  ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
              }`}
              disabled={botonEstado.btnRegistrar}
              onClick={handleButtonClick}
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
      <TablaUsers
        setFormData={setFormData}
        setVariableEstado={setVariableEstado}
        setBotonEstado={setBotonEstado}
      />
    </div>
  );
};

export default AdminUser;
