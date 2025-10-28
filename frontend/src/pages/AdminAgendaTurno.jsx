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
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addMinutes,
  isBefore,
} from "date-fns";
import esES from "date-fns/locale/es";

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
  adm_agen_turn_tipo_espe: "",
  adm_agen_turn_prof_cita: "",
  adm_agen_turn_hora_inic: "",
  adm_agen_turn_hora_fin: "",
  adm_agen_turn_esta_cita: "DISPONIBLE",
  adm_agen_turn_dura_min: 30,
};

const AdminAgendaTurno = () => {
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [events, setEvents] = useState([]);
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
    "adm_agen_turn_dura_min",
  ];

  const labelMap = {
    adm_agen_turn_fech: "Fecha de cita",
    adm_agen_turn_tipo_espe: "Tipo de especialidad",
    adm_agen_turn_prof_cita: "Profesional de la cita",
    adm_agen_turn_hora_inic: "Hora de inicio",
    adm_agen_turn_hora_fin: "Hora de fin",
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

  const isFieldVisible = () => true;

  // Genera turnos entre la hora inicio y fin con la duración indicada
  const generarTurnos = () => {
    setError("");
    setSuccessMessage("");

    const {
      adm_agen_turn_fech: fecha,
      adm_agen_turn_hora_inic: horaInicio,
      adm_agen_turn_hora_fin: horaFin,
      adm_agen_turn_dura_min: duracion,
      adm_agen_turn_tipo_espe,
      adm_agen_turn_prof_cita,
    } = formData;

    if (!fecha || !horaInicio || !horaFin || !duracion) {
      const msg = "Completa fecha, hora inicio, hora fin y duración.";
      setError(msg);
      toast.error(msg, { position: "bottom-right" });
      return;
    }

    const start = combineDateTime(fecha, horaInicio);
    const end = combineDateTime(fecha, horaFin);
    if (!start || !end || !isBefore(start, end)) {
      const msg = "La hora de inicio debe ser menor a la hora de fin.";
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
    let cursor = new Date(start);
    while (
      isBefore(addMinutes(cursor, duracion), end) ||
      +addMinutes(cursor, duracion) === +end
    ) {
      const slotStart = new Date(cursor);
      const slotEnd = addMinutes(cursor, duracion);

      nuevos.push({
        id: `gen-${+slotStart}`,
        title: `${adm_agen_turn_tipo_espe || "Especialidad"} - ${
          adm_agen_turn_prof_cita || "Profesional"
        } (${format(slotStart, "HH:mm")}-${format(slotEnd, "HH:mm")})`,
        start: slotStart,
        end: slotEnd,
        tipo_especialidad: adm_agen_turn_tipo_espe || "",
        profesional: adm_agen_turn_prof_cita || "",
        estado: "DISPONIBLE",
        generated: true, // para identificar que aún no se guardan en backend
      });

      cursor = slotEnd;
    }

    if (nuevos.length === 0) {
      const msg = "El rango y la duración no generan turnos.";
      setError(msg);
      toast.error(msg, { position: "bottom-right" });
      return;
    }

    setEvents((prev) => {
      // Opcional: eliminar eventos generados del mismo día antes de agregar
      const sameDay = (d1, d2) =>
        format(d1, "yyyy-MM-dd") === format(d2, "yyyy-MM-dd");
      const filtrados = prev.filter(
        (e) => !sameDay(e.start, start) || !e.generated
      );
      return [...filtrados, ...nuevos];
    });

    const ok = `Se generaron ${nuevos.length} turnos. No olvides guardarlos.`;
    setSuccessMessage(ok);
    toast.success(ok, { position: "bottom-right" });
  };

  // Guarda todos los turnos generados en el backend
  const guardarTurnosGenerados = async () => {
    const porGuardar = events.filter((e) => e.generated);
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
                event.estado === "RESERVADO"
                  ? "#fbbf24"
                  : event.estado === "DISPONIBLE"
                  ? "#34d399"
                  : "#60a5fa";
              return { style: { backgroundColor: bg } };
            }}
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
