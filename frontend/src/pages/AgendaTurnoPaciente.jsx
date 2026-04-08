import React, { useState, useRef, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
  buscarUsuarioIdUnidadSalud,
  buscarUsuarioAdmision,
  buscarTurnosAgendados,
  actualizarTurnoAgendado,
  actualizarAgenda,
  pdfTurnoAgendaPaciente,
  listarAgendaPaciente,
  buscarPacientesAgendados,
} from "../api/conexion.api.js";
import allListAdmision from "../api/all.list.admision.json";
import allListAgenda from "../api/all.list.agenda.json";
import allListRegisterUser from "../api/all.list.register.user.json";
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
import BuscarAdmisionados from "../components/BuscarAdmisionados.jsx";
import Loader from "../components/Loader.jsx";
import { toast } from "react-hot-toast";
import { BsCalendar3, BsCalendarCheckFill } from "react-icons/bs";
import { id, tr } from "date-fns/locale";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addMinutes,
  isBefore,
  addDays,
  isAfter,
  set,
} from "date-fns";
import esES from "date-fns/locale/es";
import { DateRange } from "react-date-range";
import { se } from "date-fns/locale";

const initialState = {
  age_turn_paci_tipo_iden: "",
  age_turn_paci_nume_iden: "",
  age_turn_paci_apel_nomb: "",
  age_turn_paci_tele: "",
  age_turn_paci_corr_paci: "",
  age_turn_paci_unid_salu_resp_segu_aten_paci: "",
  age_turn_paci_dire_paci: "",
  age_turn_paci_obse_paci: "",
  id_admision_paci: "",
};

const initialVariableState = {
  age_turn_paci_tipo_espe: "",
  age_turn_paci_fech_inic_fin: "",
  age_turn_paci_agen_paci: "",
  turno_historial_select: "",
  age_turn_paci_edit_agen_paci: "",
};

const initialReporteState = {
  age_turn_paci_repo_fech_inic_fin: "",
  age_turn_paci_repo_tipo_espe: "",
};

const estadoTurnoMap = {
  1: "DISPONIBLE",
  2: "RESERVADO/A",
  3: "AGENDADO/A",
  4: "CANCELADO",
  5: "ELIMINADO",
};

const unidadesSalud = Object.fromEntries(
  (allListRegisterUser.uni_unic || []).map((item) => [item.value, item.label]),
);

const TABLE_HEADERS = [
  "Unidad de Salud",
  "Tipo de Especialidad",
  "Profesional de la Cita",
  "Estado de la Cita",
];

const TABLE_HEADERS_REPORTE = [
  "Unidad de Salud",
  "Tipo de Especialidad",
  "Profesional de la Cita",
  "Estado de la Cita",
  "Identificación del Paciente",
];

function textoSeguro(valor) {
  return valor === null || valor === undefined ? "" : String(valor).trim();
}

function construirNombrePaciente(data) {
  return [
    data?.adm_dato_pers_apel_prim,
    data?.adm_dato_pers_apel_segu,
    data?.adm_dato_pers_nomb_prim,
    data?.adm_dato_pers_nomb_segu,
  ]
    .map(textoSeguro)
    .filter(Boolean)
    .join(" ");
}

function construirDireccionPaciente(data) {
  return [
    data?.adm_dato_resi_barr_sect,
    data?.adm_dato_resi_call_prin,
    data?.adm_dato_resi_call_secu,
    data?.adm_dato_resi_refe_resi,
    data?.adm_dato_resi_parr,
    data?.adm_dato_resi_cant,
    data?.adm_dato_resi_prov,
  ]
    .map(textoSeguro)
    .filter(Boolean)
    .join(", ");
}

function mapAdmisionAPaciente(data) {
  return {
    id_admision_paci: data?.id_admision_datos || "",
    age_turn_paci_apel_nomb: construirNombrePaciente(data),
    age_turn_paci_tele: textoSeguro(data?.adm_dato_pers_celu),
    age_turn_paci_corr_paci: textoSeguro(data?.adm_dato_pers_corr_elec),
    age_turn_paci_dire_paci: construirDireccionPaciente(data),
    age_turn_paci_unid_salu_resp_segu_aten_paci: textoSeguro(
      data?.adm_dato_resi_esta_adsc_terr,
    ),
  };
}

function ReadOnlyField({ label, value, className = "", isTextarea = false }) {
  return (
    <div className={className}>
      <label className="block text-gray-700 text-sm font-bold mb-1">
        {label}
      </label>
      {isTextarea ? (
        <textarea
          value={value}
          readOnly
          rows={3}
          className={`${inputStyle} bg-gray-100 text-gray-700 cursor-default resize-none`}
        />
      ) : (
        <input
          value={value}
          readOnly
          className={`${inputStyle} bg-gray-100 text-gray-700 cursor-default`}
        />
      )}
    </div>
  );
}

ReadOnlyField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  className: PropTypes.string,
  isTextarea: PropTypes.bool,
};

ReadOnlyField.defaultProps = {
  value: "",
  className: "",
  isTextarea: false,
};

