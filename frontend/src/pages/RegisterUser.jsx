import React, { useState, useEffect } from "react";
import { registerUser, buscarUsuarioEni } from "../api/conexion.api.js";
import allListRegisterUser from "../api/all.list.register.user.json";
import {
  validarDato,
  validarNumeroIdentificacion,
} from "../api/validadorUtil.js";
import {
  CustomSelect,
  inputStyle,
  isFieldInvalid,
  buttonStylePrimario,
  buttonStyleSecundario,
} from "../components/EstilosCustom.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const initialState = {
  fun_tipo_iden: "",
  username: "",
  first_name: "",
  last_name: "",
  fun_sex: "",
  fun_titu: "",
  uni_unic: "",
  password1: "",
  password2: "",
};

const RegisterUser = () => {
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const navigate = useNavigate();

  const initialVariableEstado = {
    fun_tipo_iden: false,
    username: true,
    first_name: true,
    last_name: true,
    fun_sex: true,
    fun_titu: true,
    uni_unic: true,
    password1: true,
    password2: true,
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
    "fun_titu",
    "uni_unic",
    "password1",
    "password2",
  ];

  const labelMap = {
    fun_tipo_iden: "Tipo de Identificacion:",
    username: "Cédula de Identidad:",
    first_name: "Nombres completos:",
    last_name: "Apellidos completos:",
    fun_sex: "Sexo:",
    fun_titu: "Titulo del Funcionario:",
    uni_unic: "Unidad de Salud:",
    password1: "Clave:",
    password2: "Confirmar Clave:",
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
      const camposDeshabilitados = !!(response.data.fun_esta >= 0);
      ajustarVariableEstadoExitoso(camposDeshabilitados);
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
      ...formData,
      first_name:
        data.first_name ||
        "" ||
        [data.adm_dato_pers_nomb_prim || "", data.adm_dato_pers_nomb_segu || ""]
          .filter(Boolean)
          .join(" "),
      last_name:
        data.last_name ||
        "" ||
        [data.adm_dato_pers_apel_prim || "", data.adm_dato_pers_apel_segu || ""]
          .filter(Boolean)
          .join(" "),
      fun_sex: data.fun_sex || data.adm_dato_pers_sexo || "",
    }));
  };

  const ajustarVariableEstadoExitoso = (camposDeshabilitados) => {
    setVariableEstado((prevState) => ({
      ...prevState,
      fun_tipo_iden: true,
      username: true,
      first_name: true,
      last_name: true,
      fun_sex: camposDeshabilitados,
      fun_titu: camposDeshabilitados,
      uni_unic: camposDeshabilitados,
      password1: camposDeshabilitados,
      password2: camposDeshabilitados,
    }));
    setBotonEstado((prevState) => ({
      btnBuscar: true,
      btnRegistrar: true,
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
      fun_titu: false,
      uni_unic: false,
      password1: false,
      password2: false,
    }));
    setBotonEstado((prevState) => ({
      btnBuscar: true,
      btnRegistrar: true,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      let response;
      response = await registerUser(formData);
      setSuccessMessage("Registro guardado con éxito!");
      const message = response.message || "Registro guardado con éxito!";
      toast.success(message, {
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
      limpiarVariables();
      const timer = setTimeout(() => {
        navigate("/aviso-user/");
      }, 5000);
      return () => clearTimeout(timer);
    } catch (error) {
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

  const isFieldVisible = (field) => {
    return true;
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

  const checkFormValidity = () => {
    const isValid = requiredFields.every((field) => {
      if (Array.isArray(formData[field])) {
        return formData[field].length > 0;
      }
      return formData[field];
    });
    setPasswordsMatch(
      formData.password1 === formData.password2 && formData.password1 !== ""
    );

    setBotonEstado((prevState) => ({
      ...prevState,
      btnRegistrar: !isValid || !cumpleRequisitosPassword(),
    }));
  };

  const limpiarVariables = (e) => {
    setFormData(initialState);
    setError("");
    setSuccessMessage("");
    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
  };

  useEffect(() => {
    checkFormValidity();
  }, [formData]);

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

  return (
    <div className="w-auto h-auto flex items-stretch justify-stretch bg-gray-100">
      <div className="w-full h-full p-4 m-4 bg-white rounded-lg shadow-md mt-1">
        <article className="p-1 bg-blue-50 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-1 text-center text-blue-700">
            Registro de Funcionario
          </h2>
          <p className="text-center text-lg text-black">
            ¡La contraseña debe tener de 10 a 20 caracteres y tener una
            combinación entre Mayúsculas, Minúsculas, números y un carácter
            especial (* + -)!
            <br />
            <strong>Nota: </strong>
            <em>
              Si un usuario realiza itinerancia, debe comunicarse con el
              Administrador para habilitar las unidades de salud necesarias.
              <br />
              Mientras tanto, deberá escoger la unidad de salud donde lleva a
              cabo sus principales actividades.
            </em>
          </p>
        </article>
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
                <label className={labelClass} htmlFor="username">
                  {requiredFields.includes("username") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["username"]}
                </label>
                <div className="flex items-center gap-1 mb-1">
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
                  onChange={handleChange}
                  options={allListRegisterUser.uni_unic}
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
              </div>
            </div>
          </fieldset>
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Registro de Clave o Contraseña
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="password1">
                  {requiredFields.includes("password1") && (
                    <span className="text-red-500">* </span>
                  )}
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
                      isFieldInvalid(
                        "password1",
                        requiredFields,
                        formData,
                        isFieldVisible
                      )
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
                  {requiredFields.includes("password2") && (
                    <span className="text-red-500">* </span>
                  )}
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
                      isFieldInvalid(
                        "password2",
                        requiredFields,
                        formData,
                        isFieldVisible
                      )
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
          <div className="md:col-span-2 flex justify-center mt-1">
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
              Registrar
            </button>
            <button
              type="button"
              id="btnLimpiar"
              name="btnLimpiar"
              className={`${buttonStyleSecundario} ${
                botonEstado.btnLimpiar
                  ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
              }`}
              disabled={botonEstado.btnLimpiar}
              onClick={() => limpiarVariables()}
            >
              Limpiar Todo
            </button>
            <button
              type="button"
              className="ml-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              onClick={() => navigate("/login")}
            >
              Cancelar
            </button>
          </div>
        </form>
        <EstadoMensajes error={error} successMessage={successMessage} />
      </div>
    </div>
  );
};
export default RegisterUser;
