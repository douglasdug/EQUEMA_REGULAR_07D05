import React, { useState } from "react";
import { registerAdminAgendaTurno } from "../api/conexion.api.js";
import {
  CustomSelect,
  inputStyle,
  isFieldInvalid,
  buttonStylePrimario,
  buttonStyleSecundario,
} from "../components/EstilosCustom.jsx";
import Loader from "../components/Loader.jsx";
import { toast } from "react-hot-toast";

const initialState = {
  adm_agen_turn_fech: "",
  adm_agen_turn_tipo_espe: "",
  adm_agen_turn_prof_cita: "",
  adm_agen_turn_hora_inic: "",
  adm_agen_turn_hora_fin: "",
  adm_agen_turn_esta_cita: "",
};

const AdminAgendaTurno = () => {
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const initialVariableEstado = {};
  const initialBotonEstado = {};
  const [variableEstado, setVariableEstado] = useState(initialVariableEstado);
  const [botonEstado, setBotonEstado] = useState(initialBotonEstado);

  const requiredFields = [
    "adm_agen_turn_fech",
    "adm_agen_turn_tipo_espe",
    "adm_agen_turn_prof_cita",
    "adm_agen_turn_hora_inic",
    "adm_agen_turn_hora_fin",
    "adm_agen_turn_esta_cita",
  ];

  const labelMap = {
    adm_agen_turn_fech: "Fecha de cita",
    adm_agen_turn_tipo_espe: "Tipo de especialidad",
    adm_agen_turn_prof_cita: "Profesional de la cita",
    adm_agen_turn_hora_inic: "Hora de inicio",
    adm_agen_turn_hora_fin: "Hora de fin",
    adm_agen_turn_esta_cita: "Estado de la cita",
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const isFieldVisible = (field) => {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      let response;
      response = await registerAdminAgendaTurno(formData);
      const message = response?.message || "Se registró con éxito!";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 10000);
      toast.success(message, { position: "bottom-right" });
      limpiarVariables();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      toast.error(errorMessage, { position: "bottom-right" });
    } finally {
      setLoading(false);
    }
  };

  const limpiarVariables = () => {
    setFormData(initialState);
    setSuccessMessage("");
    setError("");
    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
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

  return (
    <div className="w-auto h-auto flex items-stretch justify-stretch bg-gray-100">
      <div className="w-full h-full p-4 m-4 bg-white rounded-lg shadow-md mt-1">
        <h2 className="text-2xl font-bold mb-1 text-center text-blue-700">
          Registro de Agenda de Turno
        </h2>
        <form onSubmit={handleSubmit} className="w-full">
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Tipo de Especialidad y Profesional
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_agen_turn_tipo_espe">
                  {requiredFields.includes("adm_agen_turn_tipo_espe") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["adm_agen_turn_tipo_espe"]}
                </label>
                <input
                  type="text"
                  id="adm_agen_turn_tipo_espe"
                  name="adm_agen_turn_tipo_espe"
                  value={formData.adm_agen_turn_tipo_espe}
                  onChange={handleChange}
                  placeholder="Ej: Medicina General, Pediatría..."
                  className={`${inputStyle}
                      ${
                        isFieldInvalid(
                          "adm_agen_turn_tipo_espe",
                          requiredFields,
                          formData,
                          isFieldVisible
                        )
                          ? "border-2 border-red-500"
                          : ""
                      }
                       ${
                         variableEstado["adm_agen_turn_tipo_espe"]
                           ? "bg-gray-200 text-gray-700 cursor-no-drop"
                           : "bg-white text-gray-700 cursor-pointer"
                       }`}
                  disabled={variableEstado["adm_agen_turn_tipo_espe"]}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_agen_turn_prof_cita">
                  {requiredFields.includes("adm_agen_turn_prof_cita") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["adm_agen_turn_prof_cita"]}
                </label>
                <input
                  type="text"
                  id="adm_agen_turn_prof_cita"
                  name="adm_agen_turn_prof_cita"
                  value={formData.adm_agen_turn_prof_cita}
                  onChange={handleChange}
                  placeholder="Nombre del profesional"
                  className={`${inputStyle}
                      ${
                        isFieldInvalid(
                          "adm_agen_turn_prof_cita",
                          requiredFields,
                          formData,
                          isFieldVisible
                        )
                          ? "border-2 border-red-500"
                          : ""
                      }
                       ${
                         variableEstado["adm_agen_turn_prof_cita"]
                           ? "bg-gray-200 text-gray-700 cursor-no-drop"
                           : "bg-white text-gray-700 cursor-pointer"
                       }`}
                  disabled={variableEstado["adm_agen_turn_prof_cita"]}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_agen_turn_esta_cita">
                  {requiredFields.includes("adm_agen_turn_esta_cita") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["adm_agen_turn_esta_cita"]}
                </label>
                <input
                  type="text"
                  id="adm_agen_turn_esta_cita"
                  name="adm_agen_turn_esta_cita"
                  value={formData.adm_agen_turn_esta_cita}
                  onChange={handleChange}
                  placeholder="Ej: PENDIENTE, PROGRAMADA, ATENDIDA, CANCELADA"
                  className={`${inputStyle}
                      ${
                        isFieldInvalid(
                          "adm_agen_turn_esta_cita",
                          requiredFields,
                          formData,
                          isFieldVisible
                        )
                          ? "border-2 border-red-500"
                          : ""
                      }
                       ${
                         variableEstado["adm_agen_turn_esta_cita"]
                           ? "bg-gray-200 text-gray-700 cursor-no-drop"
                           : "bg-white text-gray-700 cursor-pointer"
                       }`}
                  disabled={variableEstado["adm_agen_turn_esta_cita"]}
                />
              </div>
            </div>
          </fieldset>
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Fecha de la Agenda y turno
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_agen_turn_fech">
                  {requiredFields.includes("adm_agen_turn_fech") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["adm_agen_turn_fech"]}
                </label>
                <input
                  type="date"
                  id="adm_agen_turn_fech"
                  name="adm_agen_turn_fech"
                  value={formData.adm_agen_turn_fech}
                  onChange={handleChange}
                  placeholder="dd/mm/aaaa"
                  className={`${inputStyle}
                      ${
                        isFieldInvalid(
                          "adm_agen_turn_fech",
                          requiredFields,
                          formData,
                          isFieldVisible
                        )
                          ? "border-2 border-red-500"
                          : ""
                      }
                       ${
                         variableEstado["adm_agen_turn_fech"]
                           ? "bg-gray-200 text-gray-700 cursor-no-drop"
                           : "bg-white text-gray-700 cursor-pointer"
                       }`}
                  disabled={variableEstado["adm_agen_turn_fech"]}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_agen_turn_hora_inic">
                  {requiredFields.includes("adm_agen_turn_hora_inic") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["adm_agen_turn_hora_inic"]}
                </label>
                <input
                  type="time"
                  id="adm_agen_turn_hora_inic"
                  name="adm_agen_turn_hora_inic"
                  value={formData.adm_agen_turn_hora_inic}
                  onChange={handleChange}
                  placeholder="hh:mm"
                  className={`${inputStyle}
                      ${
                        isFieldInvalid(
                          "adm_agen_turn_hora_inic",
                          requiredFields,
                          formData,
                          isFieldVisible
                        )
                          ? "border-2 border-red-500"
                          : ""
                      }
                       ${
                         variableEstado["adm_agen_turn_hora_inic"]
                           ? "bg-gray-200 text-gray-700 cursor-no-drop"
                           : "bg-white text-gray-700 cursor-pointer"
                       }`}
                  disabled={variableEstado["adm_agen_turn_hora_inic"]}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_agen_turn_hora_fin">
                  {requiredFields.includes("adm_agen_turn_hora_fin") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["adm_agen_turn_hora_fin"]}
                </label>
                <input
                  type="time"
                  id="adm_agen_turn_hora_fin"
                  name="adm_agen_turn_hora_fin"
                  value={formData.adm_agen_turn_hora_fin}
                  onChange={handleChange}
                  placeholder="hh:mm"
                  className={`${inputStyle}
                      ${
                        isFieldInvalid(
                          "adm_agen_turn_hora_fin",
                          requiredFields,
                          formData,
                          isFieldVisible
                        )
                          ? "border-2 border-red-500"
                          : ""
                      }
                       ${
                         variableEstado["adm_agen_turn_hora_fin"]
                           ? "bg-gray-200 text-gray-700 cursor-no-drop"
                           : "bg-white text-gray-700 cursor-pointer"
                       }`}
                  disabled={variableEstado["adm_agen_turn_hora_fin"]}
                />
              </div>
            </div>
          </fieldset>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Registrar"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={limpiarVariables}
              className="inline-flex items-center justify-center rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Limpiar
            </button>
          </div>
        </form>
        <EstadoMensajes error={error} successMessage={successMessage} />
      </div>
    </div>
  );
};

export default AdminAgendaTurno;
