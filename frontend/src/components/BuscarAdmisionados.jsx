import React, { useState, useEffect, useCallback, useMemo } from "react";
import { busquedaAvanzadaAdmisionados } from "../api/conexion.api.js";
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

function BuscarAdmisionados() {
  const [apellidos, setApellidos] = useState("");
  const [nombres, setNombres] = useState("");
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [page, setPage] = useState(1);
  const [touched, setTouched] = useState(false);

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
      setData(response || initialState);
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
      setData(initialState);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (disableBuscar) return;
    fetchData({ apellidosParam: apellidos, nombresParam: nombres });
  };

  const limpiarVariables = () => {
    setApellidos("");
    setNombres("");
    setData(initialState);
    setError("");
    setPage(1);
    setTouched(false);
  };

  const resultados = data.resultados || [];
  const totalPages = Math.max(1, Math.ceil(resultados.length / PAGE_SIZE));

  const paginated = useMemo(
    () =>
      resultados.slice(
        (page - 1) * PAGE_SIZE,
        (page - 1) * PAGE_SIZE + PAGE_SIZE
      ),
    [resultados, page]
  );

  const handleChangeApellidos = (e) => {
    setApellidos(e.target.value.toUpperCase());
  };
  const handleChangeNombres = (e) => {
    setNombres(e.target.value.toUpperCase());
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
    <div className="w-full px-4 py-6 mx-auto max-w-7xl">
      <h1 className="text-2xl font-semibold text-slate-800 mb-4">
        Búsqueda Avanzada de Pacientes
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4 border border-slate-200"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col">
            <label
              htmlFor="apellidos"
              className="text-sm font-medium text-slate-700 mb-1"
            >
              Apellidos
            </label>
            <input
              id="apellidos"
              name="apellidos"
              type="text"
              placeholder="Ej: PEREZ LOPEZ"
              value={apellidos}
              onChange={handleChangeApellidos}
              onKeyDown={handleKeyDown}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="nombres"
              className="text-sm font-medium text-slate-700 mb-1"
            >
              Nombres
            </label>
            <input
              id="nombres"
              name="nombres"
              type="text"
              placeholder="Ej: JUAN CARLOS"
              value={nombres}
              onChange={handleChangeNombres}
              onKeyDown={handleKeyDown}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={disableBuscar || loading}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition
                                                    ${
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
            className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-60"
          >
            Limpiar
          </button>
        </div>

        {touched && disableBuscar && (
          <p className="text-xs text-red-600">
            Ingrese al menos un apellido o nombre para buscar.
          </p>
        )}
      </form>

      <div className="mt-6">
        <EstadoMensajes error={error} successMessage={successMessage} />

        {loading && (
          <div className="flex items-center gap-3 text-slate-600 text-sm">
            <span className="inline-block h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Cargando resultados...
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
            <div className="text-sm text-slate-700">
              {data.message} (Mostrando {paginated.length} de {data.cantidad})
            </div>

            <div className="table-auto overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Opciones</Th>
                    <Th>Tipo Identificación</Th>
                    <Th>Número Identificación</Th>
                    <Th>Apellidos y Nombres</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((row) => {
                    const apels = `${row.adm_dato_pers_apel_prim ?? ""} ${
                      row.adm_dato_pers_apel_segu ?? ""
                    }`.trim();
                    const noms = `${row.adm_dato_pers_nomb_prim ?? ""} ${
                      row.adm_dato_pers_nomb_segu ?? ""
                    }`.trim();
                    const fullName = `${apels} ${noms}`.trim();
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-blue-50/50 focus-within:bg-blue-50"
                      >
                        <Td>
                          <button
                            type="button"
                            onClick={() => console.log("Ver paciente", row)}
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
                        <Td>{row.adm_dato_pers_tipo_iden}</Td>
                        <Td className="font-mono">
                          {row.adm_dato_pers_nume_iden}
                        </Td>
                        <Td>{fullName}</Td>
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
