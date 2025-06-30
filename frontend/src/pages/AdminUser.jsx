import React, { useState, useEffect } from "react";
import Select from "react-select";
import {
  registerUser,
  updateUser,
  deleteUser,
  buscarUsuarioEni,
} from "../api/conexion.api.js";
import { listaSelectUser, listaUnidadesSalud } from "../components/AllList.jsx";
import {
  validarDato,
  validarNumeroIdentificacion,
} from "../api/validadorUtil.js";
import {
  CustomSelect,
  inputStyle,
  selectStyles,
  buttonStylePrimario,
  buttonStyleSecundario,
  buttonStyleEliminar,
} from "../components/EstilosCustom.jsx";
import TablaUsers from "../components/TablaUsers.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const getInputTypeAndAutoComplete = (key) => {
  switch (key) {
    case "password1":
      return { inputType: "password", autoCompleteValue: "new-password" };
    case "password2":
      return { inputType: "password", autoCompleteValue: "current-password" };
    case "email":
      return { inputType: "email", autoCompleteValue: "email" };
    case "username":
    case "first_name":
    case "last_name":
      return { inputType: "text", autoCompleteValue: "off" };
    default:
      return { inputType: "text", autoCompleteValue: "off" };
  }
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

  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

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
    validarDato(formData.email, setError);
    if (error.email) {
      toast.error("Por favor, corrija los errores antes de enviar.", {
        position: "bottom-right",
      });
      return;
    }
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
      const getErrorMessage = (error) => {
        if (error.response?.data) {
          const data = error.response.data;
          if (typeof data === "object") {
            const firstKey = Object.keys(data)[0];
            const firstError = data[firstKey];
            if (Array.isArray(firstError) && firstError.length > 0) {
              return firstError[0];
            } else if (typeof firstError === "string") {
              return firstError;
            } else if (data.message) {
              return data.message;
            } else if (data.error) {
              return data.error;
            }
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
      let errorMessage = "Hubo un error en la operación";
      errorMessage = getErrorMessage(error);
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
        if (error.response?.data?.error) {
          setError(error.response.data.error);
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
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
    fun_tipo_iden: "Tipo de Identificacion:",
    username: "Cédula de Identidad:",
    first_name: "Apellidos completos:",
    last_name: "Nombres completos:",
    fun_sex: "Sexo:",
    email: "Correo Electrónico:",
    fun_titu: "Titulo del Funcionario:",
    password1: "Clave:",
    password2: "Confirmar Clave:",
    fun_admi_rol: "Rol del Funcionario:",
    uni_unic: "Unidad de Salud:",
    fun_esta: "Activar la cuenta:",
  };

  const groupedFields = [];
  const keys = Object.keys(formData).filter((key) => key !== "eniUser");

  for (let i = 0; i < keys.length; i += 4) {
    groupedFields.push(keys.slice(i, i + 4));
  }

  const handleSearch = async () => {
    const { fun_tipo_iden, username } = formData;
    if (!username) {
      toast.error("Por favor, ingrese una identificación.", {
        position: "bottom-right",
      });
      return;
    }
    if (!validarNumeroIdentificacion(fun_tipo_iden, username)) {
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
        fun_tipo_iden: true,
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
      setIsEditing(true);
      toast.success(message, {
        position: "bottom-right",
      });
      checkFormValidity();
    } catch (error) {
      let errorMessage = "Hubo un error en la operación";
      if (error.response) {
        if (error.response.data && error.response.data.error) {
          setError({ general: error.response.data.error });
          errorMessage = error.response.data.error;
        } else if (error.response.data && error.response.data.message) {
          setError({ general: error.response.data.message });
          errorMessage = error.response.data.message;
        } else {
          setError({ general: "Error del servidor" });
        }
      } else if (error.request) {
        setError({ general: "No se recibió respuesta del servidor" });
      } else {
        setError({ general: "Error desconocido" });
      }
      setVariableEstado((prevState) => ({
        ...prevState,
        fun_tipo_iden: true,
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
          fun_tipo_iden: value,
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
    setError({});
    setSuccessMessage(null);
    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
    setIsEditing(false);
  };

  useEffect(() => {
    checkFormValidity();
  }, [formData]);

  const buttonText = isEditing ? "Actualizar Registro" : "Registrar";

  return (
    <div className="container">
      <div className="max-w-max m-auto mt-5">
        <h1 className="text-center text-2xl font-bold mb-5">
          Administrador de Usuarios
        </h1>
        {error && (
          <p style={{ color: "red" }}>
            {Object.keys(error).length > 0 ? JSON.stringify(error) : ""}
          </p>
        )}
        {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
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
                const { inputType, autoCompleteValue } =
                  getInputTypeAndAutoComplete(key);
                let inputElement;
                if (key === "uni_unic") {
                  inputElement = (
                    <Select
                      inputId={key}
                      name={key}
                      value={formData[key]}
                      onChange={handleSelectChange}
                      options={Object.keys(listaUnidadesSalud).map((item) => ({
                        value: item,
                        label: listaUnidadesSalud[item],
                      }))}
                      isMulti
                      placeholder="Seleccione una o varias opciones"
                      styles={{
                        ...selectStyles,
                        control: (provided, state) => ({
                          ...selectStyles.control(provided, state),
                          borderWidth: "1px",
                          borderColor: "black",
                          cursor: variableEstado[key]
                            ? "not-allowed"
                            : "pointer",
                          backgroundColor: variableEstado[key]
                            ? "lightgray"
                            : "white",
                        }),
                      }}
                      isDisabled={variableEstado[key]}
                    />
                  );
                } else if (listaSelectUser[key]) {
                  inputElement = (
                    <CustomSelect
                      id={key}
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      options={listaSelectUser[key]}
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
                        className={`${inputStyle} ${
                          variableEstado[key]
                            ? "bg-gray-200 text-gray-700 cursor-no-drop"
                            : "bg-white text-gray-700 cursor-pointer"
                        }`}
                        min="0"
                        disabled={variableEstado[key]}
                        autoComplete={autoCompleteValue}
                      />
                      {key === "username" && (
                        <div className="flex">
                          <button
                            type="button"
                            id="btnBuscar"
                            name="btnBuscar"
                            className={`${buttonStylePrimario} ${
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
                            className={buttonStyleSecundario}
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
                      {requiredFields.includes(key) && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap[key]}
                    </label>
                    {inputElement}
                    {error[key] && (
                      <p className="text-red-500 text-xs italic">
                        {error[key]}
                      </p>
                    )}
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
              className={`${buttonStylePrimario} ${
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
                className={buttonStyleEliminar}
                onClick={handleDelete}
              >
                Eliminar registro
              </button>
            )}
            <button
              type="button"
              className="ml-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              onClick={() => navigate("/")}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
      <div className="mt-5">
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
    </div>
  );
};

export default AdminUser;
