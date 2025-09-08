import { useState, useContext, Fragment, useCallback } from "react";
import {
  listarReportesAtenciones,
  listarReporteDiagnostico,
  reporteDescargaAtencionesCsv,
  buscarAtencionForm008Emer,
} from "../api/conexion.api.js";
import { AuthContext } from "../components/AuthContext.jsx";
import Loader from "../components/Loader.jsx";
import { toast } from "react-hot-toast";
import PropTypes from "prop-types";

/* ===================== CONSTANTES / UTILIDADES ===================== */
const INITIAL_FORM = {
  busc_paci_emer_fecha_min: "",
  busc_paci_emer_fecha_max: "",
  busc_paci_emer_identidad: "",
};

const MONTHS = [
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

function isValidIsoDate(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function getErrorMessage(error) {
  if (error?.response?.data instanceof Blob) {
    const data = error.response.data;
    if (data.type === "application/json") {
      return data.text().then((t) => {
        try {
          const j = JSON.parse(t);
          return j.detail || j.message || JSON.stringify(j);
        } catch {
          return t;
        }
      });
    }
    return "Error desconocido (blob)";
  }
  const data = error?.response?.data;
  if (data) {
    if (typeof data === "object") {
      if (data.message) return data.message;
      if (data.error) return data.error;
      const k = Object.keys(data)[0];
      const first = data[k];
      if (Array.isArray(first) && first.length) return first[0];
      if (typeof first === "string") return first;
      return JSON.stringify(data);
    }
    if (typeof data === "string") return data;
  } else if (error?.request) return "No se recibió respuesta del servidor";
  else if (error?.message) return error.message;
  return "Error desconocido";
}

function resolveAndToastError(err, setError) {
  const msg = getErrorMessage(err);
  if (msg instanceof Promise) {
    msg.then((m) => {
      setError(m);
      toast.error(m, { position: "bottom-right" });
    });
  } else {
    setError(msg);
    toast.error(msg, { position: "bottom-right" });
  }
}

/* ===================== COMPONENTE PRINCIPAL ===================== */
export default function ReporteAtenciones() {
  const [formData, setFormData] = useState(INITIAL_FORM);

  // Mensajes generales (bloque búsqueda detallada)
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Reporte mensual
  const [anioReporte, setAnioReporte] = useState(
    String(new Date().getFullYear())
  );
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportErr, setReportErr] = useState("");

  // Diagnósticos
  const [diagRows, setDiagRows] = useState([]);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagErr, setDiagErr] = useState("");

  // Búsqueda detallada
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Paginación
  const [page, setPage] = useState(1);

  const { authData } = useContext(AuthContext);
  const roleRaw = authData?.user?.fun_admi_rol ?? authData?.fun_admi_rol;
  const role = roleRaw != null ? Number(roleRaw) : null;

  const resetMessagesLater = (setter) => setTimeout(() => setter(""), 10000);

  const limpiarVariables = useCallback(() => {
    setFormData(INITIAL_FORM);
    setPage(1);
    setReportData(null);
    setItems([]);
    setDiagRows([]);
    setError("");
    setSuccessMessage("");
    setReportErr("");
    setDiagErr("");
  }, []);

  const printReport = () => window.print();

  /* ====== Reporte mensual (unidades + diagnóstico top) ====== */
  const buscarReporteMensual = useCallback(async () => {
    setReportLoading(true);
    setReportErr("");
    try {
      const data = await listarReportesAtenciones(anioReporte);
      setReportData(Array.isArray(data?.results) ? data.results : []);
      await buscarReporteDiagnostico(anioReporte);
    } catch (e) {
      setReportErr(e?.message || "Error al obtener reporte");
      toast.error("No se pudo cargar el reporte");
    } finally {
      setReportLoading(false);
    }
  }, [anioReporte]);

  const buscarReporteDiagnostico = useCallback(async (year) => {
    setDiagLoading(true);
    setDiagErr("");
    try {
      const data = await listarReporteDiagnostico(year);
      const rows = Array.isArray(data?.results) ? data.results : [];
      const sorted = [...rows].sort(
        (a, b) => (Number(b?.total) || 0) - (Number(a?.total) || 0)
      );
      const top10 = sorted.slice(0, 10);
      const rest = sorted.slice(10);
      if (rest.length) {
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
      } else setDiagRows(top10);
    } catch (e) {
      const msg = e?.message || "Error al obtener reporte de diagnóstico";
      setDiagErr(msg);
      toast.error(msg);
    } finally {
      setDiagLoading(false);
    }
  }, []);

  /* ====== CSV general ====== */
  const descargarCsvAtenciones = async () => {
    try {
      const { busc_paci_emer_fecha_min: fmin, busc_paci_emer_fecha_max: fmax } =
        formData;
      if (!fmin || !fmax) {
        toast.error("Debe seleccionar fecha inicio y fin", {
          position: "bottom-right",
        });
        return;
      }
      if (!isValidIsoDate(fmin) || !isValidIsoDate(fmax)) {
        toast.error("Formato de fecha inválido (use YYYY-MM-DD)", {
          position: "bottom-right",
        });
        return;
      }
      const { blob, filename } = await reporteDescargaAtencionesCsv(fmin, fmax);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMessage("Descarga de archivo CSV exitosa");
      resetMessagesLater(setSuccessMessage);
      toast.success("Descarga de archivo CSV exitosa", {
        position: "bottom-right",
      });
      limpiarVariables();
    } catch (e) {
      resolveAndToastError(e, setError);
      resetMessagesLater(setError);
    }
  };

  /* ====== Búsqueda detallada de atenciones ====== */
  const buscarAtencionEmergencia = async () => {
    setLoading(true);
    try {
      const {
        busc_paci_emer_fecha_min: fmin,
        busc_paci_emer_fecha_max: fmax,
        busc_paci_emer_identidad: ident,
      } = formData;
      if (!fmin || !fmax) {
        toast.error("Debe seleccionar fecha inicio y fin", {
          position: "bottom-right",
        });
        return;
      }
      if (!isValidIsoDate(fmin) || !isValidIsoDate(fmax)) {
        toast.error("Formato de fecha inválido (use YYYY-MM-DD)", {
          position: "bottom-right",
        });
        return;
      }
      const res = await buscarAtencionForm008Emer(fmin, fmax, ident);
      if (!res) throw new Error("No se pudo obtener respuesta de la API.");
      setSuccessMessage(res.message || "Operación exitosa");
      resetMessagesLater(setSuccessMessage);
      const rows = Array.isArray(res?.resultados) ? res.resultados : [];
      setItems(rows);
      setPage(1);
    } catch (e) {
      resolveAndToastError(e, setError);
      resetMessagesLater(setError);
    } finally {
      setLoading(false);
    }
  };

  /* ====== Paginación ====== */
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const displayedItems = items.slice(start, start + pageSize);

  const buildPages = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const out = [1];
    if (safePage > 4) out.push("...");
    const from = Math.max(2, safePage - 1);
    const to = Math.min(totalPages - 1, safePage + 1);
    for (let i = from; i <= to; i++) out.push(i);
    if (safePage < totalPages - 3) out.push("...");
    out.push(totalPages);
    return out;
  };

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

      {/* ====== BLOQUE: Reporte mensual ====== */}
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
              value={anioReporte}
              onChange={(e) => setAnioReporte(e.target.value)}
              className="w-36 px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <button
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

        {reportErr && <Alert type="error" text={reportErr} />}

        {reportLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
            <div className="h-48 bg-gray-100 rounded" />
            <div className="h-48 bg-gray-100 rounded" />
            <div className="h-48 bg-gray-100 rounded" />
          </div>
        )}

        {!reportLoading && (!reportData || reportData?.length === 0) && (
          <EmptyInfo
            text={
              reportData === null
                ? "Ingrese un año y presione Buscar para cargar el reporte."
                : "No se encontraron datos para el año seleccionado."
            }
          />
        )}

        {reportData?.length > 0 && (
          <div className="flex flex-col xl:flex-row gap-5">
            <div className="flex-1 min-w-0">
              <TablaReporteMensualUnidades rows={reportData} />
            </div>
            <div className="w-full xl:w-72 shrink-0 space-y-4">
              <TablaResumenIndicadores rows={reportData} />
              <div className="p-3 rounded border border-blue-100 bg-blue-50 text-xs text-blue-700">
                Consejo: Puede imprimir la página para conservar el formato.
              </div>
            </div>
          </div>
        )}

        {diagErr && <Alert type="error" text={diagErr} />}
        {diagLoading && (
          <div className="h-40 rounded bg-gray-100 animate-pulse" />
        )}
        {!diagLoading && diagRows.length === 0 && (
          <EmptyInfo text="No hay datos de diagnóstico. Ejecute primero el reporte mensual." />
        )}
        {diagRows.length > 0 && !diagLoading && (
          <TablaDiagnosticoTop rows={diagRows} />
        )}
      </section>

      {/* ====== BLOQUE: Descarga CSV y búsqueda detallada ====== */}
      {(role === 1 || role === 2) && (
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Reporte Detallado de Atenciones con Filtro Avanzado
          </h3>
          {loading && (
            <Loader
              modal
              isOpen={loading}
              title="Iniciando sesión"
              text="Por favor espere..."
              closeButton={false}
            />
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
            }}
            className="grid gap-4 md:grid-cols-6 items-end"
          >
            <InputDate
              label="Fecha mínima"
              value={formData.busc_paci_emer_fecha_min}
              onChange={(v) =>
                setFormData((f) => ({ ...f, busc_paci_emer_fecha_min: v }))
              }
            />
            <InputDate
              label="Fecha máxima"
              value={formData.busc_paci_emer_fecha_max}
              onChange={(v) =>
                setFormData((f) => ({ ...f, busc_paci_emer_fecha_max: v }))
              }
            />
            <div className="flex flex-col md:col-span-2">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Cédula / Apellidos o Nombres
              </label>
              <input
                type="text"
                value={formData.busc_paci_emer_identidad}
                onChange={(e) =>
                  setFormData((f) => ({
                    ...f,
                    busc_paci_emer_identidad: e.target.value
                      .toUpperCase()
                      .replace(/\s{2,}/g, " "),
                  }))
                }
                placeholder="Cédula o nombres/apellidos"
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="md:col-span-6 flex flex-wrap gap-2">
              <Button
                onClick={buscarAtencionEmergencia}
                disabled={
                  !formData.busc_paci_emer_fecha_min ||
                  !formData.busc_paci_emer_fecha_max ||
                  !formData.busc_paci_emer_identidad ||
                  formData.busc_paci_emer_identidad.length < 3
                }
                loading={loading}
                text="Buscar"
              />
              <Button
                color="emerald"
                onClick={descargarCsvAtenciones}
                disabled={
                  !formData.busc_paci_emer_fecha_min ||
                  !formData.busc_paci_emer_fecha_max ||
                  formData.busc_paci_emer_identidad.length > 0
                }
                loading={loading}
                text="Descargar CSV"
                loadingText="Descargando..."
              />
              <button
                type="button"
                onClick={limpiarVariables}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium border border-gray-300 shadow-sm"
              >
                Limpiar
              </button>
              <span className="text-xs text-gray-500 flex items-center">
                Seleccione un rango de fechas para exportar o realice una
                búsqueda avanzada de pacientes.
              </span>
            </div>
          </form>

          <EstadoMensajes error={error} successMessage={successMessage} />

          <div className="overflow-auto border border-gray-200 rounded relative">
            <table className="w-full text-xs border-collapse min-w-[1500px]">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow">
                <tr>
                  {[
                    "#",
                    "UNIDAD DE SALUD",
                    "FECHA DE ATENCIÓN",
                    "TIPO DE DOCUMENTO DE IDENTIFICACIÓN",
                    "NÚMERO DE IDENTIFICACION",
                    "APELLIDOS / NOMBRES DEL PACIENTE",
                    "SEXO",
                    "EDAD",
                    "NACIONALIDAD",
                    "ETNIA",
                    "GRUPO PRIORITARIO",
                    "TIPO DE SEGURO",
                    "PROV. RESIDENCIA",
                    "CANT. RESIDENCIA",
                    "PARR. RESIDENCIA",
                    "ESPECIALIDAD DEL PROFESIONAL",
                    "CIE-10 (PRINCIPAL)",
                    "DIAGNÓSTICO 1 (PRINCIPAL)",
                    "CONDICIÓN DEL DIAGNÓSTICO",
                    "CIE-10 (CAUSA EXTERNA)",
                    "DIAGNÓSTICO (CAUSA EXTERNA)",
                    "HOSPITALIZACIÓN",
                    "HORA ATENCIÓN",
                    "CONDICIÓN DEL ALTA",
                    "OBSERVACIÓN",
                    "FECHA DE REPORTE",
                    "RESPONSABLE ATENCIÓN MÉDICA",
                    "APOYO ATENCIÓN MÉDICA",
                    "EDAD GESTACIONAL",
                    "RIESGO OBSTÉTRICO",
                    "UNIDAD RESPONSABLE SEGUIMIENTO",
                    "DIRECCIÓN DE DOMICILIO",
                    "TELÉFONO DEL PACIENTE",
                  ].map((h) => (
                    <th key={h} className="px-2 py-2 text-left border-b">
                      {h}
                    </th>
                  ))}
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
                        key={r.id || globalIndex}
                        className={`border-t ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                        } hover:bg-indigo-50 transition-colors`}
                      >
                        <Cell>{globalIndex}</Cell>
                        <Cell>{r.for_008_emer_unid}</Cell>
                        <Cell>{r.for_008_emer_fech_aten}</Cell>
                        <Cell>{r.for_008_emer_tipo_docu_iden}</Cell>
                        <Cell>{r.for_008_emer_nume_iden}</Cell>
                        <Cell>{paciente}</Cell>
                        <Cell>{r.for_008_emer_sexo}</Cell>
                        <Cell>
                          {r.for_008_emer_edad != null
                            ? `${r.for_008_emer_edad} ${
                                r.for_008_emer_cond_edad || ""
                              }`
                            : "-"}
                        </Cell>
                        <Cell>{r.for_008_emer_naci}</Cell>
                        <Cell>{r.for_008_emer_etni}</Cell>
                        <Cell>{r.for_008_emer_grup_prio}</Cell>
                        <Cell>{r.for_008_emer_tipo_segu}</Cell>
                        <Cell>{r.for_008_emer_prov_resi}</Cell>
                        <Cell>{r.for_008_emer_cant_resi}</Cell>
                        <Cell>{r.for_008_emer_parr_resi}</Cell>
                        <Cell>{r.for_008_emer_espe_prof}</Cell>
                        <Cell>{r.for_008_emer_cie_10_prin}</Cell>
                        <Cell>{r.for_008_emer_diag_prin}</Cell>
                        <Cell>{r.for_008_emer_cond_diag}</Cell>
                        <Cell>{r.for_008_emer_cie_10_caus_exte}</Cell>
                        <Cell>{r.for_008_emer_diag_caus_exte}</Cell>
                        <Cell>{r.for_008_emer_hosp}</Cell>
                        <Cell>
                          {r.for_008_emer_hora_aten
                            ? r.for_008_emer_hora_aten.slice(0, 5)
                            : "-"}
                        </Cell>
                        <Cell>{r.for_008_emer_cond_alta}</Cell>
                        <Cell>{r.for_008_emer_obse}</Cell>
                        <Cell>
                          {r.for_008_emer_fech_repor
                            ? r.for_008_emer_fech_repor.split("T")[0]
                            : "-"}
                        </Cell>
                        <Cell>{r.for_008_emer_resp_aten_medi}</Cell>
                        <Cell>{r.for_008_emer_apoy_aten_medi}</Cell>
                        <Cell>{r.for_008_emer_edad_gest}</Cell>
                        <Cell>{r.for_008_emer_ries_obst}</Cell>
                        <Cell>{r.for_008_emer_unid_salu_resp_segu_aten}</Cell>
                        <Cell>{r.for_008_emer_dire_domi}</Cell>
                        <Cell>{r.for_008_emer_tele_paci}</Cell>
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
            {items.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-white">
                <div className="text-[11px] text-gray-600">
                  Página {safePage} de {totalPages}
                </div>
                <div className="flex items-center gap-1">
                  <PageBtn
                    onClick={() => goToPage(1)}
                    disabled={safePage === 1}
                  >
                    «
                  </PageBtn>
                  <PageBtn
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage === 1}
                  >
                    ‹
                  </PageBtn>
                  {buildPages().map((p, i) => (
                    <PageBtn
                      key={i + String(p)}
                      onClick={() => goToPage(p)}
                      disabled={p === "..."}
                      active={p === safePage}
                      ellipsis={p === "..."}
                    >
                      {p}
                    </PageBtn>
                  ))}
                  <PageBtn
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage === totalPages}
                  >
                    ›
                  </PageBtn>
                  <PageBtn
                    onClick={() => goToPage(totalPages)}
                    disabled={safePage === totalPages}
                  >
                    »
                  </PageBtn>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/* ===================== SUBCOMPONENTES REUTILIZABLES ===================== */
function EstadoMensajes({ error, successMessage }) {
  if (!error && !successMessage) return null;
  return (
    <div className="bg-white rounded-lg">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2">
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
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-2">
          <strong className="font-bold">¡Éxito! </strong>
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
    </div>
  );
}

EstadoMensajes.propTypes = {
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  successMessage: PropTypes.string,
};

function Alert({ type = "info", text }) {
  const color =
    type === "error"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-blue-50 text-blue-700 border-blue-200";
  return (
    <div className={`px-3 py-2 rounded-md border text-sm ${color}`}>{text}</div>
  );
}
Alert.propTypes = {
  type: PropTypes.string,
  text: PropTypes.string,
};

function EmptyInfo({ text }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-md border border-dashed border-gray-300 bg-gray-50 text-gray-600 text-sm">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 text-gray-500">
        !
      </span>
      {text}
    </div>
  );
}
EmptyInfo.propTypes = { text: PropTypes.string };

