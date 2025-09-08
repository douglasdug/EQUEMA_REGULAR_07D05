import React, { useState, useEffect } from "react";
import Admision from "./Admision.jsx";
import {
  listarUsuariosApoyoAtencion,
  listarAtencionesPaciente,
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
import BuscarAdmisionados from "../components/BuscarAdmisionados.jsx";
import Loader from "../components/Loader.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const initialState = {
  id_eniUser: null,
  id_admision_datos: null,
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
  for_008_emer_cie_10_prin_diag: [""],
  for_008_emer_cond_diag: [""],
  for_008_emer_cie_10_caus_exte_diag: [""],
  for_008_emer_hosp: "",
  for_008_emer_cond_alta: "",
  for_008_emer_obse: "",
  for_008_emer_apoy_aten_medi: "",
  for_008_emer_edad_gest: "",
  for_008_emer_ries_obst: "",
  for_008_hist_aten: "",
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
  const [showAdmisionModal, setShowAdmisionModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalText, setConfirmModalText] = useState("");
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isBuscar, setIsBuscar] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [edad, setEdad] = useState("");
  const fechaHoraSistema = new Date();
  const formatoFecha = new Intl.DateTimeFormat("es-EC", {
    timeZone: "America/Guayaquil",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const fechaActual = formatoFecha.format(fechaHoraSistema);
  const fechaMinima = formatoFecha.format(
    fechaHoraSistema - 7 * 24 * 60 * 60 * 1000
  ); // 7 días * 24 horas * 60 minutos * 60 segundos * 1000 milisegundos
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
  const [atencionesPrevias, setAtencionesPrevias] = useState([]);
  const [isHistorialExpandido, setIsHistorialExpandido] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(true);
  const [admisionInit, setAdmisionInit] = useState({
    tipoIdenInicial: "",
    numeIdenInicial: "",
  });
  const [showBusquedaAvanzada, setShowBusquedaAvanzada] = useState(false);
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
    for_008_busc_pers_nume_iden: true,
    for_008_emer_nomb_esta_salu: true,
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
    for_008_hist_aten: true,
  };
  const initialBotonEstado = {
    btnBuscar: true,
    btnRegistrar: true,
  };

  const [variableEstado, setVariableEstado] = useState(initialVariableEstado);
  const [botonEstado, setBotonEstado] = useState(initialBotonEstado);

  const requiredFields = [
    "for_008_busc_pers_tipo_iden",
    "for_008_busc_pers_nume_iden",
    "for_008_emer_nomb_esta_salu",
    "for_008_emer_fech_aten",
    "for_008_emer_hora_aten",
    "for_008_emer_apel_comp",
    "for_008_emer_nomb_comp",
    "for_008_emer_sexo",
    "for_008_emer_naci",
    "for_008_emer_etni",
    "for_008_emer_grup_prio",
    "for_008_emer_tipo_segu",
    "for_008_emer_prov_resi",
    "for_008_emer_cant_resi",
    "for_008_emer_parr_resi",
    "for_008_emer_espe_prof",
    "for_008_emer_cie_10_prin_diag",
    "for_008_emer_cond_diag",
    "for_008_emer_cie_10_caus_exte_diag",
    "for_008_emer_hosp",
    "for_008_emer_cond_alta",
    "for_008_emer_edad_gest",
    "for_008_emer_ries_obst",
  ];

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
      "RESPONSABLE DE SEGUIMIENTO DE ATENCIÓN:",
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

    setFormData((prev) => ({
      ...prev,
      for_008_emer_nomb_esta_salu: "",
      for_008_emer_fech_aten: "",
      for_008_emer_hora_aten: "",
    }));

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
    }
  };

  // Helper: construir dirección desde datos de admisión
  function buildDireccionAdmision(data) {
    return [
      data?.adm_dato_resi_barr_sect
        ? `Barrio: ${data.adm_dato_resi_barr_sect}`
        : "",
      data?.adm_dato_resi_call_prin
        ? `Calle prin.: ${data.adm_dato_resi_call_prin}`
        : "",
      data?.adm_dato_resi_call_secu
        ? `Calle sec.: ${data.adm_dato_resi_call_secu}`
        : "",
      data?.adm_dato_resi_refe_resi
        ? `Referencia: ${data.adm_dato_resi_refe_resi}`
        : "",
    ]
      .filter(Boolean)
      .join(" / ");
  }

  // Helper: formatear HH:mm
  function formatHora(date = new Date()) {
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }

  // Helper: mapear respuesta de admisión a los campos del formulario
  function mapAdmisionToFormData(data, now = new Date()) {
    const horaActual = formatHora(now);
    const fechaActual = now.toISOString().slice(0, 10);

    const apellidos = [
      data?.adm_dato_pers_apel_prim,
      data?.adm_dato_pers_apel_segu,
    ]
      .filter(Boolean)
      .join(" ");
    const nombres = [
      data?.adm_dato_pers_nomb_prim,
      data?.adm_dato_pers_nomb_segu,
    ]
      .filter(Boolean)
      .join(" ");
    const telefonos = [data?.adm_dato_pers_tele, data?.adm_dato_pers_celu]
      .filter(Boolean)
      .join(" / ");

    return {
      // Fecha/hora de atención
      for_008_emer_hora_aten: horaActual,
      for_008_emer_fech_aten: fechaActual,

      // Datos de identificación/adm
      id_admision_datos: data?.id_admision_datos || data?.id || "",
      adm_dato_naci_fech_naci: data?.adm_dato_naci_fech_naci || "",
      for_008_emer_edad_cond: calcularEdad(data?.adm_dato_naci_fech_naci),

      // Datos personales
      for_008_emer_apel_comp: apellidos,
      for_008_emer_nomb_comp: nombres,
      for_008_emer_sexo: data?.adm_dato_pers_sexo || "",
      for_008_emer_tele_paci: telefonos,
      for_008_emer_naci: data?.adm_dato_naci_naci || "",

      // Residencia
      for_008_emer_prov_resi: data?.adm_dato_resi_prov || "",
      for_008_emer_cant_resi: data?.adm_dato_resi_cant || "",
      for_008_emer_parr_resi: data?.adm_dato_resi_parr || "",
      for_008_emer_unid_salu_resp_segu_aten:
        data?.adm_dato_resi_esta_adsc_terr || "",
      for_008_emer_dire_domi: buildDireccionAdmision(data),

      // Otros
      for_008_emer_etni: data?.adm_dato_auto_auto_etni || "",
      for_008_emer_grup_prio: data?.adm_dato_adic_grup_prio || "",
      for_008_emer_tipo_segu: data?.adm_dato_adic_tipo_segu || "",
    };
  }

  // NUEVO: formatea una línea de la atención previa
  const formatearAtencionLinea = (a) => {
    const unic = a?.for_008_emer_unic ?? "";
    const unid = a?.for_008_emer_unid ?? "";
    const fecha = a?.for_008_emer_fech_aten ?? "";
    const hora = a?.for_008_emer_hora_aten ?? "";
    const cie = a?.for_008_emer_cie_10_prin ?? "";
    const diag = a?.for_008_emer_diag_prin ?? "";
    const cond = a?.for_008_emer_cond_diag ?? "";
    return `${unic} ${unid} | ${fecha} ${hora} | ${cie} ${diag} | ${cond}`;
  };

  // Refactor: una sola función con responsabilidades claras y sets agrupados
  const actualizarFormDataConRespuesta = async (data) => {
    try {
      const now = new Date();

      // Cargar listas en paralelo
      const [medicosData, unidadSaludData] = await Promise.all([
        listarUsuariosApoyoAtencion(),
        buscarUsuarioIdUnidadSalud(),
      ]);

      // Obtener atenciones previas del paciente (CORREGIDO)
      const atencionesData = await listarAtencionesPaciente(
        data.id_admision_datos
      );
      const listaAtenciones = Array.isArray(atencionesData?.data)
        ? atencionesData.data
        : Array.isArray(atencionesData)
        ? atencionesData
        : [];
      setAtencionesPrevias(listaAtenciones);

      // Formatear médicos
      const medicosListFormatted = Array.isArray(medicosData)
        ? medicosData.map((medico) => ({
            value: medico.id?.toString(),
            label:
              `${medico.username} ${medico.last_name} ${medico.first_name}`.trim(),
          }))
        : [];

      // Formatear unidades de salud
      const unidades = Array.isArray(unidadSaludData?.data?.unidades_data)
        ? unidadSaludData.data.unidades_data
        : [];

      const unidadSaludListFormatted = unidades.map((u) => ({
        value: u.id?.toString(),
        label: `${u.uni_unic} - ${u.uni_unid}`,
      }));

      const principal = unidades.find((u) => u.uni_unid_prin === 1);

      // Actualizar listas
      setMedicosList(medicosListFormatted);
      setUnidadSaludList(unidadSaludListFormatted);

      // Actualizar formData en una sola llamada
      setFormData((prev) => ({
        ...prev,
        ...mapAdmisionToFormData(data, now),
        for_008_emer_nomb_esta_salu: principal
          ? principal.id?.toString()
          : prev.for_008_emer_nomb_esta_salu,
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      setSuccessMessage("");
    }
  };

  const ajustarVariableEstadoExitoso = () => {
    setVariableEstado((prevState) => ({
      ...prevState,
      for_008_busc_pers_nume_iden: true,
      for_008_busc_pers_tipo_iden: true,
      for_008_emer_nomb_esta_salu: false,
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
      for_008_hist_aten: false,
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
      case "for_008_busc_pers_tipo_iden":
        // Limpiar el input y activar ambos campos
        setFormData((prev) => ({
          ...prev,
          for_008_busc_pers_tipo_iden: value,
          for_008_busc_pers_nume_iden: "",
        }));
        setVariableEstado((prev) => ({
          ...prev,
          for_008_busc_pers_nume_iden: value === "",
        }));
        setBotonEstado((prev) => ({
          ...prev,
          btnBuscar: true,
        }));
        setIsBuscar(false);
        break;
      case "for_008_busc_pers_nume_iden":
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
        setBotonEstado((prev) => ({
          ...prev,
          btnBuscar: value.trim() === "",
        }));
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
        break;
      }
      case "for_008_emer_espe_prof": {
        // Calcula el siguiente estado y valida inmediatamente con ese estado
        setFormData((prev) => {
          const next =
            value === "OBSTETRIZ"
              ? { ...prev, [name]: value }
              : {
                  ...prev,
                  [name]: value,
                  for_008_emer_edad_gest: "",
                  for_008_emer_ries_obst: "",
                };

          // Actualiza habilitación de campos obstétricos
          setVariableEstado((p) => ({
            ...p,
            for_008_emer_edad_gest: value !== "OBSTETRIZ",
            for_008_emer_ries_obst: value !== "OBSTETRIZ",
          }));

          // Valida con el "next" ya calculado (sin esperar a re-render)
          checkFormValidity(next);
          return next;
        });
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

  // const handleObservacionesChange = (e) => {
  //   const { value, selectionStart } = e.target;
  //   const { name } = e.target;

  //   // Actualiza el formData como lo haces normalmente
  //   setFormData((prev) => ({ ...prev, [name]: value }));

  //   validarDato(
  //     e,
  //     { ...formData, [name]: value },
  //     setFormData,
  //     error,
  //     setError,
  //     setBotonEstado
  //   );

  //   // Obtiene la palabra actual donde está el cursor
  //   const textoPrevio = value.substring(0, selectionStart);
  //   const palabras = textoPrevio.split(/\s+/);
  //   const palabraActual = palabras[palabras.length - 1];

  //   // Si la palabra tiene al menos 3 caracteres, buscar sugerencias
  //   if (palabraActual && palabraActual.length >= 3) {
  //     const coincidencias = frasesMedicas.filter((frase) =>
  //       frase.toLowerCase().startsWith(palabraActual.toLowerCase())
  //     );

  //     setSugerencias(coincidencias);
  //     setPalabraActual(palabraActual);
  //     setPosicionCursor(selectionStart);
  //     setMostrarSugerencias(coincidencias.length > 0);
  //   } else {
  //     setMostrarSugerencias(false);
  //   }
  // };

  // Helper para obtener el código CIE-10 (p.ej. "S060") desde el value seleccionado
  const getCodigoCIE10Prin = (value) => {
    if (!value) return "";
    const found = opcionesCIE10Permitidas?.find((op) => op.value === value);
    if (!found?.label) return "";
    const [codigo] = found.label.split(" ");
    return codigo || "";
  };
  const getCodigoCIE10CausExte = (value) => {
    if (!value) return "";
    const found = opcionesCIE10PermitidasExterno?.find(
      (op) => op.value === value
    );
    if (!found?.label) return "";
    const [codigo] = found.label.split(" ");
    return codigo || "";
  };

  const checkFormValidity = (data = formData) => {
    // Visibilidad basada en "data" (no en formData global)
    const isFieldVisibleWith = (field) => {
      const reglas = {
        for_008_emer_edad_gest: () =>
          data.for_008_emer_espe_prof === "OBSTETRIZ",
        for_008_emer_ries_obst: () =>
          data.for_008_emer_espe_prof === "OBSTETRIZ",
      };
      if (reglas[field]) return reglas[field]();
      return true;
    };

    const camposBasicos = requiredFields
      .filter(isFieldVisibleWith)
      .filter(
        (f) =>
          f !== "for_008_emer_cie_10_prin_diag" &&
          f !== "for_008_emer_cond_diag" &&
          f !== "for_008_emer_cie_10_caus_exte_diag"
      );

    const basicosValidos = camposBasicos.every((field) => {
      const val = data[field];
      if (Array.isArray(val)) {
        return val.some((v) => String(v ?? "").trim() !== "");
      }
      return Boolean(String(val ?? "").trim());
    });

    // Reglas específicas diagnósticos (todos los índices)
    const diags = data.for_008_emer_cie_10_prin_diag ?? [];
    const conds = data.for_008_emer_cond_diag ?? [];
    const causas = data.for_008_emer_cie_10_caus_exte_diag ?? [];

    let diagnosticosValidos = true;
    for (let i = 0; i < diags.length; i++) {
      const diag = String(diags[i] ?? "").trim();
      const cond = String(conds[i] ?? "").trim();
      const causa = String(causas[i] ?? "").trim();
      const codigoDiag = getCodigoCIE10Prin(diag);
      const codigoCausa = getCodigoCIE10CausExte(causa);
      // Diagnóstico y condición requeridos
      if (!diag || !cond) {
        diagnosticosValidos = false;
        break;
      }
      // El código CIE-10 del diagnóstico principal debe tener exactamente 4 caracteres
      if (codigoDiag.length !== 4) {
        diagnosticosValidos = false;
        break;
      }
      // Si diagnóstico principal inicia con S o T, causa externa requerida
      if (
        (codigoDiag.startsWith("S") || codigoDiag.startsWith("T")) &&
        !causa
      ) {
        diagnosticosValidos = false;
        break;
      }
      // Si hay causa externa, debe tener exactamente 4 caracteres
      if (causa && codigoCausa.length !== 4) {
        diagnosticosValidos = false;
        break;
      }
    }

    // Regla global: máximo 3 "PRESUNTIVO" en todas las condiciones
    const presCount = (data.for_008_emer_cond_diag ?? []).filter((v) =>
      String(v ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim()
        .startsWith("PRESUNTIVO")
    ).length;
    const presuntivoLimiteOk = presCount <= 3;

    const isValidationError =
      error && typeof error === "object" && error.type === "validacion";

    setBotonEstado((prev) => ({
      ...prev,
      btnRegistrar:
        +!(basicosValidos && diagnosticosValidos && presuntivoLimiteOk) ||
        +isValidationError,
    }));
  };

  // // Modificar la función insertarSugerencia para resaltar el texto insertado
  // const insertarSugerencia = (sugerencia) => {
  //   const textoActual = formData["for_008_emer_obse"];
  //   // Encuentra el inicio de la palabra actual antes del cursor
  //   const inicioPalabra = textoActual
  //     .substring(0, posicionCursor)
  //     .lastIndexOf(palabraActual);
  //   const textoAntes = textoActual.substring(0, inicioPalabra);
  //   const textoDespues = textoActual.substring(posicionCursor);

  //   // Reemplaza la palabra actual con la sugerencia
  //   const nuevoTexto = textoAntes + sugerencia + " " + textoDespues;

  //   setFormData((prev) => ({ ...prev, for_008_emer_obse: nuevoTexto }));
  //   setMostrarSugerencias(false);

  //   // Selecciona la frase insertada para edición inmediata
  //   setTimeout(() => {
  //     const textarea = document.getElementById("for_008_emer_obse");
  //     if (textarea) {
  //       textarea.focus();
  //       const inicioSeleccion = textoAntes.length;
  //       const finSeleccion = textoAntes.length + sugerencia.length;
  //       textarea.setSelectionRange(inicioSeleccion, finSeleccion);
  //     }
  //   }, 10);
  // };

  const isFieldVisible = (field) => {
    //const edadNum = parseInt(edad);

    // Reglas específicas por campo
    const reglas = {
      for_008_emer_edad_gest: () =>
        formData.for_008_emer_espe_prof === "OBSTETRIZ",
      for_008_emer_ries_obst: () =>
        formData.for_008_emer_espe_prof === "OBSTETRIZ",
    };

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

    try {
      let response;
      if (isEditing) {
        response = await updateForm008Emer(formData);
        const message = response?.message || "Registro actualizado con éxito!";
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(""), 10000);
        toast.success(message, { position: "bottom-right" });
      } else {
        const response = await registerForm008Emer(formData);
        const message = response?.message || "Registro guardado con éxito!";
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(""), 10000);
        toast.success(message, { position: "bottom-right" });
      }
      setRefreshTable((prev) => prev + 1);
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

  const limpiarVariables = () => {
    setFormData(() => ({
      ...initialState,
      // Fuerza nuevas instancias vacías de las listas
      for_008_emer_cie_10_prin_diag: [""],
      for_008_emer_cond_diag: [""],
      for_008_emer_cie_10_caus_exte_diag: [""],
    }));
    setSuccessMessage("");
    setError("");
    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
    setFechaNacimiento("");
    setEdad("");
    setAtencionesPrevias("");
    setIsEditing(false);
  };

  useEffect(() => {
    checkFormValidity();
  }, [formData, error]);

  useEffect(() => {
    // Actualiza la hora cada 60s cuando el campo está habilitado
    if (variableEstado.for_008_emer_hora_aten === false) {
      const update = () =>
        setFormData((prev) => ({
          ...prev,
          for_008_emer_hora_aten: formatHora(),
        }));

      update(); // sincroniza inmediatamente
      const id = setInterval(update, 60000);
      return () => clearInterval(id);
    }
  }, [variableEstado.for_008_emer_hora_aten]);

  const opcionesCIE10Permitidas = allListForm008.for_008_emer_cie_10_prin_diag;
  const opcionesCIE10PermitidasExterno =
    allListForm008.for_008_emer_cie_10_caus_exte_diag;

  const DiagnosticosMultiples = ({
    formData,
    setFormData,
    variableEstado,
    requiredFields,
    isFieldVisible,
    handleChange,
    opcionesCIE10Permitidas,
    opcionesCIE10PermitidasExterno,
    allListForm008,
  }) => {
    const MAX_DIAGS = 6;
    // NUEVO: Función para filtrar opciones ya seleccionadas en la lista principal
    const getOpcionesCIE10Filtradas = (index) => {
      const seleccionados = formData.for_008_emer_cie_10_prin_diag.filter(
        (_, i) => i !== index
      );
      return opcionesCIE10Permitidas.filter(
        (op) => !seleccionados.includes(op.value)
      );
    };

    // NUEVO: Función para filtrar opciones ya seleccionadas en la lista de causa externa
    const getOpcionesCIE10CausaExternaFiltradas = (index) => {
      const seleccionados = formData.for_008_emer_cie_10_caus_exte_diag.filter(
        (_, i) => i !== index
      );
      return opcionesCIE10PermitidasExterno.filter(
        (op) => !seleccionados.includes(op.value)
      );
    };

    // Función para agregar un nuevo diagnóstico (máximo 3)
    const agregarDiagnostico = () => {
      if (formData.for_008_emer_cie_10_prin_diag.length < MAX_DIAGS) {
        setFormData((prev) => ({
          ...prev,
          for_008_emer_cie_10_prin_diag: [
            ...prev.for_008_emer_cie_10_prin_diag,
            "",
          ],
          for_008_emer_cond_diag: [...prev.for_008_emer_cond_diag, ""],
          for_008_emer_cie_10_caus_exte_diag: [
            ...prev.for_008_emer_cie_10_caus_exte_diag,
            "",
          ],
        }));
      }
    };

    // Función para eliminar un diagnóstico
    const eliminarDiagnostico = (index) => {
      if (formData.for_008_emer_cie_10_prin_diag.length > 1) {
        setFormData((prev) => ({
          ...prev,
          for_008_emer_cie_10_prin_diag:
            prev.for_008_emer_cie_10_prin_diag.filter((_, i) => i !== index),
          for_008_emer_cond_diag: prev.for_008_emer_cond_diag.filter(
            (_, i) => i !== index
          ),
          for_008_emer_cie_10_caus_exte_diag:
            prev.for_008_emer_cie_10_caus_exte_diag.filter(
              (_, i) => i !== index
            ),
        }));
      }
    };

    // Verificar diagnósticos que comienzan con S o T
    const esDiagnosticoSoT = (diagValue) => {
      const selected = opcionesCIE10Permitidas.find(
        (op) => op.value === diagValue
      );
      const codigo = selected ? selected.label.split(" ")[0] : "";
      return codigo.startsWith("S") || codigo.startsWith("T");
    };

    // Normalizador seguro para comparar etiquetas/valores
    const norm = (s) =>
      String(s ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();

    const esOpcionNoAplica = (op) =>
      norm(op.label).includes("NO APLICA") || norm(op.value) === "NO APLICA";

    const esOpcionPresuntivo = (op) =>
      norm(op.label).startsWith("PRESUNTIVO") ||
      norm(op.value) === "PRESUNTIVO";
    // Detecta si un valor (value del select) es PRESUNTIVO
    const isPresuntivoValue = (val) => norm(val).startsWith("PRESUNTIVO");

    const esOpcionDefInicial = (op) => {
      const l = norm(op.label);
      return (
        (l.startsWith("DEFINITIVO INICIAL") && !l.includes("CONFIRMADO")) ||
        norm(op.value) === "DEFINITIVO INICIAL"
      );
    };

    const esOpcionDefInicialConfLab = (op) => {
      const l = norm(op.label);
      return (
        (l.startsWith("DEFINITIVO INICIAL") && l.includes("CONFIRMADO")) ||
        l.includes("LABORATORIO") ||
        norm(op.value) === "DEFINITIVO INICIAL CONFIRMADO POR LABORATORIO"
      );
    };

    // NUEVO: verificar si el diagnóstico principal inicia con Z
    const esDiagnosticoZ = (diagValue) => {
      const selected = opcionesCIE10Permitidas.find(
        (op) => op.value === diagValue
      );
      const codigo = selected ? selected.label.split(" ")[0] : "";
      return codigo.startsWith("Z");
    };

    // NUEVO (robusto): opciones de condición por índice
    const getOpcionesCondicionPorIndex = (index) => {
      const listaBase = allListForm008.for_008_emer_cond_diag || [];
      const diagValue = formData.for_008_emer_cie_10_prin_diag[index];

      if (esDiagnosticoZ(diagValue)) {
        const soloNoAplica = listaBase.filter(esOpcionNoAplica);
        // Fallback: si no encontró "NO APLICA", devolver lista completa para no dejar vacío
        return soloNoAplica.length ? soloNoAplica : listaBase;
      }

      const filtradas = listaBase.filter(
        (op) =>
          esOpcionPresuntivo(op) ||
          esOpcionDefInicial(op) ||
          esOpcionDefInicialConfLab(op)
      );
      // Fallback: si no matchea nada, devolver lista base
      return filtradas.length ? filtradas : listaBase;
    };

    const diagInvalido = (index) =>
      String(formData.for_008_emer_cie_10_prin_diag[index] ?? "").trim() === "";

    const causaInvalida = (index) =>
      esDiagnosticoSoT(formData.for_008_emer_cie_10_prin_diag[index]) &&
      String(
        formData.for_008_emer_cie_10_caus_exte_diag[index] ?? ""
      ).trim() === "";

    // Manejar cambio en campos de diagnóstico con validación inmediata
    const handleDiagnosticoChange = (e, index) => {
      const { name, value } = e.target;

      setFormData((prev) => {
        const next = {
          ...prev,
          for_008_emer_cie_10_prin_diag: [
            ...prev.for_008_emer_cie_10_prin_diag,
          ],
          for_008_emer_cond_diag: [...prev.for_008_emer_cond_diag],
          for_008_emer_cie_10_caus_exte_diag: [
            ...prev.for_008_emer_cie_10_caus_exte_diag,
          ],
        };

        if (name === `for_008_emer_cie_10_prin_diag_${index}`) {
          next.for_008_emer_cie_10_prin_diag[index] = value;
          // Si no es S/T, limpiar su causa externa
          const selected = opcionesCIE10Permitidas.find(
            (op) => op.value === value
          );
          const code = selected ? selected.label.split(" ")[0] : "";
          if (!(code.startsWith("S") || code.startsWith("T"))) {
            next.for_008_emer_cie_10_caus_exte_diag[index] = "";
          }
          // Validar/autoasignar condición según opciones filtradas
          const opcionesCond = getOpcionesCondicionPorIndex(index);
          const condActual = next.for_008_emer_cond_diag[index];

          const existeActual = opcionesCond.some(
            (op) => op.value === condActual
          );
          if (!existeActual) {
            // Autoseleccionar NO APLICA si la única opción disponible es esa
            if (
              opcionesCond.length === 1 &&
              esOpcionNoAplica(opcionesCond[0])
            ) {
              next.for_008_emer_cond_diag[index] = opcionesCond[0].value;
            } else {
              next.for_008_emer_cond_diag[index] = "";
            }
          }
        } else if (name === `for_008_emer_cond_diag_${index}`) {
          // Limitar a máximo 3 selecciones "PRESUNTIVO" en total
          if (isPresuntivoValue(value)) {
            const currentCount = next.for_008_emer_cond_diag.reduce(
              (acc, v, i) =>
                acc + (i === index ? 0 : isPresuntivoValue(v) ? 1 : 0),
              0
            );
            if (currentCount >= 3) {
              toast.error(
                "Solo puede seleccionar PRESUNTIVO hasta 3 diagnósticos.",
                {
                  position: "bottom-right",
                }
              );
              return prev; // cancelar el cambio
            }
          }
          next.for_008_emer_cond_diag[index] = value;
        } else if (name === `for_008_emer_cie_10_caus_exte_diag_${index}`) {
          next.for_008_emer_cie_10_caus_exte_diag[index] = value;
        }

        // Validar con el "next" inmediatamente
        checkFormValidity(next);
        return next;
      });
    };

    // Funciones de validación específicas para el componente
    const verificarCodigoCIE10 = (diagValue) => {
      const selected = opcionesCIE10Permitidas.find(
        (op) => op.value === diagValue
      );
      return selected ? selected.label.split(" ")[0] : "";
    };

    const requiereCausaExterna = (diagValue) => {
      const codigo = verificarCodigoCIE10(diagValue);
      return codigo && (codigo.startsWith("S") || codigo.startsWith("T"));
    };

    return (
      <div className="space-y-4">
        {formData.for_008_emer_cie_10_prin_diag.map((diagValue, index) => (
          <div key={index} className="border p-3 rounded bg-gray-50 relative">
            {index > 0 && (
              <button
                type="button"
                onClick={() => eliminarDiagnostico(index)}
                className="absolute top-2 right-2 text-red-500 font-bold"
                title="Eliminar diagnóstico"
              >
                X
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Diagnóstico principal */}
              <div className="mb-1 flex flex-col">
                <label
                  className={labelClass}
                  htmlFor={`for_008_emer_cie_10_prin_diag_${index}`}
                >
                  <span className="text-red-500">*</span>{" "}
                  {labelMap["for_008_emer_cie_10_prin_diag"]}{" "}
                  {index > 0 && `#${index + 1}`}
                </label>
                <CustomSelect
                  id={`for_008_emer_cie_10_prin_diag_${index}`}
                  name={`for_008_emer_cie_10_prin_diag_${index}`}
                  value={formData.for_008_emer_cie_10_prin_diag[index] || ""}
                  onChange={(e) => handleDiagnosticoChange(e, index)}
                  options={getOpcionesCIE10Filtradas(index)}
                  disabled={variableEstado["for_008_emer_cie_10_prin_diag"]}
                  variableEstado={variableEstado}
                  className={
                    diagInvalido(index) ||
                    getCodigoCIE10Prin(
                      formData.for_008_emer_cie_10_prin_diag[index]
                    ).length !== 4
                      ? "border-2 border-red-500"
                      : ""
                  }
                  isLargeList={true}
                  placeholder="Escriba para buscar diagnóstico CIE-10..."
                  minSearchLength={2}
                  maxResults={100}
                  tooltipTrigger="both"
                  tooltipContent={
                    <div>
                      <div className="font-semibold mb-1">
                        1️⃣ Registro de Diagnóstico Principal
                      </div>
                      <ul className="list-disc ml-5 space-y-1">
                        <li>
                          Registrar solo códigos CIE-10 de morbilidad con letras
                          iniciales de A a U.
                        </li>
                        <li>
                          Excepción: Z027 – Extensión de certificado médico
                          (custodia policial o certificado).
                        </li>
                        <li>
                          Solo se permite CIE-10 de atención de prevención son
                          los siguientes: Z000, Z027, Z113, Z206, Z258, Z358,
                          Z359, Z370, Z371, Z372, Z373, Z374, Z375, Z377, Z390.
                        </li>
                        <li>
                          No se permiten otros códigos que inicien con “Z” como
                          diagnóstico principal.
                        </li>
                      </ul>
                    </div>
                  }
                  tooltipPosition="top"
                  tooltipAlign="end"
                  tooltipOffset={6}
                />
                {formData.for_008_emer_cie_10_prin_diag[index] &&
                  getCodigoCIE10Prin(
                    formData.for_008_emer_cie_10_prin_diag[index]
                  ).length !== 4 && (
                    <span className="text-red-600 text-sm mt-1">
                      El diagnóstico seleccionado no es válido. Seleccione un
                      código CIE-10 más específico.
                    </span>
                  )}
                {requiereCausaExterna(diagValue) && diagValue && (
                  <span className="text-blue-600 text-sm mt-1">
                    Se tiene que registrar la Causa Externa que comiencen con V,
                    W, X o Y.
                  </span>
                )}
              </div>

              {/* Condición del diagnóstico */}
              <div className="mb-1 flex flex-col">
                <label
                  className={labelClass}
                  htmlFor={`for_008_emer_cond_diag_${index}`}
                >
                  <span className="text-red-500">*</span>{" "}
                  {index === 0
                    ? "CONDICIÓN DEL DIAGNÓSTICO:"
                    : `CONDICIÓN DIAGNÓSTICO #${index + 1}:`}
                </label>
                <CustomSelect
                  id={`for_008_emer_cond_diag_${index}`}
                  name={`for_008_emer_cond_diag_${index}`}
                  value={formData.for_008_emer_cond_diag[index] || ""}
                  onChange={(e) => handleDiagnosticoChange(e, index)}
                  options={getOpcionesCondicionPorIndex(index)}
                  disabled={variableEstado["for_008_emer_cond_diag"]}
                  variableEstado={variableEstado}
                  className={
                    formData.for_008_emer_cond_diag[index] === ""
                      ? "border-2 border-red-500"
                      : ""
                  }
                />
              </div>

              {/* Causa externa */}
              <div className="mb-1 flex flex-col">
                <label
                  className={labelClass}
                  htmlFor={`for_008_emer_cie_10_caus_exte_diag_${index}`}
                >
                  {esDiagnosticoSoT(
                    formData.for_008_emer_cie_10_prin_diag[index]
                  ) && <span className="text-red-500">*</span>}
                  {index === 0
                    ? "CIE-10 (CAUSA EXTERNA):"
                    : `CIE-10 (CAUSA EXTERNA) #${index + 1}:`}
                </label>
                <CustomSelect
                  id={`for_008_emer_cie_10_caus_exte_diag_${index}`}
                  name={`for_008_emer_cie_10_caus_exte_diag_${index}`}
                  value={
                    formData.for_008_emer_cie_10_caus_exte_diag[index] || ""
                  }
                  onChange={(e) => handleDiagnosticoChange(e, index)}
                  options={getOpcionesCIE10CausaExternaFiltradas(index)}
                  disabled={
                    variableEstado["for_008_emer_cie_10_caus_exte_diag"] ||
                    !esDiagnosticoSoT(
                      formData.for_008_emer_cie_10_prin_diag[index]
                    )
                  }
                  variableEstado={variableEstado}
                  className={
                    causaInvalida(index) ||
                    getCodigoCIE10CausExte(
                      formData.for_008_emer_cie_10_caus_exte_diag[index]
                    ).length === 3
                      ? "border-2 border-red-500"
                      : ""
                  }
                  isLargeList={true}
                  placeholder={
                    esDiagnosticoSoT(
                      formData.for_008_emer_cie_10_prin_diag[index]
                    )
                      ? "Escriba para buscar diagnóstico CIE-10..."
                      : "Solo disponible para diagnósticos V, W, X, Y"
                  }
                  minSearchLength={2}
                  maxResults={100}
                  tooltipTrigger="both"
                  tooltipContent={
                    <div>
                      <div className="font-semibold mb-1">
                        2️⃣ Registro de Diagnóstico de Causa Externa
                      </div>
                      <ul className="list-disc ml-5 space-y-1">
                        <li>
                          Corresponde a eventos o circunstancias externas que
                          originan la lesión o condición.
                        </li>
                        <li>
                          Usar únicamente códigos CIE-10 que inicien con V, W, X
                          o Y.
                        </li>
                        <li>
                          No registrar códigos fuera de este rango para causas
                          externas.
                        </li>
                      </ul>
                    </div>
                  }
                  tooltipPosition="top"
                  tooltipAlign="end"
                  tooltipOffset={6}
                />
                {formData.for_008_emer_cie_10_caus_exte_diag[index] &&
                  getCodigoCIE10CausExte(
                    formData.for_008_emer_cie_10_caus_exte_diag[index]
                  ).length !== 4 && (
                    <span className="text-red-600 text-sm mt-1">
                      El diagnóstico seleccionado no es válido. Seleccione un
                      código CIE-10 más específico.
                    </span>
                  )}
              </div>
            </div>
          </div>
        ))}

        {formData.for_008_emer_cie_10_prin_diag.length < MAX_DIAGS && (
          <button
            type="button"
            onClick={agregarDiagnostico}
            className="mt-2 bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm"
            disabled={variableEstado["for_008_emer_cie_10_prin_diag"]}
          >
            + Agregar otro diagnóstico
          </button>
        )}
      </div>
    );
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

  const handleSeleccionarAdmisionado = (registro) => {
    const tipo =
      registro.adm_dato_pers_tipo_iden ||
      registro.for_008_busc_pers_tipo_iden ||
      registro.tipoId ||
      "";
    const num =
      registro.adm_dato_pers_nume_iden ||
      registro.for_008_busc_pers_nume_iden ||
      registro.numeId ||
      "";

    if (!tipo || !num) return;

    setFormData((prev) => ({
      ...prev,
      for_008_busc_pers_tipo_iden: tipo,
      for_008_busc_pers_nume_iden: num,
    }));

    // Ajusta estados para permitir (o forzar) la búsqueda inmediata
    setVariableEstado((prev) => ({
      ...prev,
      for_008_busc_pers_tipo_iden: false,
      for_008_busc_pers_nume_iden: false,
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

  const fieldClass = "mb-1 flex flex-col";
  const labelClass = "block text-gray-700 text-sm font-bold mb-1";
  const buttonTextRegistro = isEditing ? "Actualizar Registro" : "Registrar";
  const buttonTextBuscar = "Buscar";

  return (
    <div className="w-full h-auto flex items-stretch justify-stretch bg-gray-100">
      {showAgreementModal && (
        <div className="fixed inset-0 z-[100] bg-black/60">
          <div className="flex h-screen w-screen items-stretch justify-center">
            <div className="bg-white w-screen h-screen md:w-[1000px] md:h-[90vh] md:rounded-lg md:my-6 shadow-xl flex flex-col">
              {/* Cabecera fija */}
              <div className="px-3 py-1 md:px-3 md:py-1 border-b sticky top-0 bg-white z-10">
                <h2 className="text-lg md:text-xl font-bold text-blue-700 text-center">
                  ACUERDO DE CONFIDENCIALIDAD
                </h2>
              </div>
              {/* Contenido con scroll (más compacto) */}
              <div className="flex-1 overflow-y-auto px-5 py-1 md:px-6 md:py-2 text-justify text-[13px] md:text-sm leading-snug text-gray-800 space-y-2">
                <section className="space-y-1">
                  <h3 className="font-bold">1. Objeto</h3>
                  <p>
                    El presente Acuerdo de Confidencialidad tiene como finalidad
                    garantizar la reserva, protección y uso adecuado de la
                    información personal, sensible, estadística y clínica a la
                    que tenga acceso el personal operativo, administrativo,
                    técnico o profesional dentro de sus funciones en el Sistema
                    Nacional de Salud y en el marco de las normativas vigentes
                    en el Ecuador.
                  </p>
                </section>

                <section className="space-y-1">
                  <h3 className="font-bold">2. Marco Legal Aplicable</h3>
                  <p>Este acuerdo se sustenta en:</p>

                  <p className="font-semibold">
                    Acuerdo Ministerial 5216 – Reglamento de Información
                    Confidencial en el Sistema Nacional de Salud.
                  </p>
                  <p>
                    <span className="font-semibold">Art. 9.</span> El personal
                    operativo y administrativo de los establecimientos del
                    Sistema Nacional de Salud que tenga acceso a información de
                    los/las usuarios/as deberá guardar reserva de manera
                    indefinida respecto de dicha información.
                  </p>
                  <p>
                    <span className="font-semibold">Art. 10.</span> Los
                    documentos que contengan información confidencial se
                    mantendrán reservados, salvo en casos justificados como
                    estudios epidemiológicos, auditorías de calidad u otros
                    debidamente autorizados.
                  </p>
                  <p>
                    <span className="font-semibold">Art. 61.</span> Las
                    instituciones y profesionales de salud deben garantizar la
                    confidencialidad de la información entregada y recibida,
                    incluso en el marco del reporte obligatorio de enfermedades
                    de notificación obligatoria.
                  </p>

                  <p className="font-semibold">
                    Ley de Estadística (Registro Oficial N.º 323 del 7 de mayo
                    de 1976)
                  </p>
                  <p>
                    <span className="font-semibold">Art. 25.</span> Las personas
                    que intervengan en investigaciones realizadas por entidades
                    del Sistema Estadístico Nacional no podrán requerir ni
                    utilizar información distinta de la autorizada, bajo
                    sanciones establecidas en la Ley de Servicio Civil y Carrera
                    Administrativa.
                  </p>

                  <p className="font-semibold">
                    Ley Orgánica de Protección de Datos Personales (Registro
                    Oficial Suplemento N.º 459, 26 de mayo de 2021)
                  </p>
                  <ul className="list-disc ml-4 space-y-0.5">
                    <li>
                      Reconoce y garantiza el derecho fundamental a la
                      protección de los datos personales.
                    </li>
                    <li>
                      Establece que el tratamiento de datos personales deberá
                      ser lícito, leal, transparente, seguro y confidencial, con
                      sujeción al principio de finalidad específica.
                    </li>
                    <li>
                      Prohíbe la transferencia, difusión o divulgación de datos
                      personales sin consentimiento expreso, salvo en los casos
                      excepcionales establecidos en la ley.
                    </li>
                  </ul>
                </section>

                <section className="space-y-1">
                  <h3 className="font-bold">3. Obligaciones del Firmante</h3>
                  <p>El personal que suscribe este acuerdo se compromete a:</p>
                  <ul className="list-disc ml-4 space-y-0.5">
                    <li>
                      Mantener estricta confidencialidad respecto de toda la
                      información sensible, personal, clínica o estadística a la
                      que tenga acceso en el cumplimiento de sus funciones.
                    </li>
                    <li>
                      No divulgar, copiar, almacenar, ni transferir información
                      sin la debida autorización de la autoridad competente.
                    </li>
                    <li>
                      Cumplir con las disposiciones establecidas en el Acuerdo
                      Ministerial 5216, la Ley de Estadística y la Ley Orgánica
                      de Protección de Datos Personales.
                    </li>
                    <li>
                      Garantizar la seguridad de los documentos físicos y
                      electrónicos, evitando accesos no autorizados.
                    </li>
                    <li>
                      Reportar de manera inmediata cualquier incidente de
                      seguridad de la información que implique vulneración,
                      pérdida o acceso indebido a los datos.
                    </li>
                  </ul>
                </section>

                <section className="space-y-1">
                  <h3 className="font-bold">4. Vigencia</h3>
                  <p>
                    La obligación de confidencialidad tendrá carácter
                    indefinido, incluso después de que el firmante cese en sus
                    funciones o relación contractual con la institución.
                  </p>
                </section>

                <section className="space-y-1">
                  <h3 className="font-bold">5. Sanciones</h3>
                  <p>
                    El incumplimiento de este acuerdo podrá dar lugar a
                    sanciones disciplinarias, administrativas, civiles y/o
                    penales de acuerdo con la normativa vigente en el Ecuador.
                  </p>
                </section>

                <section className="space-y-1">
                  <h3 className="font-bold">6. Aceptación</h3>
                  <p>
                    Mediante el presente documento, el/la suscriptor/a declara
                    haber leído, comprendido y aceptado las disposiciones aquí
                    descritas, obligándose a cumplirlas de manera íntegra y
                    responsable.
                  </p>
                </section>
              </div>
              {/* Pie fijo */}
              <div className="px-3 py-1 md:px-3 md:py-1 border-t bg-white sticky bottom-0 z-10 flex justify-end gap-2">
                <button
                  type="button"
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded"
                  onClick={() => navigate("/")}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
                  onClick={() => setShowAgreementModal(false)}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="w-full h-full p-2 bg-white rounded-lg shadow-md mt-1">
        <h2 className="text-2xl font-bold mb-1 text-center text-blue-700">
          Formulario 008 Emergencia
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <fieldset className="border border-blue-200 rounded p-2 mb-1 sm:col-span-2 md:col-span-2 lg:col-span-2">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Buscar pacientes admisionados
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2">
                <div className={fieldClass}>
                  <label
                    className={labelClass}
                    htmlFor="for_008_busc_pers_tipo_iden"
                  >
                    {requiredFields.includes("for_008_busc_pers_tipo_iden") && (
                      <span className="text-red-500">* </span>
                    )}
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
                  <div className="flex items-center justify-between">
                    <label
                      className={labelClass}
                      htmlFor="for_008_busc_pers_nume_iden"
                    >
                      {requiredFields.includes(
                        "for_008_busc_pers_nume_iden"
                      ) && <span className="text-red-500">* </span>}
                      {labelMap["for_008_busc_pers_nume_iden"]}
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
              </div>
            </fieldset>
            <fieldset className="border border-blue-200 rounded p-2 mb-1 sm:col-span-2 md:col-span-2 lg:col-span-2">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Historial de Atenciones de paciente por Emergencia.
              </legend>
              <div className="mb-2">
                <label className={labelClass} htmlFor="for_008_hist_aten">
                  Los 10 atenciones previas del paciente.
                </label>
                <textarea
                  id="for_008_hist_aten"
                  name="for_008_hist_aten"
                  readOnly
                  className={`${inputStyle} font-mono text-xs resize-none transition-all duration-200
                      ${
                        isHistorialExpandido
                          ? "h-48 overflow-auto bg-white cursor-default"
                          : "h-10 overflow-hidden bg-gray-50 cursor-pointer"
                      }`}
                  onFocus={() => setIsHistorialExpandido(true)}
                  onClick={() => setIsHistorialExpandido(true)}
                  onBlur={() => setIsHistorialExpandido(false)}
                  value={
                    atencionesPrevias && atencionesPrevias.length > 0
                      ? atencionesPrevias.map(formatearAtencionLinea).join("\n")
                      : "Sin atenciones previas registradas."
                  }
                  placeholder="El historial de atenciones previas se mostrará aquí después de buscar un paciente."
                  title="Clic para ver todo; clic fuera para comprimir"
                  disabled={variableEstado["for_008_hist_aten"]}
                />
              </div>
            </fieldset>
          </div>
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
                  onChange={handleChange}
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
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-2">
              <fieldset className="border border-blue-200 rounded p-2 mb-1">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Registro de diagnósticos de la atención de emergencia
                </legend>
                <div className="bg-blue-50 border-l-4 border-blue-500 text-black p-2 mb-2 text-sm">
                  <strong>Atención:</strong> Solo se registrarán diagnósticos
                  que incluyan el código CIE-10 con cuatro caracteres (por
                  ejemplo: I100), seguido de su respectiva descripción. Esta
                  estructura es obligatoria para garantizar uniformidad en el
                  registro clínico.
                </div>
                <DiagnosticosMultiples
                  formData={formData}
                  setFormData={setFormData}
                  variableEstado={variableEstado}
                  requiredFields={requiredFields}
                  isFieldVisible={isFieldVisible}
                  handleChange={handleChange}
                  opcionesCIE10Permitidas={opcionesCIE10Permitidas}
                  opcionesCIE10PermitidasExterno={
                    opcionesCIE10PermitidasExterno
                  }
                  allListForm008={allListForm008}
                />
              </fieldset>
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
          {formData["for_008_emer_espe_prof"] === "OBSTETRIZ" && (
            <fieldset className="border border-blue-200 rounded p-2 mb-1">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Datos de atencion obstetrica
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <div className={fieldClass}>
                  <label
                    className={labelClass}
                    htmlFor="for_008_emer_edad_gest"
                  >
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
                      const name = e.target.name;
                      // Normaliza: coma -> punto y elimina todo lo que no sea dígito o punto
                      let value = e.target.value
                        .replace(/,/g, ".")
                        .replace(/[^\d.]/g, "");

                      // Permitir borrar
                      if (value === "") {
                        handleChange({ target: { name, value } });
                        return;
                      }

                      // Evitar más de un punto decimal
                      const firstDot = value.indexOf(".");
                      if (firstDot !== -1) {
                        value =
                          value.slice(0, firstDot + 1) +
                          value.slice(firstDot + 1).replace(/\./g, "");
                      }

                      // Solo números y punto (validación rápida de tecleo)
                      if (!/^\d*\.?\d*$/.test(value)) return;

                      // Validación paso a paso: 1-60 semanas y .0-.6 días
                      const partialRegex =
                        /^([1-9]|[1-5][0-9]|60)?(\.([0-6])?)?$/; // se escapa el punto
                      if (partialRegex.test(value)) {
                        handleChange({ target: { name, value } });
                      }
                    }}
                    placeholder="Ej: 8.6 (8 semanas. 6 días)"
                    inputMode="decimal"
                    pattern="^\d+(\.\d+)?$"
                    title="Solo números y punto decimal (ej.: 15 o 12.2)"
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
                  <label
                    className={labelClass}
                    htmlFor="for_008_emer_ries_obst"
                  >
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
          )}
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
                    setAdmisionInit({
                      tipoIdenInicial: String(
                        formData.for_008_busc_pers_tipo_iden || ""
                      ).trim(),
                      numeIdenInicial: String(
                        formData.for_008_busc_pers_nume_iden || ""
                      ).trim(),
                    });
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
                id_admision={admisionData.id_admision_datos}
                tipoIdenInicial={admisionInit.tipoIdenInicial}
                numeIdenInicial={admisionInit.numeIdenInicial}
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
                btnActualizar={admisionData.id_admision_datos !== null}
                onClose={() => {
                  setShowAdmisionModal(false);
                  setAdmisionData(null); // Limpia la información al terminar
                }}
              />
            </div>
          </div>
        )}
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
