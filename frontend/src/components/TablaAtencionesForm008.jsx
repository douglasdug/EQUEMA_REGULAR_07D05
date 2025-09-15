import React, { useState, useEffect, useCallback } from "react";
import { buscarAtencionesForm008 } from "../api/conexion.api"; // Ajusta la ruta si es diferente

// Componente de ventana emergente con tabla de atenciones Form 008
const TablaAtencionesForm008 = ({ isOpen, onClose }) => {
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState("");
  const [data, setData] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

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
  ];

  const cerrarAlEsc = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", cerrarAlEsc);
    }
    return () => window.removeEventListener("keydown", cerrarAlEsc);
  }, [isOpen, cerrarAlEsc]);

  const handleBuscar = async () => {
    setError(null);
    if (!mes || !anio) {
      setError("Ingrese mes y año.");
      return;
    }
    setCargando(true);
    try {
      // Ajusta la firma si tu API requiere otros parámetros
      const resp = await buscarAtencionesForm008({
        mes: Number(mes),
        anio: Number(anio),
      });
      // Suponiendo que resp.data es el arreglo:
      const registros = Array.isArray(resp?.data)
        ? resp.data
        : Array.isArray(resp)
        ? resp
        : [];
      setData(registros);
    } catch (e) {
      setError(e.message || "Error al buscar.");
      setData([]);
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95rem] border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-700">
            Atenciones Formulario 008
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition text-sm font-medium"
          >
            Cerrar ✕
          </button>
        </div>

        <div className="px-4 pt-4 pb-2 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600">
                Mes (1-12)
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-28 focus:outline-none focus:ring focus:ring-blue-300"
                placeholder="Mes"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600">Año</label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring focus:ring-blue-300"
                placeholder="Año"
              />
            </div>
            <button
              onClick={handleBuscar}
              disabled={cargando}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium shadow"
            >
              {cargando ? "Buscando..." : "Buscar"}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
            {!error && !cargando && data.length > 0 && (
              <span className="text-xs text-gray-500">
                {data.length} registro(s)
              </span>
            )}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="overflow-auto border rounded-lg max-h-[65vh]">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-100 text-gray-700 sticky top-0">
                <tr>
                  <th className="px-2 py-2 border text-left w-14">#</th>
                  {columnas.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2 border text-left font-medium"
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
                      colSpan={1 + columnas.length}
                      className="p-4 text-center text-gray-500"
                    >
                      Cargando...
                    </td>
                  </tr>
                )}
                {!cargando && data.length === 0 && (
                  <tr>
                    <td
                      colSpan={1 + columnas.length}
                      className="p-4 text-center text-gray-500"
                    >
                      Sin resultados
                    </td>
                  </tr>
                )}
                {!cargando &&
                  data.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-blue-50">
                      <td className="px-2 py-1 border text-gray-500">
                        {idx + 1}
                      </td>
                      {columnas.map((col) => {
                        let valor = row[col.key];
                        if (col.key === "for_008_emer_fech_aten" && valor) {
                          try {
                            valor = new Date(valor).toLocaleDateString();
                          } catch {
                            /* noop */
                          }
                        }
                        return (
                          <td
                            key={col.key}
                            className="px-3 py-1 border align-top max-w-xs"
                          >
                            <div className="truncate" title={valor ?? ""}>
                              {valor ?? ""}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablaAtencionesForm008;
