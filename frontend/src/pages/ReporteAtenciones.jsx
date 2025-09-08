import { useState, Fragment, useContext } from "react";
import {
  listarReportesAtenciones,
  listarReporteDiagnostico,
  reporteDescargaAtencionesCsv,
  buscarAtencionForm008Emer,
} from "../api/conexion.api.js";
import { AuthContext } from "../components/AuthContext.jsx";
import { toast } from "react-hot-toast";
import PropTypes from "prop-types";

const initialState = {
  busc_paci_emer_fecha_min: "",
  busc_paci_emer_fecha_max: "",
  busc_paci_emer_identidad: "",
};

export default function ReporteAtenciones() {
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [repoAtenYear, setRepoAtenYear] = useState(
    String(new Date().getFullYear())
  );
  const [diagRows, setDiagRows] = useState([]);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagErr, setDiagErr] = useState("");
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportErr, setReportErr] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const { authData } = useContext(AuthContext);
  const roleRaw = authData?.user?.fun_admi_rol ?? authData?.fun_admi_rol;
  const role = roleRaw != null ? Number(roleRaw) : null;

  const getErrorMessage = (error) => {
    // Si la respuesta es un Blob (por ejemplo, error 400 con JSON)
    if (error?.response?.data instanceof Blob) {
      const data = error.response.data;
      if (data.type === "application/json") {
        // Retorna una promesa para manejar el texto del blob
        return data.text().then((text) => {
          try {
            const json = JSON.parse(text);
            return json.detail || json.message || JSON.stringify(json);
          } catch {
            return text;
          }
        });
      }
      return "Error desconocido (blob)";
    }

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
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
      buscarReporteDiagnostico();
    } catch (e) {
      setReportErr(e?.message || "Error al obtener reporte");
      toast?.error?.("No se pudo cargar el reporte");
    } finally {
      setReportLoading(false);
    }
  };

  // === NUEVO: función para reporte por diagnóstico (top 10 + OTROS) ===
  const buscarReporteDiagnostico = async () => {
    setDiagLoading(true);
    setDiagErr("");
    try {
      const data = await listarReporteDiagnostico(repoAtenYear);
      const rows = Array.isArray(data?.results) ? data.results : [];
      // ordenar por total desc
      const sorted = [...rows].sort(
        (a, b) => (Number(b?.total) || 0) - (Number(a?.total) || 0)
      );
      const top10 = sorted.slice(0, 10);
      const rest = sorted.slice(10);
      if (rest.length > 0) {
        const otros = rest.reduce(
          (acc, r) => ({
            diagnostico: "OTROS DIAGNOSTICOS",
            hombre: acc.hombre + (Number(r?.hombre) || 0),
            mujer: acc.mujer + (Number(r?.mujer) || 0),
            intersexual: acc.intersexual + (Number(r?.intersexual) || 0),
            total: acc.total + (Number(r?.total) || 0),
          }),
          {
            diagnostico: "OTROS DIAGNOSTICOS",
            hombre: 0,
            mujer: 0,
            intersexual: 0,
            total: 0,
          }
        );
        setDiagRows([...top10, otros]);
      } else {
        setDiagRows(top10);
      }
    } catch (e) {
      const msg = e?.message || "Error al obtener reporte de diagnóstico";
      setDiagErr(msg);
      toast?.error?.(msg);
    } finally {
      setDiagLoading(false);
    }
  };

  const descargarCsvAtenciones = async () => {
    try {
      const rx = /^\d{4}-\d{2}-\d{2}$/;
      if (
        !formData.busc_paci_emer_fecha_min ||
        !formData.busc_paci_emer_fecha_max
      ) {
        toast.error("Debe seleccionar fecha inicio y fin", {
          position: "bottom-right",
        });
        return;
      }
      if (
        !rx.test(formData.busc_paci_emer_fecha_min) ||
        !rx.test(formData.busc_paci_emer_fecha_max)
      ) {
        toast.error("Formato de fecha inválido (use YYYY-MM-DD)", {
          position: "bottom-right",
        });
        return;
      }
      const { blob, filename } = await reporteDescargaAtencionesCsv(
        formData.busc_paci_emer_fecha_min,
        formData.busc_paci_emer_fecha_max
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMessage("Descarga de archivo CSV exitosa");
      setTimeout(() => setSuccessMessage(""), 10000);
      toast.success("Descarga de archivo CSV exitosa", {
        position: "bottom-right",
      });
      limpiarVariables();
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      if (errorMsg instanceof Promise) {
        errorMsg.then((msg) => {
          setError(msg);
          setTimeout(() => setError(""), 10000);
          toast.error(msg, { position: "bottom-right" });
        });
      } else {
        setError(errorMsg);
        setTimeout(() => setError(""), 10000);
        toast.error(errorMsg, { position: "bottom-right" });
      }
    } finally {
      setLoading(false);
    }
  };

  const buscarAtencionEmergencia = async () => {
    setLoading(true);
    try {
      const rx = /^\d{4}-\d{2}-\d{2}$/;
      if (
        !formData.busc_paci_emer_fecha_min ||
        !formData.busc_paci_emer_fecha_max
      ) {
        toast.error("Debe seleccionar fecha inicio y fin", {
          position: "bottom-right",
        });
        return;
      }
      if (
        !rx.test(formData.busc_paci_emer_fecha_min) ||
        !rx.test(formData.busc_paci_emer_fecha_max)
      ) {
        toast.error("Formato de fecha inválido (use YYYY-MM-DD)", {
          position: "bottom-right",
        });
        return;
      }
      const response = await buscarAtencionForm008Emer(
        formData.busc_paci_emer_fecha_min,
        formData.busc_paci_emer_fecha_max,
        formData.busc_paci_emer_identidad
      );
      if (!response)
        throw new Error("No se pudo obtener una respuesta de la API.");
      setSuccessMessage(response.message || "Operación exitosa");
      setTimeout(() => setSuccessMessage(""), 10000);
      // Se asume respuesta: { message, cantidad, resultados }
      const rows = Array.isArray(response?.resultados)
        ? response.resultados
        : [];
      setItems(rows);
      setTotal(Number(response?.cantidad) || rows.length);
      setPage(1);
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      if (errorMsg instanceof Promise) {
        errorMsg.then((msg) => {
          setError(msg);
          setTimeout(() => setError(""), 10000);
          toast.error(msg, { position: "bottom-right" });
        });
      } else {
        setError(errorMsg);
        setTimeout(() => setError(""), 10000);
        toast.error(errorMsg, { position: "bottom-right" });
      }
    } finally {
      setLoading(false);
    }
  };

  const limpiarVariables = () => {
    setFormData(initialState);
    setPage(1);

    setReportData(null);
    setItems([]);
    setDiagRows([]);
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

  // Paginación (10 filas por página)
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const displayedItems = items.slice(start, start + pageSize);

  // Construcción de botones de página (compacto)
  const buildPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 4) pages.push("...");
      const from = Math.max(2, safePage - 1);
      const to = Math.min(totalPages - 1, safePage + 1);
      for (let i = from; i <= to; i++) pages.push(i);
      if (safePage < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };
  const pageButtons = buildPages();

  const goToPage = (p) => {
    if (p === "..." || p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <div className="p-4 space-y-6">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-5 text-white shadow">
        <h2 className="text-xl font-semibold">
          Reporte de Atenciones - FORM 008 Emergencia
        </h2>
        <p className="text-sm opacity-90">
          Visualización consolidada y analítica de atenciones médicas
        </p>
      </header>

      {/* BLOQUE: Reporte mensual por año */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label
              htmlFor="repo_aten_year"
              className="text-xs font-medium text-gray-600 uppercase tracking-wide"
            >
              Año
            </label>
            <input
              id="repo_aten_year"
              type="number"
              min="2000"
              max="2100"
              value={repoAtenYear}
              onChange={(e) => setRepoAtenYear(e.target.value)}
              className="w-36 px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <button
            id="btnBuscar"
            type="button"
            onClick={buscarReporteMensual}
            disabled={reportLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {reportLoading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {reportLoading ? "Cargando..." : "Buscar"}
          </button>

          <button
            type="button"
            onClick={limpiarVariables}
            disabled={reportLoading || diagLoading}
            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium border border-gray-300 shadow-sm transition disabled:opacity-60"
          >
            Limpiar
          </button>

          <button
            type="button"
            onClick={printReport}
            className="px-4 py-2 rounded-md bg-white hover:bg-gray-100 text-gray-700 text-sm font-medium border border-gray-300 shadow-sm transition"
          >
            Imprimir
          </button>
        </div>

        {reportErr && (
          <div className="px-3 py-2 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
            {reportErr}
          </div>
        )}

        {reportLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
            <div className="h-48 bg-gray-100 rounded" />
            <div className="h-48 bg-gray-100 rounded" />
            <div className="h-48 bg-gray-100 rounded" />
          </div>
        )}

        {!reportLoading && (!reportData || reportData?.length === 0) && (
          <div className="flex items-center gap-3 p-4 rounded-md border border-dashed border-gray-300 bg-gray-50 text-gray-600 text-sm">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 text-gray-500">
              !
            </span>
            {reportData === null
              ? "Ingrese un año y presione Buscar para cargar el reporte."
              : "No se encontraron datos para el año seleccionado."}
          </div>
        )}

        {reportData && Array.isArray(reportData) && reportData.length > 0 && (
          <div className="flex flex-col xl:flex-row gap-5">
            <div className="flex-1 min-w-0">
              <TablaReporteMensualUnidades rows={reportData} />
            </div>
            <div className="w-full xl:w-72 shrink-0 space-y-4">
              <TablaResumenIndicadores rows={reportData} />
              <div className="p-3 rounded border border-blue-100 bg-blue-50 text-xs text-blue-700">
                Consejo: Puede imprimir o exportar la página utilizando el botón
                Imprimir del navegador para conservar el formato.
              </div>
            </div>
          </div>
        )}
        {diagErr && (
          <div className="px-3 py-2 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
            {diagErr}
          </div>
        )}

        {diagLoading && (
          <div className="h-40 rounded bg-gray-100 animate-pulse" />
        )}

        {!diagLoading && diagRows.length === 0 && (
          <div className="flex items-center gap-3 p-4 rounded-md border border-dashed border-gray-300 bg-gray-50 text-gray-600 text-sm">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 text-gray-500">
              !
            </span>
            No hay datos de diagnóstico. Ejecute primero el reporte mensual.
          </div>
        )}

        {diagRows.length > 0 && !diagLoading && (
          <TablaDiagnosticoTop rows={diagRows} />
        )}
      </section>

      {/* BLOQUE DESCARGA CSV (solo roles 1 y 2) */}
      {(role === 1 || role === 2) && (
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Reporte Detallado de Atenciones con Filtro Avanzado
          </h3>
          <form
            id="reporteDetalladoForm"
            className="grid gap-4 md:grid-cols-6 items-end"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col">
              <label
                className="text-xs font-medium text-gray-600 uppercase tracking-wide"
                htmlFor="fecha_min"
              >
                Fecha mínima
              </label>
              <input
                type="date"
                id="fecha_min"
                name="fecha_min"
                value={formData.busc_paci_emer_fecha_min}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    busc_paci_emer_fecha_min: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label
                className="text-xs font-medium text-gray-600 uppercase tracking-wide"
                htmlFor="fecha_max"
              >
                Fecha máxima
              </label>
              <input
                type="date"
                id="fecha_max"
                name="fecha_max"
                value={formData.busc_paci_emer_fecha_max}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    busc_paci_emer_fecha_max: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="flex flex-col md:col-span-2">
              <label
                className="text-xs font-medium text-gray-600 uppercase tracking-wide"
                htmlFor="identidad"
              >
                Cédula / Apellidos o Nombres
              </label>
              <input
                type="text"
                id="identidad"
                name="identidad"
                value={formData.busc_paci_emer_identidad}
                onChange={(e) => {
                  const val = e.target.value
                    .toUpperCase()
                    .replace(/\s{2,}/g, " ");
                  setFormData({
                    ...formData,
                    busc_paci_emer_identidad: val,
                  });
                }}
                placeholder="Cédula o nombres/apellidos"
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="md:col-span-6 flex flex-wrap gap-2">
              <button
                type="button"
                id="btnBuscarAtencionForm008Emer"
                name="btnBuscarAtencionForm008Emer"
                onClick={buscarAtencionEmergencia}
                disabled={
                  !formData.busc_paci_emer_fecha_min ||
                  !formData.busc_paci_emer_fecha_max ||
                  !formData.busc_paci_emer_identidad ||
                  formData.busc_paci_emer_identidad.length < 3
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? "Buscando..." : "Buscar"}
              </button>
              <button
                type="button"
                id="btnReporteDiagnosticoCsv"
                name="btnReporteDiagnosticoCsv"
                onClick={descargarCsvAtenciones}
                disabled={
                  !formData.busc_paci_emer_fecha_min ||
                  !formData.busc_paci_emer_fecha_max
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? "Descargando..." : "Descargar CSV"}
              </button>
              <button
                type="button"
                onClick={limpiarVariables}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium border border-gray-300 shadow-sm"
              >
                Limpiar
              </button>
              <span className="text-xs text-gray-500 flex items-center">
                Seleccione un rango de fechas para exportar los registros o
                realice una busqueda avanzada de atenciones de pacientes para
                que se reflejen en la tabla.
              </span>
            </div>
          </form>
          <EstadoMensajes error={error} successMessage={successMessage} />

          <div className="overflow-auto border border-gray-200 rounded relative">
            <table className="w-full text-xs border-collapse min-w-[1500px]">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow">
                <tr>
                  <th className="px-2 py-2 text-left border-b w-10">#</th>
                  <th className="px-2 py-2 text-left border-b">
                    UNIDAD DE SALUD
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    FECHA DE ATENCIÓN
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    TIPO DE DOCUMENTO DE IDENTIFICACIÓN
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    NÚMERO DE IDENTIFICACION
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    APELLIDOS / NOMBRES DEL PACIENTE
                  </th>
                  <th className="px-2 py-2 text-left border-b">SEXO</th>
                  <th className="px-2 py-2 text-left border-b">EDAD</th>
                  <th className="px-2 py-2 text-left border-b">NACIONALIDAD</th>
                  <th className="px-2 py-2 text-left border-b">ETNIA</th>
                  <th className="px-2 py-2 text-left border-b">
                    GRUPO PRIORITARIO
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    TIPO DE SEGURO
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    PROV. RESIDENCIA
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    CANT. RESIDENCIA
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    PARR. RESIDENCIA
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    ESPECIALIDAD DEL PROFESIONAL
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    CIE-10 (PRINCIPAL)
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    DIAGNÓSTICO 1 (PRINCIPAL)
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    CONDICIÓN DEL DIAGNÓSTICO
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    CIE-10 (CAUSA EXTERNA)
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    DIAGNÓSTICO (CAUSA EXTERNA)
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    HOSPITALIZACIÓN
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    HORA ATENCIÓN
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    CONDICIÓN DEL ALTA
                  </th>
                  <th className="px-2 py-2 text-left border-b">OBSERVACIÓN</th>
                  <th className="px-2 py-2 text-left border-b">
                    FECHA DE REPORTE
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    RESPONSABLE ATENCIÓN MÉDICA
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    APOYO ATENCIÓN MÉDICA
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    EDAD GESTACIONAL
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    RIESGO OBSTÉTRICO
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    UNIDAD RESPONSABLE SEGUIMIENTO
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    DIRECCIÓN DE DOMICILIO
                  </th>
                  <th className="px-2 py-2 text-left border-b">
                    TELÉFONO DEL PACIENTE
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={34}
                      className="px-3 py-6 text-center text-gray-500"
                    >
                      Cargando...
                    </td>
                  </tr>
                )}
                {!loading && displayedItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={34}
                      className="px-3 py-6 text-center text-gray-500"
                    >
                      Sin datos
                    </td>
                  </tr>
                )}
                {!loading &&
                  displayedItems.map((r, idx) => {
                    const paciente = [
                      r.for_008_emer_prim_apel,
                      r.for_008_emer_segu_apel,
                      r.for_008_emer_prim_nomb,
                      r.for_008_emer_segu_nomb,
                    ]
                      .filter(Boolean)
                      .join(" ");
                    const globalIndex = start + idx + 1;
                    return (
                      <tr
                        key={r.id}
                        className={`border-t ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                        } hover:bg-indigo-50 transition-colors`}
                      >
                        <td className="px-2 py-1 font-medium text-gray-600">
                          {globalIndex}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_unid || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_fech_aten || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_tipo_docu_iden || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_nume_iden || "-"}
                        </td>
                        <td className="px-2 py-1">{paciente || "-"}</td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_sexo || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_edad != null
                            ? `${r.for_008_emer_edad} ${
                                r.for_008_emer_cond_edad || ""
                              }`
                            : "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_naci || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_etni || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_grup_prio || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_tipo_segu || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_prov_resi || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_cant_resi || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_parr_resi || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_espe_prof || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_cie_10_prin || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_diag_prin || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_cond_diag || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_cie_10_caus_exte || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_diag_caus_exte || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_hosp || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_hora_aten
                            ? r.for_008_emer_hora_aten.slice(0, 5)
                            : "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_cond_alta || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_obse || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_fech_repor
                            ? r.for_008_emer_fech_repor.split("T")[0]
                            : "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_resp_aten_medi || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_apoy_aten_medi || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_edad_gest || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_ries_obst || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_unid_salu_resp_segu_aten || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_dire_domi || "-"}
                        </td>
                        <td className="px-2 py-1">
                          {r.for_008_emer_tele_paci || "-"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              {items.length > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={34}
                      className="px-3 py-2 text-xs text-gray-600"
                    >
                      Mostrando {items.length === 0 ? 0 : start + 1} -{" "}
                      {start + displayedItems.length} de {items.length}{" "}
                      registros (Página {safePage} de {totalPages})
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
            {/* Controles de paginación */}
            {items.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-white">
                <div className="text-[11px] text-gray-600">
                  Página {safePage} de {totalPages}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(1)}
                    disabled={safePage === 1}
                    className="px-2 h-8 text-xs rounded border bg-white hover:bg-gray-100 disabled:opacity-40"
                  >
                    «
                  </button>
                  <button
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage === 1}
                    className="px-2 h-8 text-xs rounded border bg-white hover:bg-gray-100 disabled:opacity-40"
                  >
                    ‹
                  </button>
                  {pageButtons.map((p, i) => (
                    <button
                      key={i + String(p)}
                      onClick={() => goToPage(p)}
                      disabled={p === "..."}
                      className={`px-3 h-8 text-xs rounded border ${
                        p === safePage
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white hover:bg-indigo-50"
                      } ${p === "..." ? "cursor-default text-gray-400" : ""}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage === totalPages}
                    className="px-2 h-8 text-xs rounded border bg-white hover:bg-gray-100 disabled:opacity-40"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={safePage === totalPages}
                    className="px-2 h-8 text-xs rounded border bg-white hover:bg-gray-100 disabled:opacity-40"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
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
      <div className="px-2 py-2 font-semibold text-sm">
        TOTAL DE ATENCIONES POR UNIDAD DE SALUD
      </div>
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-2 py-2 border-b border-gray-200 whitespace-nowrap">
              UNIDAD DE SALUD
            </th>
            <th className="text-left px-2 py-2 border-b border-gray-200 whitespace-nowrap">
              PROFESIONAL MEDICO
            </th>
            <th className="text-left px-2 py-2 border-b border-gray-200 whitespace-nowrap">
              INDICADOR
            </th>
            {meses.map((m) => (
              <th
                key={m}
                className="text-center px-2 py-2 border-b border-gray-200 whitespace-nowrap"
              >
                {m}
              </th>
            ))}
            <th className="text-center px-2 py-2 border-b border-gray-200 whitespace-nowrap">
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
                  <td className="px-2 py-2 align-top font-medium" rowSpan={2}>
                    {r.unidad_salud}
                  </td>
                  <td className="px-2 py-2 align-top font-medium" rowSpan={2}>
                    {r.medico}
                  </td>
                  <td className="px-2 py-2">Atenciones por diagnostico</td>
                  {meses.map((m) => {
                    const [diag] = parMes(r, m);
                    return (
                      <td
                        key={`${r.unidad_salud}-diag-${m}`}
                        className="px-2 py-2 text-center"
                      >
                        {diag}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-center font-medium">
                    {totalDiag}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-2 py-2">Atenciones por paciente</td>
                  {meses.map((m) => {
                    const [, pac] = parMes(r, m);
                    return (
                      <td
                        key={`${r.unidad_salud}-pac-${m}`}
                        className="px-2 py-2 text-center"
                      >
                        {pac}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-center font-medium">
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
    <div className="overflow-auto border border-gray-200 rounded">
      <div className="px-2 py-2 font-semibold text-sm">
        DETALLES DE LA TABLA
      </div>
      <table className="w-full border-t border-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-2 py-2 border-b border-gray-200">
              INDICADOR
            </th>
            <th className="text-center px-2 py-2 border-b border-gray-200">
              TOTAL
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="px-2 py-2">Atenciones por diagnostico</td>
            <td className="px-2 py-2 text-center">{totals.diag}</td>
          </tr>
          <tr>
            <td className="px-2 py-2">Atenciones por paciente</td>
            <td className="px-2 py-2 text-center">{totals.pac}</td>
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

// === NUEVO: Tabla de diagnóstico (Top 10 + OTROS) ===
function TablaDiagnosticoTop({ rows }) {
  // Totales de lo mostrado (incluye "OTROS" si existe)
  const totals = rows.reduce(
    (acc, r) => {
      acc.hombre += Number(r?.hombre) || 0;
      acc.mujer += Number(r?.mujer) || 0;
      acc.intersexual += Number(r?.intersexual) || 0;
      acc.total += Number(r?.total) || 0;
      return acc;
    },
    { hombre: 0, mujer: 0, intersexual: 0, total: 0 }
  );
  return (
    <div className="overflow-auto border border-gray-200 rounded">
      <div className="px-2 py-2 font-semibold text-sm">
        LAS 10 PRINCIPALES CAUSAS DE ATENCIÓN (POR DIAGNÓSTICO)
      </div>
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 border-b border-gray-200">#</th>
            <th className="text-left px-3 py-2 border-b border-gray-200">
              DIAGNÓSTICO
            </th>
            <th className="text-center px-3 py-2 border-b border-gray-200">
              HOMBRE
            </th>
            <th className="text-center px-3 py-2 border-b border-gray-200">
              MUJER
            </th>
            <th className="text-center px-3 py-2 border-b border-gray-200">
              INTERSEXUAL
            </th>
            <th className="text-center px-3 py-2 border-b border-gray-200">
              TOTAL
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={`${r.diagnostico}-${idx}`}
              className="border-b border-gray-100"
            >
              <td className="px-3 py-2">{idx < 10 ? idx + 1 : ""}</td>
              <td className="px-3 py-2">{r.diagnostico}</td>
              <td className="px-3 py-2 text-center">
                {Number(r?.hombre) || 0}
              </td>
              <td className="px-3 py-2 text-center">{Number(r?.mujer) || 0}</td>
              <td className="px-3 py-2 text-center">
                {Number(r?.intersexual) || 0}
              </td>
              <td className="px-3 py-2 text-center font-medium">
                {Number(r?.total) || 0}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold">
            <td className="px-3 py-2 text-center" colSpan={2}>
              TOTAL
            </td>
            <td className="px-3 py-2 text-center">{totals.hombre}</td>
            <td className="px-3 py-2 text-center">{totals.mujer}</td>
            <td className="px-3 py-2 text-center">{totals.intersexual}</td>
            <td className="px-3 py-2 text-center">{totals.total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

TablaDiagnosticoTop.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      diagnostico: PropTypes.string,
      hombre: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      mujer: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      intersexual: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      total: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })
  ).isRequired,
};
