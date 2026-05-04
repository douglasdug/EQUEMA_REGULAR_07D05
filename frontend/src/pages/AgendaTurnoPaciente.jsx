import React, { useState, useRef, useEffect, useMemo, useContext } from "react";
import PropTypes, { object } from "prop-types";
import {
  buscarUsuarioIdUnidadSalud,
  buscarUsuarioAdmision,
  buscarTurnosAgendados,
  actualizarTurnoAgendado,
  actualizarAgenda,
  actualizarEstadoTurno,
  pdfTurnoAgendaPaciente,
  listarAgendaPaciente,
  buscarPacientesAgendados,
  descargarAgendaPacienteCsv,
  buscarResultadoConsultaPaciente,
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
import Admision from "./Admision.jsx";
import { AuthContext } from "../components/AuthContext.jsx";
import { toast } from "react-hot-toast";
import {
  BsCalendar3,
  BsCalendarCheckFill,
  BsPersonCheck,
  BsPersonFillX,
  BsSearch,
} from "react-icons/bs";
import { da, el, id, tr } from "date-fns/locale";
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
import { toZonedTime, format as formatTz } from "date-fns-tz";
import esES from "date-fns/locale/es";
import { DateRange } from "react-date-range";
import { se } from "date-fns/locale";

const timeZoneEC = "America/Guayaquil";
const nowEC = toZonedTime(new Date(), timeZoneEC);
const fechaActualEC = formatTz(nowEC, "yyyy-MM-dd", { timeZone: timeZoneEC });
const horaActualEC = formatTz(nowEC, "HH:mm", { timeZone: timeZoneEC });

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
  age_turn_paci_unid_salu: "",
};

const initialReporteState = {
  rad_but_buscar_tipo_cita: "1",
  age_turn_paci_repo_tipo_espe: "",
  age_turn_paci_repo_fech: fechaActualEC,
  age_turn_paci_repo_fech_inic_fin: "",
  age_turn_paci_cons_paci: "",
  age_turn_paci_cons_obse_paci: "",
  age_turn_paci_cons_link_paci: "",
  age_turn_paci_cons_tipo_serv: "",
};

const initialConsultaState = {
  age_turn_paci_resu_cons_tipo_iden_paci: "",
  age_turn_paci_resu_cons_nume_iden_paci: "",
  age_turn_paci_resu_cons_apel_nomb_paci: "",
  age_turn_paci_resu_cons_fech_inic_fin: "",
};

const unidadesSalud = Object.fromEntries(
  (allListRegisterUser.uni_unic || []).map((item) => [item.value, item.label]),
);

const TABLE_HEADERS = [
  "Turno - Fecha y Hora",
  "Unidad de Salud",
  "Tipo de Especialidad",
  "Profesional de la Cita",
  "Estado de la Cita",
];

const TABLE_HEADERS_REPORTE = [
  "Accion",
  "Detalle de Turno",
  "Estado de la Cita",
  "Identificación del Paciente",
  "Tipo de Servicio",
];

