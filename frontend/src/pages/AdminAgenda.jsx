import React, { useEffect, useMemo, useState } from "react";

// /c:/Users/LENOVO/Documents/MSP 07D05/APLICACIONES CRUD/EQUEMA_REGULAR_07D05/frontend/src/pages/AdminAgenda.jsx

const API_URL =
  (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || "";

export default function AdminAgenda() {
  const [form, setForm] = useState({
    fecha: "",
    hora: "",
    pacienteId: "",
    profesionalId: "",
    servicioId: "",
    duracionMinutos: 30,
    notas: "",
    estado: "pendiente",
  });

  const [pacientes, setPacientes] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [servicios, setServicios] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const servicioSeleccionado = useMemo(
    () => servicios.find((s) => String(s.id) === String(form.servicioId)),
    [servicios, form.servicioId]
  );

  useEffect(() => {
    let abort = new AbortController();
    async function cargarCatalogos() {
      setLoadingCatalogos(true);
      setError("");
      try {
        const [pacs, profs, servs] = await Promise.all([
          fetch(`${API_URL}/api/pacientes`, { signal: abort.signal }),
          fetch(`${API_URL}/api/profesionales`, { signal: abort.signal }),
          fetch(`${API_URL}/api/servicios`, { signal: abort.signal }),
        ]);
        if (!pacs.ok || !profs.ok || !servs.ok)
          throw new Error("No se pudo cargar catálogos");
        const [pacsJson, profsJson, servsJson] = await Promise.all([
          pacs.json(),
          profs.json(),
          servs.json(),
        ]);
        setPacientes(Array.isArray(pacsJson) ? pacsJson : []);
        setProfesionales(Array.isArray(profsJson) ? profsJson : []);
        setServicios(Array.isArray(servsJson) ? servsJson : []);
      } catch (e) {
        if (e.name !== "AbortError")
          setError(e.message || "Error cargando catálogos");
      } finally {
        setLoadingCatalogos(false);
      }
    }
    cargarCatalogos();
    return () => abort.abort();
  }, []);

  useEffect(() => {
    if (
      servicioSeleccionado &&
      servicioSeleccionado.duracionMinutos &&
      !Number.isNaN(+servicioSeleccionado.duracionMinutos)
    ) {
      setForm((f) => ({
        ...f,
        duracionMinutos: Number(servicioSeleccionado.duracionMinutos),
      }));
    }
  }, [servicioSeleccionado]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "duracionMinutos" ? Number(value) : value,
    }));
  }

  function validar() {
    if (!form.fecha) return "Seleccione una fecha";
    if (!form.hora) return "Seleccione una hora";
    if (!form.pacienteId) return "Seleccione un paciente";
    if (!form.profesionalId) return "Seleccione un profesional";
    if (!form.servicioId) return "Seleccione un servicio";
    if (!form.duracionMinutos || form.duracionMinutos <= 0)
      return "Duración inválida";
    return "";
  }

  function combinarFechaHoraISO(fecha, hora) {
    // Crea un Date en hora local y lo envía en ISO (UTC)
    const dt = new Date(`${fecha}T${hora}:00`);
    return dt.toISOString();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setOk("");
    const v = validar();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = {
        pacienteId: form.pacienteId,
        profesionalId: form.profesionalId,
        servicioId: form.servicioId,
        inicio: combinarFechaHoraISO(form.fecha, form.hora),
        duracionMinutos: form.duracionMinutos,
        notas: form.notas?.trim() || "",
        estado: form.estado,
      };
      const res = await fetch(`${API_URL}/api/turnos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await safeError(res);
        throw new Error(msg || "No se pudo crear el turno");
      }
      setOk("Turno creado");
      setForm({
        fecha: "",
        hora: "",
        pacienteId: "",
        profesionalId: "",
        servicioId: "",
        duracionMinutos: 30,
        notas: "",
        estado: "pendiente",
      });
    } catch (e) {
      setError(e.message || "Error creando turno");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setForm({
      fecha: "",
      hora: "",
      pacienteId: "",
      profesionalId: "",
      servicioId: "",
      duracionMinutos: 30,
      notas: "",
      estado: "pendiente",
    });
    setError("");
    setOk("");
  }

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: 16 }}>
      <h2>Crear turno</h2>

      {loadingCatalogos && <p>Cargando catálogos...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {ok && <p style={{ color: "green" }}>{ok}</p>}

      <form onSubmit={handleSubmit} onReset={handleReset}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div>
            <label>Fecha</label>
            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label>Hora</label>
            <input
              type="time"
              name="hora"
              value={form.hora}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label>Paciente</label>
            <select
              name="pacienteId"
              value={form.pacienteId}
              onChange={handleChange}
              required
              style={inputStyle}
              disabled={loadingCatalogos || pacientes.length === 0}
            >
              <option value="">Seleccione...</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.documento
                    ? `${p.apellidos || ""} ${p.nombres || ""} (${p.documento})`
                    : p.nombre || p.fullName || `Paciente #${p.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Profesional</label>
            <select
              name="profesionalId"
              value={form.profesionalId}
              onChange={handleChange}
              required
              style={inputStyle}
              disabled={loadingCatalogos || profesionales.length === 0}
            >
              <option value="">Seleccione...</option>
              {profesionales.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre || p.fullName || `Profesional #${p.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Servicio</label>
            <select
              name="servicioId"
              value={form.servicioId}
              onChange={handleChange}
              required
              style={inputStyle}
              disabled={loadingCatalogos || servicios.length === 0}
            >
              <option value="">Seleccione...</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre || `Servicio #${s.id}`}{" "}
                  {s.duracionMinutos ? `(${s.duracionMinutos} min)` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Duración (min)</label>
            <input
              type="number"
              min={5}
              step={5}
              name="duracionMinutos"
              value={form.duracionMinutos}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label>Notas</label>
            <textarea
              name="notas"
              value={form.notas}
              onChange={handleChange}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              placeholder="Detalle opcional..."
            />
          </div>

          <div>
            <label>Estado</label>
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Crear turno"}
          </button>
          <button type="reset" disabled={loading}>
            Limpiar
          </button>
        </div>
      </form>

      <div style={{ marginTop: 24, fontSize: 12, color: "#666" }}>
        <p>
          Consejo: verifique superposiciones en la agenda del profesional antes
          de confirmar.
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 4,
  outline: "none",
};

async function safeError(res) {
  try {
    const data = await res.json();
    return data?.message || data?.error || res.statusText;
  } catch {
    try {
      const text = await res.text();
      return text || res.statusText;
    } catch {
      return res.statusText;
    }
  }
}
