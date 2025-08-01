import React, { useState, useEffect } from "react";
import Admision from "./Admision.jsx";
import {
  getAllEniUsers,
  registerForm008Emer,
  updateForm008Emer,
  buscarUsuarioAdmision,
  buscarUsuarioIdUnidadSalud,
  updateUnidadSaludPrincipal,
} from "../api/conexion.api.js";
import allListForm008 from "../api/all.list.form008.json";
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
import TablaForm008Emer from "../components/TablaForm008Emer.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const initialState = {
  id_eni_user: "",
  id_unid_salu: "",
  for_008_busc_pers_tipo_iden: "",
  for_008_busc_pers_nume_iden: "",
  for_008_emer_nomb_esta_salu: "",
  for_008_emer_fech_aten: "",
  for_008_emer_hora_aten: "",
  for_008_emer_edad_cond: "",
  for_008_emer_apel_comp: "",
  for_008_emer_nomb_comp: "",
  for_008_emer_sexo: "",
  for_008_emer_naci: "",
  for_008_emer_etni: "",
  for_008_emer_grup_prio: "",
  for_008_emer_tipo_segu: "",
  for_008_emer_prov_resi: "",
  for_008_emer_cant_resi: "",
  for_008_emer_parr_resi: "",
  for_008_emer_unid_salu_resp_segu_aten: "",
  for_008_emer_dire_domi: "",
  for_008_emer_tele_paci: "",
  for_008_emer_espe_prof: "",
  for_008_emer_cie_10_prin_diag: "",
  for_008_emer_cond_diag: "",
  for_008_emer_cie_10_caus_exte_diag: "",
  for_008_emer_hosp: "",
  for_008_emer_cond_alta: "",
  for_008_emer_obse: "",
  for_008_emer_apoy_aten_medi: "",
  for_008_emer_edad_gest: "",
  for_008_emer_ries_obst: "",
};

function calcularEdad(fechaNacimientoStr) {
  if (!fechaNacimientoStr) return "";
  const [year, month, day] = fechaNacimientoStr.split("-").map(Number);
  const fechaNacimiento = new Date(year, month - 1, day);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fechaNacimiento > hoy) {
    return "ERROR La fecha de nacimiento no puede ser mayor a la fecha actual";
  }

  let años = hoy.getFullYear() - fechaNacimiento.getFullYear();
  let meses = hoy.getMonth() - fechaNacimiento.getMonth();
  let dias = hoy.getDate() - fechaNacimiento.getDate();

  if (dias < 0) {
    meses--;
    dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
  }
  if (meses < 0) {
    años--;
    meses += 12;
  }

  let textoEdad = "";
  if (años > 0) textoEdad += años + (años === 1 ? " AÑO " : " AÑO/S ");
  if (meses > 0) textoEdad += meses + (meses === 1 ? " MES " : " MES/ES ");
  if (dias > 0) textoEdad += dias + (dias === 1 ? " DÍA" : " DÍA/S");
  if (!textoEdad) textoEdad = "0 DÍA/S";

  return textoEdad.trim();
}

function calcularEdadConFechaReferencia(
  fechaNacimientoStr,
  fechaReferenciaStr
) {
  if (!fechaNacimientoStr || !fechaReferenciaStr) return "";

  const [yearNac, monthNac, dayNac] = fechaNacimientoStr.split("-").map(Number);
  const fechaNacimiento = new Date(yearNac, monthNac - 1, dayNac);

  const [yearRef, monthRef, dayRef] = fechaReferenciaStr.split("-").map(Number);
  const fechaReferencia = new Date(yearRef, monthRef - 1, dayRef);

  if (fechaNacimiento > fechaReferencia) {
    return "ERROR: Fecha de nacimiento mayor a fecha de atención";
  }

  let años = fechaReferencia.getFullYear() - fechaNacimiento.getFullYear();
  let meses = fechaReferencia.getMonth() - fechaNacimiento.getMonth();
  let dias = fechaReferencia.getDate() - fechaNacimiento.getDate();

  if (dias < 0) {
    meses--;
    const ultimoDiaMes = new Date(
      fechaReferencia.getFullYear(),
      fechaReferencia.getMonth(),
      0
    ).getDate();
    dias += ultimoDiaMes;
  }

  if (meses < 0) {
    años--;
    meses += 12;
  }

  let textoEdad = "";
  if (años > 0) textoEdad += años + (años === 1 ? " AÑO " : " AÑO/S ");
  if (meses > 0) textoEdad += meses + (meses === 1 ? " MES " : " MES/ES ");
  if (dias > 0) textoEdad += dias + (dias === 1 ? " DÍA" : " DÍA/S");
  if (!textoEdad) textoEdad = "0 DÍA/S";

  return textoEdad.trim();
}

