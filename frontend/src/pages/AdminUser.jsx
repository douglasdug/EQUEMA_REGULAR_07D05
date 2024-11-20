import React, { useState, useEffect } from "react";
import Select from "react-select";
import {
  registerUser,
  updateUser,
  deleteUser,
  buscarUsuarioEni,
} from "../api/conexion.api.js";
import { listaRegistro, listaUnidadesSalud } from "../components/AllList.jsx";
import { validarDato } from "../api/validadorUtil.js";
import TablaUsers from "../components/TablaUsers.jsx";
import { toast } from "react-hot-toast";

const CustomSelect = ({
  options,
  value,
  onChange,
  name,
  disabled,
  variableEstado,
}) => {
  return (
    <div className="relative inline-block w-full">
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`block appearance-none w-full border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline ${
          disabled
            ? "bg-gray-200 text-gray-700 cursor-no-drop"
            : "bg-white text-gray-700 cursor-pointer"
        }`}
      >
        <option value="" disabled>
          Seleccione una opción
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg
          className="fill-current h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <line x1="0" y1="0" x2="0" y2="20" stroke="gray" strokeWidth="2" />
          <path
            d="M5 8l5 6 5-6H5z"
            fill="gray"
            stroke="black"
            strokeWidth="0.5"
          />
        </svg>
      </div>
    </div>
  );
};

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
  const [isEditing, setIsEditing] = useState(false); // Nuevo estado para determinar si estamos editando

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
      let response;
      if (isEditing) {
        response = await updateUser(formData);
        setSuccessMessage("Registro actualizado con éxito!");
        const message = response.message || "Registro actualizado con éxito!";
        toast.success(message, {
          position: "bottom-right",
        });
      } else {
        response = await registerUser(formData);
        setSuccessMessage("Registro guardado con éxito!");
        const message = response.message || "Registro guardado con éxito!";
        toast.success(message, {
          position: "bottom-right",
        });
      }
      window.location.reload("/admin-user/");
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

  const handleDelete = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar este registro?\n\nIdentificación: ${formData.username}\nNombres: ${formData.last_name} ${formData.first_name}`
    );
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      const response = await deleteUser(formData.username);
      setSuccessMessage("Registro eliminado con éxito!");
      const message = response.message || "Registro eliminado con éxito!";
      toast.success(message, {
        position: "bottom-right",
      });
      window.location.reload("/admin-user/");
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
      toast.error(errorMessage, { position: "bottom-right" });
    } finally {
      setIsLoading(false);
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
      const response = await buscarUsuarioEni(formData.fun_tipo_iden, username);
      if (!response)
        throw new Error("No se pudo obtener una respuesta de la API.");
      const data = response.data;
      const message = response.message || "Operación exitosa";
      setFormData((prevData) => ({
        ...prevData,
        first_name: data.first_name || data.adm_dato_pers_apel,
        last_name: data.last_name || data.adm_dato_pers_nomb,
        fun_sex: data.fun_sex || data.adm_dato_pers_sexo,
        email: data.email || data.adm_dato_pers_corr_elec,
        fun_titu: data.fun_titu || "",
        password1: data.password || "",
        password2: data.password || "",
        fun_admi_rol: data.fun_admi_rol || "",
        fun_esta: data.fun_esta || 0,
        uni_unic: Array.isArray(data.uni_unic)
          ? data.uni_unic.map((item) => ({
              value: item,
              label: `${listaUnidadesSalud[item] || item}`.trim(),
            }))
          : [],
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
      setIsEditing(true); // Cambia a modo edición
      toast.success(message, {
        position: "bottom-right",
      });
      checkFormValidity();
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
        btnRegistrar: true,
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
        setIsEditing(false);
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
    const isValid = requiredFields.every((field) => {
      if (Array.isArray(formData[field])) {
        return formData[field].length > 0;
      }
      return formData[field];
    });
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
    setIsEditing(false); // Restablece el modo edición
  };

  useEffect(() => {
    checkFormValidity();
  }, [formData]);

  const buttonText = isEditing ? "Actualizar Registro" : "Registrar";

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
                      placeholder="Seleccione una opción"
                      isMulti
                      className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                        variableEstado[key]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      isDisabled={variableEstado[key]}
                    />
                  );
                } else if (listaRegistro[key]) {
                  inputElement = (
                    <CustomSelect
                      id={key}
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      options={listaRegistro[key]}
                      disabled={variableEstado[key]}
                      variableEstado={variableEstado}
                    />
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
                        className={`shadow appearance-none border border-gray-500 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                          variableEstado[key]
                            ? "bg-gray-200 text-gray-700 cursor-no-drop"
                            : "bg-white text-gray-700 cursor-pointer"
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
          <div className="flex items-center justify-center">
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
              {buttonText}
            </button>
            {isEditing && (
              <button
                type="button"
                id="btnEliminar"
                name="btnEliminar"
                className="bg-red-500 hover:bg-red-700 text-white ml-2 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer"
                onClick={handleDelete}
              >
                Eliminar registro
              </button>
            )}
          </div>
        </form>
      </div>
      <TablaUsers
        setFormData={setFormData}
        setVariableEstado={setVariableEstado}
        setBotonEstado={setBotonEstado}
        setIsEditing={setIsEditing}
        setIsLoading={setIsLoading}
        setSuccessMessage={setSuccessMessage}
        setError={setError}
      />
    </div>
  );
};

export default AdminUser;
