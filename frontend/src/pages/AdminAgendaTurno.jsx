import React, { useState, useRef, useEffect } from "react";
import {
  listarUsuariosApoyoAtencion,
  buscarUsuarioIdUnidadSalud,
  registerAdminAgendaTurno,
  listarTurnosPaciente,
  eliminarTurnoAgendado,
  actualizarAgenda,
  updateUnidadSaludPrincipal,
} from "../api/conexion.api.js";
import allListAgenda from "../api/all.list.agenda.json";
import allListRegisterUser from "../api/all.list.register.user.json";
import {
  CustomSelect,
  inputStyle,
  isFieldInvalid,
  buttonStyleGuardar,
  buttonStyleActualizar,
  buttonStyleEliminar,
  buttonStyleCancelar,
  buttonStyleOtro,
  buttonStyleDesactivado,
} from "../components/EstilosCustom.jsx";
import Loader from "../components/Loader.jsx";
import { toast } from "react-hot-toast";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
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
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { eachDayOfInterval } from "date-fns";
import { da, tr } from "date-fns/locale";
import { toZonedTime, format as formatTz } from "date-fns-tz";

const locales = { es: esES };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});
const timeZoneEC = "America/Guayaquil";
const nowEC = toZonedTime(new Date(), timeZoneEC);
const fechaActualEC = formatTz(nowEC, "yyyy-MM-dd", { timeZone: timeZoneEC });
const horaActualEC = formatTz(nowEC, "HH:mm", { timeZone: timeZoneEC });

const initialState = {
  adm_agen_turn_unid_salu: "",
  adm_agen_turn_fech: "",
  adm_agen_turn_tipo_espe: "",
  adm_agen_turn_prof_cita: "",
  adm_agen_turn_hora_inic: "",
  adm_agen_turn_hora_fin: "",
  adm_agen_turn_almuerzo_inicio: "",
  adm_agen_turn_almuerzo_fin: "",
  adm_agen_turn_esta_cita: 1,
  adm_agen_turn_dura_min: 30,
  adm_agen_turn_rese_unid_salu: "",
  adm_agen_turn_dias_semana: [1, 2, 3, 4, 5],
  adm_agen_turn_eniUser: "",
};

const initialModalState = {
  adm_agen_turn_fech_moda: "",
  adm_agen_turn_tipo_espe_moda: "",
  adm_agen_turn_prof_cita_moda: "",
  adm_agen_turn_hora_inic_moda: "",
  adm_agen_turn_hora_fin_moda: "",
  adm_agen_turn_esta_cita_moda: "",
  adm_agen_turn_rese_unid_salu_moda: "",
  adm_agen_turn_dura_min_moda: "",
  idTurno: "",
};

const diasSemana = [
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
];