const Form008Emergencia = () => {
  const storedUserId = localStorage.getItem("userId") || 1;
  const [showAdmisionModal, setShowAdmisionModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalText, setConfirmModalText] = useState("");
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [edad, setEdad] = useState("");
  const fechaActual = new Date().toISOString().slice(0, 10);
  const fechaMinima = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const [refreshTable, setRefreshTable] = useState(0);
  const [isIndicacionesFocused, setIsIndicacionesFocused] = useState(false);
  const [unidadSaludList, setUnidadSaludList] = useState([]);
  const [medicosList, setMedicosList] = useState([]);
  const [admisionData, setAdmisionData] = useState(null);
  const [showUnidadModal, setShowUnidadModal] = useState(false);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [palabraActual, setPalabraActual] = useState("");
  const [posicionCursor, setPosicionCursor] = useState(0);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const navigate = useNavigate();

  const frasesMedicas = [
    "Paciente presenta",
    "Se observa",
    "Dolor abdominal agudo",
    "Traumatismo en",
    "Administración de medicamento",
    "Control de signos vitales",
    "Herida superficial en",
    "Requiere seguimiento en",
    "Fractura en",
    "Derivado a especialista",
    "En observación por",
    "Alta médica con indicaciones",
    "Curación y limpieza de herida",
    "Dolor abdominal de inicio súbito",
    "Fiebre de  días de evolución",
    "Dificultad respiratoria",
    "Pérdida de conocimiento",
    "Paciente politraumatizado por accidente de tránsito",
    "Convulsión tónico-clónica generalizada",
    "Dolor torácico irradiado al brazo izquierdo",
    "Herida cortante en miembro superior derecho",
    "Hipertensión arterial controlada con medicación",
    "Diabetes mellitus tipo  diagnosticada hace  años",
    "Sin antecedentes personales de importancia",
    "Alergia conocida a penicilina",
    "Paciente consciente, orientado en tiempo, espacio y persona",
    "TA: /80 mmHg, FC:  lpm, FR:  rpm, Temp:  °C",
    "Palidez cutánea, diaforesis",
    "Movilidad limitada por dolor",
    "Herida de  cm en región frontal con sangrado activo",
    "Traumatismo craneoencefálico leve",
    "Infección respiratoria aguda",
    "Gastroenteritis aguda",
    "Síndrome febril en estudio",
    "Probable apendicitis aguda",
    "Colocación de suero fisiológico al  % a  ml/hora",
    "Administración de Paracetamol  mg vía oral",
    "Sutura de herida bajo anestesia local",
    "Toma de muestra para laboratorio",
    "Canalización de vena periférica",
    "Paciente permanece estable hemodinámicamente",
    "Se solicita interconsulta con cirugía",
    "En observación por  horas sin complicaciones",
    "Paciente refiere mejoría del dolor",
    "Paciente atendido en área de emergencia",
    "Se registra ingreso a las : del día  //",
    "Acompañado por familiar de primer grado",
    "Documentación completa al momento del ingreso",
    "Paciente no porta identificación al momento de la atención",
    "Se activa protocolo de triage: prioridad ",
    "Paciente dado de alta en condiciones estables",
    "Referido a  de  nivel por complejidad del caso",
    "Paciente se retira por voluntad propia, se deja constancia",
    "Alta voluntaria con firma de consentimiento informado",
    "Traslado interno al área de hospitalización",
  ];

  const initialVariableEstado = {
    for_008_busc_pers_tipo_iden: false,
    for_008_busc_pers_nume_iden: false,
    for_008_emer_nomb_esta_salu: false,
    for_008_emer_fech_aten: true,
    for_008_emer_hora_aten: true,
    for_008_emer_edad_cond: true,
    for_008_emer_apel_comp: true,
    for_008_emer_nomb_comp: true,
    for_008_emer_sexo: true,
    for_008_emer_naci: true,
    for_008_emer_etni: true,
    for_008_emer_grup_prio: true,
    for_008_emer_tipo_segu: true,
    for_008_emer_prov_resi: true,
    for_008_emer_cant_resi: true,
    for_008_emer_parr_resi: true,
    for_008_emer_unid_salu_resp_segu_aten: true,
    for_008_emer_dire_domi: true,
    for_008_emer_tele_paci: true,
    for_008_emer_espe_prof: true,
    for_008_emer_cie_10_prin_diag: true,
    for_008_emer_cond_diag: true,
    for_008_emer_cie_10_caus_exte_diag: true,
    for_008_emer_hosp: true,
    for_008_emer_cond_alta: true,
    for_008_emer_obse: true,
    for_008_emer_apoy_aten_medi: true,
    for_008_emer_edad_gest: true,
    for_008_emer_ries_obst: true,
  };
  const initialBotonEstado = {
    btnBuscar: false,
  };

  const [variableEstado, setVariableEstado] = useState(initialVariableEstado);
  const [botonEstado, setBotonEstado] = useState(initialBotonEstado);

  const requiredFields = [];

  const labelMap = {
    for_008_busc_pers_tipo_iden: "TIPO DE IDENTIFICACIÓN:",
    for_008_busc_pers_nume_iden: "NÚMERO DE IDENTIFICACIÓN:",
    for_008_emer_nomb_esta_salu: "NOMBRE DEL ESTABLECIMIENTO DE SALUD:",
    for_008_emer_fech_aten: "FECHA DE ATENCIÓN:",
    for_008_emer_hora_aten: "HORA ATENCIÓN:",
    for_008_emer_edad_cond: "EDAD:",
    for_008_emer_apel_comp: "APELLIDOS:",
    for_008_emer_nomb_comp: "NOMBRES:",
    for_008_emer_sexo: "SEXO:",
    for_008_emer_naci: "NACIONALIDAD:",
    for_008_emer_etni: "ETNIA:",
    for_008_emer_grup_prio: "GRUPO PRIORITARIO:",
    for_008_emer_tipo_segu: "TIPO DE SEGURO:",
    for_008_emer_prov_resi: "PROVINCIA DE RESIDENCIA:",
    for_008_emer_cant_resi: "CANTON DE RESIDENCIA:",
    for_008_emer_parr_resi: "PARROQUIA DE RESIDENCIA:",
    for_008_emer_unid_salu_resp_segu_aten:
      "UNIDAD DE SALUD RESPONSABLE DE SEGUIMIENTO DE ATENCIÓN:",
    for_008_emer_dire_domi: "DIRECCIÓN DE DOMICILIO:",
    for_008_emer_tele_paci: "TELEFONO DE PACIENTE:",
    for_008_emer_espe_prof: "ESPECIALIDAD DEL PROFESIONAL:",
    for_008_emer_cie_10_prin_diag: "CIE-10 (PRINCIPAL):",
    for_008_emer_cond_diag: "CONDICIÓN DEL DIAGNÓSTICO:",
    for_008_emer_cie_10_caus_exte_diag: "CIE-10 (CAUSA EXTERNA):",
    for_008_emer_hosp: "HOSPITALIZACIÓN:",
    for_008_emer_cond_alta: "CONDICIÓN DEL ALTA:",
    for_008_emer_obse: "OBSERVACIÓN:",
    for_008_emer_apoy_aten_medi: "APOYO EN LA ATENCION MEDICA:",
    for_008_emer_edad_gest: "EDAD GESTACIONAL:",
    for_008_emer_ries_obst: "RIESGO OBSTETRICO:",
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

    if (!tipoId || !numIden) {
      setError("Debe seleccionar el tipo y número de identificación.");
      setTimeout(() => setError(""), 5000);
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
      const response = await buscarUsuarioAdmision(tipoId, numIden);
      if (!response)
        throw new Error("No se pudo obtener una respuesta de la API.");
      if (parseInt(response.data.adm_dato_paci_falt_dato) === 0) {
        if (
          response.message.toLowerCase().includes("usuario está registrado") ||
          response.message.toLowerCase().includes("registrado en admision") ||
          response.message.toLowerCase().includes("no se pudo obtener")
        ) {
          setConfirmModalText(
            "¿El paciente le falta actualizar la información en el sistema?"
          );
          setAdmisionData(response.data);
          setShowConfirmModal(true);
        }
      } else {
        actualizarFormDataConRespuesta(response.data);
        ajustarVariableEstadoExitoso();
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
      if (
        errorMessage.toLowerCase().includes("no se encontró") ||
        errorMessage.toLowerCase().includes("no existe") ||
        errorMessage.toLowerCase().includes("no se pudo obtener")
      ) {
        setConfirmModalText(
          "¿El paciente tiene que ser admisionado al sistema?"
        );
        setShowConfirmModal(true);
      }
    }
  };

  const actualizarFormDataConRespuesta = (data) => {
    setFormData((prevData) => ({
      ...prevData,
      id_adm: data.id_adm || data.id || "",
      adm_dato_naci_fech_naci: data.adm_dato_naci_fech_naci || "",
      for_008_emer_edad_cond: calcularEdad(data.adm_dato_naci_fech_naci),
      // Combina apellidos
      for_008_emer_apel_comp: [
        data.adm_dato_pers_apel_prim || "",
        data.adm_dato_pers_apel_segu || "",
      ]
        .filter(Boolean)
        .join(" "),
      for_008_emer_nomb_comp: [
        data.adm_dato_pers_nomb_prim || "",
        data.adm_dato_pers_nomb_segu || "",
      ]
        .filter(Boolean)
        .join(" "),
      for_008_emer_sexo: data.adm_dato_pers_sexo || "",
      for_008_emer_tele_paci: [
        data.adm_dato_pers_tele || "",
        data.adm_dato_pers_celu || "",
      ]
        .filter(Boolean)
        .join(" / "),
      for_008_emer_naci: data.adm_dato_naci_naci || "",
      for_008_emer_prov_resi: data.adm_dato_resi_prov || "",
      for_008_emer_cant_resi: data.adm_dato_resi_cant || "",
      for_008_emer_parr_resi: data.adm_dato_resi_parr || "",
      for_008_emer_unid_salu_resp_segu_aten:
        data.adm_dato_resi_esta_adsc_terr || "",
      for_008_emer_dire_domi: [
        data.adm_dato_resi_barr_sect
          ? `Barrio: ${data.adm_dato_resi_barr_sect}`
          : "",
        data.adm_dato_resi_call_prin
          ? `Calle prin.: ${data.adm_dato_resi_call_prin}`
          : "",
        data.adm_dato_resi_call_secu
          ? `Calle sec.: ${data.adm_dato_resi_call_secu}`
          : "",
        data.adm_dato_resi_refe_resi
          ? `Referencia: ${data.adm_dato_resi_refe_resi}`
          : "",
      ]
        .filter(Boolean)
        .join(" / "),
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
      for_008_emer_nomb_esta_salu: true,
      for_008_emer_fech_aten: false,
      for_008_emer_hora_aten: false,
      for_008_emer_edad_cond: true,
      for_008_emer_apel_comp: true,
      for_008_emer_nomb_comp: true,
      for_008_emer_sexo: true,
      for_008_emer_naci: true,
      for_008_emer_etni: true,
      for_008_emer_grup_prio: true,
      for_008_emer_tipo_segu: true,
      for_008_emer_prov_resi: true,
      for_008_emer_cant_resi: true,
      for_008_emer_parr_resi: true,
      for_008_emer_unid_salu_resp_segu_aten: true,
      for_008_emer_dire_domi: true,
      for_008_emer_tele_paci: true,
      for_008_emer_espe_prof: false,
      for_008_emer_cie_10_prin_diag: false,
      for_008_emer_cond_diag: false,
      for_008_emer_cie_10_caus_exte_diag: false,
      for_008_emer_hosp: false,
      for_008_emer_cond_alta: false,
      for_008_emer_obse: false,
      for_008_emer_apoy_aten_medi: false,
      for_008_emer_edad_gest: false,
      for_008_emer_ries_obst: false,
    }));
    setBotonEstado((prevState) => ({
      btnBuscar: true,
    }));
  };

  const ajustarVariableEstadoFalso = () => {
    setVariableEstado((prevState) => ({
      ...prevState,
      for_008_busc_pers_nume_iden: true,
      for_008_busc_pers_tipo_iden: true,
      for_008_emer_nomb_esta_salu: true,
      for_008_emer_fech_aten: false,
      for_008_emer_hora_aten: false,
      for_008_emer_edad_cond: true,
      for_008_emer_apel_comp: true,
      for_008_emer_nomb_comp: true,
      for_008_emer_sexo: true,
      for_008_emer_naci: true,
      for_008_emer_etni: true,
      for_008_emer_grup_prio: true,
      for_008_emer_tipo_segu: true,
      for_008_emer_prov_resi: true,
      for_008_emer_cant_resi: true,
      for_008_emer_parr_resi: true,
      for_008_emer_unid_salu_resp_segu_aten: true,
      for_008_emer_dire_domi: true,
      for_008_emer_tele_paci: true,
      for_008_emer_espe_prof: false,
      for_008_emer_cie_10_prin_diag: false,
      for_008_emer_cond_diag: false,
      for_008_emer_cie_10_caus_exte_diag: false,
      for_008_emer_hosp: false,
      for_008_emer_cond_alta: false,
      for_008_emer_obse: false,
      for_008_emer_apoy_aten_medi: false,
      for_008_emer_edad_gest: false,
      for_008_emer_ries_obst: false,
    }));
    setBotonEstado((prevState) => ({
      btnBuscar: true,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const actualizarFechaNacimiento = (val, name) => {
      if (name === "for_008_emer_fech_aten") {
        // Validar la fecha
        if (value < fechaMinima || value > fechaActual) {
          setError(`La fecha debe estar entre ${fechaMinima} y ${fechaActual}`);
          setTimeout(() => setError(""), 5000);
          return;
        }
        // Si tenemos fecha de nacimiento guardada, recalcular la edad
        if (formData.adm_dato_naci_fech_naci) {
          formData.for_008_emer_edad_cond = calcularEdadConFechaReferencia(
            formData.adm_dato_naci_fech_naci,
            value
          );
        }
        // Actualizar el estado una sola vez
        setFormData((prev) => ({ ...prev, for_008_emer_fech_aten: val }));
      }
      validarDato(
        { target: { name, value: val } },
        { ...formData, [name]: val },
        setFormData,
        error,
        setError,
        setBotonEstado
      );
    };

    switch (name) {
      case "for_008_emer_fech_aten":
        actualizarFechaNacimiento(value, name);
        break;
      case "for_008_emer_cie_10_prin_diag": {
        // Verificar si el nuevo diagnóstico comienza con S o T
        const diagSeleccionado = opcionesCIE10Permitidas.find(
          (op) => op.value === value
        );
        const codigo = diagSeleccionado
          ? diagSeleccionado.label.split(" ")[0]
          : "";
        const empiezaConSoT = codigo.startsWith("S") || codigo.startsWith("T");

        // Si no comienza con S o T y hay un valor en causa externa, limpiar causa externa
        if (
          !empiezaConSoT &&
          formData["for_008_emer_cie_10_caus_exte_diag"] !== ""
        ) {
          setFormData((prev) => ({
            ...prev,
            [name]: value,
            for_008_emer_cie_10_caus_exte_diag: "",
          }));
        } else {
          // Solo actualizar el diagnóstico principal
          setFormData((prev) => ({ ...prev, [name]: value }));
        }

        // validarDato(
        //   e,
        //   { ...formData, [name]: value },
        //   setFormData,
        //   error,
        //   setError,
        //   setBotonEstado
        // );
        break;
      }
      default:
        setFormData((prev) => ({ ...prev, [name]: value }));
        validarDato(
          e,
          { ...formData, [name]: value },
          setFormData,
          error,
          setError,
          setBotonEstado
        );
        break;
    }
  };

  const handleObservacionesChange = (e) => {
    const { value, selectionStart } = e.target;
    const { name } = e.target;

    // Actualiza el formData como lo haces normalmente
    setFormData((prev) => ({ ...prev, [name]: value }));

    validarDato(
      e,
      { ...formData, [name]: value },
      setFormData,
      error,
      setError,
      setBotonEstado
    );

    // Obtiene la palabra actual donde está el cursor
    const textoPrevio = value.substring(0, selectionStart);
    const palabras = textoPrevio.split(/\s+/);
    const palabraActual = palabras[palabras.length - 1];

    // Si la palabra tiene al menos 3 caracteres, buscar sugerencias
    if (palabraActual && palabraActual.length >= 3) {
      const coincidencias = frasesMedicas.filter((frase) =>
        frase.toLowerCase().startsWith(palabraActual.toLowerCase())
      );

      setSugerencias(coincidencias);
      setPalabraActual(palabraActual);
      setPosicionCursor(selectionStart);
      setMostrarSugerencias(coincidencias.length > 0);
    } else {
      setMostrarSugerencias(false);
    }
  };

  // Modificar la función insertarSugerencia para resaltar el texto insertado
  const insertarSugerencia = (sugerencia) => {
    const textoActual = formData["for_008_emer_obse"];
    // Encuentra el inicio de la palabra actual antes del cursor
    const inicioPalabra = textoActual
      .substring(0, posicionCursor)
      .lastIndexOf(palabraActual);
    const textoAntes = textoActual.substring(0, inicioPalabra);
    const textoDespues = textoActual.substring(posicionCursor);

    // Reemplaza la palabra actual con la sugerencia
    const nuevoTexto = textoAntes + sugerencia + " " + textoDespues;

    setFormData((prev) => ({ ...prev, for_008_emer_obse: nuevoTexto }));
    setMostrarSugerencias(false);

    // Selecciona la frase insertada para edición inmediata
    setTimeout(() => {
      const textarea = document.getElementById("for_008_emer_obse");
      if (textarea) {
        textarea.focus();
        const inicioSeleccion = textoAntes.length;
        const finSeleccion = textoAntes.length + sugerencia.length;
        textarea.setSelectionRange(inicioSeleccion, finSeleccion);
      }
    }, 10);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    const formDataConUsuario = { ...formData, eniUser: storedUserId };

    try {
      let response;
      if (isEditing) {
        response = await updateForm008Emer(formDataConUsuario);
        const message = response?.message || "Registro actualizado con éxito!";
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(""), 10000);
        toast.success(message, { position: "bottom-right" });
        limpiarVariables(true);
      } else {
        const response = await registerForm008Emer(formDataConUsuario);
        const message = response?.message || "Registro guardado con éxito!";
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(""), 10000);
        toast.success(message, { position: "bottom-right" });
        limpiarVariables(true);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      toast.error(errorMessage, { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitBuscar = (e) => {
    e.preventDefault();
    setSuccess("Formulario enviado correctamente");
    setError("");
  };

  const handleButtonClick = (e) => {
    if (botonEstado.btnRegistrar) {
      e.preventDefault();
      toast.error("Todos los campos con * en rojo tienen que estar llenos!", {
        position: "bottom-right",
      });
    }
  };

  const limpiarVariables = (esBtnLimpiar = false) => {
    setFormData(initialState);
    if (esBtnLimpiar) {
      setTimeout(() => setSuccessMessage(""), 5000);
      setTimeout(() => setError(""), 5000);
    } else {
      setSuccessMessage("");
      setError("");
    }
    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
    setFechaNacimiento("");
    setEdad("");
    setIsEditing(false);
    //setActiveTab("personales");
  };

  useEffect(() => {
    const now = new Date();
    const horaActual =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");
    const fechaActual = now.toISOString().slice(0, 10); // formato YYYY-MM-DD
    setFormData((prev) => ({
      ...prev,
      for_008_emer_hora_aten: horaActual,
      for_008_emer_fech_aten: fechaActual,
    }));
  }, []);

  useEffect(() => {
    const loadMedicosList = async () => {
      try {
        const medicosData = await getAllEniUsers();
        // Formatear los datos para el Select
        const formattedMedicos = medicosData.map((medico) => ({
          value: medico.id.toString(),
          label: `${medico.username} ${medico.last_name} ${medico.first_name}`,
        }));
        setMedicosList(formattedMedicos);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
        setTimeout(() => setError(""), 10000);
        setSuccessMessage("");
      }
    };

    loadMedicosList();
  }, []);

  useEffect(() => {
    let id_eni_user = 1;
    const loadUnidadSaludList = async () => {
      try {
        const unidadSaludData = await buscarUsuarioIdUnidadSalud(id_eni_user);

        let lista = [];
        if (Array.isArray(unidadSaludData?.data?.unidades_data)) {
          lista = unidadSaludData.data.unidades_data;
        } else {
          setUnidadSaludList([]);
          setError(
            "No se pudo cargar la lista de unidades de salud (respuesta inesperada)"
          );
          return;
        }

        // Formatear para el select
        const formattedUnidadSalud = lista.map((unidad) => ({
          value: unidad.id.toString(),
          label: `${unidad.uni_unic} - ${unidad.uni_unid}`,
        }));
        setUnidadSaludList(formattedUnidadSalud);

        // Seleccionar automáticamente la unidad principal
        const principal = lista.find((unidad) => unidad.uni_unid_prin === 1);
        if (principal) {
          setFormData((prev) => ({
            ...prev,
            for_008_emer_nomb_esta_salu: principal.id.toString(),
          }));
        }
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
        setTimeout(() => setError(""), 10000);
        setSuccessMessage("");
      }
    };

    loadUnidadSaludList();
  }, []);

  const opcionesCIE10Permitidas = allListForm008.for_008_emer_cie_10_prin_diag;

  const codigoCIE10Seleccionado = (() => {
    const selected = opcionesCIE10Permitidas.find(
      (op) => op.value === formData["for_008_emer_cie_10_prin_diag"]
    );
    return selected ? selected.label.split(" ")[0] : "";
  })();

  const esDiagnosticoNoValido =
    codigoCIE10Seleccionado && codigoCIE10Seleccionado.length === 3;

  const opcionesCIE10PermitidasExterno =
    allListForm008.for_008_emer_cie_10_caus_exte_diag;

  const codigoCIE10SeleccionadoExterno = (() => {
    const selected = opcionesCIE10PermitidasExterno.find(
      (op) => op.value === formData["for_008_emer_cie_10_caus_exte_diag"]
    );
    return selected ? selected.label.split(" ")[0] : "";
  })();

  const esDiagnosticoNoValidoExterno =
    codigoCIE10SeleccionadoExterno &&
    codigoCIE10SeleccionadoExterno.length === 3;

  // Verificar si el diagnóstico comienza con S o T para habilitar causa externa
  const habilitarCausaExterna =
    codigoCIE10Seleccionado &&
    (codigoCIE10Seleccionado.startsWith("S") ||
      codigoCIE10Seleccionado.startsWith("T"));

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
    <div className="w-auto h-auto flex items-stretch justify-stretch bg-gray-100">
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
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold mb-4 text-blue-700">
                {confirmModalText}
              </h3>
              <div className="flex justify-end gap-2">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setShowAdmisionModal(true);
                  }}
                >
                  Sí, registrar
                </button>
                <button
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => setShowConfirmModal(false)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
        {showAdmisionModal && admisionData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50">
            <div className="relative w-full max-w-7xl mx-auto mt-8 rounded-lg shadow-lg overflow-y-auto max-h-screen">
              <button
                className="absolute top-4 right-4 text-red-500 font-bold text-2xl z-10"
                onClick={() => {
                  setShowAdmisionModal(false);
                  setAdmisionData(null);
                }}
              >
                X
              </button>
              <Admision
                id_admision={admisionData.id_adm}
                tipoIdenInicial={formData.for_008_busc_pers_tipo_iden}
                numeIdenInicial={formData.for_008_busc_pers_nume_iden}
                pers_apellidos={[
                  admisionData.adm_dato_pers_apel_prim,
                  admisionData.adm_dato_pers_apel_segu,
                ]
                  .filter(Boolean)
                  .join(" ")}
                pers_nombres={[
                  admisionData.adm_dato_pers_nomb_prim,
                  admisionData.adm_dato_pers_nomb_segu,
                ]
                  .filter(Boolean)
                  .join(" ")}
                pers_sexo={admisionData.adm_dato_pers_sexo}
                pers_correo={admisionData.adm_dato_pers_corr_elec}
                ejecutarAjustarAdmision={true}
                btnActualizar={true}
                onClose={() => {
                  setShowAdmisionModal(false);
                  setAdmisionData(null); // Limpia la información al terminar
                }}
              />
            </div>
          </div>
        )}
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
                <CustomSelect
                  id="for_008_emer_nomb_esta_salu"
                  name="for_008_emer_nomb_esta_salu"
                  value={formData["for_008_emer_nomb_esta_salu"]}
                  onChange={(e) => {
                    // Si el valor es diferente al actual, mostrar modal
                    if (
                      e.target.value !== formData["for_008_emer_nomb_esta_salu"]
                    ) {
                      setUnidadSeleccionada(e.target.value);
                      setShowUnidadModal(true);
                    }
                  }}
                  options={unidadSaludList}
                  disabled={variableEstado["for_008_emer_nomb_esta_salu"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "for_008_emer_nomb_esta_salu",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                  placeholder="Escriba para buscar Unidad de Salud..."
                  isClearable={false}
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
                  min={fechaMinima}
                  max={fechaActual}
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
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="for_008_emer_hora_aten">
                  {requiredFields.includes("for_008_emer_hora_aten") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_hora_aten"]}
                </label>
                <input
                  type="time"
                  id="for_008_emer_hora_aten"
                  name="for_008_emer_hora_aten"
                  value={formData["for_008_emer_hora_aten"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle} ${
                    isFieldInvalid(
                      "for_008_emer_hora_aten",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  } ${
                    variableEstado["for_008_emer_hora_aten"]
                      ? "bg-gray-200 text-gray-700 cursor-no-drop"
                      : "bg-white text-gray-700 cursor-pointer"
                  }`}
                  disabled={variableEstado["for_008_emer_hora_aten"]}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="for_008_emer_edad_cond">
                  {requiredFields.includes("for_008_emer_edad_cond") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_edad_cond"]}
                </label>
                <input
                  type="text"
                  id="for_008_emer_edad_cond"
                  name="for_008_emer_edad_cond"
                  value={formData["for_008_emer_edad_cond"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle} ${
                    isFieldInvalid(
                      "for_008_emer_edad_cond",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  } ${
                    variableEstado["for_008_emer_edad_cond"]
                      ? "bg-gray-200 text-gray-700 cursor-no-drop"
                      : "bg-white text-gray-700 cursor-pointer"
                  }`}
                  disabled={variableEstado["for_008_emer_edad_cond"]}
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
                <label className={labelClass} htmlFor="for_008_emer_prov_resi">
                  {requiredFields.includes("for_008_emer_prov_resi") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_prov_resi"]}
                </label>
                <input
                  type="text"
                  id="for_008_emer_prov_resi"
                  name="for_008_emer_prov_resi"
                  value={formData["for_008_emer_prov_resi"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle} ${
                    isFieldInvalid(
                      "for_008_emer_prov_resi",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  } ${
                    variableEstado["for_008_emer_prov_resi"]
                      ? "bg-gray-200 text-gray-700 cursor-no-drop"
                      : "bg-white text-gray-700 cursor-pointer"
                  }`}
                  disabled={variableEstado["for_008_emer_prov_resi"]}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="for_008_emer_cant_resi">
                  {requiredFields.includes("for_008_emer_cant_resi") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_cant_resi"]}
                </label>
                <input
                  type="text"
                  id="for_008_emer_cant_resi"
                  name="for_008_emer_cant_resi"
                  value={formData["for_008_emer_cant_resi"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle} ${
                    isFieldInvalid(
                      "for_008_emer_cant_resi",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  } ${
                    variableEstado["for_008_emer_cant_resi"]
                      ? "bg-gray-200 text-gray-700 cursor-no-drop"
                      : "bg-white text-gray-700 cursor-pointer"
                  }`}
                  disabled={variableEstado["for_008_emer_cant_resi"]}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="for_008_emer_parr_resi">
                  {requiredFields.includes("for_008_emer_parr_resi") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_parr_resi"]}
                </label>
                <input
                  type="text"
                  id="for_008_emer_parr_resi"
                  name="for_008_emer_parr_resi"
                  value={formData["for_008_emer_parr_resi"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle} ${
                    isFieldInvalid(
                      "for_008_emer_parr_resi",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  } ${
                    variableEstado["for_008_emer_parr_resi"]
                      ? "bg-gray-200 text-gray-700 cursor-no-drop"
                      : "bg-white text-gray-700 cursor-pointer"
                  }`}
                  disabled={variableEstado["for_008_emer_parr_resi"]}
                />
              </div>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="for_008_emer_unid_salu_resp_segu_aten"
                >
                  {requiredFields.includes(
                    "for_008_emer_unid_salu_resp_segu_aten"
                  ) && <span className="text-red-500">* </span>}
                  {labelMap["for_008_emer_unid_salu_resp_segu_aten"]}
                </label>
                <input
                  type="text"
                  id="for_008_emer_unid_salu_resp_segu_aten"
                  name="for_008_emer_unid_salu_resp_segu_aten"
                  value={formData["for_008_emer_unid_salu_resp_segu_aten"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle} ${
                    isFieldInvalid(
                      "for_008_emer_unid_salu_resp_segu_aten",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  } ${
                    variableEstado["for_008_emer_unid_salu_resp_segu_aten"]
                      ? "bg-gray-200 text-gray-700 cursor-no-drop"
                      : "bg-white text-gray-700 cursor-pointer"
                  }`}
                  disabled={
                    variableEstado["for_008_emer_unid_salu_resp_segu_aten"]
                  }
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="for_008_emer_dire_domi">
                  {requiredFields.includes("for_008_emer_dire_domi") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_dire_domi"]}
                </label>
                <input
                  type="text"
                  id="for_008_emer_dire_domi"
                  name="for_008_emer_dire_domi"
                  value={formData["for_008_emer_dire_domi"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle} ${
                    isFieldInvalid(
                      "for_008_emer_dire_domi",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  } ${
                    variableEstado["for_008_emer_dire_domi"]
                      ? "bg-gray-200 text-gray-700 cursor-no-drop"
                      : "bg-white text-gray-700 cursor-pointer"
                  }`}
                  disabled={variableEstado["for_008_emer_dire_domi"]}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="for_008_emer_tele_paci">
                  {requiredFields.includes("for_008_emer_tele_paci") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_tele_paci"]}
                </label>
                <input
                  type="text"
                  id="for_008_emer_tele_paci"
                  name="for_008_emer_tele_paci"
                  value={formData["for_008_emer_tele_paci"]}
                  onChange={handleChange}
                  placeholder="Información es requerida"
                  required
                  className={`${inputStyle} ${
                    isFieldInvalid(
                      "for_008_emer_tele_paci",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  } ${
                    variableEstado["for_008_emer_tele_paci"]
                      ? "bg-gray-200 text-gray-700 cursor-no-drop"
                      : "bg-white text-gray-700 cursor-pointer"
                  }`}
                  disabled={variableEstado["for_008_emer_tele_paci"]}
                />
              </div>
            </div>
          </fieldset>
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Datos de Registro de Atencion de Emergencia
            </legend>
            <div className="bg-blue-50 border-l-4 border-blue-500 text-black p-2 mb-2 text-sm">
              <strong>Atención:</strong> Solo se registrarán diagnósticos que
              incluyan el código CIE-10 con cuatro caracteres (por ejemplo:
              I100), seguido de su respectiva descripción. Esta estructura es
              obligatoria para garantizar uniformidad en el registro clínico.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="for_008_emer_espe_prof">
                  {requiredFields.includes("for_008_emer_espe_prof") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_espe_prof"]}
                </label>
                <CustomSelect
                  id="for_008_emer_espe_prof"
                  name="for_008_emer_espe_prof"
                  value={formData["for_008_emer_espe_prof"]}
                  onChange={handleChange}
                  options={allListForm008.for_008_emer_espe_prof}
                  disabled={variableEstado["for_008_emer_espe_prof"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "for_008_emer_espe_prof",
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
                  htmlFor="for_008_emer_cie_10_prin_diag"
                >
                  {requiredFields.includes("for_008_emer_cie_10_prin_diag") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_cie_10_prin_diag"]}
                </label>
                <CustomSelect
                  id="for_008_emer_cie_10_prin_diag"
                  name="for_008_emer_cie_10_prin_diag"
                  value={formData["for_008_emer_cie_10_prin_diag"]}
                  onChange={handleChange}
                  options={opcionesCIE10Permitidas}
                  disabled={variableEstado["for_008_emer_cie_10_prin_diag"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "for_008_emer_cie_10_prin_diag",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                  isLargeList={true} // Activar el modo lista grande
                  placeholder="Escriba para buscar diagnóstico CIE-10..."
                  minSearchLength={2}
                  maxResults={100}
                />
                {esDiagnosticoNoValido && (
                  <span className="text-red-600 text-sm mt-1">
                    El diagnóstico seleccionado no es válido. Seleccione un
                    código CIE-10 más específico.
                  </span>
                )}
                {!!habilitarCausaExterna &&
                  formData["for_008_emer_cie_10_prin_diag"] && (
                    <span className="text-blue-600 text-sm mt-1">
                      Se tiene que registrar la causa externa para diagnósticos
                      que comiencen con S o T.
                    </span>
                  )}
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="for_008_emer_cond_diag">
                  {requiredFields.includes("for_008_emer_cond_diag") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_cond_diag"]}
                </label>
                <CustomSelect
                  id="for_008_emer_cond_diag"
                  name="for_008_emer_cond_diag"
                  value={formData["for_008_emer_cond_diag"]}
                  onChange={handleChange}
                  options={allListForm008.for_008_emer_cond_diag}
                  disabled={variableEstado["for_008_emer_cond_diag"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "for_008_emer_cond_diag",
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
                  htmlFor="for_008_emer_cie_10_caus_exte_diag"
                >
                  {requiredFields.includes(
                    "for_008_emer_cie_10_caus_exte_diag"
                  ) && <span className="text-red-500">* </span>}
                  {labelMap["for_008_emer_cie_10_caus_exte_diag"]}
                </label>
                <CustomSelect
                  id="for_008_emer_cie_10_caus_exte_diag"
                  name="for_008_emer_cie_10_caus_exte_diag"
                  value={formData["for_008_emer_cie_10_caus_exte_diag"]}
                  onChange={handleChange}
                  options={opcionesCIE10PermitidasExterno}
                  disabled={
                    variableEstado["for_008_emer_cie_10_caus_exte_diag"] ||
                    !habilitarCausaExterna
                  }
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "for_008_emer_cie_10_caus_exte_diag",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                  isLargeList={true}
                  placeholder={
                    habilitarCausaExterna
                      ? "Escriba para buscar diagnóstico CIE-10..."
                      : "Solo disponible para diagnósticos S y T"
                  }
                  minSearchLength={2}
                  maxResults={100}
                />
                {esDiagnosticoNoValidoExterno && (
                  <span className="text-red-600 text-sm mt-1">
                    El diagnóstico seleccionado no es válido. Seleccione un
                    código CIE-10 más específico.
                  </span>
                )}
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="for_008_emer_hosp">
                  {requiredFields.includes("for_008_emer_hosp") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_hosp"]}
                </label>
                <CustomSelect
                  id="for_008_emer_hosp"
                  name="for_008_emer_hosp"
                  value={formData["for_008_emer_hosp"]}
                  onChange={handleChange}
                  options={allListForm008.for_008_emer_hosp}
                  disabled={variableEstado["for_008_emer_hosp"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "for_008_emer_hosp",
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
                <label className={labelClass} htmlFor="for_008_emer_cond_alta">
                  {requiredFields.includes("for_008_emer_cond_alta") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_cond_alta"]}
                </label>
                <CustomSelect
                  id="for_008_emer_cond_alta"
                  name="for_008_emer_cond_alta"
                  value={formData["for_008_emer_cond_alta"]}
                  onChange={handleChange}
                  options={allListForm008.for_008_emer_cond_alta}
                  disabled={variableEstado["for_008_emer_cond_alta"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "for_008_emer_cond_alta",
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
                <label className={labelClass} htmlFor="for_008_emer_obse">
                  {requiredFields.includes("for_008_emer_obse") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_obse"]}
                </label>
                <textarea
                  id="for_008_emer_obse"
                  name="for_008_emer_obse"
                  value={formData["for_008_emer_obse"]}
                  onChange={handleObservacionesChange}
                  placeholder="Máximo 350 caracteres"
                  maxLength={350}
                  onFocus={() => setIsIndicacionesFocused(true)}
                  onBlur={() => {
                    setIsIndicacionesFocused(false);
                    // Pequeño delay para permitir clics en las sugerencias
                    setTimeout(() => setMostrarSugerencias(false), 200);
                  }}
                  className={`
                    ${inputStyle}
                    resize-none
                    transition-all duration-300
                    ${
                      isFieldInvalid(
                        "for_008_emer_obse",
                        requiredFields,
                        formData,
                        isFieldVisible
                      )
                        ? "border-2 border-red-500"
                        : ""
                    }
                    ${
                      variableEstado["for_008_emer_obse"]
                        ? "bg-gray-200 text-gray-700 cursor-no-drop"
                        : "bg-white text-gray-700 cursor-pointer"
                    }
                    ${isIndicacionesFocused ? "h-24 text-lg" : "h-10"}
                  `}
                  disabled={variableEstado["for_008_emer_obse"]}
                />
                <span className="text-xs text-gray-500">
                  Máximo 350 caracteres
                </span>
                {mostrarSugerencias && (
                  <div className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto w-100">
                    {sugerencias.map((sugerencia, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                        onClick={() => insertarSugerencia(sugerencia)}
                        aria-label={`Insertar sugerencia: ${sugerencia}`}
                      >
                        {sugerencia}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </fieldset>
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Datos de Medico que ayudo en la Atencion
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="for_008_emer_apoy_aten_medi"
                >
                  {requiredFields.includes("for_008_emer_apoy_aten_medi") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_apoy_aten_medi"]}
                </label>
                <CustomSelect
                  id="for_008_emer_apoy_aten_medi"
                  name="for_008_emer_apoy_aten_medi"
                  value={formData["for_008_emer_apoy_aten_medi"]}
                  onChange={handleChange}
                  options={medicosList}
                  disabled={variableEstado["for_008_emer_apoy_aten_medi"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "for_008_emer_apoy_aten_medi",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                  isLargeList={true}
                  placeholder="Escriba para buscar Medico..."
                  minSearchLength={2}
                  maxResults={100}
                />
              </div>
            </div>
          </fieldset>
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Datos de atencion obstetrica
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="for_008_emer_edad_gest">
                  {requiredFields.includes("for_008_emer_edad_gest") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_edad_gest"]}
                </label>
                <input
                  type="text"
                  id="for_008_emer_edad_gest"
                  name="for_008_emer_edad_gest"
                  value={formData["for_008_emer_edad_gest"]}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permitir vacío para borrar
                    if (value === "") {
                      handleChange(e);
                      return;
                    }
                    // Permitir solo semanas 1-60 y días 1-6, formato paso a paso
                    const partialRegex = /^([1-9]|[1-5][0-9]|60)?(.([1-6])?)?$/;
                    if (partialRegex.test(value)) {
                      handleChange(e);
                    }
                  }}
                  placeholder="Ej: 8.6 (8 semanas. 6 días)"
                  className={`${inputStyle} ${
                    isFieldInvalid(
                      "for_008_emer_edad_gest",
                      requiredFields,
                      formData,
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  } ${
                    variableEstado["for_008_emer_edad_gest"]
                      ? "bg-gray-200 text-gray-700 cursor-no-drop"
                      : "bg-white text-gray-700 cursor-pointer"
                  }`}
                  disabled={variableEstado["for_008_emer_edad_gest"]}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="for_008_emer_ries_obst">
                  {requiredFields.includes("for_008_emer_ries_obst") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["for_008_emer_ries_obst"]}
                </label>
                <CustomSelect
                  id="for_008_emer_ries_obst"
                  name="for_008_emer_ries_obst"
                  value={formData["for_008_emer_ries_obst"]}
                  onChange={handleChange}
                  options={allListForm008.for_008_emer_ries_obst}
                  disabled={variableEstado["for_008_emer_ries_obst"]}
                  variableEstado={variableEstado}
                  className={
                    isFieldInvalid(
                      "for_008_emer_ries_obst",
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
              {buttonTextRegistro}
            </button>
            {/* BOTON LIMPIAR */}
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
              onClick={() => navigate("/")}
            >
              Cancelar
            </button>
          </div>
        </form>
        <EstadoMensajes error={error} successMessage={successMessage} />
        {showUnidadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold mb-4 text-blue-700">
                ¿Desea establecer esta unidad de salud como principal?
              </h3>
              <div className="flex justify-end gap-2">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  onClick={async () => {
                    try {
                      await updateUnidadSaludPrincipal({
                        id_unid_salu: unidadSeleccionada,
                      });
                      setFormData((prev) => ({
                        ...prev,
                        id_unid_salu: unidadSeleccionada,
                        for_008_emer_nomb_esta_salu: unidadSeleccionada,
                      }));
                      setSuccessMessage(
                        "Unidad principal actualizada correctamente."
                      );
                    } catch (error) {
                      setError("No se pudo actualizar la unidad principal.");
                    }
                    setShowUnidadModal(false);
                  }}
                >
                  Sí, cambiar
                </button>
                <button
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => setShowUnidadModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        <TablaForm008Emer
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

export default Form008Emergencia;
