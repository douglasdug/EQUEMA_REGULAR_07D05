import React, { useState, useRef } from "react";
import {
  listarUsuariosApoyoAtencion,
  registerAdminAgendaTurno,
} from "../api/conexion.api.js";
import allListAgenda from "../api/all.list.agenda.json";
import {
  CustomSelect,
  inputStyle,
  isFieldInvalid,
  buttonStylePrimario,
  buttonStyleSecundario,
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
} from "date-fns";
import esES from "date-fns/locale/es";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { eachDayOfInterval } from "date-fns";
import { da } from "date-fns/locale";

const locales = { es: esES };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const initialState = {
  adm_agen_turn_fech: "",
  adm_agen_turn_fech_inicio: "",
  adm_agen_turn_fech_fin: "",
  adm_agen_turn_tipo_espe: "",
  adm_agen_turn_prof_cita: "",
  adm_agen_turn_hora_inic: "",
  adm_agen_turn_hora_fin: "",
  adm_agen_turn_almuerzo_inicio: "",
  adm_agen_turn_almuerzo_fin: "",
  adm_agen_turn_esta_cita: "DISPONIBLE",
  adm_agen_turn_dura_min: 30,
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
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [medicosList, setMedicosList] = useState([]);

  const initialVariableEstado = {};
  const initialBotonEstado = {};
  const [variableEstado, setVariableEstado] = useState(initialVariableEstado);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  const [botonEstado, setBotonEstado] = useState(initialBotonEstado);
  const [range, setRange] = useState([
    {
      startDate: formData.adm_agen_turn_fech_inicio
        ? parse(formData.adm_agen_turn_fech_inicio, "yyyy-MM-dd", new Date())
        : new Date(),
      endDate: formData.adm_agen_turn_fech_fin
        ? parse(formData.adm_agen_turn_fech_fin, "yyyy-MM-dd", new Date())
        : new Date(),
      key: "selection",
    },
  ]);
  const [diasSeleccionados, setDiasSeleccionados] = useState([1, 2, 3, 4, 5]);
  const [calendarView, setCalendarView] = useState(Views.WEEK);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const onRangeChange = ({ selection }) => {
    setRange([selection]);
    setFormData((f) => ({
      ...f,
      adm_agen_turn_fech_inicio: format(selection.startDate, "yyyy-MM-dd"),
      adm_agen_turn_fech_fin: format(selection.endDate, "yyyy-MM-dd"),
    }));
  };

  // Maneja el cambio de los checkboxes
  const handleDiaChange = (dia) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const requiredFields = [
    "adm_agen_turn_fech",
    "adm_agen_turn_tipo_espe",
    "adm_agen_turn_prof_cita",
    "adm_agen_turn_hora_inic",
    "adm_agen_turn_hora_fin",
    "adm_agen_turn_esta_cita",
    "adm_agen_turn_dura_min",
  ];

  const labelMap = {
    adm_agen_turn_fech: "Fecha de cita",
    adm_agen_turn_fech_inicio: "Fecha inicio agenda",
    adm_agen_turn_fech_fin: "Fecha fin agenda",
    adm_agen_turn_tipo_espe: "Tipo de especialidad",
    adm_agen_turn_prof_cita: "Profesional de la cita",
    adm_agen_turn_hora_inic: "Hora de inicio",
    adm_agen_turn_hora_fin: "Hora de fin",
    adm_agen_turn_almuerzo_inicio: "Inicio almuerzo",
    adm_agen_turn_almuerzo_fin: "Fin almuerzo",
    adm_agen_turn_esta_cita: "Estado de la cita",
    adm_agen_turn_dura_min: "Duración por turno (min)",
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
    setFormData((f) => ({
      ...f,
      [name]: name === "adm_agen_turn_dura_min" ? Number(value) : value,
    }));
  };

  const combineDateTime = (date, time) => {
    if (!date || !time) return null;
    return new Date(`${date}T${time}`);
  };

  const handleSelectSlot = ({ start, end }) => {
    setFormData((f) => ({
      ...f,
      adm_agen_turn_fech: format(start, "yyyy-MM-dd"),
      adm_agen_turn_fech_inicio: format(start, "yyyy-MM-dd"),
      adm_agen_turn_fech_fin: format(start, "yyyy-MM-dd"),
      adm_agen_turn_hora_inic: format(start, "HH:mm"),
      adm_agen_turn_hora_fin: format(end, "HH:mm"),
    }));
  };

  const handleSelectEvent = (event) => {
    setFormData({
      adm_agen_turn_fech: format(event.start, "yyyy-MM-dd"),
      adm_agen_turn_hora_inic: format(event.start, "HH:mm"),
      adm_agen_turn_hora_fin: format(event.end, "HH:mm"),
      adm_agen_turn_tipo_espe: event.tipo_especialidad || "",
      adm_agen_turn_prof_cita: event.profesional || "",
      adm_agen_turn_esta_cita: event.estado || "",
      adm_agen_turn_dura_min: formData.adm_agen_turn_dura_min || 30,
    });
  };

  const handleViewChange = (view) => setCalendarView(view);
  const handleNavigate = (action) => {
    let newDate = calendarDate;
    switch (action) {
      case "TODAY":
        newDate = new Date();
        break;
      case "PREV":
        if (calendarView === Views.MONTH) newDate = addDays(calendarDate, -30);
        else if (calendarView === Views.WEEK)
          newDate = addDays(calendarDate, -7);
        else newDate = addDays(calendarDate, -1);
        break;
      case "NEXT":
        if (calendarView === Views.MONTH) newDate = addDays(calendarDate, 30);
        else if (calendarView === Views.WEEK)
          newDate = addDays(calendarDate, 7);
        else newDate = addDays(calendarDate, 1);
        break;
      default:
        break;
    }
    setCalendarDate(newDate);
  };

  const isFieldVisible = () => true;

  // Genera turnos entre la hora inicio y fin con la duración indicada
  const generarTurnos = () => {
    setError("");
    setSuccessMessage("");

    const {
      adm_agen_turn_fech,
      adm_agen_turn_fech_inicio: fechaInicioRango,
      adm_agen_turn_fech_fin: fechaFinRango,
      adm_agen_turn_hora_inic: horaInicio,
      adm_agen_turn_hora_fin: horaFin,
      adm_agen_turn_dura_min: duracion,
      adm_agen_turn_tipo_espe,
      adm_agen_turn_prof_cita,
      adm_agen_turn_almuerzo_inicio: almuerzoInicio,
      adm_agen_turn_almuerzo_fin: almuerzoFin,
    } = formData;

    const fechaReferencia = fechaInicioRango || adm_agen_turn_fech;
    const fechaInicio = fechaReferencia;
    const fechaFin = fechaFinRango || fechaReferencia;

    if (!fechaInicio || !horaInicio || !horaFin || !duracion) {
      const msg = "Completa fechas, hora inicio, hora fin y duración.";
      setError(msg);
      toast.error(msg, { position: "bottom-right" });
      return;
    }

    const inicioDia = new Date(`${fechaInicio}T00:00:00`);
    const finDia = new Date(`${fechaFin}T00:00:00`);
    if (isAfter(inicioDia, finDia)) {
      const msg = "La fecha fin debe ser mayor o igual a la fecha inicio.";
      setError(msg);
      toast.error(msg, { position: "bottom-right" });
      return;
    }
    if (duracion <= 0) {
      const msg = "La duración debe ser mayor a 0.";
      setError(msg);
      toast.error(msg, { position: "bottom-right" });
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
          title: `${adm_agen_turn_tipo_espe || "Especialidad"} - ${
            adm_agen_turn_prof_cita || "Profesional"
          } (${format(slotStart, "HH:mm")}-${format(slotEnd, "HH:mm")})`,
          start: slotStart,
          end: slotEnd,
          tipo_especialidad: adm_agen_turn_tipo_espe || "",
          profesional: adm_agen_turn_prof_cita || "",
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
              tipo_especialidad: adm_agen_turn_tipo_espe || "",
              profesional: adm_agen_turn_prof_cita || "",
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
      return;
    }

    setEvents((prev) => {
      const sameDay = (d1, d2) =>
        format(d1, "yyyy-MM-dd") === format(d2, "yyyy-MM-dd");
      const filtrados = prev.filter(
        (e) =>
          !nuevos.some((nuevo) => sameDay(e.start, nuevo.start)) || !e.generated
      );
      return [...filtrados, ...nuevos];
    });

    const ok = `Se generaron ${nuevos.length} turnos. No olvides guardarlos.`;
    setSuccessMessage(ok);
    toast.success(ok, { position: "bottom-right" });
  };

  // Guarda todos los turnos generados en el backend
  const guardarTurnosGenerados = async () => {
    const porGuardar = events.filter(
      (e) => e.generated && e.estado !== "ALMUERZO"
    );
    if (porGuardar.length === 0) {
      toast("No hay turnos nuevos para guardar.", { position: "bottom-right" });
      return;
    }
    if (loading) return;

    setLoading(true);
    setError("");
    setSuccessMessage("");

    let okCount = 0;
    for (const ev of porGuardar) {
      try {
        const payload = {
          adm_agen_turn_fech: format(ev.start, "yyyy-MM-dd"),
          adm_agen_turn_tipo_espe:
            ev.tipo_especialidad || formData.adm_agen_turn_tipo_espe || "",
          adm_agen_turn_prof_cita:
            ev.profesional || formData.adm_agen_turn_prof_cita || "",
          adm_agen_turn_hora_inic: format(ev.start, "HH:mm"),
          adm_agen_turn_hora_fin: format(ev.end, "HH:mm"),
          adm_agen_turn_esta_cita: ev.estado || "DISPONIBLE",
        };
        const response = await registerAdminAgendaTurno(payload);
        const id = response?.id || `srv-${Date.now()}-${Math.random()}`;

        setEvents((prev) =>
          prev.map((e) => (e.id === ev.id ? { ...e, id, generated: false } : e))
        );
        okCount++;
      } catch (err) {
        const m = getErrorMessage(err);
        toast.error(`Error guardando ${format(ev.start, "HH:mm")}: ${m}`, {
          position: "bottom-right",
        });
      }
    }

    const msg = `Turnos guardados: ${okCount}/${porGuardar.length}`;
    setSuccessMessage(msg);
    toast.success(msg, { position: "bottom-right" });
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await registerAdminAgendaTurno(formData);
      const message = response?.message || "Se registró con éxito!";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 10000);
      toast.success(message, { position: "bottom-right" });
      const start = combineDateTime(
        formData.adm_agen_turn_fech,
        formData.adm_agen_turn_hora_inic
      );
      const end = combineDateTime(
        formData.adm_agen_turn_fech,
        formData.adm_agen_turn_hora_fin
      );
      const newEvent = {
        id: response?.id || `${Date.now()}`,
        title: `${formData.adm_agen_turn_tipo_espe} - ${formData.adm_agen_turn_prof_cita}`,
        start,
        end,
        tipo_especialidad: formData.adm_agen_turn_tipo_espe,
        profesional: formData.adm_agen_turn_prof_cita,
        estado: formData.adm_agen_turn_esta_cita,
        generated: false,
      };
      setEvents((prev) => [...prev, newEvent]);
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

  const reservarTurnoLocal = (id) => {
    // Demo de selección de paciente (solo front, integra tu API de reserva/actualización aquí)
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, estado: "RESERVADO", title: `${e.title} - RESERVADO` }
          : e
      )
    );
    toast.success("Turno reservado (demo).", { position: "bottom-right" });
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
        const res = await listarUsuariosApoyoAtencion();
        let data;
        if (Array.isArray(res?.data)) {
          data = res.data;
        } else if (Array.isArray(res)) {
          data = res;
        } else {
          data = [];
        }

        // Formatear médicos
        const medicosListFormatted = Array.isArray(data)
          ? data.map((medico) => ({
              value: medico.id?.toString(),
              label:
                `${medico.username} ${medico.last_name} ${medico.first_name}`.trim(),
            }))
          : [];
        setMedicosList(medicosListFormatted);
      } catch (err) {
        toast.error("No se pudo cargar la lista de profesionales.", {
          position: "bottom-right",
        });
        console.error(err);
      }
    };

    cargarProfesionales();
    return () => {
      mounted = false;
    };
  }, []);

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
                      isFieldVisible
                    )
                      ? "border-2 border-red-500"
                      : ""
                  }
                  placeholder="Ej: Medicina General, Pediatría..."
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
                  onChange={(eOrValue) => {
                    // Soporta tanto evento sintético como valor directo del CustomSelect
                    if (eOrValue && eOrValue.target) {
                      handleChange(eOrValue);
                    } else {
                      setFormData((f) => ({
                        ...f,
                        adm_agen_turn_prof_cita:
                          typeof eOrValue === "object"
                            ? eOrValue.value
                            : eOrValue,
                      }));
                    }
                  }}
                  options={medicosList}
                  disabled={variableEstado["adm_agen_turn_prof_cita"]}
                  className={
                    isFieldInvalid(
                      "adm_agen_turn_prof_cita",
                      requiredFields,
                      formData,
                      isFieldVisible
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
                  placeholder="Ej: DISPONIBLE, PROGRAMADA, ATENDIDA, CANCELADA"
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
              Fecha de la Agenda y turnos
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="adm_agen_turn_fech_inicio"
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
                    Rango de fechas de la agenda
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={
                      formData.adm_agen_turn_fech_inicio &&
                      formData.adm_agen_turn_fech_fin
                        ? `${formData.adm_agen_turn_fech_inicio} - ${formData.adm_agen_turn_fech_fin}`
                        : "Selecciona el rango de fechas"
                    }
                    onClick={() => setShowCalendar(true)}
                    className="cursor-pointer bg-blue-50 border border-blue-200 rounded-lg shadow-md p-2 w-full"
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
                          setShowCalendar(false); // Oculta al seleccionar
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
                <label className={labelClass} htmlFor="hora_rango">
                  Hora de inicio y fin <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    id="adm_agen_turn_hora_inic"
                    name="adm_agen_turn_hora_inic"
                    value={formData.adm_agen_turn_hora_inic}
                    onChange={handleChange}
                    className={`${inputStyle} w-1/2`}
                    required
                  />
                  <span className="self-center text-gray-500">a</span>
                  <input
                    type="time"
                    id="adm_agen_turn_hora_fin"
                    name="adm_agen_turn_hora_fin"
                    value={formData.adm_agen_turn_hora_fin}
                    onChange={handleChange}
                    className={`${inputStyle} w-1/2`}
                    required
                  />
                </div>
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="hora_rango">
                  Hora de Almuerzo inicio y fin{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    id="adm_agen_turn_almuerzo_inicio"
                    name="adm_agen_turn_almuerzo_inicio"
                    value={formData.adm_agen_turn_almuerzo_inicio}
                    onChange={handleChange}
                    className={`${inputStyle} w-1/2`}
                  />
                  <span className="self-center text-gray-500">a</span>
                  <input
                    type="time"
                    id="adm_agen_turn_almuerzo_fin"
                    name="adm_agen_turn_almuerzo_fin"
                    value={formData.adm_agen_turn_almuerzo_fin}
                    onChange={handleChange}
                    className={`${inputStyle} w-1/2`}
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
                  type="number"
                  min={5}
                  step={5}
                  id="adm_agen_turn_dura_min"
                  name="adm_agen_turn_dura_min"
                  value={formData.adm_agen_turn_dura_min}
                  onChange={handleChange}
                  placeholder="Ej: 15, 20, 30"
                  className={`${inputStyle}
                      ${
                        isFieldInvalid(
                          "adm_agen_turn_dura_min",
                          requiredFields,
                          formData,
                          isFieldVisible
                        )
                          ? "border-2 border-red-500"
                          : ""
                      }
                       ${
                         variableEstado["adm_agen_turn_dura_min"]
                           ? "bg-gray-200 text-gray-700 cursor-no-drop"
                           : "bg-white text-gray-700 cursor-pointer"
                       }`}
                  disabled={variableEstado["adm_agen_turn_dura_min"]}
                />
              </div>
              <div className="col-span-full mb-2">
                <label className="block text-gray-700 text-sm font-bold mb-1">
                  Días de la semana para generar turnos:
                </label>
                <div className="flex flex-wrap gap-3">
                  {diasSemana.map((dia) => (
                    <label key={dia.value} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={diasSeleccionados.includes(dia.value)}
                        onChange={() => handleDiaChange(dia.value)}
                        className="accent-blue-600"
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

            <div className="flex flex-wrap items-center gap-3 mt-2">
              <button
                type="button"
                disabled={loading}
                onClick={generarTurnos}
                className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Generar turnos
              </button>
              <button
                type="button"
                disabled={
                  loading || events.filter((e) => e.generated).length === 0
                }
                onClick={guardarTurnosGenerados}
                className="inline-flex items-center justify-center rounded bg-emerald-600 px-4 py-2 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                Guardar turnos generados
              </button>
            </div>
          </fieldset>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Registrar único"}
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

        <div className="mb-4">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
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
              const bg =
                event.estado === "ALMUERZO"
                  ? "#9ca3af"
                  : event.estado === "RESERVADO"
                  ? "#fbbf24"
                  : event.estado === "DISPONIBLE"
                  ? "#34d399"
                  : "#60a5fa";
              return { style: { backgroundColor: bg } };
            }}
            view={calendarView}
            onView={setCalendarView}
            date={calendarDate}
            onNavigate={setCalendarDate}
          />
          <p className="text-xs text-gray-500 mt-1">
            Sugerencia: selecciona en el calendario para rellenar fecha y horas.
          </p>
        </div>

        <div className="border-t pt-3">
          <h3 className="text-lg font-semibold text-blue-700 mb-2">
            Turnos disponibles (vista paciente - demo)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {events.filter((e) => e.estado === "DISPONIBLE").length === 0 && (
              <p className="text-gray-500 text-sm col-span-full">
                No hay turnos disponibles.
              </p>
            )}
            {events
              .filter((e) => e.estado === "DISPONIBLE")
              .sort((a, b) => +a.start - +b.start)
              .map((e) => (
                <div
                  key={e.id}
                  className="border rounded p-3 shadow-sm flex flex-col gap-1"
                >
                  <div className="text-sm font-semibold">
                    {e.tipo_especialidad || "Especialidad"}
                  </div>
                  <div className="text-xs text-gray-600">
                    {e.profesional || "Profesional"}
                  </div>
                  <div className="text-sm">
                    {format(e.start, "EEEE d 'de' MMMM", { locale: esES })}
                  </div>
                  <div className="text-sm">
                    {format(e.start, "HH:mm")} - {format(e.end, "HH:mm")}
                  </div>
                  <button
                    className="mt-2 inline-flex items-center justify-center rounded bg-emerald-600 px-3 py-1.5 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                    onClick={() => reservarTurnoLocal(e.id)}
                  >
                    Reservar
                  </button>
                </div>
              ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Integra aquí tu API para confirmar la reserva y actualizar el estado
            del turno.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAgendaTurno;
