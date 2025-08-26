import React, { useState, useEffect, useCallback, useMemo } from "react";
import { busquedaAvanzadaAdmisionados } from "../api/conexion.api.js";
import {
  inputStyle,
  buttonStylePrimario,
  buttonStyleSecundario,
  buttonStyleEliminar,
} from "../components/EstilosCustom.jsx";
import { toast } from "react-hot-toast";

// /src/components/BuscarAdmisionados.jsx

const PAGE_SIZE = 10;

const initialState = {
  apellidos: "",
  nombres: "",
  message: "",
  cantidad: 0,
  resultados: [],
};

function BuscarAdmisionados({
  inModal = false,
  onClose = () => {},
  onSelect = () => {},
}) {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [page, setPage] = useState(1);
  const [touched, setTouched] = useState(false);
  const [tablaFiltro, setTablaFiltro] = useState("");

  const { apellidos, nombres } = formData;
  const disableBuscar = !apellidos.trim() && !nombres.trim();

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

  const fetchData = useCallback(async ({ apellidosParam, nombresParam }) => {
    setLoading(true);
    setError("");
    try {
      const response = await busquedaAvanzadaAdmisionados(
        apellidosParam.trim(),
        nombresParam.trim()
      );
      // Se asume que response ya es el JSON mostrado; ajustar si la API responde distinto
      setFormData((prev) => ({
        ...prev,
        ...(response || {}),
        apellidos: prev.apellidos,
        nombres: prev.nombres,
      }));
      setPage(1);
      const message =
        response?.message || "Se encontro resultado de la busqueda!";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 10000);
      toast.success(message, { position: "bottom-right" });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      toast.error(errorMessage, { position: "bottom-right" });
      setFormData((prev) => ({
        ...initialState,
        apellidos: prev.apellidos,
        nombres: prev.nombres,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (disableBuscar) return;
    fetchData({
      apellidosParam: formData.apellidos,
      nombresParam: formData.nombres,
    });
  };

  const limpiarVariables = () => {
    setFormData(initialState);
    setError("");
    setPage(1);
    setTouched(false);
    setTablaFiltro("");
  };

  const resultados = formData.resultados || [];
  // Filtrado local de la tabla
  const resultadosFiltrados = useMemo(() => {
    if (!tablaFiltro.trim()) return resultados;
    const term = tablaFiltro.trim().toUpperCase();
    return resultados.filter((r) => {
      const tipo = (r.adm_dato_pers_tipo_iden ?? "").toUpperCase();
      const num = (r.adm_dato_pers_nume_iden ?? "").toUpperCase();
      const ap1 = (r.adm_dato_pers_apel_prim ?? "").toUpperCase();
      const ap2 = (r.adm_dato_pers_apel_segu ?? "").toUpperCase();
      const no1 = (r.adm_dato_pers_nomb_prim ?? "").toUpperCase();
      const no2 = (r.adm_dato_pers_nomb_segu ?? "").toUpperCase();
      const full = [ap1, ap2, no1, no2]
        .filter(Boolean)
        .join(" ")
        .replace(/\s{2,}/g, " ")
        .trim();
      return tipo.includes(term) || num.includes(term) || full.includes(term);
    });
  }, [resultados, tablaFiltro]);

  const totalPages = Math.max(
    1,
    Math.ceil(resultadosFiltrados.length / PAGE_SIZE)
  );

  const paginated = useMemo(
    () =>
      resultadosFiltrados.slice(
        (page - 1) * PAGE_SIZE,
        (page - 1) * PAGE_SIZE + PAGE_SIZE
      ),
    [resultadosFiltrados, page]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    let cleaned = value
      .replace(/[\r\n]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .toUpperCase();
    if (name === "apellidos" || name === "nombres") {
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  // Accesibilidad: navegar con Enter desde inputs
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handleGlobalKey = useCallback(
    (e) => {
      if (e.key === "Escape") {
        if (apellidos || nombres) {
          limpiarVariables();
        } else if (inModal) {
          onClose();
        }
      }
    },
    [apellidos, nombres, inModal, onClose]
  );

  useEffect(() => {
    if (inModal) {
      window.addEventListener("keydown", handleGlobalKey);
      return () => window.removeEventListener("keydown", handleGlobalKey);
    }
  }, [handleGlobalKey, inModal]);

  const highlight = (text) => {
    const term = (formData.apellidos + " " + formData.nombres).trim();
    if (!term) return text;
    try {
      const regex = new RegExp(
        "(" +
          term
            .split(/\s+/)
            .filter(Boolean)
            .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("|") +
          ")",
        "gi"
      );
      return text.split(regex).map((frag, i) =>
        regex.test(frag) ? (
          <mark key={i} className="bg-yellow-200 text-slate-900 rounded px-0.5">
            {frag}
          </mark>
        ) : (
          <span key={i}>{frag}</span>
        )
      );
    } catch {
      return text;
    }
  };

  // Resalta coincidencia del filtro de tabla (independiente del de apellidos/nombres)
  const highlightFiltro = (text) => {
    if (!tablaFiltro.trim()) return text;
    try {
      const term = tablaFiltro.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${term})`, "gi");
      return text.split(regex).map((frag, i) =>
        regex.test(frag) ? (
          <mark key={i} className="bg-green-200 text-slate-900 rounded px-0.5">
            {frag}
          </mark>
        ) : (
          <span key={i}>{frag}</span>
        )
      );
    } catch {
      return text;
    }
  };

  const handleTablaFiltroChange = (e) => {
    let v = e.target.value.toUpperCase();
    v = v.replace(/[^A-Z0-9 ]+/g, "");
    v = v.replace(/\s+/g, " ");
    v = v.replace(/^ /, "");
    setPage(1);
    setTablaFiltro(v);
  };

  const buildFullName = (row) =>
    [
      row.adm_dato_pers_apel_prim,
      row.adm_dato_pers_apel_segu,
      row.adm_dato_pers_nomb_prim,
      row.adm_dato_pers_nomb_segu,
    ]
      .map((p) => (p || "").toString().trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim();

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
    <div
      className={
        inModal
          ? "w-full h-full flex flex-col"
          : "w-full px-4 py-6 mx-auto max-w-7xl"
      }
    >
      <div
        className={`${
          inModal
            ? "bg-white rounded-t-lg shadow px-4 py-3 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10"
            : "hidden"
        }`}
      >
        <h2 className="text-sm font-semibold text-slate-700 tracking-wide">
          Búsqueda de Pacientes
        </h2>
        <div className="flex items-center gap-2">
          {loading && (
            <span
              className="inline-block h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"
              aria-label="Cargando"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400/40"
            aria-label="Cerrar buscador"
          >
            ✕
          </button>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className={`w-full bg-white ${
          inModal
            ? "rounded-none border-0 shadow-none"
            : "rounded-lg shadow border border-slate-200"
        } p-4 md:p-5 space-y-3`}
        role="search"
        aria-label="Buscar pacientes"
      >
        <fieldset className="border border-blue-200 rounded p-2 mb-1">
          <legend className="text-lg font-semibold text-blue-600 px-2">
            Búsqueda Avanzada de Pacientes
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={fieldClass}>
              <label htmlFor="apellidos" className={labelClass}>
                Apellidos
              </label>
              <input
                id="apellidos"
                name="apellidos"
                type="text"
                placeholder="Ej: PEREZ LOPEZ"
                value={formData.apellidos}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className={`${inputStyle} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 bg-white`}
              />
            </div>
            <div className={fieldClass}>
              <label htmlFor="nombres" className={labelClass}>
                Nombres
              </label>
              <div className="flex w-full gap-1 mb-1">
                <input
                  id="nombres"
                  name="nombres"
                  type="text"
                  placeholder="Ej: JUAN CARLOS"
                  value={formData.nombres}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className={`${"flex-1"} ${inputStyle} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 bg-white`}
                />
                <button
                  type="submit"
                  disabled={disableBuscar || loading}
                  className={`${buttonStyleSecundario} inline-flex items-center transition focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    disableBuscar || loading
                      ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {loading && (
                    <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Buscar
                </button>
                <button
                  type="button"
                  onClick={limpiarVariables}
                  disabled={loading}
                  className={`${buttonStyleSecundario} inline-flex items-center hover:bg-blue-300 disabled:opacity-60 focus:ring-2 focus:ring-slate-400/40`}
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
          <p className="text-[12px] text-black">
            Para realizar la búsqueda tiene que ingresar un APELLIDO o NOMBRE
            con al menos tres caracteres como mínimo.
          </p>
        </fieldset>
      </form>
      <div
        className={`${
          inModal
            ? "flex-1 overflow-y-auto p-4 bg-white rounded-b-lg border-t border-slate-200"
            : "mt-6"
        }`}
        aria-live="polite"
      >
        {loading && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded bg-slate-100"
              />
            ))}
          </div>
        )}
        {!loading &&
          !error &&
          resultados.length === 0 &&
          touched &&
          !disableBuscar && (
            <div className="text-sm text-slate-600">
              No se encontraron registros para los criterios proporcionados.
            </div>
          )}
        {!loading && resultados.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <span className="font-medium text-slate-700">
                      {formData.message}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                      {formData.cantidad}
                    </span>
                  </span>
                  <span className="italic">
                    Mostrando {paginated.length} / {resultadosFiltrados.length}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-72">
                <input
                  type="text"
                  value={tablaFiltro}
                  onChange={handleTablaFiltroChange}
                  placeholder="Filtrar en la tabla..."
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
                  aria-label="Filtrar resultados en tabla"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                />
                {tablaFiltro && (
                  <button
                    type="button"
                    onClick={() => {
                      setTablaFiltro("");
                      setPage(1);
                    }}
                    className="px-2 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600"
                    title="Limpiar filtro"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
              <table
                className="min-w-full divide-y divide-slate-200 text-sm"
                aria-busy={loading ? "true" : "false"}
              >
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <Th>Opciones</Th>
                    <Th>Tipo Identificación</Th>
                    <Th>Número Identificación</Th>
                    <Th>Apellidos y Nombres</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((row) => {
                    const fullName = buildFullName(row);
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-blue-50/50 focus-within:bg-blue-50 even:bg-slate-50/40"
                      >
                        <Td>
                          <button
                            type="button"
                            id={`btnVerDetalle${row.id}`}
                            name={`btnVerDetalle${row.id}`}
                            onClick={() => {
                              onSelect(row);
                              if (inModal) onClose();
                            }}
                            className="p-1 rounded-md text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="Ver detalles"
                            aria-label={`Ver detalles de ${fullName}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10.5 3.75a6.75 6.75 0 0 1 5.17 11.142l4.17 4.168a.75.75 0 1 1-1.06 1.06l-4.168-4.17A6.75 6.75 0 1 1 10.5 3.75Zm0 1.5a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </Td>
                        <Td>
                          {highlightFiltro(row.adm_dato_pers_tipo_iden ?? "")}
                        </Td>
                        <Td className="font-bold">
                          {highlightFiltro(row.adm_dato_pers_nume_iden ?? "")}
                        </Td>
                        <Td>
                          {highlightFiltro(
                            highlight(fullName).props
                              ? fullName // si highlight devuelve nodos complejos, aplicamos filtro a texto plano
                              : fullName
                          )}
                          {/* Si quieres combinar ambos resaltados simultáneamente podrías refactorizar */}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={handlePageChange}
            />
          </div>
        )}
      </div>
      <EstadoMensajes error={error} successMessage={successMessage} />
    </div>
  );
}

function Th({ children }) {
  return (
    <th
      scope="col"
      className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`px-3 py-2 whitespace-nowrap text-slate-700 ${className}`}>
      {children}
    </td>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }

  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Paginación">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1 text-xs rounded-md border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-100"
      >
        Anterior
      </button>
      {start > 1 && (
        <>
          <PageButton
            number={1}
            active={page === 1}
            onClick={() => onChange(1)}
          />
          {start > 2 && (
            <span className="px-1 text-xs text-slate-500">...</span>
          )}
        </>
      )}
      {pages.map((n) => (
        <PageButton
          key={n}
          number={n}
          active={n === page}
          onClick={() => onChange(n)}
        />
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="px-1 text-xs text-slate-500">...</span>
          )}
          <PageButton
            number={totalPages}
            active={page === totalPages}
            onClick={() => onChange(totalPages)}
          />
        </>
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1 text-xs rounded-md border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-100"
      >
        Siguiente
      </button>
      <span className="text-xs text-slate-600 ml-2">
        Página {page} de {totalPages}
      </span>
    </nav>
  );
}

function PageButton({ number, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`min-w-[2rem] px-2 py-1 text-xs rounded-md border transition ${
        active
          ? "bg-blue-600 border-blue-600 text-white"
          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {number}
    </button>
  );
}

export default BuscarAdmisionados;
