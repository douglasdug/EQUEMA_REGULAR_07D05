import React, { useState, useEffect } from "react";
import {
  registerUser,
  updateUser,
  deleteUser,
  buscarUsuarioEni,
} from "../api/conexion.api.js";
import allListRegisterUser from "../api/all.list.register.user.json";
import {
  validarDato,
  validarNumeroIdentificacion,
} from "../api/validadorUtil.js";
import {
  CustomSelect,
  inputStyle,
  isFieldInvalid,
  selectStyles,
  buttonStylePrimario,
  buttonStyleSecundario,
  buttonStyleEliminar,
} from "../components/EstilosCustom.jsx";
import TablaUsers from "../components/TablaUsers.jsx";
import BuscarAdmisionados from "../components/BuscarAdmisionados.jsx";
import Loader from "../components/Loader.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const initialState = {
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
};

const AdminUser = () => {
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isBuscar, setIsBuscar] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [refreshTable, setRefreshTable] = useState(0);
  const [showBusquedaAvanzada, setShowBusquedaAvanzada] = useState(false);
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
    "fun_admi_rol",
    "uni_unic",
    "fun_esta",
  ];

  const labelMap = {
    fun_tipo_iden: "Tipo de Identificacion:",
    username: "Cédula de Identidad:",
    first_name: "Nombres completos:",
    last_name: "Apellidos completos:",
    fun_sex: "Sexo:",
    email: "Correo Electrónico:",
    fun_titu: "Titulo del Funcionario:",
    password1: "Clave:",
    password2: "Confirmar Clave:",
    fun_admi_rol: "Rol del Funcionario:",
    uni_unic: "Unidad de Salud:",
    fun_esta: "Activar la cuenta:",
  };

  const getErrorMessage = (error) => {
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === "object" && data !== null) {
        if (data.message) return data.message;
        if (data.error) return data.error;
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

  const handleSearch = async () => {
    let tipoId, numIden;
    tipoId = formData.fun_tipo_iden;
    numIden = formData.username;
    if (!tipoId || !numIden) {
      setError("Debe seleccionar el tipo y número de identificación.");
      toast.error("Debe seleccionar el tipo y número de identificación.", {
        position: "bottom-right",
      });
      return;
    }
    if (!numIden) {
      toast.error("Por favor, ingrese una identificación.", {
        position: "bottom-right",
      });
      return;
    }
    const resultado = validarNumeroIdentificacion(tipoId, numIden);
    if (!resultado.valido) {
      setError(resultado.mensaje);
      setTimeout(() => setError(""), 8000);
      toast.error(resultado.mensaje, { position: "bottom-right" });
      return;
    }
    try {
      const response = await buscarUsuarioEni(tipoId, numIden);
      if (!response)
        throw new Error("No se pudo obtener una respuesta de la API.");

      actualizarFormDataConRespuesta(response.data);
      ajustarVariableEstadoExitoso();
      console.log("Respuesta de buscarUsuarioEni:", response.data.fun_esta);
      if (response.data.fun_esta >= 0) {
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
      setSuccessMessage(response.message || "Operación exitosa");
      setTimeout(() => setSuccessMessage(""), 10000);
      setError("");
      toast.success(response.message || "Operación exitosa", {
        position: "bottom-right",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      ajustarVariableEstadoFalso();
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      setSuccessMessage("");
      toast.error(errorMessage, { position: "bottom-right" });
    }
  };

  const actualizarFormDataConRespuesta = (data) => {
    setFormData((prevData) => ({
      ...prevData,
      id_eniUser: data.id_eniUser || "",
      first_name:
        data.first_name ||
        [data.adm_dato_pers_nomb_prim || "", data.adm_dato_pers_nomb_segu || ""]
          .filter(Boolean)
          .join(" "),
      last_name:
        data.last_name ||
        [data.adm_dato_pers_apel_prim || "", data.adm_dato_pers_apel_segu || ""]
          .filter(Boolean)
          .join(" "),
      fun_sex: data.fun_sex || data.adm_dato_pers_sexo || "",
      email: data.email || data.adm_dato_pers_corr_elec || "",
      fun_titu: data.fun_titu || "",
      password1: "",
      password2: "",
      fun_admi_rol: data.fun_admi_rol || "",
      fun_esta: data.fun_esta || 0,
      uni_unic: Array.isArray(data.unidades_data)
        ? data.unidades_data.map((item) => {
            if (typeof item === "object" && item !== null) {
              return {
                value: item.uni_unic,
                label: `${item.uni_unic} - ${item.uni_unid}`.trim(),
              };
            } else {
              return {
                value: item,
                label: item,
              };
            }
          })
        : [],
    }));
  };

  const ajustarVariableEstadoExitoso = () => {
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
  };

  const ajustarVariableEstadoFalso = () => {
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
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "fun_tipo_iden") {
      limpiarVariables();
      setFormData((prev) => ({
        ...initialState,
        fun_tipo_iden: value,
      }));
      setVariableEstado({
        ...initialVariableEstado,
        username: !value,
      });
      setBotonEstado({
        ...initialBotonEstado,
        btnBuscar: !value,
      });
      return;
    }

    let newFormData = { ...formData, [name]: value };
    let newVariableEstado = { ...variableEstado };
    let newBotonEstado = { ...botonEstado };

    if (name === "username") {
      newBotonEstado.btnBuscar = !value;
    }

    setFormData(newFormData);
    setVariableEstado(newVariableEstado);
    setBotonEstado(newBotonEstado);

    validarDato(e, newFormData, setFormData, error, setError, setBotonEstado);
  };

  const handleSelectChange = (selected) => {
    let value = selected || [];
    let errorMessage = "";

    if (!value.length) {
      errorMessage = "Debe seleccionar al menos una unidad de salud";
      setError("");
    } else if (value.length > 3) {
      errorMessage = "Solo puede seleccionar hasta 3 unidades de salud";
      setError("Solo puede seleccionar hasta 3 unidades de salud");
      value = value.slice(0, 3);
    }

    setFormData((prev) => ({ ...prev, uni_unic: value }));

    setTimeout(() => checkFormValidity({ ...formData, uni_unic: value }), 0);

    if (errorMessage) {
      toast.error(errorMessage, { position: "bottom-right" });
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
      setRefreshTable((prev) => prev + 1);
      limpiarVariables();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      setSuccessMessage("");
      toast.error(errorMessage, { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const isFieldVisible = (field) => {
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      let response;
      if (isEditing) {
        // Construir el objeto data solo con los campos necesarios
        const data = {
          ...formData,
        };
        // Solo agregar password1 y password2 si ambos tienen valor
        if (!formData.password1 && !formData.password2) {
          delete data.password1;
          delete data.password2;
        }
        response = await updateUser(data);
        const message = response?.message || "Registro actualizado con éxito!";
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(""), 10000);
        toast.success(message, { position: "bottom-right" });
        setRefreshTable((prev) => prev + 1);
      } else {
        response = await registerUser(formData);
        const message = response.message || "Registro guardado con éxito!";
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(""), 10000);
        toast.success(message, { position: "bottom-right" });
        setRefreshTable((prev) => prev + 1);
      }
      limpiarVariables();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
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

  // Validación de contraseña reutilizable
  const getPasswordValidation = () => {
    const { password1, password2 } = formData;
    return {
      longitud:
        password1.length >= 10 &&
        password1.length <= 20 &&
        password2.length >= 10 &&
        password2.length <= 20,
      mayMinNum:
        /[A-Z]/.test(password1) &&
        /[a-z]/.test(password1) &&
        /\d/.test(password1) &&
        /[A-Z]/.test(password2) &&
        /[a-z]/.test(password2) &&
        /\d/.test(password2),
      especial: /[*+\-]/.test(password1) && /[*+\-]/.test(password2),
      iguales: password1 && password2 && password1 === password2,
    };
  };

  const cumpleRequisitosPassword = () => {
    const val = getPasswordValidation();
    return val.longitud && val.mayMinNum && val.especial && val.iguales;
  };

  const checkFormValidity = (customFormData) => {
    const data = customFormData || formData;
    const fieldsValid = requiredFields.every((field) => {
      if (field === "uni_unic") {
        return (
          Array.isArray(data.uni_unic) &&
          data.uni_unic.length >= 1 &&
          data.uni_unic.length <= 3
        );
      }
      if (Array.isArray(data[field])) {
        return data[field].length > 0;
      }
      return data[field];
    });

    // Solo requerir password en modo registro
    let passwordValid = true;
    if (!isEditing) {
      passwordValid = cumpleRequisitosPassword();
    } else {
      // En edición, solo validar si el usuario escribe algo en los campos
      const { password1, password2 } = data;
      if (password1 || password2) {
        passwordValid = cumpleRequisitosPassword();
        if (!password1 || !password2) passwordValid = false;
      }
    }

    const formValid = fieldsValid && passwordValid && !error;

    setBotonEstado((prevState) => ({
      ...prevState,
      btnRegistrar: !formValid,
    }));
  };

  const limpiarVariables = () => {
    setFormData(initialState);
    setSuccessMessage("");
    setError("");
    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
    setIsEditing(false);
  };

  useEffect(() => {
    checkFormValidity();
  }, [formData]);

  const handleSeleccionarAdmisionado = (registro) => {
    const tipo =
      registro.adm_dato_pers_tipo_iden ||
      registro.tipoId ||
      registro.fun_tipo_iden ||
      "";
    const num =
      registro.adm_dato_pers_nume_iden ||
      registro.numeId ||
      registro.username ||
      "";

    if (!tipo || !num) return;

    setFormData((prev) => ({
      ...prev,
      fun_tipo_iden: tipo,
      username: num,
    }));

    // Ajusta estados para permitir (o forzar) la búsqueda inmediata
    setVariableEstado((prev) => ({
      ...prev,
      fun_tipo_iden: false,
      username: false,
    }));
    setBotonEstado((prev) => ({
      ...prev,
      btnBuscar: false, // habilita botón "Buscar" como acción disponible
    }));
    setIsBuscar(false);
    setShowBusquedaAvanzada(false);

    // Si quieres cargar de inmediato los demás datos:
    setTimeout(() => handleSearch("paciente"), 0);
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

  const fieldClass = "mb-1 flex flex-col";
  const labelClass = "block text-gray-700 text-sm font-bold mb-1";
  const buttonTextRegistro = isEditing ? "Actualizar Registro" : "Registrar";
  const buttonTextBuscar = isBuscar ? "Nuevo Registro" : "Buscar";

  return (
    <div className="w-auto h-auto flex items-stretch justify-stretch bg-gray-100">
      <div className="w-full h-full p-4 m-4 bg-white rounded-lg shadow-md mt-1">
        <h2 className="text-2xl font-bold mb-1 text-center text-blue-700">
          Administrador de Usuarios
        </h2>
        {isLoading && (
          <Loader
            modal
            isOpen={isLoading}
            title="Iniciando sesión"
            text="Por favor espere..."
            closeButton={false}
          />
        )}
        <form onSubmit={handleSubmit} className="w-full">
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Datos Personales
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="fun_tipo_iden">
                  {requiredFields.includes("fun_tipo_iden") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["fun_tipo_iden"]}
                </label>
                <CustomSelect
                  id="fun_tipo_iden"
                  name="fun_tipo_iden"
                  value={formData["fun_tipo_iden"]}
                  onChange={handleChange}
                  options={allListRegisterUser.fun_tipo_iden}
                  disabled={variableEstado["fun_tipo_iden"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "fun_tipo_iden",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                />
              </div>
              <div className={fieldClass}>
                <div className="flex items-center justify-between">
                  <label className={labelClass} htmlFor="username">
                    {requiredFields.includes("username") && (
                      <span className="text-red-500">* </span>
                    )}
                    {labelMap["username"]}
                  </label>
                  <button
                    type="button"
                    id="btnBusquedaAvanzada"
                    name="btnBusquedaAvanzada"
                    onClick={() => {
                      limpiarVariables();
                      setShowBusquedaAvanzada(true);
                    }}
                    className={`ml-2 inline-flex items-center gap-1 px-2 py-[2px] text-[11px] rounded-full border
                          ${
                            showBusquedaAvanzada
                              ? "bg-indigo-600 text-white border-indigo-700 shadow"
                              : "bg-indigo-100 text-black border-indigo-400 hover:bg-indigo-300"
                          } transition-colors`}
                    title="Abrir búsqueda avanzada"
                    aria-pressed={showBusquedaAvanzada}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 18 18"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.9 14.32a8 8 0 111.414-1.414l3.387 3.386a1 1 0 01-1.414 1.415l-3.387-3.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Avanzada
                  </button>
                </div>
                <div className="flex items-center gap-0 mb-0">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData["username"]}
                    onChange={handleChange}
                    placeholder="Información es requerida"
                    required
                    className={`${inputStyle}
                                ${
                                  isFieldInvalid(
                                    "username",
                                    requiredFields,
                                    formData,
                                    isFieldVisible
                                  )
                                    ? "border-2 border-red-500"
                                    : ""
                                }
                                 ${
                                   variableEstado["username"]
                                     ? "bg-gray-200 text-gray-700 cursor-no-drop"
                                     : "bg-white text-gray-700 cursor-pointer"
                                 }`}
                    disabled={variableEstado["username"]}
                  />
                  <button
                    type="button"
                    id="btnBuscar"
                    name="btnBuscar"
                    className={`${buttonStylePrimario} ${
                      botonEstado.btnBuscar
                        ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                    }`}
                    onClick={handleSearch}
                    disabled={botonEstado.btnBuscar}
                  >
                    Buscar
                  </button>
                </div>
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="last_name">
                  {requiredFields.includes("last_name") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["last_name"]}
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData["last_name"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle}
                                ${
                                  isFieldInvalid(
                                    "last_name",
                                    requiredFields,
                                    formData,
                                    isFieldVisible
                                  )
                                    ? "border-2 border-red-500"
                                    : ""
                                }
                                ${
                                  variableEstado["last_name"]
                                    ? "bg-gray-200 text-gray-700 cursor-no-drop"
                                    : "bg-white text-gray-700 cursor-pointer"
                                }`}
                  disabled={variableEstado["last_name"]}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="first_name">
                  {requiredFields.includes("first_name") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["first_name"]}
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData["first_name"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle}
                                ${
                                  isFieldInvalid(
                                    "first_name",
                                    requiredFields,
                                    formData,
                                    isFieldVisible
                                  )
                                    ? "border-2 border-red-500"
                                    : ""
                                }
                                ${
                                  variableEstado["first_name"]
                                    ? "bg-gray-200 text-gray-700 cursor-no-drop"
                                    : "bg-white text-gray-700 cursor-pointer"
                                }`}
                  disabled={variableEstado["first_name"]}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="fun_sex">
                  {requiredFields.includes("fun_sex") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["fun_sex"]}
                </label>
                <CustomSelect
                  id="fun_sex"
                  name="fun_sex"
                  value={formData["fun_sex"]}
                  onChange={handleChange}
                  options={allListRegisterUser.fun_sex}
                  disabled={variableEstado["fun_sex"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "fun_sex",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="email">
                  {requiredFields.includes("email") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["email"]}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData["email"]}
                  onChange={handleChange}
                  placeholder="ejemplo@gmacil.com"
                  required
                  className={`${inputStyle}
                                ${
                                  isFieldInvalid(
                                    "email",
                                    requiredFields,
                                    formData,
                                    isFieldVisible
                                  )
                                    ? "border-2 border-red-500"
                                    : ""
                                }
                                ${
                                  variableEstado["email"]
                                    ? "bg-gray-200 text-gray-700 cursor-no-drop"
                                    : "bg-white text-gray-700 cursor-pointer"
                                }`}
                  disabled={variableEstado["email"]}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="fun_titu">
                  {requiredFields.includes("fun_titu") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["fun_titu"]}
                </label>
                <CustomSelect
                  id="fun_titu"
                  name="fun_titu"
                  value={formData["fun_titu"]}
                  onChange={handleChange}
                  options={allListRegisterUser.fun_titu}
                  disabled={variableEstado["fun_titu"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "fun_titu",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="uni_unic">
                  {requiredFields.includes("uni_unic") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["uni_unic"]}
                </label>
                <CustomSelect
                  id="uni_unic"
                  name="uni_unic"
                  value={formData["uni_unic"]}
                  onChange={handleSelectChange}
                  options={allListRegisterUser.uni_unic}
                  isMulti
                  disabled={variableEstado["uni_unic"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "uni_unic",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                />
                <span className="text-xs text-gray-500 mt-1">
                  Seleccione de 1 a 3 unidades de salud
                </span>
              </div>
            </div>
          </fieldset>
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Rol y Estado del Usuario
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="fun_admi_rol">
                  {requiredFields.includes("fun_admi_rol") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["fun_admi_rol"]}
                </label>
                <CustomSelect
                  id="fun_admi_rol"
                  name="fun_admi_rol"
                  value={formData["fun_admi_rol"]}
                  onChange={handleChange}
                  options={allListRegisterUser.fun_admi_rol}
                  disabled={variableEstado["fun_admi_rol"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "fun_admi_rol",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="fun_esta">
                  {requiredFields.includes("fun_esta") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["fun_esta"]}
                </label>
                <CustomSelect
                  id="fun_esta"
                  name="fun_esta"
                  value={formData["fun_esta"]}
                  onChange={handleChange}
                  options={allListRegisterUser.fun_esta}
                  disabled={variableEstado["fun_esta"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "fun_esta",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                />
              </div>
            </div>
          </fieldset>
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Solo para registrar o Actualizar la Clave o Contraseña
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="password1">
                  {!isEditing && <span className="text-red-500">* </span>}
                  {labelMap["password1"]}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword1 ? "text" : "password"}
                    id="password1"
                    name="password1"
                    value={formData["password1"]}
                    onChange={handleChange}
                    placeholder="Requiere la misma clave"
                    className={`${inputStyle}
                    ${
                      !isEditing && !formData["password1"] // Solo en modo registro y si está vacío
                        ? "border-2 border-red-500"
                        : ""
                    }
                    ${
                      variableEstado["password1"]
                        ? "bg-gray-200 text-gray-700 cursor-no-drop"
                        : "bg-white text-gray-700 cursor-pointer"
                    }
                    pr-10`}
                    disabled={variableEstado["password1"]}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-700 border-l border-gray-800 pl-3 h-7 flex items-center bg-transparent"
                    onClick={() => setShowPassword1((prev) => !prev)}
                    style={{ outline: "none" }}
                  >
                    {showPassword1 ? "🙈" : "👁️"}
                  </button>
                </div>
                <div className="mt-1 ml-1 text-sm">
                  {(() => {
                    const passwordValidation = getPasswordValidation();
                    return (
                      <ul>
                        <li className="flex items-center">
                          {passwordValidation.longitud ? (
                            <span className="text-green-600 mr-1">✅</span>
                          ) : (
                            <span className="text-red-600 mr-1">❌</span>
                          )}
                          Tener de 10 hasta 20 caracteres.
                        </li>
                        <li className="flex items-center">
                          {passwordValidation.mayMinNum ? (
                            <span className="text-green-600 mr-1">✅</span>
                          ) : (
                            <span className="text-red-600 mr-1">❌</span>
                          )}
                          Estar conformada de Mayúsculas, minúsculas y números.
                        </li>
                        <li className="flex items-center">
                          {passwordValidation.especial ? (
                            <span className="text-green-600 mr-1">✅</span>
                          ) : (
                            <span className="text-red-600 mr-1">❌</span>
                          )}
                          Al menos un carácter especial: * + -
                        </li>
                        <li className="flex items-center">
                          {passwordValidation.iguales ? (
                            <span className="text-green-600 mr-1">✅</span>
                          ) : (
                            <span className="text-red-600 mr-1">❌</span>
                          )}
                          Las contraseñas coinciden.
                        </li>
                      </ul>
                    );
                  })()}
                </div>
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="password2">
                  {!isEditing && <span className="text-red-500">* </span>}
                  {labelMap["password2"]}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword2 ? "text" : "password"}
                    id="password2"
                    name="password2"
                    value={formData["password2"]}
                    onChange={handleChange}
                    placeholder="Requiere la misma clave"
                    className={`${inputStyle}
                    ${
                      !isEditing && !formData["password2"] // Solo en modo registro y si está vacío
                        ? "border-2 border-red-500"
                        : ""
                    }
                    ${
                      variableEstado["password2"]
                        ? "bg-gray-200 text-gray-700 cursor-no-drop"
                        : "bg-white text-gray-700 cursor-pointer"
                    }
                    pr-10`}
                    disabled={variableEstado["password2"]}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-700 border-l border-gray-800 pl-3 h-7 flex items-center bg-transparent"
                    onClick={() => setShowPassword2((prev) => !prev)}
                    style={{ outline: "none" }}
                  >
                    {showPassword2 ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </div>
          </fieldset>
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
              {buttonTextRegistro}
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
              id="btnLimpiar"
              name="btnLimpiar"
              className={buttonStyleSecundario}
              onClick={limpiarVariables}
            >
              Limpiar
            </button>
            <button
              type="button"
              className="ml-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              onClick={() => navigate("/")}
            >
              Cancelar
            </button>
          </div>
        </form>
        <EstadoMensajes error={error} successMessage={successMessage} />
        {showBusquedaAvanzada && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white w-[95%] max-w-6xl max-h-[90vh] overflow-auto rounded shadow-lg p-4 relative">
              <button
                type="button"
                onClick={() => setShowBusquedaAvanzada(false)}
                className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-700 rounded px-2 py-1 text-sm"
              >
                X
              </button>
              <BuscarAdmisionados
                onSelect={handleSeleccionarAdmisionado}
                onClose={() => setShowBusquedaAvanzada(false)}
              />
            </div>
          </div>
        )}
        <TablaUsers
          setFormData={setFormData}
          setVariableEstado={setVariableEstado}
          setBotonEstado={setBotonEstado}
          setIsEditing={setIsEditing}
          setIsLoading={setIsLoading}
          setSuccessMessage={setSuccessMessage}
          setError={setError}
          refreshTable={refreshTable}
        />
      </div>
    </div>
  );
};

export default AdminUser;