export default function AgendaTurnoPaciente() {
  const [formData, setFormData] = useState(initialState);
  const [variableData, setVariableData] = useState(initialVariableState);
  const [reporteData, setReporteData] = useState(initialReporteState);
  const [turnosPaciente, setTurnosPaciente] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showBusquedaAvanzada, setShowBusquedaAvanzada] = useState(false);
  const [rangeInicio, setRangeInicio] = useState(new Date());
  const [rangeFin, setRangeFin] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const onRangeChange = ({ selection }) => {
    setRange([selection]);
    setRangeInicio(selection.startDate);
    setRangeFin(selection.endDate);
  };
  const [rangeRepoInicio, setRangeRepoInicio] = useState(new Date());
  const [rangeRepoFin, setRangeRepoFin] = useState(new Date());
  const [showRepoCalendar, setShowRepoCalendar] = useState(false);
  const [rangeRepo, setRangeRepo] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const onRangeRepoChange = ({ selection }) => {
    setRangeRepo([selection]);
    setRangeRepoInicio(selection.startDate);
    setRangeRepoFin(selection.endDate);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isHistorialExpandido, setIsHistorialExpandido] = useState(false);
  const [showEditarListaTurnos, setShowEditarListaTurnos] = useState(false);
  const [editandoListaTurnos, setEditandoListaTurnos] = useState([]);
  const [unidadSaludList, setUnidadSaludList] = useState([]);
  const [activeTab, setActiveTab] = useState("agenda");
  const [pacientesAgendados, setPacientesAgendados] = useState([]);
  const [currentPageReporte, setCurrentPageReporte] = useState(1);
  const [searchTermReporte, setSearchTermReporte] = useState("");
  const [rowsPerPageReporte, setRowsPerPageReporte] = useState(10);

  const filteredUsers = useMemo(() => {
    let turnos = [];
    if (Array.isArray(turnosPaciente.data)) {
      turnos = turnosPaciente.data;
    } else if (Array.isArray(turnosPaciente)) {
      turnos = turnosPaciente;
    }
    if (!searchTerm.trim()) return turnos;
    const q = searchTerm.toLowerCase();
    return turnos.filter((u) => {
      return [
        u.adm_agen_turn_fech,
        u.adm_agen_turn_hora_inic,
        u.adm_agen_turn_hora_fin,
        u.adm_agen_turn_unid_salu,
        u.adm_agen_turn_tipo_espe,
        u.adm_agen_turn_prof_cita,
        u.adm_agen_turn_dura_cita,
        estadoTurnoMap[u.adm_agen_turn_esta_cita],
        unidadesSalud[u.adm_agen_turn_rese_unic_salu],
      ]
        .filter(Boolean)
        .some((field) => field.toString().toLowerCase().includes(q));
    });
  }, [turnosPaciente, searchTerm]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage)),
    [filteredUsers.length, rowsPerPage],
  );

  useEffect(() => {
    setCurrentPage((prev) => Math.min(Math.max(prev, 1), totalPages));
  }, [totalPages]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  const currentRows = useMemo(
    () => filteredUsers.slice(indexOfFirstRow, indexOfLastRow),
    [filteredUsers, indexOfFirstRow, indexOfLastRow],
  );

  const filteredReporte = useMemo(() => {
    let turnos = [];
    if (Array.isArray(pacientesAgendados.data)) {
      turnos = pacientesAgendados.data;
    } else if (Array.isArray(pacientesAgendados)) {
      turnos = pacientesAgendados;
    }
    if (!searchTermReporte.trim()) return turnos;
    const q = searchTermReporte.toLowerCase();
    return turnos.filter((u) => {
      return [
        u.adm_agen_turn_fech,
        u.adm_agen_turn_hora_inic,
        u.adm_agen_turn_hora_fin,
        u.adm_agen_turn_unid_salu,
        u.adm_agen_turn_tipo_espe,
        u.adm_agen_turn_prof_cita,
        u.adm_agen_turn_dura_cita,
        estadoTurnoMap[u.adm_agen_turn_esta_cita],
        u.adm_agen_turn_nume_iden_paci,
        u.adm_agen_turn_apel_nomb_paci,
      ]
        .filter(Boolean)
        .some((field) => field.toString().toLowerCase().includes(q));
    });
  }, [pacientesAgendados, searchTermReporte]);

  const totalPagesReporte = useMemo(
    () => Math.max(1, Math.ceil(filteredReporte.length / rowsPerPageReporte)),
    [filteredReporte.length, rowsPerPageReporte],
  );

  useEffect(() => {
    setCurrentPageReporte((prev) =>
      Math.min(Math.max(prev, 1), totalPagesReporte),
    );
  }, [totalPagesReporte]);

  const indexOfLastRowReporte = currentPageReporte * rowsPerPageReporte;
  const indexOfFirstRowReporte = indexOfLastRowReporte - rowsPerPageReporte;

  const currentRowsReporte = useMemo(
    () => filteredReporte.slice(indexOfFirstRowReporte, indexOfLastRowReporte),
    [filteredReporte, indexOfFirstRowReporte, indexOfLastRowReporte],
  );

  const initialVariableEstado = {
    age_turn_paci_tipo_iden: false,
    age_turn_paci_nume_iden: true,
    age_turn_paci_fech_inic_fin: true,
    age_turn_paci_tipo_espe: true,
    age_turn_paci_apel_nomb: true,
    age_turn_paci_tele: true,
    age_turn_paci_corr_paci: true,
    age_turn_paci_unid_salu_resp_segu_aten_paci: true,
    age_turn_paci_dire_paci: true,
    age_turn_paci_obse_paci: true,
    age_turn_paci_agen_paci: true,
    age_turn_paci_edit_agen_paci: true,
    age_turn_paci_repo_fech_inic_fin: false,
    age_turn_paci_repo_tipo_espe: false,
  };

  const initialBotonEstado = {
    btn_buscar_paciente: true,
    btn_busqueda_avanzada: true,
    btn_cargar_turnos: true,
    btnRegistrar: true,
    btn_limpiar_formulario: true,
    btn_editar_lista_turnos: true,
    btn_libe_turn_paci: true,
    btn_reporte_turnos: false,
  };

  const [variableEstado, setVariableEstado] = useState(initialVariableEstado);
  const [botonEstado, setBotonEstado] = useState(initialBotonEstado);
  const calendarRef = useRef(null);
  const calendarRefRepo = useRef(null);

  const requiredFields = [
    "age_turn_paci_tipo_iden",
    "age_turn_paci_nume_iden",
    "age_turn_paci_tipo_espe",
    "age_turn_paci_fech_inic_fin",
    "age_turn_paci_corr_paci",
  ];

  const labelMap = {
    age_turn_paci_tipo_iden: "Tipo de identificación:",
    age_turn_paci_nume_iden: "Número de identificación:",
    age_turn_paci_fech_inic_fin: "Rango de fechas para turnos:",
    age_turn_paci_tipo_espe: "Tipo de especialidad:",
    age_turn_paci_apel_nomb: "Apellidos y nombres:",
    age_turn_paci_tele: "Celular:",
    age_turn_paci_corr_paci: "Correo electrónico:",
    age_turn_paci_unid_salu_resp_segu_aten_paci: "Unidad de salud responsable:",
    age_turn_paci_dire_paci: "Dirección:",
    age_turn_paci_obse_paci: "Observaciones:",
    age_turn_paci_agen_paci: "Turnos Agendados a Paciente:",
    age_turn_paci_repo_fech_inic_fin: "Rango de fechas para reporte:",
    age_turn_paci_repo_tipo_espe: "Tipo de especialidad para reporte:",
  };

  const areRequiredFieldsFilled = (nextFormData, nextVariableData) => {
    const camposForm = [
      "age_turn_paci_tipo_iden",
      "age_turn_paci_nume_iden",
      "age_turn_paci_corr_paci",
    ];
    const camposVar = ["age_turn_paci_tipo_espe"];

    const formOk = camposForm.every((campo) =>
      textoSeguro(nextFormData[campo]),
    );
    const varOk = camposVar.every((campo) =>
      textoSeguro(nextVariableData[campo]),
    );

    return formOk && varOk;
  };

  const actualizarEstadoBtnRegistrar = (nextFormData, nextVariableData) => {
    const completos = areRequiredFieldsFilled(nextFormData, nextVariableData);
    const hayTurnoSeleccionado = textoSeguro(nextFormData.id_turno);

    const hayError =
      typeof error === "string"
        ? textoSeguro(error)
        : error && textoSeguro(error.message || "");

    const puedeRegistrar = completos && hayTurnoSeleccionado && !hayError;
    setBotonEstado((prev) => ({
      ...prev,
      btnRegistrar: !puedeRegistrar,
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    const nextFormData = {
      ...formData,
      [name]: value,
    };

    if (name === "age_turn_paci_tipo_iden") {
      handleTipoIdentificacionChange(value);
    }

    validarDato(
      event,
      nextFormData,
      setFormData,
      error,
      setError,
      setBotonEstado,
    );

    actualizarEstadoBtnRegistrar(nextFormData, variableData);
  };

  const handleChangeVariable = (event) => {
    const { name, value } = event.target;

    const nextVariableData = {
      ...variableData,
      [name]: value,
    };

    setVariableData(nextVariableData);

    if (name === "age_turn_paci_tipo_espe") {
      handleFechIniFinTipoEspeChange(value);
    }
    if (name === "age_turn_paci_edit_agen_paci") {
      setBotonEstado((prev) => ({
        ...prev,
        btn_libe_turn_paci: !value,
      }));
      setShowEditarListaTurnos(value);
    }
    actualizarEstadoBtnRegistrar(formData, nextVariableData);
  };

  const handleChangeReporte = (event) => {
    const { name, value } = event.target;

    const nextReporteData = {
      ...reporteData,
      [name]: value,
    };

    setReporteData(nextReporteData);
  };

  useEffect(() => {
    actualizarEstadoBtnRegistrar(formData, variableData);
  }, [formData, variableData, error]);

  const handleTipoIdentificacionChange = (tipoIdentificacion) => {
    const esValido = tipoIdentificacion && tipoIdentificacion.trim() !== "";

    if (esValido) {
      setVariableEstado((prev) => ({
        ...prev,
        age_turn_paci_nume_iden: false,
      }));

      setBotonEstado((prev) => ({
        ...prev,
        btn_buscar_paciente: false,
        btn_busqueda_avanzada: false,
        btn_limpiar_formulario: false,
      }));
    } else {
      limpiarFormulario();
    }
  };

  const handleFechIniFinTipoEspeChange = (dato) => {
    const esValido = dato && dato.trim() !== "";

    if (esValido) {
      setBotonEstado((prev) => ({
        ...prev,
        btn_cargar_turnos: false,
      }));
    } else {
      limpiarFormulario();
    }
  };

  const isFieldVisible = () => {
    // Por defecto, visible
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    let tipoIden, numeIden;
    tipoIden = formData.age_turn_paci_tipo_iden;
    numeIden = formData.age_turn_paci_nume_iden;

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
      let response, responseListPaci;
      response = await buscarUsuarioAdmision(tipoIden, numeIden);
      responseListPaci = await listarAgendaPaciente(tipoIden, numeIden);
      const pacienteBase = mapAdmisionAPaciente(response?.data || {});
      const opcionesTurnos =
        Array.isArray(responseListPaci) && responseListPaci.length
          ? responseListPaci.map((t, index) => {
              const fecha = textoSeguro(t.adm_agen_turn_fech);
              const horaIni = textoSeguro(t.adm_agen_turn_hora_inic);
              const horaFin = textoSeguro(t.adm_agen_turn_hora_fin);
              const espe = textoSeguro(t.adm_agen_turn_tipo_espe);
              const unid = textoSeguro(t.adm_agen_turn_unid_salu);
              const pref = textoSeguro(t.adm_agen_turn_prof_cita);
              const estado =
                estadoTurnoMap[t.adm_agen_turn_esta_cita] || "DESCONOCIDO";
              return {
                value: t.id,
                label: `${index + 1}. ${fecha} ${horaIni}-${horaFin} | ${espe} | ${unid} | ${pref} | ${estado}`,
              };
            })
          : [];

      const textoTurnos = opcionesTurnos.length
        ? opcionesTurnos.map((o) => o.label).join("\n")
        : "No tiene turnos agendados registrados.";

      if (opcionesTurnos.length >= 1) {
        setBotonEstado((prev) => ({
          ...prev,
          btn_editar_lista_turnos: false,
        }));
      }
      setVariableData((prev) => ({
        ...prev,
        age_turn_paci_agen_paci: textoTurnos,
      }));
      setEditandoListaTurnos(opcionesTurnos);
      setFormData((prev) => ({
        ...prev,
        ...pacienteBase,
        age_turn_paci_tipo_iden: prev.age_turn_paci_tipo_iden,
        age_turn_paci_nume_iden: prev.age_turn_paci_nume_iden,
      }));
      const message =
        response?.message ||
        "Paciente encontrado en admisión. No tiene turnos asociados en agenda.";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 10000);
      toast.success(message, { position: "bottom-right" });
      variableEstadoTrue();
      botonEstadoTrue();
      setTurnosPaciente([]);
      setError("");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      toast.error(errorMessage, { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReporteSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    let tipoEspeRepo;
    tipoEspeRepo = reporteData.age_turn_paci_repo_tipo_espe;

    if (!fechaRepoInicio || !fechaRepoFin || !tipoEspeRepo) {
      const mensaje =
        "Se tiene que tener una fecha de inicio y fin válida, y un tipo de especialidad seleccionado para generar el reporte.";
      setError(mensaje);
      setTimeout(() => setError(""), 10000);
      setSuccessMessage("");
      toast.error(mensaje, { position: "bottom-right" });
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      let response;
      response = await buscarPacientesAgendados(
        tipoEspeRepo,
        fechaRepoInicio,
        fechaRepoFin,
      );
      setPacientesAgendados(response.data || []);
      const message =
        response?.message ||
        "Se generó el reporte de pacientes agendados exitosamente.";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 10000);
      toast.success(message, { position: "bottom-right" });
      limpiarFormularioReporte();
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

  const variableEstadoTrue = () => {
    setVariableEstado((prev) => ({
      ...prev,
      age_turn_paci_tipo_iden: true,
      age_turn_paci_nume_iden: true,
      age_turn_paci_fech_inic_fin: false,
      age_turn_paci_tipo_espe: false,
      age_turn_paci_tele: false,
      age_turn_paci_corr_paci: false,
      age_turn_paci_obse_paci: false,
      age_turn_paci_agen_paci: false,
    }));
  };

  const botonEstadoTrue = () => {
    setBotonEstado((prev) => ({
      ...prev,
      btnRegistrar: false,
      btn_busqueda_avanzada: true,
      btn_buscar_paciente: true,
    }));
  };

  const handleGuardarTurno = async () => {
    let id_turno, nombres;
    id_turno = formData.id_turno;
    nombres = formData.age_turn_paci_apel_nomb;

    if (!textoSeguro(id_turno)) {
      const mensaje = "El ID del turno es requerido.";
      setError(mensaje);
      setSuccessMessage("");
      toast.error(mensaje, { position: "bottom-right" });
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      let response;
      response = await actualizarTurnoAgendado(id_turno, formData);
      const pdfBlob = await pdfTurnoAgendaPaciente(id_turno);
      const url = globalThis.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `turno_${nombres}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
      const message = response?.message || "Turno guardado exitosamente.";
      const messagePdfTurno = "Se generó el PDF del turno.";
      setSuccessMessage(message);
      setSuccessMessage(messagePdfTurno);
      setTimeout(() => setSuccessMessage(""), 10000);
      toast.success(message, { position: "bottom-right" });
      toast.success(messagePdfTurno, { position: "bottom-right" });
      await handleListarTurnos();
      limpiarFormulario();
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

  const handleTurnoSeleccionado = (id) => {
    const nextFormData = {
      ...formData,
      id_turno: id,
    };

    setFormData(nextFormData);
    actualizarEstadoBtnRegistrar(nextFormData, variableData);
  };

  const handleConfirmarTurnoSeleccionado = async () => {
    let id_turno;
    id_turno = variableData.age_turn_paci_agen_paci;
    if (id_turno == "") {
      toast.error("Seleccione un turno a confirmar.", {
        position: "bottom-right",
      });
      return;
    }
  };

  const handleCancelarTurnoSeleccionado = async () => {
    let id_turno;
    id_turno = variableData.age_turn_paci_agen_paci;
    if (id_turno == "") {
      toast.error("Seleccione un turno a cancelar.", {
        position: "bottom-right",
      });
      return;
    }
  };

  const handleLiberarTurnoSeleccionado = async () => {
    let id_turno;
    id_turno = variableData.age_turn_paci_edit_agen_paci;
    if (id_turno == "") {
      toast.error("Seleccione un turno a liberar.", {
        position: "bottom-right",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await actualizarAgenda(id_turno, {});
      toast.success(response?.message || "Turno liberado correctamente.", {
        position: "bottom-right",
      });
      limpiarFormulario();
    } catch (e) {
      toast.error(getErrorMessage(e), { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const fechaReferencia = format(rangeInicio, "yyyy-MM-dd");
  const fechaInicio = fechaReferencia;
  const fechaFin = format(rangeFin, "yyyy-MM-dd");

  const fechaRepoReferencia = format(rangeRepoInicio, "yyyy-MM-dd");
  const fechaRepoInicio = fechaRepoReferencia;
  const fechaRepoFin = format(rangeRepoFin, "yyyy-MM-dd");

  const handleListarTurnos = async () => {
    let tipoEspe;
    tipoEspe = variableData.age_turn_paci_tipo_espe;

    if (!fechaInicio || !fechaFin || !tipoEspe) {
      setError(
        "Debe seleccionar la Fecha Inicio/Final y el Tipo de Especialidad.",
      );
      setTimeout(() => setError(""), 5000);
      toast.error(
        "Debe seleccionar la Fecha Inicio/Final y el Tipo de Especialidad.",
        {
          position: "bottom-right",
        },
      );
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      let response;
      response = await buscarTurnosAgendados(tipoEspe, fechaInicio, fechaFin);
      const message = response?.message || "Listar turnos!";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 10000);
      toast.success(message, { position: "bottom-right" });
      setTurnosPaciente(response.data || []);
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

  const handleSeleccionarAdmisionado = (registro) => {
    let tipo, num;
    tipo = registro.adm_dato_pers_tipo_iden || "";
    num = registro.adm_dato_pers_nume_iden || "";
    if (!tipo || !num) return;

    setFormData((prev) => ({
      ...prev,
      age_turn_paci_tipo_iden: tipo,
      age_turn_paci_nume_iden: num,
    }));
    setShowBusquedaAvanzada(false);
  };

  const handleEditarListaTurnos = () => {
    setShowEditarListaTurnos(true);
    setVariableEstado((prev) => ({
      ...prev,
      age_turn_paci_edit_agen_paci: false,
    }));
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar, calendarRef]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        calendarRefRepo.current &&
        !calendarRefRepo.current.contains(event.target)
      ) {
        setShowRepoCalendar(false);
      }
    }
    if (showRepoCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRepoCalendar, calendarRefRepo]);

  React.useEffect(() => {
    let mounted = true;

    const cargarProfesionales = async () => {
      try {
        const unidadSaludData = await buscarUsuarioIdUnidadSalud();
        const unidades = Array.isArray(unidadSaludData?.data?.unidades_data)
          ? unidadSaludData.data.unidades_data
          : [];
        const unidadSaludListFormatted = unidades.map((u) => ({
          value: u.id?.toString(),
          label: `${u.uni_unic}`,
        }));
        setUnidadSaludList(unidadSaludListFormatted);
      } catch (error) {
        const errorMessage =
          getErrorMessage(error) ||
          "No se pudo cargar la lista de profesionales.";
        setError(errorMessage);
        setTimeout(() => setError(""), 10000);
        setSuccessMessage("");
        toast.error(errorMessage, { position: "bottom-right" });
      } finally {
        setIsLoading(false);
      }
    };

    cargarProfesionales();
    return () => {
      mounted = false;
    };
  }, []);

  const limpiarFormulario = () => {
    setFormData(initialState);
    setVariableData(initialVariableState);
    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
    setTurnosPaciente([]);
    setEditandoListaTurnos([]);
    setError("");
    setSuccessMessage("");
    setShowEditarListaTurnos(false);
  };

  const limpiarFormularioBusqAvan = () => {
    setFormData((prev) => ({
      ...prev,
      age_turn_paci_apel_nomb: "",
      age_turn_paci_tele: "",
      age_turn_paci_corr_paci: "",
      age_turn_paci_unid_salu_resp_segu_aten_paci: "",
      age_turn_paci_dire_paci: "",
      age_turn_paci_obse_paci: "",
    }));
    setVariableData(initialVariableState);
    setTurnosPaciente([]);
    setEditandoListaTurnos([]);
    setError("");
    setSuccessMessage("");
    setShowEditarListaTurnos(false);
  };

  const limpiarFormularioReporte = () => {
    setReporteData(initialReporteState);
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
  const tableStyles = {
    container:
      "overflow-x-auto rounded-lg shadow max-w-full border-2 border-gray-300 sm:border my-4",
    table: "w-full table-auto border-collapse bg-white",
    thead: "bg-gray-50 border-b border-gray-300",
    th: "px-1 py-1.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-x border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]",
    tbody: "divide-y divide-gray-200",
    td: "px-1 py-2 text-sm text-gray-600 border-x border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]",
    actionButton:
      "p-1 text-blue-700 hover:text-blue-800 hover:bg-blue-100 rounded focus:outline-none focus:shadow-outline cursor-pointer",
    deleteButton: "p-1 text-red-700 hover:text-red-800 hover:bg-red-50 rounded",
    trHover: "hover:bg-gray-50 transition-colors duration-150",
  };

  const unidadSaludLabels = unidadSaludList.map((u) => u.label);
  const tabs = [
    { label: "Datos para Agenda", key: "agenda" },
    { label: "Datos para Reporte", key: "reporte" },
  ];

  return (
    <div className="w-auto h-auto flex items-stretch justify-stretch bg-gray-100">
      <div className="w-full h-full p-4 m-4 bg-white rounded-lg shadow-md mt-1">
        <h2 className="text-2xl font-bold mb-1 text-center text-blue-700">
          Agenda de Turnos para Pacientes
        </h2>
        <p className="text-base text-center text-black">
          <strong>Nota:</strong> Los campos con{" "}
          <span className="text-red-500">*</span> son obligatorios.
        </p>
        <nav className="w-full flex overflow-x-auto no-scrollbar space-x-2 border-b border-blue-200 mb-1 bg-white items-center justify-center px-1 py-1 relative">
          {tabs.map(
            (tab) =>
              tab.key && (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-1 py-1 sm:px-2 sm:py-1 rounded-e-full font-bold transition-colors duration-200 whitespace-nowrap
          ${
            activeTab === tab.key
              ? "bg-blue-600 text-white shadow"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
                >
                  {tab.label}
                </button>
              ),
          )}
        </nav>
        {isLoading && (
          <Loader
            modal
            isOpen={isLoading}
            title="Procesando información"
            text="Por favor espere..."
            closeButton={false}
          />
        )}
        {activeTab === "agenda" && (
          <>
            <form onSubmit={handleSubmit} autoComplete="on" className="w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <fieldset className="border border-blue-200 rounded p-2 mb-1 sm:col-span-2 md:col-span-2 lg:col-span-2">
                  <legend className="text-lg font-semibold text-blue-600 px-2">
                    Busqueda del Paciente
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2">
                    <div className={fieldClass}>
                      <label
                        className={labelClass}
                        htmlFor="age_turn_paci_tipo_iden"
                      >
                        {requiredFields.includes("age_turn_paci_tipo_iden") && (
                          <span className="text-red-500">* </span>
                        )}
                        {labelMap["age_turn_paci_tipo_iden"]}
                      </label>
                      <CustomSelect
                        id="age_turn_paci_tipo_iden"
                        name="age_turn_paci_tipo_iden"
                        value={formData["age_turn_paci_tipo_iden"]}
                        onChange={handleChange}
                        options={allListAdmision.adm_dato_pers_tipo_iden || []}
                        placeholder="Seleccione el tipo de identificacion"
                        disabled={variableEstado["age_turn_paci_tipo_iden"]}
                        variableEstado={variableEstado}
                        className={
                          isFieldInvalid(
                            "age_turn_paci_tipo_iden",
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
                          htmlFor="age_turn_paci_nume_iden"
                        >
                          {requiredFields.includes(
                            "age_turn_paci_nume_iden",
                          ) && <span className="text-red-500">* </span>}
                          {labelMap["age_turn_paci_nume_iden"]}
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
                          id="age_turn_paci_nume_iden"
                          name="age_turn_paci_nume_iden"
                          value={formData["age_turn_paci_nume_iden"]}
                          onChange={handleChange}
                          placeholder="Ingrese la identificacion del paciente"
                          autoComplete="on"
                          required
                          className={`${inputStyle}
                      ${isFieldInvalid("age_turn_paci_nume_iden", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""}
                      ${variableEstado["age_turn_paci_nume_iden"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                          disabled={variableEstado["age_turn_paci_nume_iden"]}
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
                <fieldset className="border border-blue-200 rounded p-2 mb-1 sm:col-span-2 md:col-span-2 lg:col-span-2">
                  <legend className="text-lg font-semibold text-blue-600 px-2">
                    Turnos Disponibles por Especialidad
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                    <div className={fieldClass}>
                      <label
                        className={labelClass}
                        htmlFor="age_turn_paci_fech_inic_fin"
                      >
                        <span className="inline-flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {requiredFields.includes(
                            "age_turn_paci_fech_inic_fin",
                          ) && <span className="text-red-500">* </span>}
                          {labelMap["age_turn_paci_fech_inic_fin"]}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          id="age_turn_paci_fech_inic_fin"
                          name="age_turn_paci_fech_inic_fin"
                          type="text"
                          readOnly
                          value={
                            rangeInicio && rangeFin
                              ? `${format(rangeInicio, "yyyy-MM-dd")} - ${format(rangeFin, "yyyy-MM-dd")}`
                              : "Selecciona el rango de fechas"
                          }
                          onClick={() => setShowCalendar(true)}
                          className={`${inputStyle}
                        ${
                          isFieldInvalid(
                            "age_turn_paci_fech_inic_fin",
                            requiredFields,
                            formData,
                            isFieldVisible,
                          ) && !(rangeInicio && rangeFin)
                            ? "border-2 border-red-500"
                            : ""
                        }
                        ${variableEstado["age_turn_paci_fech_inic_fin"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                          disabled={
                            variableEstado["age_turn_paci_fech_inic_fin"]
                          }
                        />
                        {rangeInicio && rangeFin && (
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                            onClick={() => {
                              setRangeInicio(null);
                              setRangeFin(null);
                            }}
                            title="Limpiar fechas"
                          >
                            X
                          </button>
                        )}
                        {showCalendar && (
                          <div
                            ref={calendarRef}
                            className="absolute z-50 mt-2 left-0 bg-white border border-blue-200 rounded-lg shadow-lg"
                          >
                            <DateRange
                              ranges={range}
                              onChange={(ranges) => {
                                onRangeChange(ranges);
                                setShowCalendar(false);
                              }}
                              moveRangeOnFirstSelection={false}
                              direction="horizontal"
                              locale={esES}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={fieldClass}>
                      <label
                        className={labelClass}
                        htmlFor="age_turn_paci_tipo_espe"
                      >
                        {requiredFields.includes("age_turn_paci_tipo_espe") && (
                          <span className="text-red-500">* </span>
                        )}
                        {labelMap["age_turn_paci_tipo_espe"]}
                      </label>
                      <div className="flex items-center gap-0 mb-0">
                        <CustomSelect
                          id="age_turn_paci_tipo_espe"
                          name="age_turn_paci_tipo_espe"
                          value={variableData.age_turn_paci_tipo_espe}
                          onChange={handleChangeVariable}
                          options={allListAgenda.adm_agen_turn_tipo_espe || []}
                          placeholder="Seleccione el tipo de especialidad"
                          disabled={variableEstado["age_turn_paci_tipo_espe"]}
                          variableEstado={variableEstado}
                          className={
                            isFieldInvalid(
                              "age_turn_paci_tipo_espe",
                              requiredFields,
                              variableData,
                              isFieldVisible,
                            )
                              ? "border-2 border-red-500"
                              : ""
                          }
                        />
                        <button
                          type="button"
                          id="btn_cargar_turnos"
                          name="btn_cargar_turnos"
                          onClick={handleListarTurnos}
                          className={`${botonEstado.btn_cargar_turnos ? buttonStyleDesactivado : buttonStyleOtro}`}
                          disabled={botonEstado.btn_cargar_turnos}
                        >
                          Turnos
                        </button>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
              <fieldset className="border border-blue-200 rounded p-3 mb-4">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Datos del Paciente
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="age_turn_paci_apel_nomb"
                    >
                      {requiredFields.includes("age_turn_paci_apel_nomb") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["age_turn_paci_apel_nomb"]}
                    </label>
                    <input
                      type="text"
                      id="age_turn_paci_apel_nomb"
                      name="age_turn_paci_apel_nomb"
                      value={formData["age_turn_paci_apel_nomb"]}
                      readOnly
                      onChange={handleChange}
                      placeholder="Información es requerida"
                      className={`${inputStyle}
                  ${isFieldInvalid("age_turn_paci_apel_nomb", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} 
                  ${variableEstado["age_turn_paci_apel_nomb"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                      disabled={variableEstado["age_turn_paci_apel_nomb"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label className={labelClass} htmlFor="age_turn_paci_tele">
                      {requiredFields.includes("age_turn_paci_tele") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["age_turn_paci_tele"]}
                    </label>
                    <input
                      type="tel"
                      id="age_turn_paci_tele"
                      name="age_turn_paci_tele"
                      value={formData["age_turn_paci_tele"]}
                      onChange={handleChange}
                      placeholder="0911122233"
                      autoComplete="tel"
                      maxLength={10}
                      className={`${inputStyle}
                  ${isFieldInvalid("age_turn_paci_tele", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} 
                  ${variableEstado["age_turn_paci_tele"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                      disabled={variableEstado["age_turn_paci_tele"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="age_turn_paci_corr_paci"
                    >
                      {requiredFields.includes("age_turn_paci_corr_paci") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["age_turn_paci_corr_paci"]}
                    </label>
                    <input
                      type="email"
                      id="age_turn_paci_corr_paci"
                      name="age_turn_paci_corr_paci"
                      value={formData["age_turn_paci_corr_paci"]}
                      onChange={handleChange}
                      placeholder="ejemplo@dominio.com"
                      autoComplete="email"
                      className={`${inputStyle}
                  ${isFieldInvalid("age_turn_paci_corr_paci", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} 
                  ${variableEstado["age_turn_paci_corr_paci"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                      disabled={variableEstado["age_turn_paci_corr_paci"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="age_turn_paci_unid_salu_resp_segu_aten_paci"
                    >
                      {requiredFields.includes(
                        "age_turn_paci_unid_salu_resp_segu_aten_paci",
                      ) && <span className="text-red-500">* </span>}
                      {labelMap["age_turn_paci_unid_salu_resp_segu_aten_paci"]}
                    </label>
                    <input
                      type="text"
                      id="age_turn_paci_unid_salu_resp_segu_aten_paci"
                      name="age_turn_paci_unid_salu_resp_segu_aten_paci"
                      value={
                        formData["age_turn_paci_unid_salu_resp_segu_aten_paci"]
                      }
                      onChange={handleChange}
                      readOnly
                      placeholder="Información es requerida"
                      className={`${inputStyle}
                  ${isFieldInvalid("age_turn_paci_unid_salu_resp_segu_aten_paci", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} 
                  ${variableEstado["age_turn_paci_unid_salu_resp_segu_aten_paci"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                      disabled={
                        variableEstado[
                          "age_turn_paci_unid_salu_resp_segu_aten_paci"
                        ]
                      }
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="age_turn_paci_dire_paci"
                    >
                      {requiredFields.includes("age_turn_paci_dire_paci") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["age_turn_paci_dire_paci"]}
                    </label>
                    <input
                      type="text"
                      id="age_turn_paci_dire_paci"
                      name="age_turn_paci_dire_paci"
                      value={formData["age_turn_paci_dire_paci"]}
                      onChange={handleChange}
                      readOnly
                      placeholder="Información es requerida"
                      className={`${inputStyle}
                  ${isFieldInvalid("age_turn_paci_dire_paci", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} 
                  ${variableEstado["age_turn_paci_dire_paci"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                      disabled={variableEstado["age_turn_paci_dire_paci"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="age_turn_paci_obse_paci"
                    >
                      {requiredFields.includes("age_turn_paci_obse_paci") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["age_turn_paci_obse_paci"]}
                    </label>
                    <textarea
                      id="age_turn_paci_obse_paci"
                      name="age_turn_paci_obse_paci"
                      value={formData["age_turn_paci_obse_paci"]}
                      onChange={handleChange}
                      placeholder="Observaciones para el paciente, alergias, etc."
                      autoComplete="street-address"
                      maxLength={400}
                      className={`${inputStyle}${isFieldInvalid("age_turn_paci_obse_paci", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_obse_paci"] ? "bg-gray-200 text-gray-700 h-10 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                      title="Observaciones generales sobre el paciente, alergias, etc."
                      disabled={variableEstado["age_turn_paci_obse_paci"]}
                    />
                    <span className="text-xs text-gray-500">
                      Máximo 400 caracteres
                    </span>
                  </div>
                  <div
                    className={`${fieldClass} sm:col-span-2 md:col-span-2 lg:col-span-2`}
                  >
                    <label
                      className={labelClass}
                      htmlFor="age_turn_paci_agen_paci"
                    >
                      {requiredFields.includes("age_turn_paci_agen_paci") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["age_turn_paci_agen_paci"]}
                    </label>
                    {!showEditarListaTurnos && (
                      <div className="flex items-center gap-0 mb-0">
                        <textarea
                          id="age_turn_paci_agen_paci"
                          name="age_turn_paci_agen_paci"
                          value={variableData["age_turn_paci_agen_paci"]}
                          onChange={handleChangeVariable}
                          placeholder="Listado de turnos agendados para el paciente."
                          readOnly
                          className={`${inputStyle} font-mono text-sm resize-none transition-all duration-200 ${
                            variableEstado["age_turn_paci_agen_paci"]
                              ? "bg-gray-200 text-gray-700 h-10 cursor-no-drop"
                              : `${isHistorialExpandido ? "h-48 overflow-auto bg-white cursor-default" : "h-10 overflow-hidden bg-gray-50 cursor-pointer"}`
                          }`}
                          onFocus={() => setIsHistorialExpandido(true)}
                          onClick={() => setIsHistorialExpandido(true)}
                          onBlur={() => setIsHistorialExpandido(false)}
                          title="Clic para ver todo; clic fuera para comprimir"
                          disabled={variableEstado["age_turn_paci_agen_paci"]}
                        />
                        <button
                          type="button"
                          id="btn_editar_lista_turnos"
                          name="btn_editar_lista_turnos"
                          onClick={handleEditarListaTurnos}
                          className={`${botonEstado.btn_editar_lista_turnos ? buttonStyleDesactivado : buttonStyleOtro}`}
                          disabled={botonEstado.btn_editar_lista_turnos}
                        >
                          Editar
                        </button>
                      </div>
                    )}
                    {showEditarListaTurnos && (
                      <div className="flex flex-col items-center gap-1 mb-0 w-full">
                        <CustomSelect
                          id="age_turn_paci_edit_agen_paci"
                          name="age_turn_paci_edit_agen_paci"
                          value={variableData.age_turn_paci_edit_agen_paci}
                          onChange={handleChangeVariable}
                          options={editandoListaTurnos}
                          placeholder="Seleccione el turno a liberar"
                          disabled={
                            variableEstado["age_turn_paci_edit_agen_paci"]
                          }
                          variableEstado={variableEstado}
                          className={
                            isFieldInvalid(
                              "age_turn_paci_edit_agen_paci",
                              requiredFields,
                              variableData,
                              isFieldVisible,
                            )
                              ? "border-2 border-red-500"
                              : "z-50"
                          }
                          style={{ minWidth: 0, flex: 1 }}
                        />
                        <button
                          type="button"
                          id="btn_libe_turn_paci"
                          name="btn_libe_turn_paci"
                          onClick={handleLiberarTurnoSeleccionado}
                          className={`${botonEstado.btn_libe_turn_paci ? buttonStyleDesactivado : buttonStyleOtro}`}
                          disabled={botonEstado.btn_libe_turn_paci}
                        >
                          Liberar Turno
                        </button>
                      </div>
                    )}
                    <span className="text-xs text-gray-500">
                      NOTA: Listado de turnos del paciente, solo las 10 ultimos
                      turnos agendados.
                    </span>
                  </div>
                </div>
              </fieldset>
              <div className="md:col-span-2 flex justify-center mt-1">
                <button
                  type="button"
                  id="btnRegistrar"
                  name="btnRegistrar"
                  onClick={handleGuardarTurno}
                  className={`${botonEstado.btnRegistrar ? buttonStyleDesactivado : buttonStyleGuardar}`}
                  disabled={botonEstado.btnRegistrar}
                >
                  Guardar Turno
                </button>
                <button
                  id="btn_limpiar_formulario"
                  name="btn_limpiar_formulario"
                  type="button"
                  className={`${botonEstado.btn_limpiar_formulario ? buttonStyleDesactivado : buttonStyleCancelar}`}
                  onClick={limpiarFormulario}
                  disabled={botonEstado.btn_limpiar_formulario}
                >
                  Limpiar
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
            <fieldset className="border border-blue-200 rounded p-3">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Turnos Disponibles
              </legend>
              <div className={`${tableStyles.container} bg-white/90`}>
                <table className={`${tableStyles.table} text-base`}>
                  <thead className={`${tableStyles.thead}`}>
                    <tr>
                      <th className={tableStyles.th} colSpan={3}>
                        Turno - Fecha y Hora
                      </th>
                      {TABLE_HEADERS.map((header) => (
                        <th
                          key={header}
                          scope="col"
                          className={`${tableStyles.th} sticky top-0 z-10 bg-gray-50`}
                          title={header}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`${tableStyles.tbody}`}>
                    {currentRows.map((registro) => {
                      const unidadSaludTurno =
                        registro.adm_agen_turn_rese_unic_salu;
                      const isReservado =
                        registro.adm_agen_turn_esta_cita === 2;
                      const esUnidadUsuario =
                        unidadSaludLabels.includes(unidadSaludTurno);
                      return (
                        <tr
                          key={registro.id}
                          className={`${tableStyles.trHover} odd:bg-white even:bg-gray-50`}
                        >
                          <td
                            className={`${tableStyles.td} align-top`}
                            colSpan={3}
                          >
                            {isReservado && !esUnidadUsuario ? (
                              // Solo texto, NO botón
                              <span className="p-1 flex flex-col items-start opacity-60 cursor-not-allowed select-none">
                                {registro.adm_agen_turn_fech}
                                {" - "}
                                {registro.adm_agen_turn_hora_inic}
                                {" - "}
                                {registro.adm_agen_turn_hora_fin}
                                {" : "}
                                {registro.adm_agen_turn_dura_cita} min
                              </span>
                            ) : (
                              // Botón habilitado
                              <button
                                className={
                                  tableStyles.actionButton +
                                  " w-full flex flex-col items-start"
                                }
                                onClick={() =>
                                  handleTurnoSeleccionado(registro.id)
                                }
                                type="button"
                                aria-label="Seleccionar turno"
                                title="Seleccionar turno"
                              >
                                <span>
                                  {formData.id_turno === registro.id ? (
                                    <BsCalendarCheckFill className="inline text-green-600" />
                                  ) : (
                                    <BsCalendar3 className="inline" />
                                  )}{" "}
                                  {registro.adm_agen_turn_fech}
                                  {" - "}
                                  {registro.adm_agen_turn_hora_inic}
                                  {" - "}
                                  {registro.adm_agen_turn_hora_fin}
                                  {" : "}
                                  {registro.adm_agen_turn_dura_cita} min
                                </span>
                              </button>
                            )}
                          </td>
                          {Object.keys(registro)
                            .filter(
                              (key) =>
                                ![
                                  "id",
                                  "adm_agen_turn_fech",
                                  "adm_agen_turn_hora_inic",
                                  "adm_agen_turn_hora_fin",
                                  "adm_agen_turn_dura_cita",
                                  "adm_agen_turn_rese_unic_salu",
                                ].includes(key),
                            )
                            .map((key) => {
                              let cellContent;
                              switch (key) {
                                case "adm_agen_turn_unid_salu":
                                  cellContent = (
                                    <span
                                      className="truncate block text-blue-600 hover:text-blue-800"
                                      title={registro[key]}
                                    >
                                      {registro[key]}
                                    </span>
                                  );
                                  break;
                                case "adm_agen_turn_esta_cita": {
                                  const estado =
                                    estadoTurnoMap[registro[key]] || "";
                                  let color =
                                    "bg-gray-100 text-gray-700 ring-gray-400";
                                  if (estado === "DISPONIBLE") {
                                    color =
                                      "bg-green-100 text-black ring-green-400";
                                  } else if (estado === "RESERVADO/A") {
                                    color =
                                      "bg-orange-100 text-orange-700 ring-orange-400";
                                  }
                                  cellContent = (
                                    <div>
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${color}`}
                                      >
                                        {estado}
                                      </span>
                                      {registro.adm_agen_turn_rese_unic_salu && (
                                        <div className="mt-1 text-xs text-black font-medium">
                                          {unidadesSalud[
                                            registro
                                              .adm_agen_turn_rese_unic_salu
                                          ] || ""}
                                        </div>
                                      )}
                                    </div>
                                  );
                                  break;
                                }
                                default:
                                  cellContent =
                                    typeof registro[key] === "object" ? (
                                      <span
                                        className="truncate block text-gray-600"
                                        title={JSON.stringify(registro[key])}
                                      >
                                        {JSON.stringify(registro[key])}
                                      </span>
                                    ) : (
                                      <span
                                        className="truncate block text-gray-700"
                                        title={registro[key]}
                                      >
                                        {registro[key]}
                                      </span>
                                    );
                              }
                              return (
                                <td key={key} className={tableStyles.td}>
                                  {cellContent}
                                </td>
                              );
                            })}
                        </tr>
                      );
                    })}
                    {currentRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={1 + TABLE_HEADERS.length}
                          className="px-4 py-8 text-center text-sm text-gray-500"
                        >
                          {searchTerm
                            ? "No hay resultados para la búsqueda."
                            : "No hay registros."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between sm:items-center mt-2 px-1">
                <div className="text-xs sm:text-sm text-gray-700">
                  Mostrando{" "}
                  <span className="font-medium">
                    {filteredUsers.length === 0 ? 0 : indexOfFirstRow + 1}
                  </span>{" "}
                  –{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastRow, filteredUsers.length)}
                  </span>{" "}
                  de <span className="font-medium">{filteredUsers.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="rowsPerPage"
                      className="text-xs text-gray-700"
                    >
                      Filas:
                    </label>
                    <select
                      id="rowsPerPage"
                      value={rowsPerPage}
                      onChange={(e) => setRowsPerPage(Number(e.target.value))}
                      className="px-2 py-1 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-300"
                    >
                      {[5, 10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
                    title="Primera página"
                  >
                    «
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700 px-1">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Siguiente
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
                    title="Última página"
                  >
                    »
                  </button>
                </div>
              </div>
            </fieldset>
          </>
        )}
        {activeTab === "reporte" && (
          <>
            <form
              onSubmit={handleReporteSubmit}
              autoComplete="on"
              className="w-full"
            >
              <fieldset className="border border-blue-200 rounded p-2 mb-1">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Reporte de Turnos Agendados
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="age_turn_paci_repo_fech_inic_fin"
                    >
                      <span className="inline-flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {requiredFields.includes(
                          "age_turn_paci_repo_fech_inic_fin",
                        ) && <span className="text-red-500">* </span>}
                        {labelMap["age_turn_paci_repo_fech_inic_fin"]}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        id="age_turn_paci_repo_fech_inic_fin"
                        name="age_turn_paci_repo_fech_inic_fin"
                        type="text"
                        readOnly
                        value={
                          rangeRepoInicio && rangeRepoFin
                            ? `${format(rangeRepoInicio, "yyyy-MM-dd")} - ${format(rangeRepoFin, "yyyy-MM-dd")}`
                            : "Selecciona el rango de fechas"
                        }
                        onClick={() => setShowRepoCalendar(true)}
                        className={`${inputStyle}
                        ${
                          isFieldInvalid(
                            "age_turn_paci_repo_fech_inic_fin",
                            requiredFields,
                            formData,
                            isFieldVisible,
                          ) && !(rangeRepoInicio && rangeRepoFin)
                            ? "border-2 border-red-500"
                            : ""
                        }
                        ${variableEstado["age_turn_paci_repo_fech_inic_fin"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                        disabled={
                          variableEstado["age_turn_paci_repo_fech_inic_fin"]
                        }
                      />
                      {rangeRepoInicio && rangeRepoFin && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                          onClick={() => {
                            setRangeRepoInicio(null);
                            setRangeRepoFin(null);
                          }}
                          title="Limpiar fechas"
                        >
                          X
                        </button>
                      )}
                      {showRepoCalendar && (
                        <div
                          ref={calendarRefRepo}
                          className="absolute z-50 mt-2 left-0 bg-white border border-blue-200 rounded-lg shadow-lg"
                        >
                          <DateRange
                            ranges={rangeRepo}
                            onChange={(ranges) => {
                              onRangeRepoChange(ranges);
                              setShowRepoCalendar(false);
                            }}
                            moveRangeOnFirstSelection={false}
                            direction="horizontal"
                            locale={esES}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="age_turn_paci_repo_tipo_espe"
                    >
                      {requiredFields.includes(
                        "age_turn_paci_repo_tipo_espe",
                      ) && <span className="text-red-500">* </span>}
                      {labelMap["age_turn_paci_repo_tipo_espe"]}
                    </label>
                    <div className="flex items-center gap-0 mb-0">
                      <CustomSelect
                        id="age_turn_paci_repo_tipo_espe"
                        name="age_turn_paci_repo_tipo_espe"
                        value={reporteData.age_turn_paci_repo_tipo_espe}
                        onChange={handleChangeReporte}
                        options={allListAgenda.adm_agen_turn_tipo_espe || []}
                        placeholder="Seleccione el tipo de especialidad"
                        disabled={
                          variableEstado["age_turn_paci_repo_tipo_espe"]
                        }
                        variableEstado={variableEstado}
                        className={
                          isFieldInvalid(
                            "age_turn_paci_repo_tipo_espe",
                            requiredFields,
                            variableData,
                            isFieldVisible,
                          )
                            ? "border-2 border-red-500"
                            : ""
                        }
                      />
                      <button
                        type="submit"
                        id="btn_reporte_turnos"
                        name="btn_reporte_turnos"
                        className={`${botonEstado.btn_reporte_turnos ? buttonStyleDesactivado : buttonStyleOtro}`}
                        disabled={botonEstado.btn_reporte_turnos}
                      >
                        Buscar
                      </button>
                    </div>
                  </div>
                </div>
              </fieldset>
              <div className="md:col-span-2 flex justify-center mt-1">
                <button
                  type="button"
                  id="btnRegistrar"
                  name="btnRegistrar"
                  onClick={handleGuardarTurno}
                  className={`${botonEstado.btnRegistrar ? buttonStyleDesactivado : buttonStyleGuardar}`}
                  disabled={botonEstado.btnRegistrar}
                >
                  Guardar Turno
                </button>
                <button
                  id="btn_limpiar_formulario"
                  name="btn_limpiar_formulario"
                  type="button"
                  className={`${botonEstado.btn_limpiar_formulario ? buttonStyleDesactivado : buttonStyleCancelar}`}
                  onClick={limpiarFormulario}
                  disabled={botonEstado.btn_limpiar_formulario}
                >
                  Limpiar
                </button>
              </div>
            </form>
            <fieldset className="border border-blue-200 rounded p-3">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Turnos Agendados para el Paciente
              </legend>
              <div className={`${tableStyles.container} bg-white/90`}>
                <table className={`${tableStyles.table} text-base`}>
                  <thead className={`${tableStyles.thead}`}>
                    <tr>
                      <th className={tableStyles.th}>Accion</th>
                      <th className={tableStyles.th} colSpan={3}>
                        Turno - Fecha y Hora
                      </th>
                      {TABLE_HEADERS_REPORTE.map((header) => (
                        <th
                          key={header}
                          scope="col"
                          className={`${tableStyles.th} sticky top-0 z-10 bg-gray-50`}
                          title={header}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`${tableStyles.tbody}`}>
                    {currentRowsReporte.map((registro) => {
                      return (
                        <tr
                          key={registro.id}
                          className={`${tableStyles.trHover} odd:bg-white even:bg-gray-50`}
                        >
                          <td className={`${tableStyles.td} align-top`}>
                            <button
                              className={
                                tableStyles.actionButton +
                                " w-full flex flex-col items-start"
                              }
                              onClick={() =>
                                handleConfirmarTurnoSeleccionado(registro.id)
                              }
                              type="button"
                              aria-label="Seleccionar turno"
                              title="Seleccionar turno"
                            >
                              <span>
                                <BsCalendar3 className="inline" />
                              </span>
                            </button>
                            <button
                              className={
                                tableStyles.actionButton +
                                " w-full flex flex-col items-start"
                              }
                              onClick={() =>
                                handleCancelarTurnoSeleccionado(registro.id)
                              }
                              type="button"
                              aria-label="Seleccionar turno"
                              title="Seleccionar turno"
                            >
                              <span>
                                <BsCalendar3 className="inline" />
                              </span>
                            </button>
                          </td>
                          <td
                            className={`${tableStyles.td} align-top`}
                            colSpan={3}
                          >
                            <span className="p-1 flex flex-col items-start text-black">
                              {registro.adm_agen_turn_fech}
                              {" - "}
                              {registro.adm_agen_turn_hora_inic}
                              {" - "}
                              {registro.adm_agen_turn_hora_fin}
                              {" : "}
                              {registro.adm_agen_turn_dura_cita} min
                            </span>
                          </td>
                          {Object.keys(registro)
                            .filter(
                              (key) =>
                                ![
                                  "id",
                                  "adm_agen_turn_fech",
                                  "adm_agen_turn_hora_inic",
                                  "adm_agen_turn_hora_fin",
                                  "adm_agen_turn_dura_cita",
                                  "adm_agen_turn_rese_unic_salu",
                                  "adm_agen_turn_apel_nomb_paci",
                                ].includes(key),
                            )
                            .map((key) => {
                              let cellContent;
                              switch (key) {
                                case "adm_agen_turn_unid_salu":
                                  cellContent = (
                                    <span
                                      className="truncate block text-black hover:text-black/80"
                                      title={registro[key]}
                                    >
                                      {registro[key]}
                                    </span>
                                  );
                                  break;
                                case "adm_agen_turn_esta_cita": {
                                  const estado =
                                    estadoTurnoMap[registro[key]] || "";
                                  let color =
                                    "bg-gray-100 text-gray-700 ring-gray-400";
                                  if (estado === "AGENDADO/A") {
                                    color =
                                      "bg-green-100 text-black ring-green-400";
                                  }
                                  cellContent = (
                                    <div>
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${color}`}
                                      >
                                        {estado}
                                      </span>
                                      {registro.adm_agen_turn_rese_unic_salu && (
                                        <div className="mt-1 text-xs text-black font-medium">
                                          {unidadesSalud[
                                            registro
                                              .adm_agen_turn_rese_unic_salu
                                          ] || ""}
                                        </div>
                                      )}
                                    </div>
                                  );
                                  break;
                                }
                                case "adm_agen_turn_nume_iden_paci":
                                  cellContent = (
                                    <span
                                      className="p-1 flex flex-col truncate items-start text-black"
                                      title={`${registro.adm_agen_turn_nume_iden_paci} - ${registro.adm_agen_turn_apel_nomb_paci}`}
                                    >
                                      {registro.adm_agen_turn_nume_iden_paci}
                                      {" - "}
                                      {registro.adm_agen_turn_apel_nomb_paci}
                                    </span>
                                  );
                                  break;
                                default:
                                  cellContent =
                                    typeof registro[key] === "object" ? (
                                      <span
                                        className="truncate block text-gray-600"
                                        title={JSON.stringify(registro[key])}
                                      >
                                        {JSON.stringify(registro[key])}
                                      </span>
                                    ) : (
                                      <span
                                        className="truncate block text-gray-700"
                                        title={registro[key]}
                                      >
                                        {registro[key]}
                                      </span>
                                    );
                              }
                              return (
                                <td key={key} className={tableStyles.td}>
                                  {cellContent}
                                </td>
                              );
                            })}
                        </tr>
                      );
                    })}
                    {currentRowsReporte.length === 0 && (
                      <tr>
                        <td
                          colSpan={1 + TABLE_HEADERS_REPORTE.length}
                          className="px-4 py-8 text-center text-sm text-gray-500"
                        >
                          {searchTerm
                            ? "No hay resultados para la búsqueda."
                            : "No hay registros."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between sm:items-center mt-2 px-1">
                <div className="text-xs sm:text-sm text-gray-700">
                  Mostrando{" "}
                  <span className="font-medium">
                    {filteredReporte.length === 0
                      ? 0
                      : indexOfFirstRowReporte + 1}
                  </span>{" "}
                  –{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastRowReporte, filteredReporte.length)}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium">{filteredReporte.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="rowsPerPage"
                      className="text-xs text-gray-700"
                    >
                      Filas:
                    </label>
                    <select
                      id="rowsPerPage"
                      value={rowsPerPageReporte}
                      onChange={(e) =>
                        setRowsPerPageReporte(Number(e.target.value))
                      }
                      className="px-2 py-1 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-300"
                    >
                      {[5, 10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setCurrentPageReporte(1)}
                    disabled={currentPageReporte === 1}
                    className="px-2.5 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
                    title="Primera página"
                  >
                    «
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPageReporte((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPageReporte === 1}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700 px-1">
                    Página {currentPageReporte} de {totalPagesReporte}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPageReporte((prev) =>
                        Math.min(prev + 1, totalPagesReporte),
                      )
                    }
                    disabled={currentPageReporte === totalPagesReporte}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Siguiente
                  </button>
                  <button
                    onClick={() => setCurrentPageReporte(totalPagesReporte)}
                    disabled={currentPageReporte === totalPagesReporte}
                    className="px-2.5 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
                    title="Última página"
                  >
                    »
                  </button>
                </div>
              </div>
            </fieldset>
            <EstadoMensajes error={error} successMessage={successMessage} />
          </>
        )}
      </div>
    </div>
  );
}
