import React, { useState, useEffect } from "react";
import {
  registerAdmision,
  updateAdmision,
  buscarUsuarioAdmision,
} from "../api/conexion.api.js";
import allListForm008 from "../api/all.list.form008.json";
import allListAbscripcionTerritorial from "../api/all.list.abscripcion.territorial.json";
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
  for_008_busc_pers_tipo_iden: "",
  for_008_busc_pers_nume_iden: "",
  for_008_emer_inst_sist: "",
  for_008_emer_unic: "",
  for_008_emer_nomb_esta_salu: "",
  for_008_emer_zona: "",
  for_008_emer_prov: "",
  for_008_emer_cant: "",
  for_008_emer_dist: "",
  for_008_emer_nive: "",
  for_008_emer_fech_aten: "",
  for_008_emer_tipo_docu_iden: "",
  for_008_emer_nume_iden: "",
  for_008_emer_apel_comp: "",
  for_008_emer_nomb_comp: "",
  for_008_emer_sexo: "",
  for_008_emer_edad: "",
  for_008_emer_cond_edad: "",
  for_008_emer_naci: "",
  for_008_emer_etni: "",
  for_008_emer_grup_prio: "",
  for_008_emer_tipo_segu: "",
  for_008_emer_prov_resi: "",
  for_008_emer_cant_resi: "",
  for_008_emer_parr_resi: "",
  for_008_emer_espe_prof: "",
  for_008_emer_cie_10_prin: "",
  for_008_emer_diga_prin: "",
  for_008_emer_cond_diag: "",
  for_008_emer_cie_10_caus_exte: "",
  for_008_emer_diag_caus_exte: "",
  for_008_emer_hosp: "",
  for_008_emer_hora_aten: "",
  for_008_emer_cond_alta: "",
  for_008_emer_obse: "",
  for_008_emer_resp_aten_medi: "",
  for_008_emer_apoy_aten_medi: "",
  for_008_emer_edad_gest: "",
  for_008_emer_ries_obst: "",
  for_008_emer_indi_paci_fami: "",
  for_008_emer_unid_salu_resp_segu_aten: "",
  for_008_emer_dire_domi: "",
  for_008_emer_tele_paci: "",
};

