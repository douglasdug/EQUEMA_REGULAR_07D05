import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE_URL =
  import.meta?.env?.VITE_API_URL || "http://localhost:3000/api";
const ENDPOINT = "/form_008_emergencia/atenciones"; // Ajustar al endpoint real

export default function ReporteAtenciones() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [servicio, setServicio] = useState("");
  const [medico, setMedico] = useState("");
  const [estado, setEstado] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("fecha_atencion");
  const [sortDir, setSortDir] = useState("desc");

  const abortRef = useRef(null);

  const columns = useMemo(
    () => [
      { key: "fecha_atencion", label: "Fecha", sortable: true },
      { key: "hora_atencion", label: "Hora", sortable: true },
      { key: "documento", label: "Documento", sortable: true },
      { key: "paciente", label: "Paciente", sortable: true },
      { key: "edad", label: "Edad", sortable: true },
      { key: "sexo", label: "Sexo", sortable: true },
      { key: "servicio", label: "Servicio", sortable: true },
      { key: "medico", label: "Médico", sortable: true },
      { key: "diagnostico", label: "Diagnóstico", sortable: false },
      { key: "estado", label: "Estado", sortable: true },
    ],
    []
  );

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, sortDir]);

  const buildQuery = () => {
    const q = new URLSearchParams();
    if (search) q.set("search", search.trim());
    if (fechaInicio) q.set("from", fechaInicio);
    if (fechaFin) q.set("to", fechaFin);
    if (servicio) q.set("servicio", servicio);
    if (medico) q.set("medico", medico);
    if (estado) q.set("estado", estado);
    q.set("page", String(page));
    q.set("pageSize", String(pageSize));
    q.set("sortBy", sortBy);
    q.set("sortDir", sortDir);
    return q.toString();
  };

  const fetchData = async () => {
    setLoading(true);
    setErr("");
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const url = `${API_BASE_URL}${ENDPOINT}?${buildQuery()}`;
      const res = await fetch(url, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      // Se asume { items: [], total: number }. Ajustar si el backend usa otra forma.
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(
        Number.isFinite(data.total)
          ? data.total
          : Array.isArray(data.items)
          ? data.items.length
          : 0
      );
    } catch (e) {
      if (e.name !== "AbortError") setErr(e.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const resetFiltros = () => {
    setSearch("");
    setFechaInicio("");
    setFechaFin("");
    setServicio("");
    setMedico("");
    setEstado("");
    setPage(1);
    setSortBy("fecha_atencion");
    setSortDir("desc");
    fetchData();
  };

  const toggleSort = (key) => {
    if (!columns.find((c) => c.key === key)?.sortable) return;
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const exportCSV = () => {
    const headers = columns.map((c) => c.label);
    const rows = items.map((row) =>
      columns.map((c) => sanitizeCSV(valueOf(row, c.key)))
    );
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.download = `reporte_atenciones_${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Reporte de Atenciones - FORM 008 Emergencia</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(6, minmax(140px, 1fr))",
          alignItems: "end",
          marginBottom: 12,
        }}
      >
        <div>
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Paciente / Documento / Diagnóstico"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label>Desde</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label>Hasta</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label>Servicio</label>
          <input
            type="text"
            value={servicio}
            onChange={(e) => setServicio(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label>Médico</label>
          <input
            type="text"
            value={medico}
            onChange={(e) => setMedico(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label>Estado</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            style={inputStyle}
          >
            <option value="">Todos</option>
            <option value="ATENDIDO">Atendido</option>
            <option value="EN_ESPERA">En espera</option>
            <option value="REFERIDO">Referido</option>
            <option value="DERIVADO">Derivado</option>
          </select>
        </div>

        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
          <button type="submit" disabled={loading} style={btnPrimary}>
            {loading ? "Cargando..." : "Buscar"}
          </button>
          <button
            type="button"
            onClick={resetFiltros}
            disabled={loading}
            style={btnSecondary}
          >
            Limpiar
          </button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={exportCSV}
              disabled={loading || items.length === 0}
              style={btnSecondary}
            >
              Exportar CSV
            </button>
            <button type="button" onClick={printReport} style={btnSecondary}>
              Imprimir
            </button>
          </div>
        </div>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <span>Total: {total}</span>
        <span>
          Página {page} de {totalPages}
        </span>
        <label>
          Tamaño
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            style={{ marginLeft: 6 }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            onClick={() => setPage(1)}
            disabled={page === 1 || loading}
            style={btnSmall}
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            style={btnSmall}
          >
            ‹
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            style={btnSmall}
          >
            ›
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages || loading}
            style={btnSmall}
          >
            »
          </button>
        </div>
      </div>

      {err ? (
        <div style={{ color: "crimson", marginBottom: 8 }}>Error: {err}</div>
      ) : null}

      <div
        style={{ overflow: "auto", border: "1px solid #ddd", borderRadius: 6 }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
        >
          <thead style={{ background: "#f6f6f6" }}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderBottom: "1px solid #eaeaea",
                    cursor: col.sortable ? "pointer" : "default",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col.label}{" "}
                  {col.sortable && sortBy === col.key
                    ? sortDir === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ padding: 16, textAlign: "center", color: "#666" }}
                >
                  Sin resultados
                </td>
              </tr>
            ) : null}
            {items.map((row, idx) => (
              <tr
                key={row.id || `${row.documento}-${idx}`}
                style={{ borderBottom: "1px solid #f0f0f0" }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{ padding: "8px 10px", verticalAlign: "top" }}
                  >
                    {formatValue(valueOf(row, col.key), col.key)}
                  </td>
                ))}
              </tr>
            ))}
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ padding: 16, textAlign: "center" }}
                >
                  Cargando...
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #ccc",
  borderRadius: 4,
};
const btnPrimary = {
  padding: "8px 12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};
const btnSecondary = {
  padding: "8px 12px",
  background: "#f3f4f6",
  color: "#111",
  border: "1px solid #e5e7eb",
  borderRadius: 4,
  cursor: "pointer",
};
const btnSmall = {
  padding: "6px 10px",
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 4,
  cursor: "pointer",
};

function valueOf(obj, path) {
  const val = obj?.[path];
  return val == null ? "" : val;
}

function formatValue(val, key) {
  if (val == null || val === "") return "-";
  if (key === "fecha_atencion") return safeDate(val);
  if (key === "hora_atencion") return String(val).slice(0, 5);
  if (key === "edad") return `${val} años`;
  return String(val);
}

function safeDate(v) {
  try {
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return String(v);
  }
}

function sanitizeCSV(v) {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