const TABLE_HEADERS_RESULTADO_CONSULTA = [
  "Detalle de Turno",
  "Datos de Paciente",
  "Estado de la Cita",
  "Link de Consulta",
  "Observaciones de la Consulta",
  "Tipo de Servicio",
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
  const [consultaData, setConsultaData] = useState(initialConsultaState);
  const [turnosPaciente, setTurnosPaciente] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { authData } = useContext(AuthContext);
  const roleRaw = authData?.user?.fun_admi_rol ?? authData?.fun_admi_rol;
  const role = roleRaw != null ? Number(roleRaw) : null;

  const [showAdmisionModal, setShowAdmisionModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalText, setConfirmModalText] = useState("");
  const [admisionData, setAdmisionData] = useState(null);
  const [admisionInit, setAdmisionInit] = useState({
    tipoIdenInicial: "",
    numeIdenInicial: "",
  });
  const [showBusquedaAvanzada, setShowBusquedaAvanzada] = useState(false);
  const [showBusquedaApellidosNombres, setShowBusquedaApellidosNombres] =
    useState(true);
  const [showFechaReporteAgenda, setShowFechaReporteAgenda] = useState(true);
  const [showConfirmInasistencia, setShowConfirmInasistencia] = useState(false);
  const [turnoAConfirmar, setTurnoAConfirmar] = useState(null);
  const estadoTurnoMap = useMemo(() => {
    return Object.fromEntries(
      (allListAgenda.adm_agen_turn_esta_cita || []).map((item) => [
        String(item.value),
        item.label ? item.label.slice(3) : "",
      ]),
    );
  }, [allListAgenda.adm_agen_turn_esta_cita]);
  const tipoServicioMap = useMemo(() => {
    return Object.fromEntries(
      (allListAgenda.age_turn_paci_cons_tipo_serv || []).map((item) => [
        String(item.value),
        item.label ? item.label.slice(3) : "",
      ]),
    );
  }, [allListAgenda.age_turn_paci_cons_tipo_serv]);
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
  const getInitialTab = (role) => {
    if (role === 5) return "agenda";
    if (role === 6) return "agenda";
    if (role === 7 || role === 3) return "consulta";
    return "agenda";
  };
  const [activeTab, setActiveTab] = useState(() => getInitialTab(role));

  const [pacientesAgendados, setPacientesAgendados] = useState([]);
  const [currentPageReporte, setCurrentPageReporte] = useState(1);
  const [searchTermReporte, setSearchTermReporte] = useState("");
  const [rowsPerPageReporte, setRowsPerPageReporte] = useState(10);

  const [rangeResuConsInicio, setRangeResuConsInicio] = useState(new Date());
  const [rangeResuConsFin, setRangeResuConsFin] = useState(new Date());
  const [showResuConsCalendar, setShowResuConsCalendar] = useState(false);
  const [rangeResuCons, setRangeResuCons] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const onRangeResuConsChange = ({ selection }) => {
    setRangeResuCons([selection]);
    setRangeResuConsInicio(selection.startDate);
    setRangeResuConsFin(selection.endDate);
  };

  const [resultadoConsulta, setResultadoConsulta] = useState([]);
  const [currentPageResultadoConsulta, setCurrentPageResultadoConsulta] =
    useState(1);
  const [searchTermResultadoConsulta, setSearchTermResultadoConsulta] =
    useState("");
  const [rowsPerPageResultadoConsulta, setRowsPerPageResultadoConsulta] =
    useState(10);

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
        u.adm_agen_turn_cons_link_paci,
        u.adm_agen_turn_cons_obse_paci,
        u.adm_agen_turn_cons_tipo_serv,
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

  const filteredResultadoConsulta = useMemo(() => {
    let turnos = [];
    if (Array.isArray(resultadoConsulta.data)) {
      turnos = resultadoConsulta.data;
    } else if (Array.isArray(resultadoConsulta)) {
      turnos = resultadoConsulta;
    }
    if (!searchTermResultadoConsulta.trim()) return turnos;
    const q = searchTermResultadoConsulta.toLowerCase();
    return turnos.filter((u) => {
      return [
        u.adm_agen_turn_fech,
        u.adm_agen_turn_hora_inic,
        u.adm_agen_turn_unid_salu,
        u.adm_agen_turn_tipo_espe,
        u.adm_agen_turn_prof_cita,
        u.adm_agen_turn_nume_iden_paci,
        u.adm_agen_turn_apel_nomb_paci,
        estadoTurnoMap[u.adm_agen_turn_esta_cita],
        u.adm_agen_turn_cons_link_paci,
        u.adm_agen_turn_cons_obse_paci,
        u.adm_agen_turn_cons_tipo_serv,
      ]
        .filter(Boolean)
        .some((field) => field.toString().toLowerCase().includes(q));
    });
  }, [resultadoConsulta, searchTermResultadoConsulta]);

  const totalPagesResultadoConsulta = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(
          filteredResultadoConsulta.length / rowsPerPageResultadoConsulta,
        ),
      ),
    [filteredResultadoConsulta.length, rowsPerPageResultadoConsulta],
  );

  useEffect(() => {
    setCurrentPageResultadoConsulta((prev) =>
      Math.min(Math.max(prev, 1), totalPagesResultadoConsulta),
    );
  }, [totalPagesResultadoConsulta]);

  const indexOfLastRowResultadoConsulta =
    currentPageResultadoConsulta * rowsPerPageResultadoConsulta;
  const indexOfFirstRowResultadoConsulta =
    indexOfLastRowResultadoConsulta - rowsPerPageResultadoConsulta;

  const currentRowsResultadoConsulta = useMemo(
    () =>
      filteredResultadoConsulta.slice(
        indexOfFirstRowResultadoConsulta,
        indexOfLastRowResultadoConsulta,
      ),
    [
      filteredResultadoConsulta,
      indexOfFirstRowResultadoConsulta,
      indexOfLastRowResultadoConsulta,
    ],
  );

  const initialVariableEstado = {
    age_turn_paci_tipo_iden: false,
    age_turn_paci_nume_iden: true,
    age_turn_paci_fech_inic_fin: true,
    age_turn_paci_tipo_espe: true,
    age_turn_paci_unid_salu: true,
    age_turn_paci_apel_nomb: true,
    age_turn_paci_tele: true,
    age_turn_paci_corr_paci: true,
    age_turn_paci_unid_salu_resp_segu_aten_paci: true,
    age_turn_paci_dire_paci: true,
    age_turn_paci_obse_paci: true,
    age_turn_paci_agen_paci: true,
    age_turn_paci_edit_agen_paci: true,
    age_turn_paci_repo_tipo_espe: false,
    age_turn_paci_repo_fech: true,
    age_turn_paci_repo_fech_inic_fin: true,
    age_turn_paci_cons_paci: true,
    age_turn_paci_cons_obse_paci: true,
    age_turn_paci_cons_link_paci: true,
    age_turn_paci_cons_tipo_serv: true,
    age_turn_paci_resu_cons_tipo_iden_paci: false,
    age_turn_paci_resu_cons_nume_iden_paci: true,
    age_turn_paci_resu_cons_apel_nomb_paci: true,
    age_turn_paci_resu_cons_fech_inic_fin: true,
  };

  const initialBotonEstado = {
    btn_buscar_paciente: true,
    btn_busqueda_avanzada: true,
    btn_cargar_turnos: true,
    btnRegistrar: true,
    btn_limpiar_formulario: true,
    btn_editar_lista_turnos: true,
    btn_libe_turn_paci: true,
    btn_reporte_turnos: true,
    btn_descargar_reporte: true,
    btn_limpiar_reporte: true,
    btn_guardar_consulta_paciente: true,
    btn_resultado_consulta: true,
  };

  const [variableEstado, setVariableEstado] = useState(initialVariableEstado);
  const [botonEstado, setBotonEstado] = useState(initialBotonEstado);
  const calendarRef = useRef(null);
  const calendarRefRepo = useRef(null);
  const calendarRefResuCons = useRef(null);

  const fechaReferencia = format(rangeInicio, "yyyy-MM-dd");
  const fechaInicio = fechaReferencia;
  const fechaFin = format(rangeFin, "yyyy-MM-dd");

  const fechaRepoReferencia = format(rangeRepoInicio, "yyyy-MM-dd");
  const fechaRepoInicio = fechaRepoReferencia;
  const fechaRepoFin = format(rangeRepoFin, "yyyy-MM-dd");

  const fechaResuConsReferencia = format(rangeResuConsInicio, "yyyy-MM-dd");
  const fechaResuConsInicio = fechaResuConsReferencia;
  const fechaResuConsFin = format(rangeResuConsFin, "yyyy-MM-dd");

  const requiredFields = [
    "age_turn_paci_tipo_iden",
    "age_turn_paci_nume_iden",
    "age_turn_paci_tipo_espe",
    "age_turn_paci_fech_inic_fin",
    "age_turn_paci_unid_salu",
    "age_turn_paci_corr_paci",
    "age_turn_paci_repo_fech",
    "age_turn_paci_repo_fech_inic_fin",
    "age_turn_paci_repo_tipo_espe",
    "age_turn_paci_resu_cons_tipo_iden_paci",
    "age_turn_paci_resu_cons_nume_iden_paci",
    "age_turn_paci_resu_cons_apel_nomb_paci",
    "age_turn_paci_resu_cons_fech_inic_fin",
  ];

  const labelMap = {
    age_turn_paci_tipo_iden: "Tipo de identificación:",
    age_turn_paci_nume_iden: "Número de identificación:",
    age_turn_paci_fech_inic_fin: "Rango de fechas para turnos:",
    age_turn_paci_tipo_espe: "Tipo de especialidad:",
    age_turn_paci_unid_salu: "Unidad de salud:",
    age_turn_paci_apel_nomb: "Apellidos y nombres:",
    age_turn_paci_tele: "Celular:",
    age_turn_paci_corr_paci: "Correo electrónico:",
    age_turn_paci_unid_salu_resp_segu_aten_paci: "Unidad de salud responsable:",
    age_turn_paci_dire_paci: "Dirección:",
    age_turn_paci_obse_paci: "Observaciones:",
    age_turn_paci_agen_paci: "Turnos Agendados a Paciente:",
    age_turn_paci_repo_fech: "Fecha de agendados:",
    age_turn_paci_repo_fech_inic_fin: "Rango de fechas para reporte:",
    age_turn_paci_repo_tipo_espe: "Tipo de especialidad para reporte:",
    age_turn_paci_cons_paci: "Nombres del paciente:",
    age_turn_paci_cons_obse_paci: "Observaciones de consulta:",
    age_turn_paci_cons_link_paci: "Link de consulta:",
    age_turn_paci_cons_tipo_serv: "Tipo de servicio para consulta:",
    age_turn_paci_resu_cons_tipo_iden_paci:
      "Tipo de identificación del paciente:",
    age_turn_paci_resu_cons_nume_iden_paci:
      "Número de identificación del paciente:",
    age_turn_paci_resu_cons_apel_nomb_paci: "Apellidos y nombres del paciente:",
    age_turn_paci_resu_cons_fech_inic_fin:
      "Rango de fechas para resultado de consulta:",
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
    if (name === "age_turn_paci_unid_salu") {
      const unidadSaludObjetos = Object.entries(unidadesSalud).map(
        ([value, label]) => ({ value, label }),
      );
      const unidadSeleccionada = unidadSaludObjetos.find(
        (u) => u.value === value,
      );

      const nextVariableData = {
        ...variableData,
        [name]: unidadSeleccionada || { value, label: value },
      };

      setVariableData(nextVariableData);
      actualizarEstadoBtnRegistrar(formData, nextVariableData);
      return;
    }

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

    if (name === "rad_but_buscar_tipo_cita") {
      if (value === "1") {
        setShowFechaReporteAgenda(true);
      } else if (value === "2") {
        setShowFechaReporteAgenda(false);
      }
      setReporteData((prev) => ({
        ...prev,
        rad_but_buscar_tipo_cita: value,
        age_turn_paci_repo_tipo_espe: "",
        age_turn_paci_cons_paci: "",
        age_turn_paci_cons_obse_paci: "",
        age_turn_paci_cons_link_paci: "",
        age_turn_paci_cons_tipo_serv: "",
      }));
      setVariableEstado((prev) => ({
        ...prev,
        age_turn_paci_repo_tipo_espe: false,
        age_turn_paci_repo_fech: true,
        age_turn_paci_repo_fech_inic_fin: true,
        age_turn_paci_cons_paci: true,
        age_turn_paci_cons_obse_paci: true,
        age_turn_paci_cons_link_paci: true,
        age_turn_paci_cons_tipo_serv: true,
      }));
      setBotonEstado((prev) => ({
        ...prev,
        btn_reporte_turnos: true,
        btn_descargar_reporte: true,
        btn_limpiar_reporte: true,
      }));
      setPacientesAgendados([]);
      return;
    }

    const nextReporteData = {
      ...reporteData,
      [name]: value,
    };

    if (name === "age_turn_paci_repo_tipo_espe") {
      handleTipoIdentificacionChangeReporte(value);
    }

    setReporteData(nextReporteData);
    validarDato(
      event,
      nextReporteData,
      setReporteData,
      error,
      setError,
      setBotonEstado,
    );
  };

  const handleChangeResultadoConsulta = (event) => {
    const { name, value } = event.target;

    const nextResuConsData = {
      ...consultaData,
      [name]: value,
    };

    if (name === "age_turn_paci_resu_cons_tipo_iden_paci") {
      handleTipoIdentificacionChangeResultadoConsulta(value);
    }
    if (name === "age_turn_paci_resu_cons_apel_nomb_paci") {
      handleApellidoNombreChangeResultadoConsulta(value);
    }
    if (name === "rad_but_buscar_tipo_apel_nomb") {
      limpiarFormularioResultadoConsulta();
      if (value === "1") {
        setShowBusquedaApellidosNombres(true);
      } else if (value === "2") {
        setShowBusquedaApellidosNombres(false);
      }
      return;
    }

    setConsultaData(nextResuConsData);
    validarDato(
      event,
      nextResuConsData,
      setConsultaData,
      error,
      setError,
      setBotonEstado,
    );
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

  const handleTipoIdentificacionChangeReporte = (tipoIdentificacion) => {
    const esValido = tipoIdentificacion && tipoIdentificacion.trim() !== "";

    if (esValido) {
      setVariableEstado((prev) => ({
        ...prev,
        age_turn_paci_repo_fech: false,
        age_turn_paci_repo_fech_inic_fin: false,
      }));

      setBotonEstado((prev) => ({
        ...prev,
        btn_reporte_turnos: false,
        btn_descargar_reporte: false,
        btn_limpiar_reporte: false,
      }));
    } else {
      limpiarFormularioReporte();
    }
  };

  const handleTipoIdentificacionChangeResultadoConsulta = (
    tipoIdentificacion,
  ) => {
    const esValido = tipoIdentificacion && tipoIdentificacion.trim() !== "";

    if (esValido) {
      setVariableEstado((prev) => ({
        ...prev,
        age_turn_paci_resu_cons_nume_iden_paci: false,
        age_turn_paci_resu_cons_fech_inic_fin: false,
      }));

      setBotonEstado((prev) => ({
        ...prev,
        btn_resultado_consulta: false,
        btn_limpiar_resultado_consulta: false,
      }));
    } else {
      limpiarFormularioResultadoConsulta();
    }
  };

  const handleApellidoNombreChangeResultadoConsulta = (apellidoNombre) => {
    const esValido = apellidoNombre && apellidoNombre.length >= 3;

    if (esValido) {
      setVariableEstado((prev) => ({
        ...prev,
        age_turn_paci_resu_cons_fech_inic_fin: false,
      }));
      setBotonEstado((prev) => ({
        ...prev,
        btn_resultado_consulta: false,
        btn_limpiar_resultado_consulta: false,
      }));
    } else {
      limpiarFormularioResultadoConsulta();
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

  const handleSubmitSearch = async (event) => {
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

  const handleReporteSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    let tipoEspeRepo, radButCitas, fechaAgenda, dateRepoInicio, dateRepoFin;
    tipoEspeRepo = reporteData.age_turn_paci_repo_tipo_espe;
    radButCitas = reporteData.rad_but_buscar_tipo_cita;
    fechaAgenda = reporteData.age_turn_paci_repo_fech;
    dateRepoInicio = fechaRepoInicio;
    dateRepoFin = fechaRepoFin;

    if (radButCitas === "1") {
      dateRepoInicio = fechaAgenda;
      dateRepoFin = fechaAgenda;
    }

    if (!dateRepoInicio || !dateRepoFin || !tipoEspeRepo || !radButCitas) {
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
        radButCitas,
        dateRepoInicio,
        dateRepoFin,
      );
      setPacientesAgendados(response.data || []);
      const message =
        response?.message ||
        "Se generó el reporte de pacientes agendados exitosamente.";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 10000);
      toast.success(message, { position: "bottom-right" });
      reporteSubmitExito();
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

  const handleResultadoConsultaSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    let tipoIden, numeIden, apelNomb;
    tipoIden = consultaData.age_turn_paci_resu_cons_tipo_iden_paci;
    numeIden = consultaData.age_turn_paci_resu_cons_nume_iden_paci;
    apelNomb = consultaData.age_turn_paci_resu_cons_apel_nomb_paci;

    if (
      !fechaResuConsInicio ||
      !fechaResuConsFin ||
      ((!tipoIden || !numeIden) && !apelNomb)
    ) {
      const mensaje =
        "Se tiene que tener una fecha de inicio y fin válida tambien el número de identificación o los Nombres del paciente.";
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
      response = await buscarResultadoConsultaPaciente(
        tipoIden,
        numeIden,
        apelNomb,
        fechaResuConsInicio,
        fechaResuConsFin,
      );
      setResultadoConsulta(response.data || []);
      const message =
        response?.message ||
        "Se generó el reporte de resultados de consulta exitosamente.";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 10000);
      toast.success(message, { position: "bottom-right" });
      //reporteSubmitExito();
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

  const variableEstadoExito = () => {
    setVariableEstado((prev) => ({
      ...prev,
      age_turn_paci_tipo_iden: true,
      age_turn_paci_nume_iden: true,
      age_turn_paci_fech_inic_fin: false,
      age_turn_paci_tipo_espe: false,
      age_turn_paci_unid_salu: false,
      age_turn_paci_tele: false,
      age_turn_paci_corr_paci: false,
      age_turn_paci_obse_paci: false,
      age_turn_paci_agen_paci: false,
    }));
    setBotonEstado((prev) => ({
      ...prev,
      btnRegistrar: false,
      btn_busqueda_avanzada: true,
      btn_buscar_paciente: true,
    }));
  };

  const reporteSubmitExito = () => {
    setVariableEstado((prev) => ({
      ...prev,
      age_turn_paci_repo_tipo_espe: true,
      age_turn_paci_repo_fech: true,
      age_turn_paci_repo_fech_inic_fin: true,
    }));
    setBotonEstado((prev) => ({
      ...prev,
      btn_reporte_turnos: true,
      btn_descargar_reporte: true,
      btn_guardar_consulta_paciente: true,
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
      limpiarFormulario(false);
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

  const handleAtendidoTurnoSeleccionado = (
    id,
    fechaTurno,
    paciente,
    link,
    observaciones,
    tipoServicio,
    estadoCita,
  ) => {
    if (!id || !fechaTurno || !paciente || !estadoCita) {
      toast.error("Seleccione el turno a atender.", {
        position: "bottom-right",
      });
      return;
    }

    setError("");
    setSuccessMessage("");
    setReporteData((prev) => ({
      ...prev,
      id_turno: id,
      fecha_turno: fechaTurno,
      age_turn_paci_cons_paci: paciente,
      age_turn_paci_cons_link_paci: link || "",
      age_turn_paci_cons_obse_paci: observaciones || "",
      age_turn_paci_cons_tipo_serv: Number.parseInt(tipoServicio) || "",
      estado_cita: estadoCita,
    }));
    const message = `A seleccionado el turno del paciente ${paciente}.`;
    setSuccessMessage(message);
    setVariableEstado((prev) => ({
      ...prev,
      age_turn_paci_cons_link_paci: false,
      age_turn_paci_cons_obse_paci: false,
      age_turn_paci_cons_tipo_serv: false,
    }));
    setBotonEstado((prev) => ({
      ...prev,
      btn_guardar_consulta_paciente: false,
      btn_limpiar_reporte: false,
    }));
    setTimeout(() => setSuccessMessage(""), 10000);
    toast.success(message, { position: "bottom-right" });
  };

  const handleInasistenciaTurnoSeleccionado = (
    id,
    fechaTurno,
    paciente,
    estadoCita,
  ) => {
    if (!id || !fechaTurno || !paciente) {
      toast.error("Seleccione un turno a marcar como Inasistente.", {
        position: "bottom-right",
      });
      return;
    }
    if (estadoCita === 5) {
      toast.error(
        "El turno seleccionado ya se encuentra marcado como Inasistente.",
        {
          position: "bottom-right",
        },
      );
      return;
    }
    setTurnoAConfirmar({ id, fechaTurno, paciente });
    setShowConfirmInasistencia(true);
    setBotonEstado((prev) => ({
      ...prev,
      btn_limpiar_reporte: false,
    }));
  };

  const confirmarInasistencia = async () => {
    let tipoCita;
    tipoCita = reporteData.rad_but_buscar_tipo_cita;
    if (!turnoAConfirmar) return;
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const datos = {
        fecha_turno: turnoAConfirmar.fechaTurno,
        estado_turno: 2,
        tipo_cita: tipoCita,
      };
      let response;
      response = await actualizarEstadoTurno(turnoAConfirmar.id, datos);
      const message = response?.message || "Turno marcado como inasistente.";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 10000);
      toast.success(message, { position: "bottom-right" });
      await handleListarTurnosReporte();
      setShowConfirmInasistencia(false);
      setTurnoAConfirmar(null);
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

  const handleGuardarAtencionPaciente = async () => {
    let id, fechaTurno, link, observaciones, tipoServicio, tipoCita;
    id = reporteData.id_turno;
    fechaTurno = reporteData.fecha_turno;
    link = reporteData.age_turn_paci_cons_link_paci;
    observaciones = reporteData.age_turn_paci_cons_obse_paci;
    tipoServicio = reporteData.age_turn_paci_cons_tipo_serv;
    tipoCita = reporteData.rad_but_buscar_tipo_cita;

    if (!id || !fechaTurno) {
      toast.error(
        "Falta de información para guardar la atención del paciente.",
        {
          position: "bottom-right",
        },
      );
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const datos = {
        fecha_turno: fechaTurno,
        link_consulta: link,
        obse_atencion: observaciones,
        tipo_servicio: tipoServicio,
        estado_turno: 1,
        tipo_cita: tipoCita,
      };
      let response;
      response = await actualizarEstadoTurno(id, datos);
      const message = response?.message || "Turno marcado como atendido.";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 10000);
      toast.success(message, { position: "bottom-right" });
      await handleListarTurnosReporte();
      limpiarFormularioReporte(false);
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

  const handleListarTurnos = async () => {
    let tipoEspe, unidSalu;
    tipoEspe = variableData.age_turn_paci_tipo_espe;
    unidSalu = variableData.age_turn_paci_unid_salu.label || "";

    if (!fechaInicio || !fechaFin || !tipoEspe || !unidSalu) {
      setError(
        "Debe seleccionar la Fecha Inicio/Final, el Tipo de Especialidad y la Unidad de Salud.",
      );
      setTimeout(() => setError(""), 5000);
      toast.error(
        "Debe seleccionar la Fecha Inicio/Final, el Tipo de Especialidad y la Unidad de Salud.",
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
      response = await buscarTurnosAgendados(
        tipoEspe,
        unidSalu,
        fechaInicio,
        fechaFin,
      );
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

  const handleListarTurnosReporte = async () => {
    let tipoEspeRepo, radButCitas, fechaAgenda, dateRepoInicio, dateRepoFin;
    tipoEspeRepo = reporteData.age_turn_paci_repo_tipo_espe;
    radButCitas = reporteData.rad_but_buscar_tipo_cita;
    fechaAgenda = reporteData.age_turn_paci_repo_fech;
    dateRepoInicio = fechaRepoInicio;
    dateRepoFin = fechaRepoFin;

    if (radButCitas === "1") {
      dateRepoInicio = fechaAgenda;
      dateRepoFin = fechaAgenda;
    }

    if (!dateRepoInicio || !radButCitas || !dateRepoFin || !tipoEspeRepo) {
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
      response = await buscarPacientesAgendados(
        tipoEspeRepo,
        radButCitas,
        dateRepoInicio,
        dateRepoFin,
      );
      const message = response?.message || "Listar turnos!";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 10000);
      toast.success(message, { position: "bottom-right" });
      setPacientesAgendados(response.data || []);
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

  const handleDescargarReporte = async () => {
    let tipoEspeRepo, radButCitas, fechaAgenda, dateRepoInicio, dateRepoFin;
    tipoEspeRepo = reporteData.age_turn_paci_repo_tipo_espe;
    radButCitas = reporteData.rad_but_buscar_tipo_cita;
    fechaAgenda = reporteData.age_turn_paci_repo_fech;
    dateRepoInicio = fechaRepoInicio;
    dateRepoFin = fechaRepoFin;

    if (radButCitas === "1") {
      dateRepoInicio = fechaAgenda;
      dateRepoFin = fechaAgenda;
    }
    if (!dateRepoInicio || !dateRepoFin || !tipoEspeRepo) {
      const mensaje =
        "Se tiene que tener una fecha de inicio y fin válida, y un tipo de especialidad seleccionado para generar el reporte.";
      setError(mensaje);
      setTimeout(() => setError(""), 10000);
      setSuccessMessage("");
      toast.error(mensaje, { position: "bottom-right" });
      return;
    }
    try {
      const { blob, filename } = await descargarAgendaPacienteCsv(
        tipoEspeRepo,
        dateRepoInicio,
        dateRepoFin,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMessage("Descarga de archivo CSV exitosa");
      setTimeout(() => setSuccessMessage(""), 10000);
      setError("");
      toast.success("Descarga de archivo CSV exitosa", {
        position: "bottom-right",
      });
      limpiarFormularioReporte();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      setSuccessMessage("");
      toast.error(errorMessage, { position: "bottom-right" });
    }
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        calendarRefResuCons.current &&
        !calendarRefResuCons.current.contains(event.target)
      ) {
        setShowResuConsCalendar(false);
      }
    }
    if (showResuConsCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showResuConsCalendar, calendarRefResuCons]);

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

  const limpiarFormulario = (borrarTabla = true) => {
    setFormData(initialState);

    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
    if (borrarTabla) {
      setVariableData(initialVariableState);
      setTurnosPaciente([]);
    } else {
      setVariableData((prev) => ({
        ...prev,
        age_turn_paci_agen_paci: "",
        turno_historial_select: "",
        age_turn_paci_edit_agen_paci: "",
      }));
    }
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

  const limpiarFormularioReporte = (borrarTabla = true) => {
    if (borrarTabla) {
      setReporteData(initialReporteState);
    } else {
      setReporteData((prev) => ({
        ...prev,
        age_turn_paci_cons_paci: "",
        age_turn_paci_cons_obse_paci: "",
        age_turn_paci_cons_link_paci: "",
        age_turn_paci_cons_tipo_serv: "",
      }));
    }
    setVariableEstado((prev) => ({
      ...prev,
      age_turn_paci_repo_tipo_espe: false,
      age_turn_paci_repo_fech: true,
      age_turn_paci_repo_fech_inic_fin: true,
      age_turn_paci_cons_obse_paci: true,
      age_turn_paci_cons_link_paci: true,
      age_turn_paci_cons_tipo_serv: true,
    }));
    if (borrarTabla) {
      setBotonEstado((prev) => ({
        ...prev,
        btn_reporte_turnos: true,
        btn_descargar_reporte: true,
        btn_guardar_consulta_paciente: true,
        btn_limpiar_reporte: true,
      }));
    } else {
      setBotonEstado((prev) => ({
        ...prev,
        btn_reporte_turnos: true,
        btn_descargar_reporte: true,
        btn_guardar_consulta_paciente: true,
        btn_limpiar_reporte: false,
      }));
    }
    if (borrarTabla) {
      setPacientesAgendados([]);
    }
    setShowFechaReporteAgenda(true);
    setError("");
    setSuccessMessage("");
  };

  const limpiarFormularioResultadoConsulta = (borrarTabla = true) => {
    setConsultaData(initialConsultaState);
    setVariableEstado((prev) => ({
      ...prev,
      age_turn_paci_resu_cons_tipo_iden_paci: false,
      age_turn_paci_resu_cons_nume_iden_paci: true,
      age_turn_paci_resu_cons_apel_nomb_paci: false,
      age_turn_paci_resu_cons_fech_inic_fin: true,
    }));
    setBotonEstado((prev) => ({
      ...prev,
      btn_resultado_consulta: true,
      btn_limpiar_resultado_consulta: true,
    }));
    if (borrarTabla) {
      setResultadoConsulta([]);
    }
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
  const tableStyles = {
    container:
      "overflow-x-auto rounded-lg shadow max-w-full border-2 border-gray-300 sm:border my-4",
    table: "w-full table-auto border-collapse bg-white",
    thead: "bg-gray-50 border-b border-gray-300 items-center",
    th: "px-1 py-1.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-x border-gray-200",
    tbody: "divide-y divide-gray-200",
    td: "px-3 py-2 align-top text-sm text-gray-600 border-x border-gray-200",
    td2: "px-1 py-1 align-top text-blue-700 border-r border-gray-100 last:border-none whitespace-normal break-words max-w-[220px] underline",
    td3: "px-1 py-1 align-top text-gray-700 border-r border-gray-100 last:border-none whitespace-normal break-words max-w-[220px]",
    actionButton:
      "p-1 text-blue-700 hover:text-blue-800 hover:bg-blue-100 rounded focus:outline-none focus:shadow-outline cursor-pointer",
    deleteButton:
      "p-1 text-red-700 hover:text-red-800 hover:bg-red-50 rounded focus:outline-none focus:shadow-outline cursor-pointer",
    deleteButtonDisabled:
      "p-1 text-gray-700 hover:text-gray-800 hover:bg-gray-50 rounded focus:outline-none focus:shadow-outline cursor-not-allowed",
    trHover: "hover:bg-gray-50 transition-colors duration-150",
  };

  const unidadSaludLabels = new Set(unidadSaludList.map((u) => u.label));
  const tabs = [
    { label: "Datos para Agendar", key: "agenda" },
    { label: "Datos para Reporte", key: "reporte" },
    { label: "Datos para Consulta", key: "consulta" },
  ];
  let allowedTabKeys = new Set();

  if (role === 5) {
    allowedTabKeys = new Set(["agenda", "reporte", "consulta"]);
  } else if (role === 6) {
    allowedTabKeys = new Set(["agenda"]);
  } else if (role === 7 || role === 3) {
    allowedTabKeys = new Set(["consulta"]);
  }

  const visibleTabs = tabs.filter(({ key }) => allowedTabKeys.has(key));

  return (
    <div className="w-full h-auto flex items-stretch justify-stretch bg-gray-100">
      <div className="w-full h-full p-2 bg-white rounded-lg shadow-md mt-1">
        <h2 className="text-2xl font-bold mb-1 text-center text-blue-700">
          Agenda de Turnos para Pacientes
        </h2>
        <p className="text-base text-center text-black">
          <strong>Nota:</strong> Los campos con{" "}
          <span className="text-red-500">*</span> son obligatorios.
        </p>
        <nav className="w-full flex overflow-x-auto no-scrollbar space-x-2 border-b border-blue-200 mb-1 bg-white items-center justify-center px-1 py-1 relative">
          {visibleTabs.map(
            (tab) =>
              tab.key && (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (tab.key === "agenda") {
                      limpiarFormularioReporte();
                      limpiarFormularioResultadoConsulta();
                    } else if (tab.key === "reporte") {
                      limpiarFormulario();
                      limpiarFormularioResultadoConsulta();
                    } else if (tab.key === "consulta") {
                      limpiarFormulario();
                      limpiarFormularioReporte();
                    }
                  }}
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
        {activeTab === "agenda" && (role === 5 || role === 6) && (
          <>
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
                          className={`${inputStyle} ${isFieldInvalid("age_turn_paci_nume_iden", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_nume_iden"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
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
                      <div className="relative w-full rounded">
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
                          className={`${inputStyle} ${isFieldInvalid("age_turn_paci_fech_inic_fin", requiredFields, formData, isFieldVisible) && !(rangeInicio && rangeFin) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_fech_inic_fin"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
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
                        htmlFor="age_turn_paci_unid_salu"
                      >
                        {requiredFields.includes("age_turn_paci_unid_salu") && (
                          <span className="text-red-500">* </span>
                        )}
                        {labelMap["age_turn_paci_unid_salu"]}
                      </label>
                      <CustomSelect
                        id="age_turn_paci_unid_salu"
                        name="age_turn_paci_unid_salu"
                        value={variableData.age_turn_paci_unid_salu}
                        onChange={handleChangeVariable}
                        options={(allListRegisterUser.uni_unic || []).filter(
                          (opt) =>
                            opt.value === "000591" || opt.value === "000592",
                        )}
                        placeholder="Seleccione la unidad de salud"
                        disabled={variableEstado["age_turn_paci_unid_salu"]}
                        variableEstado={variableEstado}
                        className={
                          isFieldInvalid(
                            "age_turn_paci_unid_salu",
                            requiredFields,
                            variableData,
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
                      className={`${inputStyle} ${isFieldInvalid("age_turn_paci_apel_nomb", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_apel_nomb"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
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
                      className={`${inputStyle} ${isFieldInvalid("age_turn_paci_tele", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_tele"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
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
                      className={`${inputStyle} ${isFieldInvalid("age_turn_paci_corr_paci", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_corr_paci"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
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
                      className={`${inputStyle} ${isFieldInvalid("age_turn_paci_unid_salu_resp_segu_aten_paci", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_unid_salu_resp_segu_aten_paci"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
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
                      className={`${inputStyle} ${isFieldInvalid("age_turn_paci_dire_paci", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_dire_paci"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
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
                      className={`${inputStyle} ${isFieldInvalid("age_turn_paci_obse_paci", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_obse_paci"] ? "bg-gray-200 text-gray-700 h-10 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
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
                          className={`${inputStyle} font-mono text-sm resize-none transition-all duration-200 ${variableEstado["age_turn_paci_agen_paci"] ? "bg-gray-200 text-gray-700 h-10 cursor-no-drop" : `${isHistorialExpandido ? "h-48 overflow-auto bg-white cursor-default" : "h-10 overflow-hidden bg-gray-50 cursor-pointer"}`}`}
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
            {showConfirmModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-50">
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
                            formData.age_turn_paci_tipo_iden || "",
                          ).trim(),
                          numeIdenInicial: String(
                            formData.age_turn_paci_nume_iden || "",
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
              <div className="fixed inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-50">
                <div className="relative w-full max-w-7xl mx-auto mt-8 rounded-lg shadow-lg overflow-y-auto max-h-screen">
                  <button
                    className="absolute top-4 right-4 text-red-500 font-bold text-2xl z-10"
                    onClick={() => {
                      setShowAdmisionModal(false);
                      setAdmisionData(null);
                    }}
                  >
                    Cerrar X
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
            <div className="flex flex-col gap-1 px-1 sm:px-1.5 md:px-3 lg:px-4 py-2">
              <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Turnos Disponibles
              </h3>
            </div>
            <div className={`${tableStyles.container} bg-white/90`}>
              <table className={`${tableStyles.table} text-base`}>
                <thead className={`${tableStyles.thead}`}>
                  <tr>
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
                    const isReservado = registro.adm_agen_turn_esta_cita === 2;
                    const esUnidadUsuario =
                      unidadSaludLabels.has(unidadSaludTurno);
                    return (
                      <tr
                        key={registro.id}
                        className={`${tableStyles.trHover} odd:bg-white even:bg-gray-50`}
                      >
                        <td className={`${tableStyles.td} align-top`}>
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
                                          registro.adm_agen_turn_rese_unic_salu
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
                        colSpan={TABLE_HEADERS.length}
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
          </>
        )}
        {activeTab === "reporte" && role === 5 && (
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
                  <div className="col-span-full flex flex-wrap items-center gap-2 mb-2 p-1 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                    <span className="flex items-center gap-2 text-blue-700 font-semibold text-base">
                      <BsSearch className="inline" />
                      Buscar por:
                    </span>
                    <label
                      htmlFor="rad_but_buscar_tipo_cita_agen"
                      className="inline-flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-blue-100 transition"
                    >
                      <input
                        type="radio"
                        id="rad_but_buscar_tipo_cita_agen"
                        name="rad_but_buscar_tipo_cita"
                        value="1"
                        checked={reporteData.rad_but_buscar_tipo_cita === "1"}
                        onChange={handleChangeReporte}
                        className="form-radio text-blue-600 focus:ring-2 focus:ring-blue-400"
                      />
                      <span className="text-gray-800 font-medium">
                        Citas Agendadas
                      </span>
                    </label>
                    <label
                      htmlFor="rad_but_buscar_tipo_cita_inas"
                      className="inline-flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-blue-100 transition"
                    >
                      <input
                        type="radio"
                        id="rad_but_buscar_tipo_cita_inas"
                        name="rad_but_buscar_tipo_cita"
                        value="2"
                        checked={reporteData.rad_but_buscar_tipo_cita === "2"}
                        onChange={handleChangeReporte}
                        className="form-radio text-blue-600 focus:ring-2 focus:ring-blue-400"
                      />
                      <span className="text-gray-800 font-medium">
                        Administrar Citas
                      </span>
                    </label>
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
                    <CustomSelect
                      id="age_turn_paci_repo_tipo_espe"
                      name="age_turn_paci_repo_tipo_espe"
                      value={reporteData.age_turn_paci_repo_tipo_espe}
                      onChange={handleChangeReporte}
                      options={allListAgenda.adm_agen_turn_tipo_espe || []}
                      placeholder="Seleccione el tipo de especialidad"
                      disabled={variableEstado["age_turn_paci_repo_tipo_espe"]}
                      variableEstado={variableEstado}
                      className={
                        isFieldInvalid(
                          "age_turn_paci_repo_tipo_espe",
                          requiredFields,
                          reporteData,
                          isFieldVisible,
                        )
                          ? "border-2 border-red-500"
                          : ""
                      }
                    />
                  </div>
                  <div className={fieldClass}>
                    {showFechaReporteAgenda ? (
                      <>
                        <label
                          className={labelClass}
                          htmlFor="age_turn_paci_repo_fech"
                        >
                          {requiredFields.includes(
                            "age_turn_paci_repo_fech",
                          ) && <span className="text-red-500">* </span>}
                          {labelMap["age_turn_paci_repo_fech"]}
                        </label>
                        <input
                          type="date"
                          id="age_turn_paci_repo_fech"
                          name="age_turn_paci_repo_fech"
                          value={reporteData["age_turn_paci_repo_fech"]}
                          onChange={handleChangeReporte}
                          //min={fechaActualEC}
                          placeholder="Fecha de la cita"
                          className={`${inputStyle} ${isFieldInvalid("age_turn_paci_repo_fech", requiredFields, reporteData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_repo_fech"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                          disabled={variableEstado["age_turn_paci_repo_fech"]}
                        />
                      </>
                    ) : (
                      <>
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
                        <div className="relative w-full rounded">
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
                            className={`${inputStyle} ${isFieldInvalid("age_turn_paci_repo_fech_inic_fin", requiredFields, reporteData, isFieldVisible) && !(rangeRepoInicio && rangeRepoFin) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_repo_fech_inic_fin"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
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
                      </>
                    )}
                  </div>
                  <div className="md:col-span-2 flex flex-col justify-items-start mt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        id="btn_reporte_turnos"
                        name="btn_reporte_turnos"
                        className={`${botonEstado.btn_reporte_turnos ? buttonStyleDesactivado : buttonStyleOtro}`}
                        disabled={botonEstado.btn_reporte_turnos}
                      >
                        Buscar
                      </button>
                      <button
                        type="button"
                        id="btn_descargar_reporte"
                        name="btn_descargar_reporte"
                        onClick={handleDescargarReporte}
                        className={`${botonEstado.btn_descargar_reporte ? buttonStyleDesactivado : buttonStyleGuardar}`}
                        disabled={botonEstado.btn_descargar_reporte}
                      >
                        Descargar Turnos
                      </button>
                    </div>
                    <span className="text-xs text-gray-500">
                      NOTA: El archivo que se descarga es de solo los pacientes
                      agendados, atendidos y inasistentes.
                    </span>
                  </div>
                </div>
              </fieldset>
              <fieldset className="border border-blue-200 rounded p-2 mb-1">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Datos de la Consulta del paciente
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="age_turn_paci_cons_paci"
                    >
                      {requiredFields.includes("age_turn_paci_cons_paci") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["age_turn_paci_cons_paci"]}
                    </label>
                    <input
                      type="text"
                      id="age_turn_paci_cons_paci"
                      name="age_turn_paci_cons_paci"
                      value={reporteData["age_turn_paci_cons_paci"]}
                      onChange={handleChangeReporte}
                      readOnly
                      placeholder="Nombres del paciente"
                      className={`${inputStyle} ${isFieldInvalid("age_turn_paci_cons_paci", requiredFields, reporteData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_cons_paci"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                      disabled={variableEstado["age_turn_paci_cons_paci"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="age_turn_paci_cons_link_paci"
                    >
                      {requiredFields.includes(
                        "age_turn_paci_cons_link_paci",
                      ) && <span className="text-red-500">* </span>}
                      {labelMap["age_turn_paci_cons_link_paci"]}
                    </label>
                    <input
                      type="url"
                      id="age_turn_paci_cons_link_paci"
                      name="age_turn_paci_cons_link_paci"
                      value={reporteData["age_turn_paci_cons_link_paci"]}
                      onChange={handleChangeReporte}
                      placeholder="Link de consulta"
                      className={`${inputStyle} ${isFieldInvalid("age_turn_paci_cons_link_paci", requiredFields, reporteData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_cons_link_paci"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                      disabled={variableEstado["age_turn_paci_cons_link_paci"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="age_turn_paci_cons_tipo_serv"
                    >
                      {requiredFields.includes(
                        "age_turn_paci_cons_tipo_serv",
                      ) && <span className="text-red-500">* </span>}
                      {labelMap["age_turn_paci_cons_tipo_serv"]}
                    </label>
                    <CustomSelect
                      id="age_turn_paci_cons_tipo_serv"
                      name="age_turn_paci_cons_tipo_serv"
                      value={reporteData.age_turn_paci_cons_tipo_serv}
                      onChange={handleChangeReporte}
                      options={allListAgenda.age_turn_paci_cons_tipo_serv || []}
                      placeholder="Seleccione el tipo de servicio"
                      disabled={variableEstado["age_turn_paci_cons_tipo_serv"]}
                      variableEstado={variableEstado}
                      className={
                        isFieldInvalid(
                          "age_turn_paci_cons_tipo_serv",
                          requiredFields,
                          reporteData,
                          isFieldVisible,
                        )
                          ? "border-2 border-red-500"
                          : ""
                      }
                    />
                  </div>
                  <div
                    className={`${fieldClass} sm:col-span-2 md:col-span-2 lg:col-span-2`}
                  >
                    <label
                      className={labelClass}
                      htmlFor="age_turn_paci_cons_obse_paci"
                    >
                      {requiredFields.includes(
                        "age_turn_paci_cons_obse_paci",
                      ) && <span className="text-red-500">* </span>}
                      {labelMap["age_turn_paci_cons_obse_paci"]}
                    </label>
                    <div className="flex items-center gap-0 mb-0">
                      <textarea
                        id="age_turn_paci_cons_obse_paci"
                        name="age_turn_paci_cons_obse_paci"
                        value={reporteData["age_turn_paci_cons_obse_paci"]}
                        onChange={handleChangeReporte}
                        placeholder="Observaciones para el paciente de la consulta."
                        autoComplete="street-address"
                        maxLength={500}
                        className={`${inputStyle} ${isFieldInvalid("age_turn_paci_cons_obse_paci", requiredFields, reporteData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_cons_obse_paci"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                        disabled={
                          variableEstado["age_turn_paci_cons_obse_paci"]
                        }
                      />
                      <button
                        type="button"
                        id="btn_guardar_consulta_paciente"
                        name="btn_guardar_consulta_paciente"
                        className={`${botonEstado.btn_guardar_consulta_paciente ? buttonStyleDesactivado : buttonStyleGuardar}`}
                        onClick={handleGuardarAtencionPaciente}
                        disabled={botonEstado.btn_guardar_consulta_paciente}
                      >
                        {reporteData.estado_cita === 4
                          ? "Actualizar"
                          : "Guardar"}
                      </button>
                    </div>
                    <span className="text-xs text-gray-500">
                      Máximo 500 caracteres
                    </span>
                  </div>
                </div>
              </fieldset>
              <div className="md:col-span-2 flex justify-center mt-1">
                <button
                  id="btn_limpiar_reporte"
                  name="btn_limpiar_reporte"
                  type="button"
                  className={`${botonEstado.btn_limpiar_reporte ? buttonStyleDesactivado : buttonStyleCancelar}`}
                  onClick={limpiarFormularioReporte}
                  disabled={botonEstado.btn_limpiar_reporte}
                >
                  Limpiar Todo
                </button>
              </div>
            </form>
            <div className="flex flex-col gap-1 px-1 sm:px-1.5 md:px-3 lg:px-4 py-2">
              <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Turnos Agendados para el Paciente
              </h3>
            </div>
            <div className={`${tableStyles.container} bg-white/90`}>
              <table className={`${tableStyles.table} text-base`}>
                <thead className={`${tableStyles.thead}`}>
                  <tr>
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
                        <td className={tableStyles.td}>
                          <div className="flex gap-1">
                            <button
                              className={tableStyles.actionButton + " flex-1"}
                              onClick={() =>
                                handleAtendidoTurnoSeleccionado(
                                  registro.id,
                                  registro.adm_agen_turn_fech,
                                  `${registro.adm_agen_turn_nume_iden_paci} - ${registro.adm_agen_turn_apel_nomb_paci}`,
                                  registro.adm_agen_turn_cons_link_paci,
                                  registro.adm_agen_turn_cons_obse_paci,
                                  registro.adm_agen_turn_cons_tipo_serv,
                                  registro.adm_agen_turn_esta_cita,
                                )
                              }
                              type="button"
                              aria-label="Marcar como atendido"
                              title="Marcar como atendido"
                            >
                              <BsPersonCheck className="inline" />
                            </button>
                            <button
                              className={
                                registro.adm_agen_turn_esta_cita === 5
                                  ? tableStyles.deleteButtonDisabled + " flex-1"
                                  : tableStyles.deleteButton + " flex-1"
                              }
                              onClick={() =>
                                handleInasistenciaTurnoSeleccionado(
                                  registro.id,
                                  registro.adm_agen_turn_fech,
                                  `${registro.adm_agen_turn_nume_iden_paci} - ${registro.adm_agen_turn_apel_nomb_paci}`,
                                  registro.adm_agen_turn_esta_cita,
                                )
                              }
                              type="button"
                              aria-label="Marcar como inasistente"
                              title="Marcar como inasistente"
                              disabled={registro.adm_agen_turn_esta_cita === 5}
                            >
                              <BsPersonFillX className="inline" />
                            </button>
                          </div>
                        </td>
                        <td className={`${tableStyles.td} flex flex-col`}>
                          <span className="flex flex-col items-start text-black whitespace-pre-line">
                            {registro.adm_agen_turn_fech}
                            {" - "}
                            {registro.adm_agen_turn_hora_inic}
                            {" - "}
                            {registro.adm_agen_turn_hora_fin}
                            {" : "}
                            {registro.adm_agen_turn_dura_cita} min
                          </span>
                          <span>{registro.adm_agen_turn_unid_salu}</span>
                          <span>{registro.adm_agen_turn_tipo_espe}</span>
                          <span>{registro.adm_agen_turn_prof_cita}</span>
                        </td>
                        {Object.keys(registro)
                          .filter(
                            (key) =>
                              ![
                                "id",
                                "adm_agen_turn_fech",
                                "adm_agen_turn_hora_inic",
                                "adm_agen_turn_hora_fin",
                                "adm_agen_turn_unid_salu",
                                "adm_agen_turn_tipo_espe",
                                "adm_agen_turn_prof_cita",
                                "adm_agen_turn_dura_cita",
                                "adm_agen_turn_rese_unic_salu",
                                "adm_agen_turn_apel_nomb_paci",
                                "adm_agen_turn_cons_link_paci",
                                "adm_agen_turn_cons_obse_paci",
                              ].includes(key),
                          )
                          .map((key) => {
                            let cellContent;
                            let tdClass = tableStyles.td;
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
                                tdClass = tableStyles.td3;
                                break;
                              case "adm_agen_turn_esta_cita": {
                                const estado =
                                  estadoTurnoMap[registro[key]] || "";
                                let color =
                                  "bg-red-100 text-red-700 ring-red-400";
                                if (estado === "AGENDADO/A") {
                                  color =
                                    "bg-green-100 text-black ring-green-400";
                                } else if (estado === "ATENDIDO/A") {
                                  color =
                                    "bg-blue-100 text-blue-700 ring-blue-400";
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
                                          registro.adm_agen_turn_rese_unic_salu
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
                              case "adm_agen_turn_cons_tipo_serv": {
                                const tipoServ =
                                  tipoServicioMap[registro[key]] || "";
                                let color =
                                  "bg-gray-100 text-gray-700 ring-gray-400";
                                if (tipoServ === "CONSULTA EXTERNA") {
                                  color =
                                    "bg-lime-100 text-black ring-lime-400";
                                } else if (tipoServ === "EMERGENCIA") {
                                  color = "bg-sky-100 text-black ring-sky-400";
                                }
                                cellContent = (
                                  <div>
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${color}`}
                                    >
                                      {tipoServ}
                                    </span>
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
                              <td key={key} className={tdClass}>
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
                        colSpan={TABLE_HEADERS_REPORTE.length}
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
                de <span className="font-medium">{filteredReporte.length}</span>
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
            <EstadoMensajes error={error} successMessage={successMessage} />
            {showConfirmInasistencia && (
              <div className="fixed inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                  <h2 className="text-lg font-bold mb-4 text-gray-800">
                    ¿Confirmar Inasistencia?
                  </h2>
                  <p className="mb-6 text-gray-600">
                    ¿Está seguro que desea marcar como{" "}
                    <span className="font-bold text-red-600">INASISTENCIA</span>{" "}
                    el turno de la fecha {turnoAConfirmar?.fechaTurno} del
                    paciente{" "}
                    <span className="font-semibold">
                      {turnoAConfirmar?.paciente}?
                    </span>
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                      onClick={() => {
                        setShowConfirmInasistencia(false);
                        setTurnoAConfirmar(null);
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      onClick={confirmarInasistencia}
                      disabled={isLoading}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {activeTab === "consulta" &&
          (role === 3 || role === 5 || role === 7) && (
            <div className="mt-2 space-y-1">
              <form
                onSubmit={handleResultadoConsultaSubmit}
                autoComplete="on"
                className="w-full"
              >
                <fieldset className="border border-blue-200 rounded p-2 mb-1">
                  <legend className="text-lg font-semibold text-blue-600 px-2">
                    Resultados de la Consulta del Paciente
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <div className="col-span-full flex flex-wrap items-center gap-2 mb-2 p-1 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                      <span className="flex items-center gap-2 text-blue-700 font-semibold text-base">
                        <BsSearch className="inline" />
                        Buscar por:
                      </span>
                      <label
                        htmlFor="rad_but_buscar_tipo_iden"
                        className="inline-flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-blue-100 transition"
                      >
                        <input
                          type="radio"
                          id="rad_but_buscar_tipo_iden"
                          name="rad_but_buscar_tipo_apel_nomb"
                          value="1"
                          checked={showBusquedaApellidosNombres}
                          onChange={handleChangeResultadoConsulta}
                          className="form-radio text-blue-600 focus:ring-2 focus:ring-blue-400"
                        />
                        <span className="text-gray-800 font-medium">
                          Tipo y Número de Identificación
                        </span>
                      </label>
                      <label
                        htmlFor="rad_but_buscar_apel_nomb"
                        className="inline-flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-blue-100 transition"
                      >
                        <input
                          type="radio"
                          id="rad_but_buscar_apel_nomb"
                          name="rad_but_buscar_tipo_apel_nomb"
                          value="2"
                          checked={!showBusquedaApellidosNombres}
                          onChange={handleChangeResultadoConsulta}
                          className="form-radio text-blue-600 focus:ring-2 focus:ring-blue-400"
                        />
                        <span className="text-gray-800 font-medium">
                          Apellidos y Nombres
                        </span>
                      </label>
                    </div>
                    {showBusquedaApellidosNombres ? (
                      <>
                        <div className={fieldClass}>
                          <label
                            className={labelClass}
                            htmlFor="age_turn_paci_resu_cons_tipo_iden_paci"
                          >
                            {requiredFields.includes(
                              "age_turn_paci_resu_cons_tipo_iden_paci",
                            ) && <span className="text-red-500">* </span>}
                            {labelMap["age_turn_paci_resu_cons_tipo_iden_paci"]}
                          </label>
                          <CustomSelect
                            id="age_turn_paci_resu_cons_tipo_iden_paci"
                            name="age_turn_paci_resu_cons_tipo_iden_paci"
                            value={
                              consultaData.age_turn_paci_resu_cons_tipo_iden_paci
                            }
                            onChange={handleChangeResultadoConsulta}
                            options={
                              allListAdmision.adm_dato_pers_tipo_iden || []
                            }
                            placeholder="Seleccione el tipo de identificación del paciente"
                            disabled={
                              variableEstado[
                                "age_turn_paci_resu_cons_tipo_iden_paci"
                              ]
                            }
                            variableEstado={variableEstado}
                            className={
                              isFieldInvalid(
                                "age_turn_paci_resu_cons_tipo_iden_paci",
                                requiredFields,
                                consultaData,
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
                            htmlFor="age_turn_paci_resu_cons_nume_iden_paci"
                          >
                            {requiredFields.includes(
                              "age_turn_paci_resu_cons_nume_iden_paci",
                            ) && <span className="text-red-500">* </span>}
                            {labelMap["age_turn_paci_resu_cons_nume_iden_paci"]}
                          </label>
                          <input
                            type="text"
                            id="age_turn_paci_resu_cons_nume_iden_paci"
                            name="age_turn_paci_resu_cons_nume_iden_paci"
                            value={
                              consultaData[
                                "age_turn_paci_resu_cons_nume_iden_paci"
                              ]
                            }
                            onChange={handleChangeResultadoConsulta}
                            placeholder="Nombres del paciente"
                            className={`${inputStyle} ${isFieldInvalid("age_turn_paci_resu_cons_nume_iden_paci", requiredFields, consultaData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_resu_cons_nume_iden_paci"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                            disabled={
                              variableEstado[
                                "age_turn_paci_resu_cons_nume_iden_paci"
                              ]
                            }
                          />
                        </div>
                      </>
                    ) : (
                      <div className={fieldClass}>
                        <label
                          className={labelClass}
                          htmlFor="age_turn_paci_resu_cons_apel_nomb_paci"
                        >
                          {requiredFields.includes(
                            "age_turn_paci_resu_cons_apel_nomb_paci",
                          ) && <span className="text-red-500">* </span>}
                          {labelMap["age_turn_paci_resu_cons_apel_nomb_paci"]}
                        </label>
                        <input
                          type="text"
                          id="age_turn_paci_resu_cons_apel_nomb_paci"
                          name="age_turn_paci_resu_cons_apel_nomb_paci"
                          value={
                            consultaData[
                              "age_turn_paci_resu_cons_apel_nomb_paci"
                            ]
                          }
                          onChange={handleChangeResultadoConsulta}
                          placeholder="Nombres del paciente"
                          className={`${inputStyle} ${isFieldInvalid("age_turn_paci_resu_cons_apel_nomb_paci", requiredFields, consultaData, isFieldVisible) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_resu_cons_apel_nomb_paci"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                          disabled={
                            variableEstado[
                              "age_turn_paci_resu_cons_apel_nomb_paci"
                            ]
                          }
                        />
                      </div>
                    )}
                    <div className={fieldClass}>
                      <label
                        className={labelClass}
                        htmlFor="age_turn_paci_resu_cons_fech_inic_fin"
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
                            "age_turn_paci_resu_cons_fech_inic_fin",
                          ) && <span className="text-red-500">* </span>}
                          {labelMap["age_turn_paci_resu_cons_fech_inic_fin"]}
                        </span>
                      </label>
                      <div className="relative w-full rounded">
                        <input
                          id="age_turn_paci_resu_cons_fech_inic_fin"
                          name="age_turn_paci_resu_cons_fech_inic_fin"
                          type="text"
                          readOnly
                          value={
                            rangeResuConsInicio && rangeResuConsFin
                              ? `${format(rangeResuConsInicio, "yyyy-MM-dd")} - ${format(rangeResuConsFin, "yyyy-MM-dd")}`
                              : "Selecciona el rango de fechas"
                          }
                          onClick={() => setShowResuConsCalendar(true)}
                          className={`${inputStyle} ${isFieldInvalid("age_turn_paci_resu_cons_fech_inic_fin", requiredFields, consultaData, isFieldVisible) && !(rangeResuConsInicio && rangeResuConsFin) ? "border-2 border-red-500" : ""} ${variableEstado["age_turn_paci_resu_cons_fech_inic_fin"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                          disabled={
                            variableEstado[
                              "age_turn_paci_resu_cons_fech_inic_fin"
                            ]
                          }
                        />
                        {rangeResuConsInicio && rangeResuConsFin && (
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                            onClick={() => {
                              setRangeResuConsInicio(null);
                              setRangeResuConsFin(null);
                            }}
                            title="Limpiar fechas"
                          >
                            X
                          </button>
                        )}
                        {showResuConsCalendar && (
                          <div
                            ref={calendarRefResuCons}
                            className="absolute z-50 mt-2 left-0 bg-white border border-blue-200 rounded-lg shadow-lg"
                          >
                            <DateRange
                              ranges={rangeResuCons}
                              onChange={(ranges) => {
                                onRangeResuConsChange(ranges);
                                setShowResuConsCalendar(false);
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
                    <div className="md:col-span-1 flex justify-items-start mt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          id="btn_resultado_consulta"
                          name="btn_resultado_consulta"
                          className={`${botonEstado.btn_resultado_consulta ? buttonStyleDesactivado : buttonStyleOtro}`}
                          disabled={botonEstado.btn_resultado_consulta}
                        >
                          Buscar
                        </button>
                      </div>
                    </div>
                  </div>
                </fieldset>
                <div className="md:col-span-2 flex justify-center mt-1">
                  <button
                    id="btn_limpiar_resultado_consulta"
                    name="btn_limpiar_resultado_consulta"
                    type="button"
                    className={`${botonEstado.btn_limpiar_resultado_consulta ? buttonStyleDesactivado : buttonStyleCancelar}`}
                    onClick={limpiarFormularioResultadoConsulta}
                    disabled={botonEstado.btn_limpiar_resultado_consulta}
                  >
                    Limpiar Todo
                  </button>
                </div>
              </form>
              <div className="flex flex-col gap-1 px-1 sm:px-1.5 md:px-3 lg:px-4 py-2">
                <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  Reporte de los resultados de la consulta del paciente
                </h3>
              </div>
              <div className={`${tableStyles.container} bg-white/90`}>
                <table className={`${tableStyles.table} text-sm`}>
                  <thead className={`${tableStyles.thead}`}>
                    <tr>
                      {TABLE_HEADERS_RESULTADO_CONSULTA.map((header) => (
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
                    {currentRowsResultadoConsulta.map((registro) => {
                      return (
                        <tr
                          key={registro.id}
                          className={`${tableStyles.trHover} odd:bg-white even:bg-gray-50`}
                        >
                          <td className={tableStyles.td}>
                            <div className="flex flex-col items-start text-black whitespace-pre-line">
                              <span>
                                {registro.adm_agen_turn_fech}
                                {" - "}
                                {registro.adm_agen_turn_hora_inic}
                              </span>
                              <span>{registro.adm_agen_turn_unid_salu}</span>
                              <span>{registro.adm_agen_turn_tipo_espe}</span>
                              <span>{registro.adm_agen_turn_prof_cita}</span>
                            </div>
                          </td>
                          {Object.keys(registro)
                            .filter(
                              (key) =>
                                ![
                                  "id",
                                  "adm_agen_turn_fech",
                                  "adm_agen_turn_hora_inic",
                                  "adm_agen_turn_unid_salu",
                                  "adm_agen_turn_tipo_espe",
                                  "adm_agen_turn_prof_cita",
                                  "adm_agen_turn_apel_nomb_paci",
                                ].includes(key),
                            )
                            .map((key) => {
                              let cellContent;
                              let tdClass = tableStyles.td;
                              switch (key) {
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
                                case "adm_agen_turn_esta_cita": {
                                  const estado =
                                    estadoTurnoMap[registro[key]] || "";
                                  let color =
                                    "bg-gray-100 text-gray-700 ring-gray-400";
                                  if (estado === "ATENDIDO/A") {
                                    color =
                                      "bg-green-100 text-black ring-green-400";
                                  } else if (estado === "INASISTENCIA") {
                                    color =
                                      "bg-red-100 text-black ring-red-400";
                                  }
                                  cellContent = (
                                    <div>
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${color}`}
                                      >
                                        {estado}
                                      </span>
                                    </div>
                                  );
                                  break;
                                }
                                case "adm_agen_turn_cons_link_paci":
                                  cellContent = (
                                    <a
                                      href={
                                        registro.adm_agen_turn_cons_link_paci
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="break-all underline text-blue-700 hover:text-blue-900"
                                      title={
                                        registro.adm_agen_turn_cons_link_paci
                                      }
                                    >
                                      {registro.adm_agen_turn_cons_link_paci}
                                    </a>
                                  );
                                  tdClass = tableStyles.td2;
                                  break;
                                case "adm_agen_turn_cons_obse_paci":
                                  cellContent = (
                                    <span title={registro[key]}>
                                      {registro[key]}
                                    </span>
                                  );
                                  tdClass = tableStyles.td3;
                                  break;
                                case "adm_agen_turn_cons_tipo_serv": {
                                  const tipoServ =
                                    tipoServicioMap[registro[key]] || "";
                                  let color =
                                    "bg-gray-100 text-gray-700 ring-gray-400";
                                  if (tipoServ === "CONSULTA EXTERNA") {
                                    color =
                                      "bg-lime-100 text-black ring-lime-400";
                                  } else if (tipoServ === "EMERGENCIA") {
                                    color =
                                      "bg-sky-100 text-black ring-sky-400";
                                  }
                                  cellContent = (
                                    <div>
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${color}`}
                                      >
                                        {tipoServ}
                                      </span>
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
                                <td key={key} className={tdClass}>
                                  {cellContent}
                                </td>
                              );
                            })}
                        </tr>
                      );
                    })}
                    {currentRowsResultadoConsulta.length === 0 && (
                      <tr>
                        <td
                          colSpan={TABLE_HEADERS_RESULTADO_CONSULTA.length}
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
                    {filteredResultadoConsulta.length === 0
                      ? 0
                      : indexOfFirstRowResultadoConsulta + 1}
                  </span>{" "}
                  –{" "}
                  <span className="font-medium">
                    {Math.min(
                      indexOfLastRowResultadoConsulta,
                      filteredResultadoConsulta.length,
                    )}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium">
                    {filteredResultadoConsulta.length}
                  </span>
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
                      value={rowsPerPageResultadoConsulta}
                      onChange={(e) =>
                        setRowsPerPageResultadoConsulta(Number(e.target.value))
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
                    onClick={() => setCurrentPageResultadoConsulta(1)}
                    disabled={currentPageResultadoConsulta === 1}
                    className="px-2.5 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
                    title="Primera página"
                  >
                    «
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPageResultadoConsulta((prev) =>
                        Math.max(prev - 1, 1),
                      )
                    }
                    disabled={currentPageResultadoConsulta === 1}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700 px-1">
                    Página {currentPageResultadoConsulta} de{" "}
                    {totalPagesResultadoConsulta}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPageResultadoConsulta((prev) =>
                        Math.min(prev + 1, totalPagesResultadoConsulta),
                      )
                    }
                    disabled={
                      currentPageResultadoConsulta ===
                      totalPagesResultadoConsulta
                    }
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Siguiente
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPageResultadoConsulta(
                        totalPagesResultadoConsulta,
                      )
                    }
                    disabled={
                      currentPageResultadoConsulta ===
                      totalPagesResultadoConsulta
                    }
                    className="px-2.5 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
                    title="Última página"
                  >
                    »
                  </button>
                </div>
              </div>
              <EstadoMensajes error={error} successMessage={successMessage} />
            </div>
          )}
      </div>
    </div>
  );
}