const AdminAgendaTurno = () => {
  const [formData, setFormData] = useState(initialState);
  const [modalData, setModalData] = useState(initialModalState);
  const [turnoEditando, setTurnoEditando] = useState(null);
  const [showEditElimModal, setShowEditElimModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [events, setEvents] = useState([]);
  const [medicosList, setMedicosList] = useState([]);
  const [unidadSaludList, setUnidadSaludList] = useState([]);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [showUnidadModal, setShowUnidadModal] = useState(false);

  const [rangeInicio, setRangeInicio] = useState(new Date());
  const [rangeFin, setRangeFin] = useState(new Date());
  const [almuerzoInicio, setAlmuerzoInicio] = useState("");
  const [almuerzoFin, setAlmuerzoFin] = useState("");
  const [diasSeleccionados, setDiasSeleccionados] = useState([1, 2, 3, 4, 5]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarView, setCalendarView] = useState(Views.WEEK);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [showUnidadSalud, setShowUnidadSalud] = useState(false);
  const [showUnidadSaludModal, setShowUnidadSaludModal] = useState(false);

  const initialVariableEstado = {
    adm_agen_turn_unid_salu: true,
    adm_agen_turn_tipo_espe: false,
    adm_agen_turn_prof_cita: true,
    adm_agen_turn_esta_cita: true,
    adm_agen_turn_rese_unid_salu: true,
    adm_agen_turn_fech_inic_fin: true,
    adm_agen_turn_hora_inic: true,
    adm_agen_turn_hora_fin: true,
    adm_agen_turn_almuerzo_inicio: true,
    adm_agen_turn_almuerzo_fin: true,
    adm_agen_turn_dura_min: true,
    adm_agen_turn_dias_semana: true,
  };
  const initialBotonEstado = {
    btn_generar_turnos: true,
    btnRegistrar: true,
    btn_limpiar_variables: true,
    btn_actualizar_turno_moda: true,
    btn_eliminar_turno_moda: true,
  };
  const [variableEstado, setVariableEstado] = useState(initialVariableEstado);
  const [botonEstado, setBotonEstado] = useState(initialBotonEstado);
  const calendarRef = useRef(null);

  const onRangeChange = ({ selection }) => {
    setRange([selection]);
    setRangeInicio(selection.startDate);
    setRangeFin(selection.endDate);
  };

  // Maneja el cambio de los checkboxes
  const handleDiaChange = (dia) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia],
    );
  };

  const isFieldVisible = () => true;

  const requiredFields = [
    "adm_agen_turn_unid_salu",
    "adm_agen_turn_tipo_espe",
    "adm_agen_turn_prof_cita",
    "adm_agen_turn_esta_cita",
    "adm_agen_turn_rese_unid_salu",
    "adm_agen_turn_fech_inic_fin",
    "adm_agen_turn_hora_inic",
    "adm_agen_turn_hora_fin",
    "adm_agen_turn_dura_min",
    "adm_agen_turn_dias_semana",
  ];

  const labelMap = {
    adm_agen_turn_unid_salu: "Unidad de salud:",
    adm_agen_turn_fech: "Fecha de cita:",
    adm_agen_turn_fech_inic_fin: "Rango de fechas para agendar:",
    adm_agen_turn_fech_inicio: "Fecha inicio agenda:",
    adm_agen_turn_fech_fin: "Fecha fin agenda:",
    adm_agen_turn_tipo_espe: "Tipo de especialidad:",
    adm_agen_turn_rese_unid_salu: "Unidad de salud a reservar:",
    adm_agen_turn_prof_cita: "Profesional de la cita:",
    adm_agen_turn_hora_inic: "Hora de inicio:",
    adm_agen_turn_hora_fin: "Hora de fin:",
    adm_agen_turn_almuerzo_inicio: "Inicio almuerzo:",
    adm_agen_turn_almuerzo_fin: "Fin almuerzo:",
    adm_agen_turn_esta_cita: "Estado de la cita:",
    adm_agen_turn_dura_min: "Duración por turno (min):",
    adm_agen_turn_dias_semana: "Días de la semana para agendar:",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (
      name === "adm_agen_turn_unid_salu" &&
      value !== formData.adm_agen_turn_unid_salu
    ) {
      setUnidadSeleccionada(value);
      setShowUnidadModal(true);
    }
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [name]:
          name === "adm_agen_turn_dura_min" ||
          name === "adm_agen_turn_esta_cita"
            ? Number(value)
            : value,
      };
      if (unidadSaludList.length > 0) {
        newFormData.adm_agen_turn_unid_salu = unidadSaludList[0].value;
      }
      if (name === "adm_agen_turn_tipo_espe") {
        if (newFormData.adm_agen_turn_tipo_espe) {
          ajustarVariableEstadoFalso();
        } else {
          limpiarVariables();
        }
      }
      if (name === "adm_agen_turn_esta_cita") {
        if (newFormData.adm_agen_turn_esta_cita === 2) {
          setShowUnidadSalud(true);
          setVariableEstado((prev) => ({
            ...prev,
            adm_agen_turn_rese_unid_salu: false,
          }));
        } else {
          setShowUnidadSalud(false);
          newFormData.adm_agen_turn_rese_unid_salu = "";
        }
      }
      const camposBaseLlenos =
        newFormData.adm_agen_turn_unid_salu &&
        newFormData.adm_agen_turn_tipo_espe &&
        newFormData.adm_agen_turn_prof_cita &&
        newFormData.adm_agen_turn_esta_cita &&
        (newFormData.adm_agen_turn_esta_cita !== 2 ||
          newFormData.adm_agen_turn_rese_unid_salu) &&
        newFormData.adm_agen_turn_hora_inic &&
        newFormData.adm_agen_turn_hora_fin &&
        newFormData.adm_agen_turn_dura_min &&
        diasSeleccionados.length > 0 &&
        rangeInicio &&
        rangeFin;

      setBotonEstado((prevBtns) => ({
        ...prevBtns,
        btn_generar_turnos: !camposBaseLlenos,
      }));
      return newFormData;
    });
  };

  const ajustarVariableEstadoFalso = () => {
    setVariableEstado((prev) => ({
      ...prev,
      adm_agen_turn_unid_salu: false,
      adm_agen_turn_prof_cita: false,
      adm_agen_turn_esta_cita: false,
      adm_agen_turn_fech_inic_fin: false,
      adm_agen_turn_hora_inic: false,
      adm_agen_turn_hora_fin: false,
      adm_agen_turn_almuerzo_inicio: false,
      adm_agen_turn_almuerzo_fin: false,
      adm_agen_turn_dura_min: false,
      adm_agen_turn_dias_semana: false,
    }));
    setBotonEstado((prev) => ({
      ...prev,
      btn_limpiar_variables: false,
    }));
  };

  const handleChangeModal = (event) => {
    const { name, value } = event.target;
    setModalData((prev) => {
      const newModalData = {
        ...prev,
        [name]: name === "adm_agen_turn_esta_cita_moda" ? Number(value) : value,
      };
      if (name === "adm_agen_turn_esta_cita_moda") {
        if (newModalData.adm_agen_turn_esta_cita_moda == 2) {
          setShowUnidadSaludModal(true);
          setVariableEstado((prev) => ({
            ...prev,
            adm_agen_turn_rese_unid_salu_moda: false,
          }));
        } else {
          setShowUnidadSaludModal(false);
          newModalData.adm_agen_turn_rese_unid_salu_moda = "";
        }
      }
      const camposBaseLlenos =
        newModalData.adm_agen_turn_fech_moda &&
        newModalData.adm_agen_turn_tipo_espe_moda &&
        newModalData.adm_agen_turn_prof_cita_moda &&
        newModalData.adm_agen_turn_hora_inic_moda &&
        newModalData.adm_agen_turn_hora_fin_moda &&
        newModalData.adm_agen_turn_esta_cita_moda &&
        (newModalData.adm_agen_turn_esta_cita_moda != 2 ||
          newModalData.adm_agen_turn_rese_unid_salu_moda);
      setBotonEstado((prevBtns) => ({
        ...prevBtns,
        btn_actualizar_turno_moda: !camposBaseLlenos,
      }));
      return newModalData;
    });
  };

  const combineDateTime = (date, time) => {
    if (!date || !time) return null;
    return new Date(`${date}T${time}`);
  };

  // Genera turnos entre la hora inicio y fin con la duración indicada
  const generarTurnos = () => {
    let fechInic, fechFin, diasSema;
    fechInic = rangeInicio ? format(rangeInicio, "yyyy-MM-dd") : null;
    fechFin = rangeFin ? format(rangeFin, "yyyy-MM-dd") : null;
    diasSema = diasSeleccionados;

    const {
      adm_agen_turn_tipo_espe: tipoEspe,
      adm_agen_turn_unid_salu: unidSalu,
      adm_agen_turn_prof_cita: profCita,
      adm_agen_turn_esta_cita: estaCita,
      adm_agen_turn_rese_unid_salu: resUnidSalu,
      adm_agen_turn_hora_inic: horaInicio,
      adm_agen_turn_hora_fin: horaFin,
      adm_agen_turn_dura_min: duracion,
    } = formData;

    if (
      !tipoEspe ||
      !unidSalu ||
      !profCita ||
      !estaCita ||
      (estaCita === 2 && !resUnidSalu) ||
      !fechInic ||
      !fechFin ||
      !horaInicio ||
      !horaFin ||
      !duracion ||
      diasSema.length === 0
    ) {
      const msg =
        "Todos los campos con asterisco en rojo son obligatorios para generar turnos.";
      setError(msg);
      toast.error(msg, { position: "bottom-right" });
      setTimeout(() => setError(""), 10000);
      return;
    }

    const stringFechaHora = `${fechInic}T${horaInicio}`;
    const fechaObjeto = parse(
      stringFechaHora,
      "yyyy-MM-dd'T'HH:mm",
      new Date(),
    );

    if (isAfter(nowEC, fechaObjeto)) {
      const error = `La fecha y hora tiene que ser igual o posterior a la fecha actual (${format(nowEC, "yyyy-MM-dd HH:mm")}).`;
      setError(error);
      toast.error(error, { position: "bottom-right" });
      return;
    }

    setError("");
    setSuccessMessage("");

    const fechaReferencia = format(rangeInicio, "yyyy-MM-dd");
    const fechaInicio = fechaReferencia;
    const fechaFin = format(rangeFin, "yyyy-MM-dd");

    if (!fechaInicio || !horaInicio || !horaFin || !duracion) {
      const msg = "Completa fechas, hora inicio, hora fin y duración.";
      setError(msg);
      toast.error(msg, { position: "bottom-right" });
      setTimeout(() => setError(""), 10000);
      return;
    }

    const inicioDia = new Date(`${fechaInicio}T00:00:00`);
    const finDia = new Date(`${fechaFin}T00:00:00`);
    if (isAfter(inicioDia, finDia)) {
      const msg = "La fecha fin debe ser mayor o igual a la fecha inicio.";
      setError(msg);
      toast.error(msg, { position: "bottom-right" });
      setTimeout(() => setError(""), 10000);
      return;
    }
    if (duracion <= 0) {
      const msg = "La duración debe ser mayor a 0.";
      setError(msg);
      toast.error(msg, { position: "bottom-right" });
      setTimeout(() => setError(""), 10000);
      return;
    }

    const nuevos = [];
    const generarSlots = (diaInicioTrabajo, diaFinTrabajo, fechaStr) => {
      if (
        !diaInicioTrabajo ||
        !diaFinTrabajo ||
        !isBefore(diaInicioTrabajo, diaFinTrabajo)
      ) {
        const msg = `Rango horario inválido para ${fechaStr}.`;
        setError(msg);
        toast.error(msg, { position: "bottom-right" });
        setTimeout(() => setError(""), 10000);
        throw new Error(msg);
      }
      let cursor = new Date(diaInicioTrabajo);
      while (
        isBefore(addMinutes(cursor, duracion), diaFinTrabajo) ||
        +addMinutes(cursor, duracion) === +diaFinTrabajo
      ) {
        const slotStart = new Date(cursor);
        const slotEnd = addMinutes(cursor, duracion);
        nuevos.push({
          id: `gen-${fechaStr}-${+slotStart}`,
          title: `${tipoEspe || "Especialidad"} - ${
            profCita || "Profesional"
          } (${format(slotStart, "HH:mm")}-${format(slotEnd, "HH:mm")})`,
          start: slotStart,
          end: slotEnd,
          tipo_especialidad: tipoEspe || "",
          profesional: profCita || "",
          estado: "DISPONIBLE",
          generated: true,
        });
        cursor = slotEnd;
      }
    };

    let dia = new Date(inicioDia);
    while (dia <= finDia) {
      // Solo genera si el día está seleccionado
      if (diasSeleccionados.includes(dia.getDay())) {
        const fechaActual = format(dia, "yyyy-MM-dd");
        const diaInicioTrabajo = combineDateTime(fechaActual, horaInicio);
        const diaFinTrabajo = combineDateTime(fechaActual, horaFin);

        const tieneAlmuerzo = almuerzoInicio && almuerzoFin;
        let inicioAlmuerzo = null;
        let finAlmuerzo = null;

        if (tieneAlmuerzo) {
          inicioAlmuerzo = combineDateTime(fechaActual, almuerzoInicio);
          finAlmuerzo = combineDateTime(fechaActual, almuerzoFin);

          if (
            !inicioAlmuerzo ||
            !finAlmuerzo ||
            !isBefore(inicioAlmuerzo, finAlmuerzo) ||
            !isBefore(diaInicioTrabajo, inicioAlmuerzo) ||
            !isBefore(finAlmuerzo, diaFinTrabajo)
          ) {
            const msg =
              "La hora de almuerzo debe estar dentro del rango laboral y ser válida.";
            setError(msg);
            toast.error(msg, { position: "bottom-right" });
            setTimeout(() => setError(""), 10000);
            return;
          }
        }

        try {
          if (tieneAlmuerzo) {
            generarSlots(diaInicioTrabajo, inicioAlmuerzo, fechaActual);
            nuevos.push({
              id: `lunch-${fechaActual}`,
              title: "Almuerzo",
              start: inicioAlmuerzo,
              end: finAlmuerzo,
              tipo_especialidad: tipoEspe || "",
              profesional: profCita || "",
              estado: "ALMUERZO",
              generated: true,
            });
            generarSlots(finAlmuerzo, diaFinTrabajo, fechaActual);
          } else {
            generarSlots(diaInicioTrabajo, diaFinTrabajo, fechaActual);
          }
        } catch {
          return;
        }
      }
      dia = addDays(dia, 1);
    }

    if (nuevos.length === 0) {
      const msg = "El rango y la duración no generan turnos.";
      setError(msg);
      toast.error(msg, { position: "bottom-right" });
      setTimeout(() => setError(""), 10000);
      return;
    }

    setEvents((prev) => {
      const sameDay = (d1, d2) =>
        format(d1, "yyyy-MM-dd") === format(d2, "yyyy-MM-dd");
      const filtrados = prev.filter(
        (e) =>
          !nuevos.some((nuevo) => sameDay(e.start, nuevo.start)) ||
          !e.generated,
      );
      return [...filtrados, ...nuevos];
    });

    setVariableEstado((prev) => ({
      ...prev,
      adm_agen_turn_unid_salu: true,
      adm_agen_turn_tipo_espe: true,
      adm_agen_turn_prof_cita: true,
      adm_agen_turn_esta_cita: true,
      adm_agen_turn_rese_unid_salu: true,
      adm_agen_turn_fech_inic_fin: true,
      adm_agen_turn_hora_inic: true,
      adm_agen_turn_hora_fin: true,
      adm_agen_turn_almuerzo_inicio: true,
      adm_agen_turn_almuerzo_fin: true,
      adm_agen_turn_dura_min: true,
      adm_agen_turn_dias_semana: true,
    }));
    setBotonEstado((prev) => ({
      ...prev,
      btnRegistrar: false,
      btn_generar_turnos: true,
    }));

    const ok = `Se generaron ${nuevos.length} turnos. No olvides guardarlos.`;
    setSuccessMessage(ok);
    setTimeout(() => setSuccessMessage(""), 10000);
    toast.success(ok, { position: "bottom-right" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const turnosAGuardar = events.filter(
        (ev) => ev.generated && ev.estado === "DISPONIBLE",
      );
      if (turnosAGuardar.length === 0) {
        setError("No hay turnos generados para guardar.");
        setTimeout(() => setError(""), 10000);
        setIsLoading(false);
        return;
      }

      const seleccionado = medicosList.find(
        (opt) => opt.value === formData.adm_agen_turn_prof_cita,
      );
      const unidadObj = unidadSaludList.find(
        (u) => u.value === formData.adm_agen_turn_unid_salu,
      );
      const labelProfesional = seleccionado ? seleccionado.label : "";

      const payload = turnosAGuardar.map((ev) => ({
        adm_agen_turn_unid_salu: unidadObj ? unidadObj.label : "",
        adm_agen_turn_fech: format(ev.start, "yyyy-MM-dd"),
        adm_agen_turn_hora_inic: format(ev.start, "HH:mm"),
        adm_agen_turn_hora_fin: format(ev.end, "HH:mm"),
        adm_agen_turn_tipo_espe: ev.tipo_especialidad,
        adm_agen_turn_prof_cita: ev.profesional,
        adm_agen_turn_esta_cita: formData.adm_agen_turn_esta_cita,
        adm_agen_turn_dura_min: formData.adm_agen_turn_dura_min,
        adm_agen_turn_eniUser: labelProfesional,
        adm_agen_turn_rese_unid_salu:
          formData.adm_agen_turn_rese_unid_salu || "",
      }));

      const response = await registerAdminAgendaTurno(payload);
      const message = response?.message || "Se registró con éxito!";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 10000);
      toast.success(message, { position: "bottom-right" });

      const turnos = await listarTurnosPaciente();
      setEvents(
        turnos
          .filter(
            (turno) =>
              turno.adm_agen_turn_fech &&
              turno.adm_agen_turn_hora_inic &&
              turno.adm_agen_turn_hora_fin,
          )
          .map((turno) => {
            // Conversión de fecha
            const [day, month, year] = turno.adm_agen_turn_fech.split("/");
            const fechaISO = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            const start = new Date(
              `${fechaISO}T${turno.adm_agen_turn_hora_inic}`,
            );
            const end = new Date(`${fechaISO}T${turno.adm_agen_turn_hora_fin}`);
            if (isNaN(start) || isNaN(end)) return null;
            return {
              title:
                turno.titulo ||
                `${turno.adm_agen_turn_tipo_espe || ""} - ${turno.adm_agen_turn_prof_cita || ""}`,
              start,
              end,
              ...turno,
              fromDB: true,
            };
          })
          .filter(Boolean),
      );
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

  const handleEliminarTurno = async (id) => {
    if (!id) {
      const msg = "El identificador del turno es obligatorio.";
      setError(msg);
      toast.error(msg, { position: "bottom-right" });
      setTimeout(() => setError(""), 10000);
      return;
    }
    if (!globalThis.confirm("¿Seguro que deseas eliminar este turno?")) return;
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await eliminarTurnoAgendado(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success(response.message || "Turno eliminado correctamente");

      limpiarVariables();
      setShowEditElimModal(false);
    } catch (error) {
      const errorMessage =
        getErrorMessage(error) || "Error al eliminar el turno";
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      setSuccessMessage("");
      toast.error(errorMessage, { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActualizarTurno = async () => {
    const {
      adm_agen_turn_fech_moda: fechCitaModa,
      adm_agen_turn_tipo_espe_moda: tipoEspeModa,
      adm_agen_turn_prof_cita_moda: profCitaModa,
      adm_agen_turn_hora_inic_moda: horaInicModa,
      adm_agen_turn_hora_fin_moda: horaFinModa,
      adm_agen_turn_esta_cita_moda: estaCitaModa,
      adm_agen_turn_rese_unid_salu_moda: reseUnidSaluModa,
    } = modalData;
    if (
      !fechCitaModa ||
      !tipoEspeModa ||
      !profCitaModa ||
      !horaInicModa ||
      !horaFinModa ||
      !estaCitaModa ||
      (estaCitaModa == 2 && !reseUnidSaluModa)
    ) {
      const msg =
        "Todos los campos con asterisco en rojo son obligatorios para actualizar turnos.";
      setError(msg);
      toast.error(msg, { position: "bottom-right" });
      setTimeout(() => setError(""), 10000);
      return;
    }
    const fechaBase = new Date(`${fechCitaModa}T00:00:00`);
    const inicio = parse(horaInicModa, "HH:mm:ss", fechaBase);
    const fin = parse(horaFinModa, "HH:mm:ss", fechaBase);
    if (!isBefore(inicio, fin)) {
      const msg = "La hora de inicio debe ser menor que la hora de fin.";
      setError(msg);
      toast.error(msg, { position: "bottom-right" });
      setTimeout(() => setError(""), 10000);
      return;
    }
    const duracionMinutos = (fin - inicio) / (1000 * 60);
    const seleccionado = medicosList.find(
      (opt) => opt.value === modalData.adm_agen_turn_prof_cita_moda,
    );
    const turnoActualizado = {
      ...modalData,
      adm_agen_turn_prof_cita_moda: seleccionado ? seleccionado.label : "",
      adm_agen_turn_dura_min_moda: duracionMinutos,
    };

    if (isLoading) return;
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await actualizarAgenda(
        turnoActualizado.idTurno,
        turnoActualizado,
      );
      await fetchTurnos();
      toast.success(response.message || "Turno actualizado correctamente");
      limpiarVariables();
      setShowEditElimModal(false);
    } catch (error) {
      const errorMessage =
        getErrorMessage(error) || "Error al actualizar el turno";
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      setSuccessMessage("");
      toast.error(errorMessage, { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTurnos = async () => {
    const turnos = await listarTurnosPaciente();
    setEvents(
      turnos
        .filter(
          (turno) =>
            turno.adm_agen_turn_fech &&
            turno.adm_agen_turn_hora_inic &&
            turno.adm_agen_turn_hora_fin,
        )
        .map((turno) => {
          // Conversión de fecha
          const [day, month, year] = turno.adm_agen_turn_fech.split("/");
          const fechaISO = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          const start = new Date(
            `${fechaISO}T${turno.adm_agen_turn_hora_inic}`,
          );
          const end = new Date(`${fechaISO}T${turno.adm_agen_turn_hora_fin}`);
          if (isNaN(start) || isNaN(end)) return null;
          return {
            title:
              turno.titulo ||
              `${turno.adm_agen_turn_tipo_espe || ""} - ${turno.adm_agen_turn_prof_cita || ""}`,
            start,
            end,
            ...turno,
            fromDB: true,
          };
        })
        .filter(Boolean),
    );
  };

  const limpiarVariables = () => {
    setFormData(initialState);
    setModalData(initialModalState);
    setSuccessMessage("");
    setError("");
    setAlmuerzoInicio("");
    setAlmuerzoFin("");
    setRangeInicio(new Date());
    setRangeFin(new Date());
    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
    setShowUnidadSalud(false);
    setShowUnidadSaludModal(false);
  };

  React.useEffect(() => {
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
  }, [showCalendar]);

  // Cargar profesionales para el select (evita usar await fuera de una función async)
  React.useEffect(() => {
    let mounted = true;

    const cargarProfesionales = async () => {
      try {
        const [medicosData, unidadSaludData] = await Promise.all([
          listarUsuariosApoyoAtencion(),
          buscarUsuarioIdUnidadSalud(),
        ]);

        // Formatear médicos
        const medicosListFormatted = Array.isArray(medicosData)
          ? medicosData.map((medico) => ({
              value: medico.id?.toString(),
              label:
                `${medico.username} ${medico.last_name} ${medico.first_name}`.trim(),
            }))
          : [];
        const unidades = Array.isArray(unidadSaludData?.data?.unidades_data)
          ? unidadSaludData.data.unidades_data
          : [];

        const unidadSaludListFormatted = unidades.map((u) => ({
          value: u.id?.toString(),
          label: `${u.uni_unic} - ${u.uni_unid}`,
        }));

        setMedicosList(medicosListFormatted);
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

  useEffect(() => {
    const fetchTurnos = async () => {
      setIsLoading(true);
      try {
        const turnos = await listarTurnosPaciente();
        setEvents(
          turnos
            .filter(
              (turno) =>
                turno.adm_agen_turn_fech &&
                turno.adm_agen_turn_hora_inic &&
                turno.adm_agen_turn_hora_fin,
            )
            .map((turno) => {
              // Convertir "03/03/2026" a "2026-03-03"
              const [day, month, year] = turno.adm_agen_turn_fech.split("/");
              const fechaISO = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
              const start = new Date(
                `${fechaISO}T${turno.adm_agen_turn_hora_inic}`,
              );
              const end = new Date(
                `${fechaISO}T${turno.adm_agen_turn_hora_fin}`,
              );
              if (isNaN(start) || isNaN(end)) return null;
              return {
                title:
                  turno.titulo ||
                  `${turno.adm_agen_turn_tipo_espe || ""} - ${turno.adm_agen_turn_prof_cita || ""}`,
                start,
                end,
                ...turno,
                fromDB: true,
              };
            })
            .filter(Boolean),
        );
      } catch (error) {
        const errorMessage =
          getErrorMessage(error) || "Error al cargar los turnos agendados";
        setError(errorMessage);
        setTimeout(() => setError(""), 10000);
        setSuccessMessage("");
        toast.error(errorMessage, { position: "bottom-right" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTurnos();
  }, []);

  const MyEvent = ({ event }) => (
    <span>
      {event.title}
      {/* Puedes mostrar un icono, pero no un botón funcional aquí */}
    </span>
  );

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

  return (
    <div className="w-auto h-auto flex items-stretch justify-stretch bg-gray-100">
      <div className="w-full h-full p-4 m-4 bg-white rounded-lg shadow-md mt-1">
        <h2 className="text-2xl font-bold mb-1 text-center text-blue-700">
          Registro de Agenda de Turno
        </h2>
        {isLoading && (
          <Loader
            modal
            isOpen={isLoading}
            title="Procesando información"
            text="Por favor espere..."
            closeButton={false}
          />
        )}
        <form onSubmit={handleSubmit} autoComplete="on" className="w-full">
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
                <CustomSelect
                  id="adm_agen_turn_tipo_espe"
                  name="adm_agen_turn_tipo_espe"
                  value={formData.adm_agen_turn_tipo_espe}
                  onChange={handleChange}
                  options={allListAgenda.adm_agen_turn_tipo_espe}
                  disabled={variableEstado["adm_agen_turn_tipo_espe"]}
                  className={
                    isFieldInvalid(
                      "adm_agen_turn_tipo_espe",
                      requiredFields,
                      formData,
                      isFieldVisible,
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                  placeholder="Ej: Medicina General, Pediatría..."
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_agen_turn_unid_salu">
                  {requiredFields.includes("adm_agen_turn_unid_salu") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["adm_agen_turn_unid_salu"]}
                </label>
                <CustomSelect
                  id="adm_agen_turn_unid_salu"
                  name="adm_agen_turn_unid_salu"
                  value={formData.adm_agen_turn_unid_salu}
                  onChange={handleChange}
                  options={unidadSaludList}
                  disabled={variableEstado["adm_agen_turn_unid_salu"]}
                  className={
                    isFieldInvalid(
                      "adm_agen_turn_unid_salu",
                      requiredFields,
                      formData,
                      isFieldVisible,
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                  placeholder="Unidad de salud"
                  isClearable={false}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_agen_turn_prof_cita">
                  {requiredFields.includes("adm_agen_turn_prof_cita") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["adm_agen_turn_prof_cita"]}
                </label>
                <CustomSelect
                  id="adm_agen_turn_prof_cita"
                  name="adm_agen_turn_prof_cita"
                  value={formData.adm_agen_turn_prof_cita}
                  onChange={handleChange}
                  options={medicosList}
                  disabled={variableEstado["adm_agen_turn_prof_cita"]}
                  className={
                    isFieldInvalid(
                      "adm_agen_turn_prof_cita",
                      requiredFields,
                      formData,
                      isFieldVisible,
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                  isLargeList={true}
                  placeholder="Nombre del profesional"
                  minSearchLength={2}
                  maxResults={100}
                />
              </div>
              <div className="grid grid-rows-1 md:grid-rows-1 gap-1">
                <div className={fieldClass}>
                  <label
                    className={labelClass}
                    htmlFor="adm_agen_turn_esta_cita"
                  >
                    {requiredFields.includes("adm_agen_turn_esta_cita") && (
                      <span className="text-red-500">* </span>
                    )}
                    {labelMap["adm_agen_turn_esta_cita"]}
                  </label>
                  <CustomSelect
                    id="adm_agen_turn_esta_cita"
                    name="adm_agen_turn_esta_cita"
                    value={formData.adm_agen_turn_esta_cita}
                    onChange={handleChange}
                    options={(
                      allListAgenda.adm_agen_turn_esta_cita || []
                    ).filter((opt) => opt.value === 1 || opt.value === 2)}
                    disabled={variableEstado["adm_agen_turn_esta_cita"]}
                    className={
                      isFieldInvalid(
                        "adm_agen_turn_esta_cita",
                        requiredFields,
                        formData,
                        isFieldVisible,
                      )
                        ? "border-2 border-red-500"
                        : ""
                    }
                    placeholder="Ej: DISPONIBLE, RESERVADO/A"
                  />
                </div>
                {showUnidadSalud && (
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_agen_turn_rese_unid_salu"
                    >
                      {requiredFields.includes(
                        "adm_agen_turn_rese_unid_salu",
                      ) && <span className="text-red-500">* </span>}
                      {labelMap["adm_agen_turn_rese_unid_salu"]}
                    </label>
                    <CustomSelect
                      id="adm_agen_turn_rese_unid_salu"
                      name="adm_agen_turn_rese_unid_salu"
                      value={formData.adm_agen_turn_rese_unid_salu}
                      onChange={handleChange}
                      options={allListRegisterUser.uni_unic}
                      disabled={variableEstado["adm_agen_turn_rese_unid_salu"]}
                      className={
                        isFieldInvalid(
                          "adm_agen_turn_rese_unid_salu",
                          requiredFields,
                          formData,
                          isFieldVisible,
                        )
                          ? "border-2 border-red-500"
                          : ""
                      }
                      placeholder="Lista de unidades de salud"
                    />
                  </div>
                )}
              </div>
            </div>
          </fieldset>
          <fieldset className="border border-blue-200 rounded p-2 mb-1">
            <legend className="text-lg font-semibold text-blue-600 px-2">
              Fecha de la Agenda y turnos
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="adm_agen_turn_fech_inic_fin"
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
                    {requiredFields.includes("adm_agen_turn_fech_inic_fin") && (
                      <span className="text-red-500">* </span>
                    )}
                    {labelMap["adm_agen_turn_fech_inic_fin"]}
                  </span>
                </label>
                <div className="relative">
                  <input
                    id="adm_agen_turn_fech_inic_fin"
                    name="adm_agen_turn_fech_inic_fin"
                    type="text"
                    readOnly
                    value={
                      rangeInicio && rangeFin
                        ? `${format(rangeInicio, "yyyy-MM-dd")} - ${format(rangeFin, "yyyy-MM-dd")}`
                        : "Selecciona el rango de fechas"
                    }
                    onClick={() => setShowCalendar(true)}
                    className={`${inputStyle}
                      ${isFieldInvalid("adm_agen_turn_fech_inic_fin", requiredFields, formData, isFieldVisible) && !(rangeInicio && rangeFin) ? "border-2 border-red-500" : ""}
                      ${variableEstado["adm_agen_turn_fech_inic_fin"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                    disabled={variableEstado["adm_agen_turn_fech_inic_fin"]}
                  />
                  {showCalendar && (
                    <div
                      ref={calendarRef}
                      className="absolute z-10 mt-2 left-0 bg-white border border-blue-200 rounded-lg shadow-lg"
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
                <label className={labelClass} htmlFor="adm_agen_turn_hora_inic">
                  {requiredFields.includes("adm_agen_turn_hora_inic") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["adm_agen_turn_hora_inic"]}
                </label>
                <div className="flex gap-2">
                  <input
                    id="adm_agen_turn_hora_inic"
                    name="adm_agen_turn_hora_inic"
                    type="time"
                    value={formData.adm_agen_turn_hora_inic}
                    onChange={handleChange}
                    disabled={variableEstado["adm_agen_turn_hora_inic"]}
                    className={`${inputStyle}
                      ${isFieldInvalid("adm_agen_turn_hora_inic", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""}
                      ${variableEstado["adm_agen_turn_hora_inic"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                    required
                  />
                  <span className="self-center text-gray-500">a</span>
                  <input
                    id="adm_agen_turn_hora_fin"
                    name="adm_agen_turn_hora_fin"
                    type="time"
                    value={formData.adm_agen_turn_hora_fin}
                    onChange={handleChange}
                    className={`${inputStyle}
                      ${isFieldInvalid("adm_agen_turn_hora_fin", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""}
                      ${variableEstado["adm_agen_turn_hora_fin"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                    disabled={variableEstado["adm_agen_turn_hora_fin"]}
                    required
                  />
                </div>
              </div>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="adm_agen_turn_almuerzo_inicio"
                >
                  {requiredFields.includes("adm_agen_turn_almuerzo_inicio") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["adm_agen_turn_almuerzo_inicio"]}
                </label>
                <div className="flex gap-2">
                  <input
                    id="adm_agen_turn_almuerzo_inicio"
                    name="adm_agen_turn_almuerzo_inicio"
                    type="time"
                    value={almuerzoInicio}
                    onChange={(e) => setAlmuerzoInicio(e.target.value)}
                    className={`${inputStyle}
                      ${isFieldInvalid("adm_agen_turn_almuerzo_inicio", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""}
                      ${variableEstado["adm_agen_turn_almuerzo_inicio"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                    disabled={variableEstado["adm_agen_turn_almuerzo_inicio"]}
                  />
                  <span className="self-center text-gray-500">a</span>
                  <input
                    id="adm_agen_turn_almuerzo_fin"
                    name="adm_agen_turn_almuerzo_fin"
                    type="time"
                    value={almuerzoFin}
                    onChange={(e) => setAlmuerzoFin(e.target.value)}
                    className={`${inputStyle}
                      ${isFieldInvalid("adm_agen_turn_almuerzo_fin", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""}
                      ${variableEstado["adm_agen_turn_almuerzo_fin"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                    disabled={variableEstado["adm_agen_turn_almuerzo_fin"]}
                  />
                </div>
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_agen_turn_dura_min">
                  {requiredFields.includes("adm_agen_turn_dura_min") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["adm_agen_turn_dura_min"]}
                </label>
                <input
                  id="adm_agen_turn_dura_min"
                  name="adm_agen_turn_dura_min"
                  type="number"
                  min={5}
                  step={5}
                  value={formData.adm_agen_turn_dura_min}
                  onChange={handleChange}
                  placeholder="Ej: 15, 20, 30"
                  className={`${inputStyle}
                    ${isFieldInvalid("adm_agen_turn_dura_min", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""}
                    ${variableEstado["adm_agen_turn_dura_min"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                  disabled={variableEstado["adm_agen_turn_dura_min"]}
                />
              </div>
              <div className="col-span-full mb-2">
                <label
                  className={labelClass}
                  htmlFor="adm_agen_turn_dias_semana"
                >
                  {requiredFields.includes("adm_agen_turn_dias_semana") && (
                    <span className="text-red-500">* </span>
                  )}
                  {labelMap["adm_agen_turn_dias_semana"]}
                </label>
                <div
                  className="flex flex-wrap gap-3"
                  htmlFor="adm_agen_turn_dias_semana"
                >
                  {diasSemana.map((dia) => (
                    <label
                      key={dia.value}
                      className={`${labelClass} flex items-center gap-1`}
                    >
                      <input
                        id="adm_agen_turn_dias_semana"
                        name="adm_agen_turn_dias_semana"
                        type="checkbox"
                        checked={diasSeleccionados.includes(dia.value)}
                        onChange={() => handleDiaChange(dia.value)}
                        className="accent-blue-600"
                        disabled={variableEstado["adm_agen_turn_dias_semana"]}
                      />
                      <span>{dia.label}</span>
                    </label>
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  Por defecto están seleccionados lunes a viernes.
                </span>
              </div>
            </div>
          </fieldset>
          <div className="flex items-center gap-3">
            <button
              id="btn_generar_turnos"
              name="btn_generar_turnos"
              type="button"
              onClick={generarTurnos}
              className={`${botonEstado.btn_generar_turnos ? buttonStyleDesactivado : buttonStyleOtro}`}
              disabled={botonEstado.btn_generar_turnos}
            >
              Generar turnos
            </button>
            <button
              id="btnRegistrar"
              name="btnRegistrar"
              type="submit"
              disabled={botonEstado.btnRegistrar}
              className={`${botonEstado.btnRegistrar ? buttonStyleDesactivado : buttonStyleGuardar}`}
            >
              {isLoading ? "Guardando..." : "Guardar Turnos"}
            </button>
            <button
              id="btn_limpiar_variables"
              name="btn_limpiar_variables"
              type="button"
              onClick={limpiarVariables}
              className={`${botonEstado.btn_limpiar_variables ? buttonStyleDesactivado : buttonStyleCancelar}`}
              disabled={botonEstado.btn_limpiar_variables}
            >
              Limpiar
            </button>
          </div>
        </form>
        <span className="text-xs text-gray-700 mt-1 block">
          Nota: Solo los turnos generados aparecerán en el calendario de color
          amarillo. No olvides guardarlos para que se registren en la base de
          datos.
        </span>

        <EstadoMensajes error={error} successMessage={successMessage} />

        <div className="mb-4 pt-2 border-t" ref={calendarRef}>
          <Calendar
            localizer={localizer}
            events={events}
            components={{
              event: MyEvent,
            }}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            selectable
            onSelectEvent={(event) => {
              if (event.fromDB) {
                // Formatea la fecha para el input type="date"
                let fechaISO = "";
                if (event.adm_agen_turn_fech?.includes("/")) {
                  const [day, month, year] =
                    event.adm_agen_turn_fech.split("/");
                  fechaISO = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
                } else {
                  fechaISO = event.adm_agen_turn_fech || "";
                }
                setModalData((prev) => ({
                  ...prev,
                  adm_agen_turn_fech_moda: fechaISO,
                  adm_agen_turn_tipo_espe_moda: event.adm_agen_turn_tipo_espe,
                  adm_agen_turn_prof_cita_moda: String(event.id_prof_cita),
                  adm_agen_turn_hora_inic_moda: event.adm_agen_turn_hora_inic,
                  adm_agen_turn_hora_fin_moda: event.adm_agen_turn_hora_fin,
                  adm_agen_turn_esta_cita_moda: event.adm_agen_turn_esta_cita,
                  idTurno: event.id,
                }));
                if (modalData.idTurno !== event.id) {
                  setBotonEstado((prevBtns) => ({
                    ...prevBtns,
                    btn_eliminar_turno_moda: false,
                  }));
                }
                setShowEditElimModal(true);
              }
            }}
            views={["month", "week", "day", "agenda"]}
            defaultView="week"
            min={new Date(1970, 0, 1, 0, 0)}
            scrollToTime={new Date(1970, 0, 1, 8, 0)}
            messages={{
              month: "Mes",
              week: "Semana",
              day: "Día",
              today: "Hoy",
              previous: "Anterior",
              next: "Siguiente",
              agenda: "Agenda",
              date: "Fecha",
              time: "Hora",
              event: "Evento",
              showMore: (total) => `+ Ver más (${total})`,
            }}
            culture="es"
            eventPropGetter={(event) => {
              const getEventColor = (estado) => {
                if (estado === "ALMUERZO") return "#9ca3af"; // gris
                if (estado === "DISPONIBLE") return "#22c55e"; // verde
                if (estado === "RESERVADO/A") return "#fbbf24"; // naranja
                if (estado === "AGENDADO/A") return "#3b82f6"; // azul
                if (estado === "CANCELADO") return "#f22432"; // rojo
                return "#1beaf5";
              };
              // Mapea el código numérico de la BD al texto de estado
              const mapCodigoToEstado = (codigo) => {
                switch (codigo) {
                  case 1:
                    return "DISPONIBLE";
                  case 2:
                    return "RESERVADO/A";
                  case 3:
                    return "AGENDADO/A";
                  case 4:
                    return "CANCELADO";
                  default:
                    return undefined;
                }
              };
              const codigo =
                typeof event.adm_agen_turn_esta_cita === "string"
                  ? Number(event.adm_agen_turn_esta_cita)
                  : event.adm_agen_turn_esta_cita;
              const estado = event.estado || mapCodigoToEstado(codigo);
              let bg = getEventColor(estado);
              if (event.generated && estado !== "ALMUERZO") {
                bg = "#f8fc05";
              }
              return {
                style: {
                  backgroundColor: bg,
                  color: "black",
                },
              };
            }}
            view={calendarView}
            onView={setCalendarView}
            date={calendarDate}
            onNavigate={setCalendarDate}
          />
          {showEditElimModal && modalData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                <button
                  type="button"
                  onClick={() => setShowEditElimModal(false)}
                  className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-700 rounded px-2 py-1 text-sm"
                >
                  X
                </button>
                <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                  <h3 className="text-lg font-bold mb-2">Editar Turno</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await handleActualizarTurno();
                    }}
                    autoComplete="on"
                    className="w-full"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-2">
                      <div className={fieldClass}>
                        <label
                          className={labelClass}
                          htmlFor="adm_agen_turn_fech_moda"
                        >
                          {requiredFields.includes("adm_agen_turn_fech") && (
                            <span className="text-red-500">* </span>
                          )}
                          {labelMap["adm_agen_turn_fech"]}
                        </label>
                        <input
                          id="adm_agen_turn_fech_moda"
                          name="adm_agen_turn_fech_moda"
                          type="date"
                          value={modalData.adm_agen_turn_fech_moda || ""}
                          onChange={handleChangeModal}
                          className={`${inputStyle}
                            ${isFieldInvalid("adm_agen_turn_fech_moda", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""}
                            ${variableEstado["adm_agen_turn_fech_moda"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                        />
                      </div>
                      <div className={fieldClass}>
                        <label
                          className={labelClass}
                          htmlFor="adm_agen_turn_tipo_espe_moda"
                        >
                          {requiredFields.includes(
                            "adm_agen_turn_tipo_espe",
                          ) && <span className="text-red-500">* </span>}
                          {labelMap["adm_agen_turn_tipo_espe"]}
                        </label>
                        <CustomSelect
                          id="adm_agen_turn_tipo_espe_moda"
                          name="adm_agen_turn_tipo_espe_moda"
                          value={modalData.adm_agen_turn_tipo_espe_moda || ""}
                          onChange={handleChangeModal}
                          options={allListAgenda.adm_agen_turn_tipo_espe}
                          className={
                            isFieldInvalid(
                              "adm_agen_turn_tipo_espe_moda",
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
                          htmlFor="adm_agen_turn_prof_cita_moda"
                        >
                          {requiredFields.includes(
                            "adm_agen_turn_prof_cita",
                          ) && <span className="text-red-500">* </span>}
                          {labelMap["adm_agen_turn_prof_cita"]}
                        </label>
                        <CustomSelect
                          id="adm_agen_turn_prof_cita_moda"
                          name="adm_agen_turn_prof_cita_moda"
                          value={modalData.adm_agen_turn_prof_cita_moda || ""}
                          onChange={handleChangeModal}
                          options={medicosList}
                          className={
                            isFieldInvalid(
                              "adm_agen_turn_prof_cita_moda",
                              requiredFields,
                              formData,
                              isFieldVisible,
                            )
                              ? "border-2 border-red-500"
                              : ""
                          }
                          isLargeList={true}
                          placeholder="Nombre del profesional"
                          minSearchLength={2}
                          maxResults={100}
                        />
                      </div>
                      <div className={fieldClass}>
                        <label
                          className={labelClass}
                          htmlFor="adm_agen_turn_hora_inic_moda"
                        >
                          {requiredFields.includes(
                            "adm_agen_turn_hora_inic",
                          ) && <span className="text-red-500">* </span>}
                          {labelMap["adm_agen_turn_hora_inic"]}
                        </label>
                        <input
                          id="adm_agen_turn_hora_inic_moda"
                          name="adm_agen_turn_hora_inic_moda"
                          type="time"
                          value={modalData.adm_agen_turn_hora_inic_moda || ""}
                          onChange={handleChangeModal}
                          className={`${inputStyle}
                            ${isFieldInvalid("adm_agen_turn_hora_inic_moda", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""}
                            ${variableEstado["adm_agen_turn_hora_inic_moda"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                        />
                      </div>
                      <div className={fieldClass}>
                        <label
                          className={labelClass}
                          htmlFor="adm_agen_turn_hora_fin_moda"
                        >
                          {requiredFields.includes(
                            "adm_agen_turn_hora_fin",
                          ) && <span className="text-red-500">* </span>}
                          {labelMap["adm_agen_turn_hora_fin"]}
                        </label>
                        <input
                          id="adm_agen_turn_hora_fin_moda"
                          name="adm_agen_turn_hora_fin_moda"
                          type="time"
                          value={modalData.adm_agen_turn_hora_fin_moda || ""}
                          onChange={handleChangeModal}
                          className={`${inputStyle}
                            ${isFieldInvalid("adm_agen_turn_hora_fin_moda", requiredFields, formData, isFieldVisible) ? "border-2 border-red-500" : ""}
                            ${variableEstado["adm_agen_turn_hora_fin_moda"] ? "bg-gray-200 text-gray-700 cursor-no-drop" : "bg-white text-gray-700 cursor-pointer"}`}
                        />
                      </div>
                      <div className={fieldClass}>
                        <label
                          className={labelClass}
                          htmlFor="adm_agen_turn_esta_cita_moda"
                        >
                          {requiredFields.includes(
                            "adm_agen_turn_esta_cita",
                          ) && <span className="text-red-500">* </span>}
                          {labelMap["adm_agen_turn_esta_cita"]}
                        </label>
                        <CustomSelect
                          id="adm_agen_turn_esta_cita_moda"
                          name="adm_agen_turn_esta_cita_moda"
                          value={modalData.adm_agen_turn_esta_cita_moda || ""}
                          onChange={handleChangeModal}
                          options={(
                            allListAgenda.adm_agen_turn_esta_cita || []
                          ).filter((opt) => opt.value === 1 || opt.value === 2)}
                          className={
                            isFieldInvalid(
                              "adm_agen_turn_esta_cita_moda",
                              requiredFields,
                              formData,
                              isFieldVisible,
                            )
                              ? "border-2 border-red-500"
                              : ""
                          }
                        />
                      </div>
                      {showUnidadSaludModal && (
                        <div className={fieldClass}>
                          <label
                            className={labelClass}
                            htmlFor="adm_agen_turn_rese_unid_salu_moda"
                          >
                            {requiredFields.includes(
                              "adm_agen_turn_rese_unid_salu",
                            ) && <span className="text-red-500">* </span>}
                            {labelMap["adm_agen_turn_rese_unid_salu"]}
                          </label>
                          <CustomSelect
                            id="adm_agen_turn_rese_unid_salu_moda"
                            name="adm_agen_turn_rese_unid_salu_moda"
                            value={
                              modalData.adm_agen_turn_rese_unid_salu_moda || ""
                            }
                            onChange={handleChangeModal}
                            options={allListRegisterUser.uni_unic}
                            disabled={
                              variableEstado[
                                "adm_agen_turn_rese_unid_salu_moda"
                              ]
                            }
                            className={
                              isFieldInvalid(
                                "adm_agen_turn_rese_unid_salu_moda",
                                requiredFields,
                                formData,
                                isFieldVisible,
                              )
                                ? "border-2 border-red-500"
                                : ""
                            }
                            placeholder="Lista de unidades de salud"
                          />
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 flex justify-center mt-1">
                      <button
                        id="btn_actualizar_turno_moda"
                        name="btn_actualizar_turno_moda"
                        type="submit"
                        className={`${botonEstado.btn_actualizar_turno_moda ? buttonStyleDesactivado : buttonStyleActualizar}`}
                        disabled={botonEstado.btn_actualizar_turno_moda}
                      >
                        Actualizar
                      </button>
                      <button
                        id="btn_eliminar_turno_moda"
                        name="btn_eliminar_turno_moda"
                        type="button"
                        onClick={() => handleEliminarTurno(modalData.idTurno)}
                        className={`${botonEstado.btn_eliminar_turno_moda ? buttonStyleDesactivado : buttonStyleEliminar}`}
                        disabled={botonEstado.btn_eliminar_turno_moda}
                      >
                        Eliminar
                      </button>
                      <button
                        id="btn_cancelar_turno_moda"
                        name="btn_cancelar_turno_moda"
                        type="button"
                        onClick={() => setShowEditElimModal(false)}
                        className={`${botonEstado.btn_cancelar_turno_moda ? buttonStyleDesactivado : buttonStyleCancelar}`}
                        disabled={botonEstado.btn_cancelar_turno_moda}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
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
                          adm_agen_turn_unid_salu: unidadSeleccionada,
                        }));
                        setSuccessMessage(
                          "Unidad principal actualizada correctamente.",
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
          <p className="text-sm text-gray-700 mt-1">
            NOTA: Los turnos en estado "ALMUERZO" se muestran en gris,
            "DISPONIBLE" en verde, "RESERVADO/A" en naranja, "AGENDADO/A" en
            azul y "CANCELADO" en rojo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAgendaTurno;
