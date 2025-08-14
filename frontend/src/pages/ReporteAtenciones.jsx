import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import { listarReportesAtenciones } from "../api/conexion.api.js";
import { toast } from "react-hot-toast";
import PropTypes from "prop-types";

const API_BASE_URL =
  import.meta?.env?.VITE_API_URL || "http://localhost:3000/api";
const ENDPOINT = "/form_008_emergencia/atenciones";

export default function ReporteAtenciones() {
  const [estado, setEstado] = useState("");
  // === NUEVO: estado para reporte mensual ===
  const [repoAtenYear, setRepoAtenYear] = useState(
    String(new Date().getFullYear())
  );
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportErr, setReportErr] = useState("");

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [servicio, setServicio] = useState("");
  const [medico, setMedico] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("fecha_atencion");
  const [sortDir, setSortDir] = useState("desc");

  const abortRef = useRef(null);

  // Ajusta/añade variables según las columnas reales de tu tabla form_008_emergencia
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
  const [visibleCols, setVisibleCols] = useState(() =>
    columns.map((c) => c.key)
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
    const usedCols = columns.filter((c) => visibleCols.includes(c.key));
    const headers = usedCols.map((c) => c.label);
    const rows = items.map((row) =>
      usedCols.map((c) => sanitizeCSV(valueOf(row, c.key)))
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

  const printReport = () => window.print();

  // === NUEVO: función para llamar al endpoint de reporte mensual ===
  const buscarReporteMensual = async () => {
    setReportLoading(true);
    setReportErr("");
    try {
      // Ajusta los params si tu API requiere eniUser y user_rol además de year:
      // Ej.: const data = await listarReportesAtenciones({ eniUser, user_rol, year: repoAtenYear });
      const data = await listarReportesAtenciones(repoAtenYear);
      setReportData(Array.isArray(data?.results) ? data.results : []);
    } catch (e) {
      setReportErr(e?.message || "Error al obtener reporte");
      toast?.error?.("No se pudo cargar el reporte");
    } finally {
      setReportLoading(false);
    }
  };

  // Resúmenes rápidos en la página actual (útil para reportes)
  const resumenEstado = useMemo(() => countBy(items, "estado"), [items]);
  const resumenServicio = useMemo(() => countBy(items, "servicio"), [items]);

  const usedColumns = columns.filter((c) => visibleCols.includes(c.key));

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">
        Reporte de Atenciones - FORM 008 Emergencia
      </h2>

      {/* NUEVO: Reporte mensual por año */}
      <div className="mb-4 border border-gray-200 rounded p-3">
        <h3 className="font-medium text-sm mb-2">Reporte mensual (por año)</h3>
        <div className="flex items-end gap-2 mb-3">
          <div className="flex flex-col">
            <label htmlFor="repo_aten_year" className="text-sm text-gray-700">
              Año
            </label>
            <input
              id="repo_aten_year"
              type="number"
              min="2000"
              max="2100"
              value={repoAtenYear}
              onChange={(e) => setRepoAtenYear(e.target.value)}
              className="w-36 px-2 py-1 border border-gray-300 rounded"
            />
          </div>
          <button
            id="btnBuscar"
            type="button"
            onClick={buscarReporteMensual}
            disabled={reportLoading}
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
          >
            {reportLoading ? "Cargando..." : "Buscar"}
          </button>
        </div>

        {reportErr ? (
          <div className="text-red-600 mb-2 text-sm">Error: {reportErr}</div>
        ) : null}

        {reportData && Array.isArray(reportData) && reportData.length > 0 ? (
          <>
            <TablaReporteMensualUnidades rows={reportData} />
            <TablaResumenIndicadores rows={reportData} />
          </>
        ) : null}
      </div>
      {/* FIN NUEVO */}

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 md:grid-cols-6 items-end mb-3"
      >
        <div className="flex flex-col">
          <label className="text-sm text-gray-700">Buscar</label>
          <input
            type="text"
            placeholder="Paciente / Documento / Diagnóstico"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700">Desde</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700">Hasta</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700">Servicio</label>
          <input
            type="text"
            value={servicio}
            onChange={(e) => setServicio(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700">Médico</label>
          <input
            type="text"
            value={medico}
            onChange={(e) => setMedico(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700">Estado</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded"
          >
            <option value="">Todos</option>
            <option value="ATENDIDO">Atendido</option>
            <option value="EN_ESPERA">En espera</option>
            <option value="REFERIDO">Referido</option>
            <option value="DERIVADO">Derivado</option>
          </select>
        </div>

        <div className="md:col-span-6 flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
          >
            {loading ? "Cargando..." : "Buscar"}
          </button>
          <button
            type="button"
            onClick={resetFiltros}
            disabled={loading}
            className="px-3 py-2 rounded border border-gray-300 bg-gray-100"
          >
            Limpiar
          </button>

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={exportCSV}
              disabled={loading || items.length === 0}
              className="px-3 py-2 rounded border border-gray-300 bg-gray-100 disabled:opacity-60"
            >
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={printReport}
              className="px-3 py-2 rounded border border-gray-300 bg-gray-100"
            >
              Imprimir
            </button>
          </div>
        </div>
      </form>

      {/* Selector de variables/columnas para el reporte */}
      <div className="mb-3">
        <details className="rounded border border-gray-200">
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
            Variables del reporte
          </summary>
          <div className="px-3 py-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {columns.map((c) => (
              <label
                key={c.key}
                className="inline-flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={visibleCols.includes(c.key)}
                  onChange={() =>
                    setVisibleCols((prev) =>
                      prev.includes(c.key)
                        ? prev.filter((k) => k !== c.key)
                        : [...prev, c.key]
                    )
                  }
                />
                {c.label}
              </label>
            ))}
          </div>
        </details>
      </div>

      {/* Barra de control y paginación */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm">Total: {total}</span>
        <span className="text-sm">
          Página {page} de {totalPages}
        </span>
        <label className="text-sm">
          Tamaño
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="ml-1 border border-gray-300 rounded px-2 py-1"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1 || loading}
            className="px-2 py-1 border border-gray-300 rounded bg-white disabled:opacity-50"
            title="Primera"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-2 py-1 border border-gray-300 rounded bg-white disabled:opacity-50"
            title="Anterior"
          >
            ‹
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="px-2 py-1 border border-gray-300 rounded bg-white disabled:opacity-50"
            title="Siguiente"
          >
            ›
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages || loading}
            className="px-2 py-1 border border-gray-300 rounded bg-white disabled:opacity-50"
            title="Última"
          >
            »
          </button>
        </div>
      </div>

      {err ? (
        <div className="text-red-600 mb-2 text-sm">Error: {err}</div>
      ) : null}

      {/* Resúmenes (en la página actual) */}
      <div className="grid gap-3 md:grid-cols-2 mb-3">
        <div className="border border-gray-200 rounded p-3">
          <h3 className="font-medium text-sm mb-2">
            Resumen por Estado (página actual)
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(resumenEstado).length === 0 ? (
              <span className="text-gray-500 text-sm">Sin datos</span>
            ) : (
              Object.entries(resumenEstado).map(([k, v]) => (
                <span
                  key={k}
                  className="text-xs px-2 py-1 rounded bg-gray-100 border border-gray-200"
                >
                  {k || "Sin estado"}: {v}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="border border-gray-200 rounded p-3">
          <h3 className="font-medium text-sm mb-2">
            Resumen por Servicio (página actual)
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(resumenServicio).length === 0 ? (
              <span className="text-gray-500 text-sm">Sin datos</span>
            ) : (
              Object.entries(resumenServicio).map(([k, v]) => (
                <span
                  key={k}
                  className="text-xs px-2 py-1 rounded bg-gray-100 border border-gray-200"
                >
                  {k || "Sin servicio"}: {v}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="overflow-auto border border-gray-200 rounded">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr>
              {usedColumns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`text-left px-3 py-2 border-b border-gray-200 whitespace-nowrap ${
                    col.sortable ? "cursor-pointer select-none" : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortBy === col.key ? (
                      <span>{sortDir === "asc" ? "▲" : "▼"}</span>
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 ? (
              <tr>
                <td
                  colSpan={usedColumns.length}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  Sin resultados
                </td>
              </tr>
            ) : null}
            {items.map((row, idx) => (
              <tr
                key={row.id || `${row.documento}-${idx}`}
                className="border-b border-gray-100"
              >
                {usedColumns.map((col) => (
                  <td key={col.key} className="px-3 py-2 align-top">
                    {formatValue(valueOf(row, col.key), col.key)}
                  </td>
                ))}
              </tr>
            ))}
            {loading ? (
              <tr>
                <td
                  colSpan={usedColumns.length}
                  className="px-4 py-6 text-center"
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

function countBy(arr, key) {
  return arr.reduce((acc, it) => {
    const k = it?.[key] ?? "";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

// ...existing code...
function TablaReporteMensualUnidades({ rows }) {
  const meses = [
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE",
  ];
  const parMes = (r, m) => {
    const par = r?.meses?.[m];
    if (!Array.isArray(par) || par.length < 2) return [0, 0];
    return [Number(par[0]) || 0, Number(par[1]) || 0];
  };
  return (
    <div className="overflow-auto border border-gray-200 rounded">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 border-b border-gray-200 whitespace-nowrap">
              UNIDAD DE SALUD
            </th>
            <th className="text-left px-3 py-2 border-b border-gray-200 whitespace-nowrap">
              INDICADOR
            </th>
            {meses.map((m) => (
              <th
                key={m}
                className="text-right px-3 py-2 border-b border-gray-200 whitespace-nowrap"
              >
                {m}
              </th>
            ))}
            <th className="text-right px-3 py-2 border-b border-gray-200 whitespace-nowrap">
              TOTAL
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const totalDiag = Number(r?.total?.[0]) || 0;
            const totalPac = Number(r?.total?.[1]) || 0;
            return (
              <Fragment key={r.unidad_salud}>
                <tr className="border-b border-gray-100">
                  <td className="px-3 py-2 align-top font-medium" rowSpan={2}>
                    {r.unidad_salud}
                  </td>
                  <td className="px-3 py-2">Atenciones por diagnostico</td>
                  {meses.map((m) => {
                    const [diag] = parMes(r, m);
                    return (
                      <td
                        key={`${r.unidad_salud}-diag-${m}`}
                        className="px-3 py-2 text-right"
                      >
                        {diag}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-medium">
                    {totalDiag}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-3 py-2">Atenciones por paciente</td>
                  {meses.map((m) => {
                    const [, pac] = parMes(r, m);
                    return (
                      <td
                        key={`${r.unidad_salud}-pac-${m}`}
                        className="px-3 py-2 text-right"
                      >
                        {pac}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-medium">
                    {totalPac}
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
TablaReporteMensualUnidades.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      unidad_salud: PropTypes.string,
      meses: PropTypes.objectOf(
        PropTypes.arrayOf(
          PropTypes.oneOfType([PropTypes.number, PropTypes.string])
        )
      ),
      total: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      ),
    })
  ).isRequired,
};
// ...existing code...
// NUEVO: tabla de resumen “DETALLES DE LA TABLA”
function TablaResumenIndicadores({ rows }) {
  const totals = rows.reduce(
    (acc, r) => {
      acc.diag += Number(r?.total?.[0]) || 0;
      acc.pac += Number(r?.total?.[1]) || 0;
      return acc;
    },
    { diag: 0, pac: 0 }
  );

  return (
    <div className="mt-4 border border-gray-200 rounded">
      <div className="px-3 py-2 font-semibold text-sm">
        DETALLES DE LA TABLA
      </div>
      <table className="w-full border-t border-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 border-b border-gray-200">
              INDICADOR
            </th>
            <th className="text-right px-3 py-2 border-b border-gray-200">
              TOTAL
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="px-3 py-2">Atenciones por diagnostico</td>
            <td className="px-3 py-2 text-right">{totals.diag}</td>
          </tr>
          <tr>
            <td className="px-3 py-2">Atenciones por paciente</td>
            <td className="px-3 py-2 text-right">{totals.pac}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

TablaResumenIndicadores.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      total: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      ),
    })
  ).isRequired,
};
