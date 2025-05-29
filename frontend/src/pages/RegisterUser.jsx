import React, { useState, useEffect } from "react";
import { registerUser, buscarUsuarioEni } from "../api/conexion.api.js";
import { listaSelectUser } from "../components/AllList.jsx";
import { validarDato, validarIdentificacion } from "../api/validadorUtil.js";
import {
  CustomSelect,
  inputStyle,
  buttonStylePrimario,
  buttonStyleSecundario,
} from "../components/EstilosCustom.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const getInputTypeAndAutoComplete = (key) => {
  let inputType;
  let autoCompleteValue;

  if (key === "password1" || key === "password2") {
    inputType = "password";
    autoCompleteValue =
      key === "password1" ? "new-password" : "current-password";
  } else if (["username", "first_name", "last_name"].includes(key)) {
    inputType = "text";
    autoCompleteValue = "off";
  }

  return { inputType, autoCompleteValue };
};

const RegisterUser = () => {
  const [formData, setFormData] = useState({
    fun_tipo_iden: "",
    username: "",
    first_name: "",
    last_name: "",
    fun_sex: "",
    fun_titu: "",
    uni_unic: [],
    password1: "",
    password2: "",
  });

  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
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

  // Helper function to parse error messages
  const parseErrorMessage = (error) => {
    let errorMessage = "Hubo un error en la operación";
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const firstErrorArray = data[firstKey];
        if (firstKey === "username") {
          errorMessage = "El usuario ya está registrado";
        } else if (
          Array.isArray(firstErrorArray) &&
          firstErrorArray.length > 0
        ) {
          errorMessage = firstErrorArray[0];
        } else if (typeof firstErrorArray === "string") {
          errorMessage = firstErrorArray;
        }
      } else if (typeof data === "string") {
        errorMessage = data;
      }
    }
    return errorMessage;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
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
      window.location.href = "/aviso-user/";
    } catch (error) {
      const errorMessage = parseErrorMessage(error);
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
    fun_titu: "Titulo del Funcionario",
    uni_unic: "Unidad de Salud",
    password1: "Clave",
    password2: "Confirmar Clave",
  };

  const groupedFields = [];
  const keys = Object.keys(formData).filter((key) => key !== "eniUser");

  for (let i = 0; i < keys.length; i += 3) {
    groupedFields.push(keys.slice(i, i + 3));
  }

  const handleSearch = async () => {
    const { fun_tipo_iden, username } = formData;
    if (!username) {
      toast.error("Por favor, ingrese una identificación.", {
        position: "bottom-right",
      });
      return;
    }
    if (!validarIdentificacion(fun_tipo_iden, username)) {
      return;
    }
    try {
      const response = await buscarUsuarioEni(formData.fun_tipo_iden, username);
      if (!response)
        throw new Error("No se pudo obtener una respuesta de la API.");
      const data = response.data;
      const message = response.message || "Operación exitosa";
      if (data.fun_esta > 0) {
        let errorMessage =
          "El usuario ya se encuentra registrado. Por favor, comuníquese con el Administrador!";
        setError(errorMessage);
        toast.error(errorMessage, { position: "bottom-right" });
        setVariableEstado((prevState) => ({
          ...prevState,
          fun_tipo_iden: true,
          username: true,
          first_name: true,
          last_name: true,
          fun_sex: true,
          fun_titu: true,
          uni_unic: true,
          password1: true,
          password2: true,
        }));
        setBotonEstado((prevState) => ({
          btnBuscar: true,
          btnRegistrar: true,
        }));
        return;
      }

      // Solo se toma en cuenta data.first_name y data.last_name
      const firstName = data.first_name || "";
      const lastName = data.last_name || "";
      const funSex = data.fun_sex || "";

      setFormData((prevData) => ({
        ...formData,
        first_name:
          firstName ||
          [
            data.adm_dato_pers_apel_prim || "",
            data.adm_dato_pers_apel_segu || "",
          ]
            .filter(Boolean)
            .join(" "),
        last_name:
          lastName ||
          [
            data.adm_dato_pers_nomb_prim || "",
            data.adm_dato_pers_nomb_segu || "",
          ]
            .filter(Boolean)
            .join(" "),
        fun_sex: funSex || data.adm_dato_pers_sexo || "",
      }));

      const ambosLlenos = firstName.trim() !== "" && lastName.trim() !== "";

      setVariableEstado((prevState) => ({
        ...prevState,
        fun_tipo_iden: true,
        username: true,
        first_name: true,
        last_name: true,
        fun_sex: true,
        fun_titu: ambosLlenos,
        uni_unic: ambosLlenos,
        password1: ambosLlenos,
        password2: ambosLlenos,
      }));

      setBotonEstado((prevState) => ({
        ...prevState,
        btnBuscar: true,
      }));

      toast.success(message, {
        position: "bottom-right",
      });
      checkFormValidity();
    } catch (error) {
      let errorMessage = "Hubo un error en la operación";
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === "object") {
          const firstKey = Object.keys(data)[0];
          const firstErrorArray = data[firstKey];
          if (Array.isArray(firstErrorArray) && firstErrorArray.length > 0) {
            errorMessage = firstErrorArray[0];
          } else if (typeof firstErrorArray === "string") {
            errorMessage = firstErrorArray;
          }
        } else if (typeof data === "string") {
          errorMessage = data;
        }
      }
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
      setError(errorMessage);
      toast.error(errorMessage, { position: "bottom-right" });
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
          fun_titu: "",
          uni_unic: [],
          password1: "",
          password2: "",
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

  const limpiarVariables = (e) => {
    setFormData({
      fun_tipo_iden: "",
      username: "",
      first_name: "",
      last_name: "",
      fun_sex: "",
      fun_titu: "",
      uni_unic: [],
      password1: "",
      password2: "",
    });
    setError({});
    setSuccessMessage(null);
    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
  };

  useEffect(() => {
    checkFormValidity();
  }, [formData]);

  return (
    <div className="container min-h-screen flex items-center justify-center">
      <div className="max-w-max m-auto mt-1">
        <article className="p-1 bg-blue-50 rounded-lg shadow-md">
          <h2 className="text-center text-2xl font-bold mb-1">
            Registro de Funcionario
          </h2>
          <p className="text-center text-lg text-black">
            ¡La contraseña debe tener de 10 a 20 caracteres y tener una
            combinación entre Mayúsculas, Minúsculas y números!
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
        <div className="bg-white rounded-lg shadow-md">
          {error && (
            <p style={{ color: "red" }}>
              {Object.keys(error).length > 0 ? JSON.stringify(error) : ""}
            </p>
          )}
          {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          {groupedFields.map((group) => (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
              key={group.join("-")}
            >
              {group.map((key) => {
                const { inputType, autoCompleteValue } =
                  getInputTypeAndAutoComplete(key);
                let inputElement;
                if (listaSelectUser[key]) {
                  const value = formData[key];
                  const validValue =
                    typeof value === "string" || typeof value === "number"
                      ? value
                      : "";
                  inputElement = (
                    <CustomSelect
                      id={key}
                      name={key}
                      value={validValue}
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
              className="ml-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              onClick={() => navigate("/login")}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default RegisterUser;
