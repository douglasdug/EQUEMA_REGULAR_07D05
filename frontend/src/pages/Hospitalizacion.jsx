import React, { useState } from "react";
import {
  buscarUsuarioIdUnidadSalud,
  buscarUsuarioAdmision,
} from "../api/conexion.api.js";
import {
  validarDato,
  validarNumeroIdentificacion,
} from "../api/validadorUtil.js";
import {
  CustomSelect,
  inputStyle,
  isFieldInvalid,
  buttonStyleGuardar,
  buttonStyleActualizar,
  buttonStyleEliminar,
  buttonStyleCancelar,
  buttonStyleOtro,
  buttonStyleBuscarAvanzado,
  buttonStyleDesactivado,
  buttonStyleDesactivadoPeq,
} from "../components/EstilosCustom.jsx";
import allListAdmision from "../api/all.list.admision.json";
import allListHospitalizacion from "../api/all.list.hospitalizacion.json";
import BuscarAdmisionados from "../components/BuscarAdmisionados.jsx";
import Loader from "../components/Loader.jsx";
import { toast } from "react-hot-toast";

import { toZonedTime, format as formatTz } from "date-fns-tz";

const timeZoneEC = "America/Guayaquil";
const nowEC = toZonedTime(new Date(), timeZoneEC);
const fechaActualEC = formatTz(nowEC, "yyyy-MM-dd", { timeZone: timeZoneEC });
const horaActualEC = formatTz(nowEC, "HH:mm", { timeZone: timeZoneEC });

const initialStateTipoServicio = {
  hosp_admi_unid_salu: "",
  hosp_admi_tipo_serv: "",
  hosp_admi_espe: "",
  hosp_admi_nume_cama: "",
};

const initialState = {
  hosp_part_diar_unid_salu: "",
  hosp_part_diar_paci_tipo_iden: "",
  hosp_part_diar_paci_nume_iden: "",
  hosp_part_diar_paci_apel: "",
  hosp_part_diar_paci_nomb: "",
  hosp_part_diar_paci_edad: "",
  hosp_part_diar_paci_sexo: "",
  hosp_part_diar_sevi: "",
  hosp_part_diar_habi_cama: "",
  hosp_part_diar_fech_aten: "",
  hosp_part_diar_hora_aten: "",
  hosp_part_diar_prof_salu: "",
  hosp_part_diar_regi_aten: "",
};

function textoSeguro(valor) {
  return valor === null || valor === undefined ? "" : String(valor).trim();
}

function mapAdmisionAPaciente(data) {
  return {
    id_admision_paci: data?.id_admision_datos || "",
    hosp_part_diar_paci_apel:
      `${data?.adm_dato_pers_apel_prim || ""} ${data?.adm_dato_pers_apel_segu || ""}`.trim(),
    hosp_part_diar_paci_nomb:
      `${data?.adm_dato_pers_nomb_prim || ""} ${data?.adm_dato_pers_nomb_segu || ""}`.trim(),
    hosp_part_diar_paci_edad: construirEdadPaciente(data),
    hosp_part_diar_paci_sexo: data?.adm_dato_pers_sexo || "",
  };
}

function construirEdadPaciente(data) {
  const fechaNacimiento = data?.adm_dato_naci_fech_naci;
  if (!fechaNacimiento) return "";

  // Asegúrate de que fechaActualEC sea un Date
  const hoy = new Date(); // O usa new Date(fechaActualEC) si quieres la fecha de Ecuador exacta
  const nacimiento = new Date(fechaNacimiento);

  let años = hoy.getFullYear() - nacimiento.getFullYear();
  let meses = hoy.getMonth() - nacimiento.getMonth();
  let dias = hoy.getDate() - nacimiento.getDate();

  if (dias < 0) {
    meses--;
    // Ajusta los días sumando los días del mes anterior
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    dias += mesAnterior.getDate();
  }
  if (meses < 0) {
    años--;
    meses += 12;
  }

  return `${años} AÑOS, ${meses} MESES, ${dias} DIAS`;
}

