import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
  listarForm008EmerAtenciones,
  deleteUser,
} from "../api/conexion.api.js";
import { toast } from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa";

const TablaForm008Emer = ({
  setFormData,
  setVariableEstado,
  setBotonEstado,
  setIsEditing,
  setIsLoading,
  setSuccessMessage,
  setError,
  refreshTable,
}) => {
  const [eniUsers, setEniUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCards, setExpandedCards] = useState({});
  const rowsPerPage = 10;

  const getErrorMessage = (error) => {
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === "object" && data !== null) {
        if (data.message) return data.message;
        if (data.error) return data.error;
        const firstKey = Object.keys(data)[0];
        const firstError = data[firstKey];
        if (Array.isArray(firstError) && firstError.length > 0)
          return firstError[0];
        if (typeof firstError === "string") return firstError;
        return JSON.stringify(data);
      } else if (typeof data === "string") return data;
    } else if (error.request) return "No se recibió respuesta del servidor";
    else if (error.message) return error.message;
    return "Error desconocido";
  };

  useEffect(() => {
    const loadEniUsers = async () => {
      try {
        const data = await listarForm008EmerAtenciones();
        setEniUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        setError(error.message);
        setTimeout(() => setError(""), 8000);
      }
    };
    loadEniUsers();
  }, [setError, refreshTable]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const totalPages = useMemo(
    () => Math.ceil(eniUsers.length / rowsPerPage),
    [eniUsers.length]
  );
  const currentRows = useMemo(
    () =>
      Array.isArray(eniUsers)
        ? eniUsers.slice(indexOfFirstRow, indexOfLastRow)
        : [],
    [eniUsers, indexOfFirstRow, indexOfLastRow]
  );

  const handleEdit = (id) => {
    // const user = eniUsers.find((user) => user.id === id);
    // if (user) {
    //   const funAdmiRol = getFunAdmiRol(user.fun_admi_rol);
    //   setFormData(getFormData(user, funAdmiRol));
    //   setVariableEstado(getVariableEstado());
    //   setBotonEstado({ btnBuscar: true });
    //   setIsEditing(true);
    // }
  };

  const handleDelete = async (id) => {
    // const user = eniUsers.find((user) => user.id === id);
    // if (user) {
    //   if (!confirmDelete(user)) return;
    //   setIsLoading(true);
    //   try {
    //     await deleteUserAndUpdateState(user.username, id);
    //   } catch (error) {
    //     handleDeleteError(error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // }
  };

  const confirmDelete = (user) =>
    window.confirm(
      `¿Estás seguro de que deseas eliminar este registro?\n\nIdentificación: ${user.username}\nNombres: ${user.last_name} ${user.first_name}`
    );

  const deleteUserAndUpdateState = async (username, id) => {
    const response = await deleteUser(username);
    setSuccessMessage("Registro eliminado con éxito!");
    setTimeout(() => setSuccessMessage(""), 10000);
    toast.success(response.message || "Registro eliminado con éxito!", {
      position: "bottom-right",
    });
    setEniUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleDeleteError = (error) => {
    const errorMessage = getErrorMessage(error);
    setError(errorMessage);
    setTimeout(() => setError(""), 10000);
    setSuccessMessage("");
    toast.error(errorMessage, { position: "bottom-right" });
  };

  const getFunAdmiRol = (fun_admi_rol) =>
    fun_admi_rol >= 1 && fun_admi_rol <= 4 ? fun_admi_rol : 0;

  const getFormData = (user, funAdmiRol) => ({
    fun_tipo_iden: user.fun_tipo_iden || "",
    username: user.username || "",
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    fun_sex: user.fun_sex || "",
    email: user.email || "",
    fun_titu: user.fun_titu || "",
    password1: user.password || "",
    password2: user.password || "",
    fun_admi_rol: funAdmiRol || "",
    uni_unic: Array.isArray(user.unidades_salud_detalle)
      ? user.unidades_salud_detalle.map((item) =>
          typeof item === "object" && item !== null
            ? {
                value: item.id || item.uni_unic,
                label: `${item.uni_unic} - ${item.uni_unid}`.trim(),
              }
            : { value: item, label: item }
        )
      : [],
    fun_esta: user.fun_esta === 1 ? 1 : 0,
  });

  const getVariableEstado = () => ({
    fun_tipo_iden: true,
    username: true,
    first_name: true,
    last_name: true,
    fun_sex: false,
    email: false,
    fun_titu: false,
    password1: true,
    password2: true,
    fun_admi_rol: false,
    uni_unic: false,
    fun_esta: false,
  });

  // Estilos y helpers
  const tableStyles = {
    container:
      "relative overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white ring-1 ring-gray-100",
    scrollWrap:
      "overflow-x-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent hover:scrollbar-thumb-blue-400",
    table:
      "w-full table-auto border-collapse text-xs md:text-sm min-w-[140rem] [&_th]:whitespace-nowrap",
    thead:
      "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white shadow-sm",
    th: "px-2 py-2.5 text-left font-semibold uppercase tracking-wide text-[10px] md:text-xs border-r border-blue-400 last:border-none sticky top-0 backdrop-blur bg-opacity-90",
    tbody: "divide-y divide-gray-100",
    td: "px-1 py-1 align-top text-gray-700 border-r border-gray-100 last:border-none max-w-[220px] truncate",
    actionCol:
      "px-1 py-1 text-center sticky left-0 bg-white/95 backdrop-blur border-r border-gray-200 z-10",
    trHover: "odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors",
    actionBtn:
      "inline-flex items-center justify-center h-8 w-8 rounded-md border border-transparent bg-white text-blue-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1",
    deleteBtn:
      "inline-flex items-center justify-center h-8 w-8 rounded-md border border-transparent bg-white text-red-600 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1",
    badge:
      "inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700",
  };

  const excludedKeys = new Set([
    "id",
    "for_008_emer_inst_sist",
    "for_008_emer_zona",
    "for_008_emer_prov",
    "for_008_emer_cant",
    "for_008_emer_dist",
    "for_008_emer_nive",
    "for_008_emer_aten_fina",
    "admision_datos",
    "eniUser",
  ]);

  const prettyLabel = (k) =>
    k
      .replace(/^for_008_emer_/i, "")
      .replace(/_/g, " ")
      .replace(/\b(\w)/g, (m) => m.toUpperCase());

  const toggleExpand = (id) =>
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="mt-2 space-y-1">
      <div className="flex flex-col gap-1 px-1 sm:px-1.5 md:px-3 lg:px-4 py-2">
        <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Listado de Atenciones de Emergencia (últimas 30)
        </h3>
      </div>

      {/* Tabla (desktop / md+) */}
      <div className="hidden md:block">
        <div className={`${tableStyles.container} mx-2 md:mx-2`}>
          <div className={tableStyles.scrollWrap}>
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th
                    className={`${tableStyles.th} sticky left-0 z-20 bg-blue-600/95 backdrop-blur`}
                  >
                    Acciones
                  </th>
                  {Object.keys(
                    eniUsers[0] || { UNICODIGO: "", NOMBRE: "" } // fallback para encabezados si vacío
                  )
                    .filter((key) => !excludedKeys.has(key))
                    .map((key) => (
                      <th
                        key={key}
                        className={tableStyles.th}
                        title={prettyLabel(key)}
                      >
                        {prettyLabel(key)}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {currentRows.map((registro) => {
                  const keys = Object.keys(registro).filter(
                    (k) => !excludedKeys.has(k)
                  );
                  return (
                    <tr key={registro.id} className={tableStyles.trHover}>
                      <td className={tableStyles.actionCol}>
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            className={tableStyles.actionBtn}
                            aria-label="Editar"
                            onClick={() => handleEdit(registro.id)}
                            title="Editar registro"
                          >
                            <FaEdit size={16} />
                          </button>
                          {/* <button
                            className={tableStyles.deleteBtn}
                            aria-label="Eliminar"
                            onClick={() => handleDelete(registro.id)}
                            title="Eliminar registro"
                          >
                            <FaTrash size={16} />
                          </button> */}
                        </div>
                      </td>
                      {keys.map((key) => {
                        let content;
                        if (key === "for_008_emer_fech_repor") {
                          let fecha = "";
                          let hora = "";
                          if (registro[key]) {
                            const [f, h] = registro[key].split("T");
                            if (f) {
                              const [y, m, d] = f.split("-");
                              fecha = `${d}/${m}/${y}`;
                            }
                            if (h) hora = h.substring(0, 5);
                          }
                          content = (
                            <span className="flex flex-col">
                              <span className="font-medium">{fecha}</span>
                              <span className="text-[10px] text-gray-500">
                                {hora}
                              </span>
                            </span>
                          );
                        } else if (
                          [
                            "for_008_emer_dire_domi",
                            "for_008_emer_obse",
                          ].includes(key)
                        ) {
                          content = (
                            <span
                              className="block max-w-[220px] truncate"
                              title={registro[key] || ""}
                            >
                              {registro[key]}
                            </span>
                          );
                        } else if (["for_008_emer_edad_gest"].includes(key)) {
                          content = (
                            <span
                              className="number font-mono"
                              title={registro[key] || ""}
                            >
                              {registro[key]}
                            </span>
                          );
                        } else {
                          content =
                            typeof registro[key] === "object"
                              ? JSON.stringify(registro[key])
                              : registro[key];
                        }
                        return (
                          <td
                            key={key}
                            className={tableStyles.td}
                            title={String(content)}
                          >
                            {content === "" ||
                            content === null ||
                            content === undefined ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              content
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {currentRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={50}
                      className="py-10 text-center text-sm text-gray-500 font-medium"
                    >
                      No hay registros para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <div
              className="text-xs font-medium text-gray-600"
              aria-live="polite"
            >
              Página <span className="text-gray-900">{currentPage}</span> de{" "}
              <span className="text-gray-900">{totalPages || 1}</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map(
                (n) => (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={`h-7 w-7 text-[11px] rounded-md border transition ${
                      n === currentPage
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-blue-50"
                    }`}
                  >
                    {n}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vista móvil (cards) */}
      <div className="md:hidden space-y-4">
        {currentRows.length === 0 && (
          <div className="p-6 rounded-lg border border-dashed border-gray-300 text-center text-sm text-gray-500 bg-white">
            No hay registros disponibles.
          </div>
        )}
        {currentRows.map((registro) => {
          const keys = Object.keys(registro).filter(
            (k) => !excludedKeys.has(k)
          );
          const primary = keys.slice(0, 6);
          const isExpanded = expandedCards[registro.id];
          return (
            <div
              key={registro.id}
              className="relative rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500" />
              <div className="p-4 pt-5 space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <h4 className="text-sm font-semibold text-gray-800">
                    Registro #{registro.id}
                  </h4>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(registro.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-blue-600 hover:bg-blue-50"
                      aria-label="Editar"
                    >
                      <FaEdit size={15} />
                    </button>
                    {/* <button
                      onClick={() => handleDelete(registro.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-red-600 hover:bg-red-50"
                      aria-label="Eliminar"
                    >
                      <FaTrash size={15} />
                    </button> */}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {primary.map((k) => (
                    <div key={k} className="space-y-0.5">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                        {prettyLabel(k)}
                      </p>
                      <p className="text-xs text-gray-800 break-words">
                        {k === "for_008_emer_fech_repor" && registro[k]
                          ? (() => {
                              const [f, h] = registro[k].split("T");
                              const [y, m, d] = f.split("-");
                              return `${d}/${m}/${y} ${h.substring(0, 5)}`;
                            })()
                          : registro[k] === "" || registro[k] === null
                          ? "—"
                          : typeof registro[k] === "object"
                          ? JSON.stringify(registro[k])
                          : registro[k]}
                      </p>
                    </div>
                  ))}
                </div>
                {isExpanded && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      {keys.slice(6).map((k) => (
                        <div key={k} className="space-y-0.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                            {prettyLabel(k)}
                          </p>
                          <p className="text-xs text-gray-800 break-words">
                            {k === "for_008_emer_fech_repor" && registro[k]
                              ? (() => {
                                  const [f, h] = registro[k].split("T");
                                  const [y, m, d] = f.split("-");
                                  return `${d}/${m}/${y} ${h.substring(0, 5)}`;
                                })()
                              : registro[k] === "" || registro[k] === null
                              ? "—"
                              : typeof registro[k] === "object"
                              ? JSON.stringify(registro[k])
                              : registro[k]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {keys.length > 6 && (
                  <button
                    onClick={() => toggleExpand(registro.id)}
                    className="w-full mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
                  >
                    {isExpanded ? "Ver menos ▲" : "Ver más ▼"}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Paginación móvil */}
        {currentRows.length > 0 && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <div className="flex gap-1 flex-wrap justify-center">
              {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map(
                (n) => (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={`h-7 px-2 text-[11px] rounded-md border ${
                      n === currentPage
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-blue-50"
                    }`}
                  >
                    {n}
                  </button>
                )
              )}
            </div>
            <p className="text-[11px] text-gray-500">
              Página {currentPage} de {totalPages || 1}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
TablaForm008Emer.propTypes = {
  setFormData: PropTypes.func.isRequired,
  setVariableEstado: PropTypes.func.isRequired,
  setBotonEstado: PropTypes.func.isRequired,
  setIsEditing: PropTypes.func.isRequired,
  setIsLoading: PropTypes.func.isRequired,
  setSuccessMessage: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  refreshTable: PropTypes.number,
};

export default TablaForm008Emer;