function InputDate({ label, value, onChange }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
    </div>
  );
}
InputDate.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

function Button({
  onClick,
  disabled,
  loading,
  text,
  loadingText = "Procesando...",
  color = "blue",
}) {
  const base =
    color === "emerald"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : "bg-blue-600 hover:bg-blue-700";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md ${base} text-white text-sm font-medium shadow disabled:opacity-60 disabled:cursor-not-allowed transition`}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {loading ? loadingText : text}
    </button>
  );
}
Button.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  text: PropTypes.string,
  loadingText: PropTypes.string,
  color: PropTypes.string,
};

function PageBtn({ children, onClick, disabled, active, ellipsis }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 h-8 text-xs rounded border ${
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white hover:bg-indigo-50"
      } ${ellipsis ? "cursor-default text-gray-400" : ""} disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
PageBtn.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  active: PropTypes.bool,
  ellipsis: PropTypes.bool,
};

function Cell({ children }) {
  return <td className="px-2 py-1">{children || "-"}</td>;
}
Cell.propTypes = { children: PropTypes.node };

/* ===================== TABLAS REPORTES ===================== */
function TablaReporteMensualUnidades({ rows }) {
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
            <th className="text-left px-2 py-2 border-b whitespace-nowrap">
              UNIDAD DE SALUD
            </th>
            <th className="text-left px-2 py-2 border-b whitespace-nowrap">
              PROFESIONAL MEDICO
            </th>
            <th className="text-left px-2 py-2 border-b whitespace-nowrap">
              INDICADOR
            </th>
            {MONTHS.map((m) => (
              <th
                key={m}
                className="text-center px-2 py-2 border-b whitespace-nowrap"
              >
                {m}
              </th>
            ))}
            <th className="text-center px-2 py-2 border-b whitespace-nowrap">
              TOTAL
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const totalDiag = Number(r?.total?.[0]) || 0;
            const totalPac = Number(r?.total?.[1]) || 0;
            return (
              <Fragment key={`${r.unidad_salud}-${r.medico}`}>
                <tr className="border-b">
                  <td className="px-2 py-2 align-top font-medium" rowSpan={2}>
                    {r.unidad_salud}
                  </td>
                  <td className="px-2 py-2 align-top font-medium" rowSpan={2}>
                    {r.medico}
                  </td>
                  <td className="px-2 py-2">Atenciones por diagnostico</td>
                  {MONTHS.map((m) => {
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
                <tr className="border-b">
                  <td className="px-2 py-2">Atenciones por paciente</td>
                  {MONTHS.map((m) => {
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
      medico: PropTypes.string,
      meses: PropTypes.object,
      total: PropTypes.array,
    })
  ).isRequired,
};

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
      <table className="w-full border-t text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-2 py-2 border-b">INDICADOR</th>
            <th className="text-center px-2 py-2 border-b">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
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
      total: PropTypes.array,
    })
  ).isRequired,
};

function TablaDiagnosticoTop({ rows }) {
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
            {[
              "#",
              "DIAGNÓSTICO",
              "HOMBRE",
              "MUJER",
              "INTERSEXUAL",
              "TOTAL",
            ].map((h) => (
              <th
                key={h}
                className={`px-3 py-2 border-b border-gray-200 ${
                  h === "DIAGNÓSTICO" || h === "#" ? "text-left" : "text-center"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.diagnostico + idx} className="border-b">
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