const Form008Emergencia = () => {
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const initialVariableEstado = {
    for_008_busc_pers_tipo_iden: false,
    for_008_busc_pers_nume_iden: false,
    for_008_emer_inst_sist: true,
    for_008_emer_unic: true,
    for_008_emer_nomb_esta_salu: true,
    for_008_emer_zona: true,
    for_008_emer_prov: true,
    for_008_emer_cant: true,
    for_008_emer_dist: true,
    for_008_emer_nive: true,
    for_008_emer_fech_aten: true,
    for_008_emer_tipo_docu_iden: true,
    for_008_emer_nume_iden: true,
    for_008_emer_prim_apel: true,
    for_008_emer_prim_nomb: true,
    for_008_emer_sexo: true,
    for_008_emer_edad: true,
    for_008_emer_cond_edad: true,
    for_008_emer_naci: true,
    for_008_emer_etni: true,
    for_008_emer_grup_prio: true,
    for_008_emer_tipo_segu: true,
    for_008_emer_prov_reci: true,
    for_008_emer_cant_reci: true,
    for_008_emer_parr_reci: true,
    for_008_emer_espe_prof: true,
    for_008_emer_cie_10_prin: true,
    for_008_emer_diga_prin: true,
    for_008_emer_cond_diag: true,
    for_008_emer_cie_10_caus_exte: true,
    for_008_emer_diag_caus_exte: true,
    for_008_emer_hosp: true,
    for_008_emer_hora_aten: true,
    for_008_emer_cond_alta: true,
    for_008_emer_obse: true,
    for_008_emer_resp_aten_medi: true,
    for_008_emer_apoy_aten_medi: true,
    for_008_emer_edad_gest: true,
    for_008_emer_ries_obst: true,
    for_008_emer_indi_paci_fami: true,
    for_008_emer_unid_salu_resp_segu_aten: true,
    for_008_emer_dire_domi: true,
    for_008_emer_tele_paci: true,
  };
  const initialBotonEstado = {
    btnBuscar: false,
  };

  const [variableEstado, setVariableEstado] = useState(initialVariableEstado);
  const [botonEstado, setBotonEstado] = useState(initialBotonEstado);

  const requiredFields = [];

  const labelMap = {
    for_008_busc_pers_tipo_iden: "TIPO DE IDENTIFICACIÓN",
    for_008_busc_pers_nume_iden: "NÚMERO DE IDENTIFICACIÓN",
    for_008_emer_inst_sist: "INSTITUCIÓN DEL SISTEMA",
    for_008_emer_unic: "UNICODIGO",
    for_008_emer_nomb_esta_salu: "NOMBRE DEL ESTABLECIMIENTO DE SALUD",
    for_008_emer_zona: "ZONA",
    for_008_emer_prov: "PROVINCIA",
    for_008_emer_cant: "CANTON",
    for_008_emer_dist: "DISTRITO",
    for_008_emer_nive: "NIVEL",
    for_008_emer_fech_aten: "FECHA DE ATENCIÓN",
    for_008_emer_tipo_docu_iden: "TIPO DE DOCUMENTO DE IDENTIFICACIÓN",
    for_008_emer_nume_iden: "NÚMERO DE IDENTIFICACION",
    for_008_emer_apel_comp: "APELLIDOS",
    for_008_emer_nomb_comp: "NOMBRES",
    for_008_emer_sexo: "SEXO",
    for_008_emer_edad: "EDAD",
    for_008_emer_cond_edad: "CONDICIÓN DE LA EDAD",
    for_008_emer_naci: "NACIONALIDAD",
    for_008_emer_etni: "ETNIA",
    for_008_emer_grup_prio: "GRUPO PRIORITARIO",
    for_008_emer_tipo_segu: "TIPO DE SEGURO",
    for_008_emer_prov_reci: "PROVINCIA DE RECIDENCIA",
    for_008_emer_cant_reci: "CANTON DE RECIDENCIA",
    for_008_emer_parr_reci: "PARROQUIA DE RECIDENCIA",
    for_008_emer_espe_prof: "ESPECIALIDAD DEL PROFESIONAL",
    for_008_emer_cie_10_prin: "CIE-10 (PRINCIPAL)",
    for_008_emer_diga_prin: "DIGANÓSTICO 1 (PRINCIPAL)",
    for_008_emer_cond_diag: "CONDICIÓN DEL DIAGNÓSTICO",
    for_008_emer_cie_10_caus_exte: "CIE-10 (CAUSA EXTERNA)",
    for_008_emer_diag_caus_exte: "DIAGNOSTICO (CAUSA  EXTERNA)",
    for_008_emer_hosp: "HOSPITALIZACIÓN",
    for_008_emer_hora_aten: "HORA ATENCIÓN",
    for_008_emer_cond_alta: "CONDICIÓN DEL ALTA ",
    for_008_emer_obse: "OBSERVACIÓN",
    for_008_emer_resp_aten_medi: "RESPONSABLE DE LA ATENCION MEDICA",
    for_008_emer_apoy_aten_medi: "APOYO EN LA ATENCION MEDICA",
    for_008_emer_edad_gest: "EDAD GESTACIONAL",
    for_008_emer_ries_obst: "RIESGO OBSTETRICO",
    for_008_emer_indi_paci_fami: "INDICACIONES PARA EL PACIENTE O LA FAMILIA",
    for_008_emer_unid_salu_resp_segu_aten:
      "UNIDAD DE SALUD RESPONSABLE DE SEGUIMIENTO DE ATENCIÓN",
    for_008_emer_dire_domi: "DIRECCIÓN DE DOMICILIO",
    for_008_emer_tele_paci: "TELEFONO DE PACIENTE",
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
    tipoId = formData.for_008_busc_pers_tipo_iden;
    numIden = formData.for_008_busc_pers_nume_iden;

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
      const response = await buscarUsuarioAdmision(tipoId, numIden);
      if (!response)
        throw new Error("No se pudo obtener una respuesta de la API.");

      actualizarFormDataConRespuesta(response.data);
      ajustarVariableEstadoExitoso();
      setSuccessMessage(response.message || "Operación exitosa");
      setTimeout(() => setSuccessMessage(""), 10000);
      setError("");
      toast.success(response.message || "Operación exitosa", {
        position: "bottom-right",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      ajustarVariableEstadoFalsoRepr();

      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      setSuccessMessage("");
      toast.error(errorMessage, { position: "bottom-right" });
    }
  };

  const actualizarFormDataConRespuesta = (data) => {
    console.log("Datos recibidos:", data);
    setFormData((prevData) => ({
      ...prevData,
      id_adm: data.id_adm || data.id || "",
      // Combina apellidos
      for_008_emer_apel_comp: [
        data.adm_dato_pers_apel_prim || "",
        data.adm_dato_pers_apel_segu || "",
      ],
      for_008_emer_nomb_comp: [
        data.adm_dato_pers_nomb_prim || "",
        data.adm_dato_pers_nomb_segu || "",
      ],
      for_008_emer_sexo: data.adm_dato_pers_sexo || "",
      for_008_emer_tele_paci: [
        data.adm_dato_pers_tele || "",
        data.adm_dato_pers_celu || "",
      ],
      for_008_emer_naci: data.adm_dato_naci_naci || "",
      for_008_emer_prov_resi: data.adm_dato_resi_prov || "",
      for_008_emer_cant_resi: data.adm_dato_resi_cant || "",
      for_008_emer_parr_resi: data.adm_dato_resi_parr || "",
      for_008_emer_unid_salu_resp_segu_aten:
        data.adm_dato_resi_esta_adsc_terr || "",
      for_008_emer_dire_domi: [
        data.adm_dato_resi_barr_sect || "",
        data.adm_dato_resi_call_prin || "",
        data.adm_dato_resi_call_secu || "",
        data.adm_dato_resi_refe_resi || "",
      ],
      for_008_emer_etni: data.adm_dato_auto_auto_etni || "",
      for_008_emer_grup_prio: data.adm_dato_adic_grup_prio || "",
      for_008_emer_tipo_segu: data.adm_dato_adic_tipo_segu || "",
    }));
  };

  const ajustarVariableEstadoExitoso = () => {
    setVariableEstado((prevState) => ({
      ...prevState,
      for_008_busc_pers_nume_iden: true,
      for_008_busc_pers_tipo_iden: true,
      for_008_emer_inst_sist: false,
      for_008_emer_unic: false,
      for_008_emer_nomb_esta_salu: false,
      for_008_emer_zona: false,
      for_008_emer_prov: false,
      for_008_emer_cant: false,
      for_008_emer_dist: false,
      for_008_emer_nive: false,
      for_008_emer_fech_aten: false,
      for_008_emer_tipo_docu_iden: false,
      for_008_emer_nume_iden: false,
      for_008_emer_apel_comp: false,
      for_008_emer_nomb_comp: false,
      for_008_emer_sexo: false,
      for_008_emer_edad: false,
      for_008_emer_cond_edad: false,
      for_008_emer_naci: false,
      for_008_emer_etni: false,
      for_008_emer_grup_prio: false,
      for_008_emer_tipo_segu: false,
      for_008_emer_prov_reci: false,
      for_008_emer_cant_reci: false,
      for_008_emer_parr_reci: false,
      for_008_emer_espe_prof: false,
      for_008_emer_cie_10_prin: false,
      for_008_emer_diga_prin: false,
      for_008_emer_cond_diag: false,
      for_008_emer_cie_10_caus_exte: false,
      for_008_emer_diag_caus_exte: false,
      for_008_emer_hosp: false,
      for_008_emer_hora_aten: false,
      for_008_emer_cond_alta: false,
      for_008_emer_obse: false,
      for_008_emer_resp_aten_medi: false,
      for_008_emer_apoy_aten_medi: false,
      for_008_emer_edad_gest: false,
      for_008_emer_ries_obst: false,
      for_008_emer_indi_paci_fami: false,
      for_008_emer_unid_salu_resp_segu_aten: false,
      for_008_emer_dire_domi: false,
      for_008_emer_tele_paci: false,
    }));
    setBotonEstado((prevState) => ({
      btnBuscar: true,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFieldVisible = (field) => {
    const edadNum = parseInt(edad);

    // Reglas específicas por campo
    const reglas = {
      adm_dato_repr_fech_naci: () =>
        formData.adm_dato_repr_tipo_iden === "NO IDENTIFICADO",
      adm_dato_repr_naci: () =>
        formData.adm_dato_repr_tipo_iden === "NO IDENTIFICADO",
      adm_dato_repr_no_ident_prov: () =>
        formData.adm_dato_repr_tipo_iden === "NO IDENTIFICADO" &&
        formData.adm_dato_repr_naci === "ECUATORIANO/A",
      adm_dato_auto_naci_etni: () =>
        formData.adm_dato_auto_auto_etni === "INDÍGENA",
      adm_dato_auto_pueb_kich: () =>
        formData.adm_dato_auto_naci_etni === "KICHWA",
      adm_dato_no_ident_prov: () =>
        formData.adm_dato_naci_naci === "ECUATORIANO/A" &&
        formData.adm_dato_pers_tipo_iden === "NO IDENTIFICADO",
      adm_dato_resi_prov: () => formData.adm_dato_resi_pais_resi === "ECUADOR",
      adm_dato_resi_cant: () => formData.adm_dato_resi_pais_resi === "ECUADOR",
      adm_dato_resi_parr: () => formData.adm_dato_resi_pais_resi === "ECUADOR",
      adm_dato_resi_esta_adsc_terr: () =>
        formData.adm_dato_resi_pais_resi === "ECUADOR",
    };

    // Campos del representante solo si es menor de edad
    const camposRepresentante = [
      "adm_dato_repr_tipo_iden",
      "adm_dato_repr_nume_iden",
      "adm_dato_repr_apel",
      "adm_dato_repr_nomb",
      "adm_dato_repr_pare",
    ];
    if (camposRepresentante.includes(field)) {
      return !isNaN(edadNum) && edadNum < 18;
    }

    // Si hay una regla específica, aplícala
    if (reglas[field]) {
      return reglas[field]();
    }

    // Por defecto, visible
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar los datos a la API
    setSuccess("Formulario enviado correctamente");
    setError("");
    // console.log(formData);
  };

  const handleSubmitBuscar = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar los datos a la API
    setSuccess("Formulario enviado correctamente");
    setError("");
    // console.log(formData);
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
  const buttonTextBuscar = "Buscar";

  return (
    <div className="w-full h-screen flex items-stretch justify-stretch bg-gray-100">
      <div className="w-full h-full p-4 m-4 bg-white rounded-lg shadow-md mt-1">
        <h2 className="text-2xl font-bold mb-1 text-center text-blue-700">
          Formulario 008 Emergencia
        </h2>
        <form onSubmit={handleSubmitBuscar} className="w-full">
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Buscar pacientes admisionados
            </legend>
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="for_008_busc_pers_tipo_iden"
                >
                  {labelMap["for_008_busc_pers_tipo_iden"]}
                </label>
                <CustomSelect
                  id="for_008_busc_pers_tipo_iden"
                  name="for_008_busc_pers_tipo_iden"
                  value={formData["for_008_busc_pers_tipo_iden"]}
                  onChange={handleChange}
                  options={allListForm008.for_008_busc_pers_tipo_iden}
                  disabled={variableEstado["for_008_busc_pers_tipo_iden"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "for_008_busc_pers_tipo_iden",
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
                <label
                  className={labelClass}
                  htmlFor="for_008_busc_pers_nume_iden"
                >
                  {labelMap["for_008_busc_pers_nume_iden"]}
                </label>
                <input
                  type="text"
                  id="for_008_busc_pers_nume_iden"
                  name="for_008_busc_pers_nume_iden"
                  value={formData["for_008_busc_pers_nume_iden"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle}
                      ${
                        isFieldInvalid(
                          "for_008_busc_pers_nume_iden",
                          requiredFields,
                          formData,
                          isFieldVisible
                        )
                          ? "border-2 border-red-500"
                          : ""
                      }
                       ${
                         variableEstado["for_008_busc_pers_nume_iden"]
                           ? "bg-gray-200 text-gray-700 cursor-no-drop"
                           : "bg-white text-gray-700 cursor-pointer"
                       }`}
                  disabled={variableEstado["for_008_busc_pers_nume_iden"]}
                />
              </div>
              <div className="flex items-center justify-start -mb-4">
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
                  {buttonTextBuscar}
                </button>
              </div>
            </div>
          </fieldset>
        </form>
        <form onSubmit={handleSubmit} className="w-full">
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Datos de Unidad de Salud
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="for_008_emer_nomb_esta_salu"
                >
                  {requiredFields.includes("for_008_emer_nomb_esta_salu") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_nomb_esta_salu"]}
                </label>
                <input
                  type="text"
                  id="for_008_emer_nomb_esta_salu"
                  name="for_008_emer_nomb_esta_salu"
                  value={formData["for_008_emer_nomb_esta_salu"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle} ${
                    isFieldInvalid(
                      "for_008_emer_nomb_esta_salu",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  } ${
                    variableEstado["for_008_emer_nomb_esta_salu"]
                      ? "bg-gray-200 text-gray-700 cursor-no-drop"
                      : "bg-white text-gray-700 cursor-pointer"
                  }`}
                  disabled={variableEstado["for_008_emer_nomb_esta_salu"]}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="for_008_emer_fech_aten">
                  {requiredFields.includes("for_008_emer_fech_aten") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_fech_aten"]}
                </label>
                <input
                  type="date"
                  id="for_008_emer_fech_aten"
                  name="for_008_emer_fech_aten"
                  value={formData["for_008_emer_fech_aten"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle} ${
                    isFieldInvalid(
                      "for_008_emer_fech_aten",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  } ${
                    variableEstado["for_008_emer_fech_aten"]
                      ? "bg-gray-200 text-gray-700 cursor-no-drop"
                      : "bg-white text-gray-700 cursor-pointer"
                  }`}
                  disabled={variableEstado["for_008_emer_fech_aten"]}
                />
              </div>
            </div>
          </fieldset>
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Datos de Admision de paciente
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="for_008_emer_apel_comp">
                  {requiredFields.includes("for_008_emer_apel_comp") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_apel_comp"]}
                </label>
                <input
                  type="text"
                  id="for_008_emer_apel_comp"
                  name="for_008_emer_apel_comp"
                  value={formData["for_008_emer_apel_comp"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle} ${
                    isFieldInvalid(
                      "for_008_emer_apel_comp",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : "for_008_emer_apel_comp"
                  } ${
                    variableEstado["for_008_emer_apel_comp"]
                      ? "bg-gray-200 text-gray-700 cursor-no-drop"
                      : "bg-white text-gray-700 cursor-pointer"
                  }`}
                  disabled={variableEstado["for_008_emer_apel_comp"]}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="for_008_emer_nomb_comp">
                  {requiredFields.includes("for_008_emer_nomb_comp") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_nomb_comp"]}
                </label>
                <input
                  type="text"
                  id="for_008_emer_nomb_comp"
                  name="for_008_emer_nomb_comp"
                  value={formData["for_008_emer_nomb_comp"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle} ${
                    isFieldInvalid(
                      "for_008_emer_nomb_comp",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  } ${
                    variableEstado["for_008_emer_nomb_comp"]
                      ? "bg-gray-200 text-gray-700 cursor-no-drop"
                      : "bg-white text-gray-700 cursor-pointer"
                  }`}
                  disabled={variableEstado["for_008_emer_nomb_comp"]}
                />
              </div>
            </div>
            <div className={fieldClass}>
              <label className={labelClass} htmlFor="for_008_emer_sexo">
                {requiredFields.includes("for_008_emer_sexo") && (
                  <span className="text-red-500">* </span>
                )}
                {labelMap["for_008_emer_sexo"]}
              </label>
              <input
                type="text"
                id="for_008_emer_sexo"
                name="for_008_emer_sexo"
                value={formData["for_008_emer_sexo"]}
                onChange={handleChange}
                placeholder="Información es requerida"
                required
                className={`${inputStyle} ${
                  isFieldInvalid(
                    "for_008_emer_sexo",
                    requiredFields,
                    formData,
                    isFieldVisible
                  )
                    ? "border-2 border-red-500"
                    : ""
                } ${
                  variableEstado["for_008_emer_sexo"]
                    ? "bg-gray-200 text-gray-700 cursor-no-drop"
                    : "bg-white text-gray-700 cursor-pointer"
                }`}
                disabled={variableEstado["for_008_emer_sexo"]}
              />
            </div>
            <div className={fieldClass}>
              <label className={labelClass} htmlFor="for_008_emer_edad">
                {requiredFields.includes("for_008_emer_edad") && (
                  <span className="text-red-500">* </span>
                )}
                {labelMap["for_008_emer_edad"]}
              </label>
              <input
                type="text"
                id="for_008_emer_edad"
                name="for_008_emer_edad"
                value={formData["for_008_emer_edad"]}
                onChange={handleChange}
                placeholder="Información es requerida"
                required
                className={`${inputStyle} ${
                  isFieldInvalid(
                    "for_008_emer_edad",
                    requiredFields,
                    formData,
                    isFieldVisible
                  )
                    ? "border-2 border-red-500"
                    : ""
                } ${
                  variableEstado["for_008_emer_edad"]
                    ? "bg-gray-200 text-gray-700 cursor-no-drop"
                    : "bg-white text-gray-700 cursor-pointer"
                }`}
                disabled={variableEstado["for_008_emer_edad"]}
              />
            </div>
            <div className={fieldClass}>
              <label className={labelClass} htmlFor="for_008_emer_cond_edad">
                {requiredFields.includes("for_008_emer_cond_edad") && (
                  <span className="text-red-500">* </span>
                )}
                {labelMap["for_008_emer_cond_edad"]}
              </label>
              <input
                type="text"
                id="for_008_emer_cond_edad"
                name="for_008_emer_cond_edad"
                value={formData["for_008_emer_cond_edad"]}
                onChange={handleChange}
                placeholder="Información es requerida"
                required
                className={`${inputStyle} ${
                  isFieldInvalid(
                    "for_008_emer_cond_edad",
                    requiredFields,
                    formData,
                    isFieldVisible
                  )
                    ? "border-2 border-red-500"
                    : ""
                } ${
                  variableEstado["for_008_emer_cond_edad"]
                    ? "bg-gray-200 text-gray-700 cursor-no-drop"
                    : "bg-white text-gray-700 cursor-pointer"
                }`}
                disabled={variableEstado["for_008_emer_cond_edad"]}
              />
            </div>
            <div className={fieldClass}>
              <label className={labelClass} htmlFor="for_008_emer_naci">
                {requiredFields.includes("for_008_emer_naci") && (
                  <span className="text-red-500">* </span>
                )}
                {labelMap["for_008_emer_naci"]}
              </label>
              <input
                type="text"
                id="for_008_emer_naci"
                name="for_008_emer_naci"
                value={formData["for_008_emer_naci"]}
                onChange={handleChange}
                placeholder="Información es requerida"
                required
                className={`${inputStyle} ${
                  isFieldInvalid(
                    "for_008_emer_naci",
                    requiredFields,
                    formData,
                    isFieldVisible
                  )
                    ? "border-2 border-red-500"
                    : ""
                } ${
                  variableEstado["for_008_emer_naci"]
                    ? "bg-gray-200 text-gray-700 cursor-no-drop"
                    : "bg-white text-gray-700 cursor-pointer"
                }`}
                disabled={variableEstado["for_008_emer_naci"]}
              />
            </div>
            <div className={fieldClass}>
              <label className={labelClass} htmlFor="for_008_emer_etni">
                {requiredFields.includes("for_008_emer_etni") && (
                  <span className="text-red-500">* </span>
                )}
                {labelMap["for_008_emer_etni"]}
              </label>
              <input
                type="text"
                id="for_008_emer_etni"
                name="for_008_emer_etni"
                value={formData["for_008_emer_etni"]}
                onChange={handleChange}
                placeholder="Información es requerida"
                required
                className={`${inputStyle} ${
                  isFieldInvalid(
                    "for_008_emer_etni",
                    requiredFields,
                    formData,
                    isFieldVisible
                  )
                    ? "border-2 border-red-500"
                    : ""
                } ${
                  variableEstado["for_008_emer_etni"]
                    ? "bg-gray-200 text-gray-700 cursor-no-drop"
                    : "bg-white text-gray-700 cursor-pointer"
                }`}
                disabled={variableEstado["for_008_emer_etni"]}
              />
            </div>
            <div className={fieldClass}>
              <label className={labelClass} htmlFor="for_008_emer_grup_prio">
                {requiredFields.includes("for_008_emer_grup_prio") && (
                  <span className="text-red-500">* </span>
                )}
                {labelMap["for_008_emer_grup_prio"]}
              </label>
              <input
                type="text"
                id="for_008_emer_grup_prio"
                name="for_008_emer_grup_prio"
                value={formData["for_008_emer_grup_prio"]}
                onChange={handleChange}
                placeholder="Información es requerida"
                required
                className={`${inputStyle} ${
                  isFieldInvalid(
                    "for_008_emer_grup_prio",
                    requiredFields,
                    formData,
                    isFieldVisible
                  )
                    ? "border-2 border-red-500"
                    : ""
                } ${
                  variableEstado["for_008_emer_grup_prio"]
                    ? "bg-gray-200 text-gray-700 cursor-no-drop"
                    : "bg-white text-gray-700 cursor-pointer"
                }`}
                disabled={variableEstado["for_008_emer_grup_prio"]}
              />
            </div>
            <div className={fieldClass}>
              <label className={labelClass} htmlFor="for_008_emer_tipo_segu">
                {requiredFields.includes("for_008_emer_tipo_segu") && (
                  <span className="text-red-500">* </span>
                )}
                {labelMap["for_008_emer_tipo_segu"]}
              </label>
              <input
                type="text"
                id="for_008_emer_tipo_segu"
                name="for_008_emer_tipo_segu"
                value={formData["for_008_emer_tipo_segu"]}
                onChange={handleChange}
                placeholder="Información es requerida"
                required
                className={`${inputStyle} ${
                  isFieldInvalid(
                    "for_008_emer_tipo_segu",
                    requiredFields,
                    formData,
                    isFieldVisible
                  )
                    ? "border-2 border-red-500"
                    : ""
                } ${
                  variableEstado["for_008_emer_tipo_segu"]
                    ? "bg-gray-200 text-gray-700 cursor-no-drop"
                    : "bg-white text-gray-700 cursor-pointer"
                }`}
                disabled={variableEstado["for_008_emer_tipo_segu"]}
              />
            </div>
            <div className={fieldClass}>
              <label className={labelClass} htmlFor="for_008_emer_prov_reci">
                {requiredFields.includes("for_008_emer_prov_reci") && (
                  <span className="text-red-500">* </span>
                )}
                {labelMap["for_008_emer_prov_reci"]}
              </label>
              <input
                type="text"
                id="for_008_emer_prov_reci"
                name="for_008_emer_prov_reci"
                value={formData["for_008_emer_prov_reci"]}
                onChange={handleChange}
                placeholder="Información es requerida"
                required
                className={`${inputStyle} ${
                  isFieldInvalid(
                    "for_008_emer_prov_reci",
                    requiredFields,
                    formData,
                    isFieldVisible
                  )
                    ? "border-2 border-red-500"
                    : ""
                } ${
                  variableEstado["for_008_emer_prov_reci"]
                    ? "bg-gray-200 text-gray-700 cursor-no-drop"
                    : "bg-white text-gray-700 cursor-pointer"
                }`}
                disabled={variableEstado["for_008_emer_prov_reci"]}
              />
            </div>
            <div className={fieldClass}>
              <label className={labelClass} htmlFor="for_008_emer_cant_reci">
                {requiredFields.includes("for_008_emer_cant_reci") && (
                  <span className="text-red-500">* </span>
                )}
                {labelMap["for_008_emer_cant_reci"]}
              </label>
              <input
                type="text"
                id="for_008_emer_cant_reci"
                name="for_008_emer_cant_reci"
                value={formData["for_008_emer_cant_reci"]}
                onChange={handleChange}
                placeholder="Información es requerida"
                required
                className={`${inputStyle} ${
                  isFieldInvalid(
                    "for_008_emer_cant_reci",
                    requiredFields,
                    formData,
                    isFieldVisible
                  )
                    ? "border-2 border-red-500"
                    : ""
                } ${
                  variableEstado["for_008_emer_cant_reci"]
                    ? "bg-gray-200 text-gray-700 cursor-no-drop"
                    : "bg-white text-gray-700 cursor-pointer"
                }`}
                disabled={variableEstado["for_008_emer_cant_reci"]}
              />
            </div>
            <div className={fieldClass}>
              <label className={labelClass} htmlFor="for_008_emer_parr_reci">
                {requiredFields.includes("for_008_emer_parr_reci") && (
                  <span className="text-red-500">* </span>
                )}
                {labelMap["for_008_emer_parr_reci"]}
              </label>
              <input
                type="text"
                id="for_008_emer_parr_reci"
                name="for_008_emer_parr_reci"
                value={formData["for_008_emer_parr_reci"]}
                onChange={handleChange}
                placeholder="Información es requerida"
                required
                className={`${inputStyle} ${
                  isFieldInvalid(
                    "for_008_emer_parr_reci",
                    requiredFields,
                    formData,
                    isFieldVisible
                  )
                    ? "border-2 border-red-500"
                    : ""
                } ${
                  variableEstado["for_008_emer_parr_reci"]
                    ? "bg-gray-200 text-gray-700 cursor-no-drop"
                    : "bg-white text-gray-700 cursor-pointer"
                }`}
                disabled={variableEstado["for_008_emer_parr_reci"]}
              />
            </div>
          </fieldset>
          <div className="md:col-span-2 flex justify-end mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              Registrar
            </button>
          </div>
        </form>
        <EstadoMensajes error={error} successMessage={successMessage} />
      </div>
    </div>
  );
};

export default Form008Emergencia;
