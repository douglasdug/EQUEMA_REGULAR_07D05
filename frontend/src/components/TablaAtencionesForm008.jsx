import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { buscarAtencionesForm008 } from "../api/conexion.api"; // Ajusta la ruta si es diferente
import {
  CustomSelect,
  inputStyle,
  isFieldInvalid,
  buttonStylePrimario,
  buttonStyleSecundario,
} from "../components/EstilosCustom.jsx";
import { toast } from "react-hot-toast";

// Componente de ventana emergente con tabla de atenciones Form 008
const TablaAtencionesForm008 = ({
  setIdAdmision,
  setApellidosNombres,
  isOpen,
  onClose,
}) => {
  const [mes, setMes] = useState(() => (new Date().getMonth() + 1).toString());
  const [anio, setAnio] = useState(() => new Date().getFullYear().toString());
  const [data, setData] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pagina, setPagina] = useState(1);
  const registrosPorPagina = 10;

  const columnas = [
    { key: "for_008_emer_unic", label: "Código Único" },
    { key: "for_008_emer_unid", label: "Unidad" },
    { key: "for_008_emer_fech_aten", label: "Fecha Atención" },
    { key: "for_008_emer_hora_aten", label: "Hora Atención" },
    { key: "for_008_emer_cie_10_prin", label: "CIE10 Principal" },
    { key: "for_008_emer_diag_prin", label: "Diagnóstico Principal" },
    { key: "for_008_emer_cond_diag", label: "Condición Dx" },
    { key: "for_008_emer_cie_10_caus_exte", label: "CIE10 Causa Externa" },
    { key: "for_008_emer_diag_caus_exte", label: "Dx Causa Externa" },
    { key: "for_008_emer_hosp", label: "Hospitalizado" },
    { key: "for_008_emer_cond_alta", label: "Condición Alta" },
    { key: "for_008_emer_obse", label: "Observación" },
    { key: "for_008_emer_resp_aten_medi", label: "Responsable Médico" },
    { key: "for_008_emer_apoy_aten_medi", label: "Apoyo en la atención" },
  ];

  // Helper to extract message from object data
  const extractMessageFromData = (data) => {
    if (data.message) return data.message;
    if (data.error) return data.error;
    const firstKey = Object.keys(data)[0];
    const firstError = data[firstKey];
    if (Array.isArray(firstError) && firstError.length > 0)
      return firstError[0];
    if (typeof firstError === "string") return firstError;
    return JSON.stringify(data);
  };

  const getErrorMessage = (error) => {
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === "object" && data !== null) {
        return extractMessageFromData(data);
      } else if (typeof data === "string") {
        return data;
      }
    }
    if (error.request) return "No se recibió respuesta del servidor";
    if (error.message) return error.message;
    return "Error desconocido";
  };

  const cerrarAlEsc = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      setMes((new Date().getMonth() + 1).toString());
      setAnio(new Date().getFullYear().toString());
      setPagina(1);
      window.addEventListener("keydown", cerrarAlEsc);
    }
    return () => window.removeEventListener("keydown", cerrarAlEsc);
  }, [isOpen, cerrarAlEsc]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!mes || !anio) {
      setError("Ingrese mes y año.");
      return;
    }
    setCargando(true);
    try {
      const resp = await buscarAtencionesForm008(
        setIdAdmision,
        Number(mes),
        Number(anio)
      );
      let registros = [];
      if (Array.isArray(resp?.data)) {
        registros = resp.data;
      } else if (Array.isArray(resp)) {
        registros = resp;
      }
      setData(registros);
      setPagina(1);
      setSuccessMessage(resp.message || "Operación exitosa");
      setTimeout(() => setSuccessMessage(""), 10000);
      setError("");
      toast.success(resp.message || "Operación exitosa", {
        position: "bottom-right",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      setSuccessMessage("");
      toast.error(errorMessage, { position: "bottom-right" });
      setData([]);
    } finally {
      setCargando(false);
    }
  };

  const handleLimpiar = () => {
    setMes("");
    setAnio("");
    setData([]);
    setError("");
    setPagina(1);
  };

  // Paginación
  const totalPaginas = Math.ceil(data.length / registrosPorPagina);
  const datosPaginados = data.slice(
    (pagina - 1) * registrosPorPagina,
    pagina * registrosPorPagina
  );

  const EstadoMensajes = ({ error, successMessage }) => (
    <div className="bg-white rounded-lg shadow-md">
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2 animate-shake"
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
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-2 animate-fade-in"
          role="alert"
        >
          <strong className="font-bold">¡Éxito! </strong>
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  const fieldClass = "mb-1 flex flex-col";
  const labelClass = "block text-gray-700 text-sm font-bold mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-gradient-to-br via-white to-blue-200 backdrop-blur-sm p-10 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95rem] border border-gray-200 animate-fade-in">
        <div className="flex items-center justify-between px-3 py-2 border-b bg-gradient-to-r from-blue-600 to-blue-400 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {/* Lupa icon */}
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="21"
                y1="21"
                x2="16.65"
                y2="16.65"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Historial de Atenciones por Emergencia del paciente:{" "}
            <p className="text-2xl">{setApellidosNombres}</p>
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-200 transition text-lg font-bold rounded-full bg-red-500 hover:bg-red-600 p-2 shadow"
            title="Cerrar"
          >
            Cerrar ✕
          </button>
        </div>

        <div className="px-6 pt-6 pb-2 space-y-3">
          <form onSubmit={handleSubmit} className="w-full">
            <fieldset className="border border-blue-200 rounded p-2 mb-1">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Buscar por fecha de atención
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                <div className={fieldClass}>
                  <label className={labelClass} htmlFor="mes">
                    MES:
                  </label>
                  <input
                    id="mes"
                    name="mes"
                    type="number"
                    min="1"
                    max="12"
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    className={inputStyle}
                    placeholder="Mes"
                  />
                </div>
                <div className={fieldClass}>
                  <label className={labelClass} htmlFor="anio">
                    AÑO:
                  </label>
                  <input
                    id="anio"
                    name="anio"
                    type="number"
                    min="2020"
                    max="2100"
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className={inputStyle}
                    placeholder="Año"
                  />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <button
                    id="buscar"
                    name="buscar"
                    type="submit"
                    disabled={cargando}
                    className={`${buttonStylePrimario} bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg transition`}
                  >
                    {cargando ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                        Buscando...
                      </span>
                    ) : (
                      "Buscar"
                    )}
                  </button>
                  <button
                    id="limpiar"
                    name="limpiar"
                    type="button"
                    onClick={handleLimpiar}
                    className={`${buttonStyleSecundario} bg-gray-400 hover:bg-gray-500 text-gray-800 shadow transition`}
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </fieldset>
          </form>
          <EstadoMensajes error={error} successMessage={successMessage} />
          {!error && !cargando && data.length > 0 && (
            <span className="text-xs text-blue-700 font-semibold">
              {data.length} registro(s)
            </span>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="overflow-auto border rounded-xl max-h-[65vh] bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-inner">
            <table className="min-w-full text-xs">
              <thead className="bg-blue-100 text-blue-800 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-3 border text-left w-14 font-bold">
                    #
                  </th>
                  <th className="px-3 py-3 border text-left font-bold">
                    Acciones
                  </th>
                  {columnas
                    .filter((col) => col.key !== "for_008_emer_aten_fina")
                    .map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-3 border text-left font-bold"
                      >
                        {col.label}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {cargando && (
                  <tr>
                    <td
                      colSpan={2 + columnas.length - 1}
                      className="p-6 text-center text-blue-500 font-semibold"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5 text-blue-500"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                        Cargando...
                      </span>
                    </td>
                  </tr>
                )}
                {!cargando && datosPaginados.length === 0 && (
                  <tr>
                    <td
                      colSpan={2 + columnas.length - 1}
                      className="p-6 text-center text-gray-500"
                    >
                      Sin resultados
                    </td>
                  </tr>
                )}
                {!cargando &&
                  (() => {
                    // Agrupar filas por for_008_emer_aten_fina
                    const groupCols = [
                      "for_008_emer_unic",
                      "for_008_emer_unid",
                      "for_008_emer_fech_aten",
                      "for_008_emer_hora_aten",
                      "for_008_emer_resp_aten_medi",
                      "for_008_emer_apoy_aten_medi",
                    ];
                    let prevGroup = {};
                    let prevAtenFina = null;
                    return datosPaginados.map((row, idx) => {
                      const currAtenFina = row["for_008_emer_aten_fina"];
                      let showCols = {};
                      if (currAtenFina !== prevAtenFina) {
                        groupCols.forEach((col) => (showCols[col] = true));
                      } else {
                        groupCols.forEach((col) => {
                          showCols[col] = row[col] !== prevGroup[col];
                        });
                      }
                      prevGroup = {};
                      groupCols.forEach((col) => {
                        prevGroup[col] = row[col];
                      });
                      prevAtenFina = currAtenFina;

                      return (
                        <tr
                          key={row.id || idx}
                          className="hover:bg-blue-50 transition"
                        >
                          <td className="px-2 py-2 border text-gray-500 font-semibold">
                            {(pagina - 1) * registrosPorPagina + idx + 1}
                          </td>
                          <td className="px-3 py-2 border align-top max-w-xs text-center">
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver detalles"
                              // Aquí puedes agregar tu lógica de acción
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 inline"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                {/* Lupa icon */}
                                <circle
                                  cx="11"
                                  cy="11"
                                  r="8"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                                <line
                                  x1="21"
                                  y1="21"
                                  x2="16.65"
                                  y2="16.65"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </button>
                          </td>
                          {columnas
                            .filter(
                              (col) => col.key !== "for_008_emer_aten_fina"
                            )
                            .map((col) => {
                              let valor = row[col.key];
                              if (
                                col.key === "for_008_emer_fech_aten" &&
                                valor
                              ) {
                                try {
                                  valor = new Date(valor).toLocaleDateString();
                                } catch {
                                  /* noop */
                                }
                              }
                              if (
                                groupCols.includes(col.key) &&
                                !showCols[col.key]
                              ) {
                                return (
                                  <td
                                    key={col.key}
                                    className="px-3 py-2 border align-top max-w-xs"
                                  ></td>
                                );
                              }
                              return (
                                <td
                                  key={col.key}
                                  className="px-3 py-2 border align-top max-w-xs"
                                >
                                  <div className="truncate" title={valor ?? ""}>
                                    {valor ?? ""}
                                  </div>
                                </td>
                              );
                            })}
                        </tr>
                      );
                    });
                  })()}
              </tbody>
            </table>
          </div>
          {/* Paginación */}
          {data.length > registrosPorPagina && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-gray-600">
                Página {pagina} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="px-3 py-1 rounded-lg bg-blue-200 hover:bg-blue-300 text-blue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPagina(i + 1)}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      pagina === i + 1
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setPagina((p) => Math.min(totalPaginas, p + 1))
                  }
                  disabled={pagina === totalPaginas}
                  className="px-3 py-1 rounded-lg bg-blue-200 hover:bg-blue-300 text-blue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
TablaAtencionesForm008.propTypes = {
  setIdAdmision: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setApellidosNombres: PropTypes.oneOfType([PropTypes.string]),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TablaAtencionesForm008;