export default function Hospitalizacion() {
  const [formData, setFormData] = useState(initialState);
  const [tipoServicioData, setTipoServicioData] = useState(
    initialStateTipoServicio,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showBusquedaAvanzada, setShowBusquedaAvanzada] = useState(false);
  const [showAdmisionModal, setShowAdmisionModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalText, setConfirmModalText] = useState("");
  const [admisionData, setAdmisionData] = useState(null);

  const initialVariableEstado = {
    hosp_part_diar_unid_salu: false,
    hosp_part_diar_paci_tipo_iden: false,
    hosp_part_diar_paci_nume_iden: false,
    hosp_part_diar_paci_apel: false,
    hosp_part_diar_paci_nomb: false,
    hosp_part_diar_paci_edad: false,
    hosp_part_diar_paci_sexo: false,
    hosp_part_diar_sevi: false,
    hosp_part_diar_habi_cama: false,
    hosp_part_diar_fech_aten: false,
    hosp_part_diar_hora_aten: false,
    hosp_part_diar_prof_salu: false,
    hosp_part_diar_regi_aten: false,
  };

  const initialBotonEstado = {
    btnRegistrar: true,
    btn_buscar_paciente: false,
    btn_busqueda_avanzada: false,
  };

  const [variableEstado, setVariableEstado] = useState(initialVariableEstado);
  const [botonEstado, setBotonEstado] = useState(initialBotonEstado);

  const requiredFields = [
    "hosp_admi_unid_salu",
    "hosp_admi_tipo_serv",
    "hosp_admi_espe",
    "hosp_admi_nume_cama",
    "hosp_part_diar_unid_salu",
    "hosp_part_diar_paci_tipo_iden",
    "hosp_part_diar_paci_nume_iden",
  ];

  const labelMap = {
    hosp_admi_unid_salu: "Unidad de salud",
    hosp_admi_tipo_serv: "Tipo de servicio",
    hosp_admi_espe: "Especialidad",
    hosp_admi_nume_cama: "Número de cama",
    hosp_part_diar_unid_salu: "Unidad de salud",
    hosp_part_diar_paci_tipo_iden: "Tipo de identificación",
    hosp_part_diar_paci_nume_iden: "Número de identificación",
    hosp_part_diar_paci_apel: "Apellidos",
    hosp_part_diar_paci_nomb: "Nombres",
    hosp_part_diar_paci_edad: "Edad",
    hosp_part_diar_paci_sexo: "Sexo",
    hosp_part_diar_sevi: "Servicio",
    hosp_part_diar_habi_cama: "Cama",
    hosp_part_diar_fech_aten: "Fecha de atención",
    hosp_part_diar_hora_aten: "Hora de atención",
    hosp_part_diar_prof_salu: "Profesional de salud",
    hosp_part_diar_regi_aten: "Registro de atención",
  };

  const isFieldVisible = () => {
    // Por defecto, visible
    return true;
  };

  const handleChangeTipoServicio = (e) => {
    const { name, value } = e.target;
    setTipoServicioData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSeleccionarAdmisionado = (registro) => {
    let tipo, num;
    tipo = registro.adm_dato_pers_tipo_iden || "";
    num = registro.adm_dato_pers_nume_iden || "";
    if (!tipo || !num) return;

    setFormData((prev) => ({
      ...prev,
      hosp_part_diar_paci_tipo_iden: tipo,
      hosp_part_diar_paci_nume_iden: num,
    }));
    setShowBusquedaAvanzada(false);
  };

  const handleSubmitTipoServicio = async (event) => {
    event.preventDefault();
  };

  const handleSubmitSearch = async (event) => {
    event.preventDefault();

    let tipoIden, numeIden;
    tipoIden = formData.hosp_part_diar_paci_tipo_iden;
    numeIden = formData.hosp_part_diar_paci_nume_iden;
    if (isLoading) return;

    if (!textoSeguro(tipoIden) || !textoSeguro(numeIden)) {
      const mensaje =
        "Seleccione el tipo de identificación e ingrese el número del paciente.";
      setError(mensaje);
      setTimeout(() => setError(""), 10000);
      setSuccessMessage("");
      toast.error(mensaje, { position: "bottom-right" });
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    const resultado = validarNumeroIdentificacion(tipoIden, numeIden);
    if (!resultado.valido) {
      setError(resultado.mensaje);
      setTimeout(() => setError(""), 8000);
      setIsLoading(false);
      toast.error(resultado.mensaje, { position: "bottom-right" });
      return;
    }
    try {
      let response;
      response = await buscarUsuarioAdmision(tipoIden, numeIden);
      if (!response)
        throw new Error("No se pudo obtener una respuesta de la API.");
      if (Number.parseInt(response.data.adm_dato_paci_falt_dato) === 0) {
        if (
          response.message.toLowerCase().includes("usuario está registrado") ||
          response.message.toLowerCase().includes("registrado en admision") ||
          response.message.toLowerCase().includes("no se pudo obtener")
        ) {
          setConfirmModalText(
            "¿El paciente le falta actualizar la información en el sistema?",
          );
          setAdmisionData(response.data);
          setShowConfirmModal(true);
        }
      }

      const pacienteBase = mapAdmisionAPaciente(response?.data || {});
      setFormData((prev) => ({
        ...prev,
        ...pacienteBase,
        hosp_part_diar_paci_tipo_iden: prev.hosp_part_diar_paci_tipo_iden,
        hosp_part_diar_paci_nume_iden: prev.hosp_part_diar_paci_nume_iden,
      }));
      const message =
        response?.message ||
        "Paciente encontrado en admisión. No tiene turnos asociados en agenda.";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 10000);
      setError("");
      toast.success(message, { position: "bottom-right" });
      variableEstadoExito();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      toast.error(errorMessage, { position: "bottom-right" });
      if (
        errorMessage.toLowerCase().includes("no se encontró") ||
        errorMessage.toLowerCase().includes("no existe") ||
        errorMessage.toLowerCase().includes("no se pudo obtener")
      ) {
        setConfirmModalText(
          "¿El paciente tiene que ser admisionado al sistema?",
        );
        setAdmisionData({
          id_admision_datos: null,
          adm_dato_pers_apel_prim: "",
          adm_dato_pers_apel_segu: "",
          adm_dato_pers_nomb_prim: "",
          adm_dato_pers_nomb_segu: "",
          adm_dato_pers_sexo: "",
          adm_dato_pers_corr_elec: "",
        });
        setShowConfirmModal(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const variableEstadoExito = () => {};

  const handleSubmit = async (event) => {
    event.preventDefault();
  };

  const limpiarFormulario = () => {
    setFormData(initialState);
    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
  };

  const limpiarFormularioBusqAvan = () => {
    setFormData((prev) => ({
      ...prev,
      hosp_part_diar_paci_tipo_iden: "",
      hosp_part_diar_paci_nume_iden: "",
    }));
    setError("");
    setSuccessMessage("");
  };

  const getErrorMessage = (error) => {
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === "object" && data !== null) {
        // Si hay un array de errores detallados
        if (Array.isArray(data.errors)) {
          // Unir todos los mensajes de error en un solo string
          return data.errors
            .map(
              (err, idx) =>
                `Turno ${idx + 1}: ${err.error || JSON.stringify(err)}`,
            )
            .join("\n");
        }
        if (data.detail) return data.detail;
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
    <div className="w-full h-auto flex items-stretch justify-stretch bg-gray-100">
      <div className="w-full h-full p-2 bg-white rounded-lg shadow-md mt-1">
        <h2 className="text-2xl font-bold mb-1 text-center text-blue-700">
          Parte diario de hospitalización
        </h2>
        <p className="text-base text-center text-black">
          <strong>Nota:</strong> Los campos con{" "}
          <span className="text-red-500">*</span> son obligatorios.
        </p>
        {isLoading && (
          <Loader
            modal
            isOpen={isLoading}
            title="Procesando información"
            text="Por favor espere..."
            closeButton={false}
          />
        )}
        <form
          onSubmit={handleSubmitTipoServicio}
          autoComplete="on"
          className="w-full"
        >
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Registro de Tipo de Servicio
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="hosp_admi_unid_salu">
                  {requiredFields.includes("hosp_admi_unid_salu") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_admi_unid_salu"]}
                </label>
                <CustomSelect
                  id="hosp_admi_unid_salu"
                  name="hosp_admi_unid_salu"
                  value={tipoServicioData["hosp_admi_unid_salu"]}
                  onChange={handleChangeTipoServicio}
                  options={allListAdmision.adm_dato_pers_tipo_iden || []}
                  placeholder="Seleccione el tipo de identificacion"
                  disabled={variableEstado["hosp_admi_unid_salu"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "hosp_admi_unid_salu",
                      requiredFields,
                      formData,
                      isFieldVisible,
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="hosp_admi_tipo_serv">
                  {requiredFields.includes("hosp_admi_tipo_serv") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_admi_tipo_serv"]}
                </label>
                <CustomSelect
                  id="hosp_admi_tipo_serv"
                  name="hosp_admi_tipo_serv"
                  value={tipoServicioData["hosp_admi_tipo_serv"]}
                  onChange={handleChangeTipoServicio}
                  options={allListHospitalizacion.hosp_admi_tipo_serv || []}
                  placeholder="Seleccione el tipo de identificacion"
                  disabled={variableEstado["hosp_admi_tipo_serv"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "hosp_admi_tipo_serv",
                      requiredFields,
                      formData,
                      isFieldVisible,
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="hosp_admi_espe">
                  {requiredFields.includes("hosp_admi_espe") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_admi_espe"]}
                </label>
                <CustomSelect
                  id="hosp_admi_espe"
                  name="hosp_admi_espe"
                  value={tipoServicioData["hosp_admi_espe"]}
                  onChange={handleChangeTipoServicio}
                  options={allListHospitalizacion.hosp_admi_espe || []}
                  placeholder="Seleccione el tipo de identificacion"
                  disabled={variableEstado["hosp_admi_espe"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "hosp_admi_espe",
                      requiredFields,
                      formData,
                      isFieldVisible,
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="hosp_admi_nume_cama">
                  {requiredFields.includes("hosp_admi_nume_cama") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_admi_nume_cama"]}
                </label>
                <input
                  type="text"
                  id="hosp_admi_nume_cama"
                  name="hosp_admi_nume_cama"
                  value={tipoServicioData["hosp_admi_nume_cama"]}
                  onChange={handleChangeTipoServicio}
                  placeholder="Ingrese el número de cama"
                  autoComplete="on"
                  required
                  className={`${inputStyle} ${isFieldInvalid("hosp_admi_nume_cama", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["hosp_admi_nume_cama"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                  disabled={variableEstado["hosp_admi_nume_cama"]}
                />
              </div>
            </div>
          </fieldset>
        </form>
        <form
          onSubmit={handleSubmitSearch}
          autoComplete="on"
          className="w-full"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <fieldset className="border border-blue-200 rounded p-2 mb-1 sm:col-span-2 md:col-span-2 lg:col-span-2">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Busqueda del Paciente
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2">
                <div className={fieldClass}>
                  <label
                    className={labelClass}
                    htmlFor="hosp_part_diar_paci_tipo_iden"
                  >
                    {requiredFields.includes(
                      "hosp_part_diar_paci_tipo_iden",
                    ) && <span className="text-red-500">* </span>}
                    {labelMap["hosp_part_diar_paci_tipo_iden"]}
                  </label>
                  <CustomSelect
                    id="hosp_part_diar_paci_tipo_iden"
                    name="hosp_part_diar_paci_tipo_iden"
                    value={formData["hosp_part_diar_paci_tipo_iden"]}
                    onChange={handleChange}
                    options={allListAdmision.adm_dato_pers_tipo_iden || []}
                    placeholder="Seleccione el tipo de identificacion"
                    disabled={variableEstado["hosp_part_diar_paci_tipo_iden"]}
                    variableEstado={variableEstado}
                    className={
                      isFieldInvalid(
                        "hosp_part_diar_paci_tipo_iden",
                        requiredFields,
                        formData,
                        isFieldVisible,
                      )
                        ? "border-2 border-red-500"
                        : ""
                    }
                  />
                </div>
                <div className={fieldClass}>
                  <div className="flex items-center justify-between">
                    <label
                      className={labelClass}
                      htmlFor="hosp_part_diar_paci_nume_iden"
                    >
                      {requiredFields.includes(
                        "hosp_part_diar_paci_nume_iden",
                      ) && <span className="text-red-500">* </span>}
                      {labelMap["hosp_part_diar_paci_nume_iden"]}
                    </label>
                    <button
                      id="btn_busqueda_avanzada"
                      name="btn_busqueda_avanzada"
                      type="button"
                      onClick={() => {
                        limpiarFormularioBusqAvan();
                        setShowBusquedaAvanzada(true);
                      }}
                      className={`${botonEstado.btn_busqueda_avanzada ? buttonStyleDesactivadoPeq : buttonStyleBuscarAvanzado}`}
                      disabled={botonEstado.btn_busqueda_avanzada}
                      title="Buscar paciente que estan admisionados"
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
                      id="hosp_part_diar_paci_nume_iden"
                      name="hosp_part_diar_paci_nume_iden"
                      value={formData["hosp_part_diar_paci_nume_iden"]}
                      onChange={handleChange}
                      placeholder="Ingrese la identificacion del paciente"
                      autoComplete="on"
                      required
                      className={`${inputStyle} ${isFieldInvalid("hosp_part_diar_paci_nume_iden", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["hosp_part_diar_paci_nume_iden"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                      disabled={variableEstado["hosp_part_diar_paci_nume_iden"]}
                    />
                    <button
                      type="submit"
                      id="btn_buscar_paciente"
                      name="btn_buscar_paciente"
                      className={`${botonEstado.btn_buscar_paciente ? buttonStyleDesactivado : buttonStyleOtro}`}
                      disabled={botonEstado.btn_buscar_paciente}
                    >
                      Buscar
                    </button>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
        </form>
        <form onSubmit={handleSubmit} autoComplete="on" className="w-full">
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Datos del Paciente
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="hosp_part_diar_unid_salu"
                >
                  {requiredFields.includes("hosp_part_diar_unid_salu") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_part_diar_unid_salu"]}
                </label>
                <CustomSelect
                  id="hosp_part_diar_unid_salu"
                  name="hosp_part_diar_unid_salu"
                  value={formData["hosp_part_diar_unid_salu"]}
                  onChange={handleChange}
                  options={allListAdmision.adm_dato_pers_unid_salu || []}
                  placeholder="Seleccione la unidad de salud"
                  disabled={variableEstado["hosp_part_diar_unid_salu"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "hosp_part_diar_unid_salu",
                      requiredFields,
                      formData,
                      isFieldVisible,
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                />
              </div>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="hosp_part_diar_paci_apel"
                >
                  {requiredFields.includes("hosp_part_diar_paci_apel") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_part_diar_paci_apel"]}
                </label>
                <input
                  type="text"
                  id="hosp_part_diar_paci_apel"
                  name="hosp_part_diar_paci_apel"
                  value={formData["hosp_part_diar_paci_apel"]}
                  readOnly
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  className={`${inputStyle} ${isFieldInvalid("hosp_part_diar_paci_apel", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["hosp_part_diar_paci_apel"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                  disabled={variableEstado["hosp_part_diar_paci_apel"]}
                />
              </div>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="hosp_part_diar_paci_nomb"
                >
                  {requiredFields.includes("hosp_part_diar_paci_nomb") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_part_diar_paci_nomb"]}
                </label>
                <input
                  type="text"
                  id="hosp_part_diar_paci_nomb"
                  name="hosp_part_diar_paci_nomb"
                  value={formData["hosp_part_diar_paci_nomb"]}
                  readOnly
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  className={`${inputStyle} ${isFieldInvalid("hosp_part_diar_paci_nomb", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["hosp_part_diar_paci_nomb"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                  disabled={variableEstado["hosp_part_diar_paci_nomb"]}
                />
              </div>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="hosp_part_diar_paci_edad"
                >
                  {requiredFields.includes("hosp_part_diar_paci_edad") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_part_diar_paci_edad"]}
                </label>
                <input
                  type="text"
                  id="hosp_part_diar_paci_edad"
                  name="hosp_part_diar_paci_edad"
                  value={formData["hosp_part_diar_paci_edad"]}
                  readOnly
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  className={`${inputStyle} ${isFieldInvalid("hosp_part_diar_paci_edad", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["hosp_part_diar_paci_edad"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                  disabled={variableEstado["hosp_part_diar_paci_edad"]}
                />
              </div>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="hosp_part_diar_paci_sexo"
                >
                  {requiredFields.includes("hosp_part_diar_paci_sexo") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_part_diar_paci_sexo"]}
                </label>
                <CustomSelect
                  id="hosp_part_diar_paci_sexo"
                  name="hosp_part_diar_paci_sexo"
                  value={formData["hosp_part_diar_paci_sexo"]}
                  onChange={handleChange}
                  options={allListAdmision.adm_dato_pers_sexo || []}
                  placeholder="Seleccione el sexo"
                  disabled={variableEstado["hosp_part_diar_paci_sexo"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "hosp_part_diar_paci_sexo",
                      requiredFields,
                      formData,
                      isFieldVisible,
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="hosp_part_diar_sevi">
                  {requiredFields.includes("hosp_part_diar_sevi") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_part_diar_sevi"]}
                </label>
                <CustomSelect
                  id="hosp_part_diar_sevi"
                  name="hosp_part_diar_sevi"
                  value={formData["hosp_part_diar_sevi"]}
                  onChange={handleChange}
                  options={allListAdmision.adm_dato_pers_sexo || []}
                  placeholder="Seleccione el sexo"
                  disabled={variableEstado["hosp_part_diar_sevi"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "hosp_part_diar_sevi",
                      requiredFields,
                      formData,
                      isFieldVisible,
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                />
              </div>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="hosp_part_diar_habi_cama"
                >
                  {requiredFields.includes("hosp_part_diar_habi_cama") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_part_diar_habi_cama"]}
                </label>
                <input
                  type="text"
                  id="hosp_part_diar_habi_cama"
                  name="hosp_part_diar_habi_cama"
                  value={formData["hosp_part_diar_habi_cama"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  className={`${inputStyle} ${isFieldInvalid("hosp_part_diar_habi_cama", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["hosp_part_diar_habi_cama"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                  disabled={variableEstado["hosp_part_diar_habi_cama"]}
                />
              </div>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="hosp_part_diar_fech_aten"
                >
                  {requiredFields.includes("hosp_part_diar_fech_aten") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_part_diar_fech_aten"]}
                </label>
                <input
                  type="date"
                  id="hosp_part_diar_fech_aten"
                  name="hosp_part_diar_fech_aten"
                  value={formData["hosp_part_diar_fech_aten"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  className={`${inputStyle} ${isFieldInvalid("hosp_part_diar_fech_aten", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["hosp_part_diar_fech_aten"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                  disabled={variableEstado["hosp_part_diar_fech_aten"]}
                />
              </div>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="hosp_part_diar_hora_aten"
                >
                  {requiredFields.includes("hosp_part_diar_hora_aten") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_part_diar_hora_aten"]}
                </label>
                <input
                  type="time"
                  id="hosp_part_diar_hora_aten"
                  name="hosp_part_diar_hora_aten"
                  value={formData["hosp_part_diar_hora_aten"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  className={`${inputStyle} ${isFieldInvalid("hosp_part_diar_hora_aten", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["hosp_part_diar_hora_aten"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                  disabled={variableEstado["hosp_part_diar_hora_aten"]}
                />
              </div>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="hosp_part_diar_prof_salu"
                >
                  {requiredFields.includes("hosp_part_diar_prof_salu") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_part_diar_prof_salu"]}
                </label>
                <input
                  type="text"
                  id="hosp_part_diar_prof_salu"
                  name="hosp_part_diar_prof_salu"
                  value={formData["hosp_part_diar_prof_salu"]}
                  readOnly
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  className={`${inputStyle} ${isFieldInvalid("hosp_part_diar_prof_salu", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["hosp_part_diar_prof_salu"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                  disabled={variableEstado["hosp_part_diar_prof_salu"]}
                />
              </div>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="hosp_part_diar_regi_aten"
                >
                  {requiredFields.includes("hosp_part_diar_regi_aten") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["hosp_part_diar_regi_aten"]}
                </label>
                <input
                  type="text"
                  id="hosp_part_diar_regi_aten"
                  name="hosp_part_diar_regi_aten"
                  value={formData["hosp_part_diar_regi_aten"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  className={`${inputStyle} ${isFieldInvalid("hosp_part_diar_regi_aten", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["hosp_part_diar_regi_aten"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                  disabled={variableEstado["hosp_part_diar_regi_aten"]}
                />
              </div>
            </div>
          </fieldset>
        </form>
        <EstadoMensajes error={error} successMessage={successMessage} />
        {showBusquedaAvanzada && (
          <div className="fixed inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-50">
            <div className="bg-white w-[95%] max-w-6xl max-h-[90vh] overflow-auto rounded shadow-lg p-4 relative">
              <button
                type="button"
                onClick={() => setShowBusquedaAvanzada(false)}
                className="absolute top-2 right-2 text-red-500 font-bold text-2xl z-10"
              >
                Cerrar X
              </button>
              <BuscarAdmisionados
                onSelect={handleSeleccionarAdmisionado}
                onClose={() => setShowBusquedaAvanzada(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
