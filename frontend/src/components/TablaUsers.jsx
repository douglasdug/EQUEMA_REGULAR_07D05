import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { getAllEniUsers, deleteUser } from "../api/conexion.api.js";
import { toast } from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa";

const TablaUsers = ({
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
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const ROLE_NAMES = ["", "ADMINISTRADOR", "REPORTE", "MEDICO", "VACUNADOR"];
  const STATUS_NAMES = ["INACTIVO", "ACTIVO"];
  const TABLE_HEADERS = [
    "Tipo de Identificacion",
    "Número de Identificación",
    "Apellido completo",
    "Nombre completo",
    "Sexo",
    "Correo Electrónico",
    "Titulo del Funcionario",
    "Rol de usuario",
    "Activar cuenta",
    "Unidad de Salud",
  ];

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

  useEffect(() => {
    const loadEniUsers = async () => {
      try {
        const data = await getAllEniUsers();
        setEniUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        setError(error.message);
        setTimeout(() => setError(""), 8000);
      }
    };
    loadEniUsers();
  }, [setError, refreshTable]);

  // Reinicia página cuando cambia el término de búsqueda o el tamaño de página
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage]);

  // Filtrado (case-insensitive) antes de paginar
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return eniUsers;
    const q = searchTerm.toLowerCase();
    return eniUsers.filter((u) => {
      return [
        u.fun_tipo_iden,
        u.username,
        u.first_name,
        u.last_name,
        u.email,
        u.fun_titu,
        ROLE_NAMES[u.fun_admi_rol],
      ]
        .filter(Boolean)
        .some((field) => field.toString().toLowerCase().includes(q));
    });
  }, [eniUsers, searchTerm]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage)),
    [filteredUsers.length, rowsPerPage]
  );

  // Asegura que la página actual siempre esté dentro de los límites
  useEffect(() => {
    setCurrentPage((prev) => Math.min(Math.max(prev, 1), totalPages));
  }, [totalPages]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  const currentRows = useMemo(
    () => filteredUsers.slice(indexOfFirstRow, indexOfLastRow),
    [filteredUsers, indexOfFirstRow, indexOfLastRow]
  );

  const handleEdit = (id) => {
    const user = eniUsers.find((user) => user.id === id);
    if (user) {
      const funAdmiRol = getFunAdmiRol(user.fun_admi_rol);
      setFormData(getFormData(user, funAdmiRol));
      setVariableEstado(getVariableEstado());
      setBotonEstado({ btnBuscar: true });
      toast.success("Puede editar el registro seleccionado", {
        position: "bottom-right",
      });
      setIsEditing(true);
    }
  };

  const handleDelete = async (id) => {
    const user = eniUsers.find((user) => user.id === id);
    if (user) {
      if (!confirmDelete(user)) return;

      setIsLoading(true);
      try {
        await deleteUserAndUpdateState(user.username, id);
      } catch (error) {
        handleDeleteError(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const confirmDelete = (user) => {
    return window.confirm(
      `¿Estás seguro de que deseas eliminar este registro?\n\nIdentificación: ${user.username}\nNombres: ${user.last_name} ${user.first_name}`
    );
  };

  const deleteUserAndUpdateState = async (username, id) => {
    const response = await deleteUser(username);
    setSuccessMessage("Registro eliminado con éxito!");
    setTimeout(() => setSuccessMessage(""), 10000);
    const message = response.message || "Registro eliminado con éxito!";
    toast.success(message, {
      position: "bottom-right",
    });
    // Actualiza la lista de usuarios después de la eliminación
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
    id_eniUser: user.id || "",
    fun_tipo_iden: user.fun_tipo_iden || "",
    username: user.username || "",
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    fun_sex: user.fun_sex || "",
    email: user.email || "",
    fun_titu: user.fun_titu || "",
    password1: "",
    password2: "",
    fun_admi_rol: funAdmiRol || "",
    uni_unic: Array.isArray(user.unidades_data)
      ? user.unidades_data.map((item) => {
          if (typeof item === "object" && item !== null) {
            return {
              value: item.uni_unic,
              label: `${item.uni_unic} - ${item.uni_unid}`.trim(),
            };
          } else {
            return {
              value: item,
              label: item,
            };
          }
        })
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
    password1: false,
    password2: false,
    fun_admi_rol: false,
    uni_unic: false,
    fun_esta: false,
  });

  // Estilos extraídos como constantes
  const tableStyles = {
    container:
      "overflow-x-auto rounded-lg shadow max-w-full border-2 border-gray-300 sm:border my-4",
    table: "w-full table-auto border-collapse bg-white",
    thead: "bg-gray-50 border-b border-gray-300",
    th: "px-3 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-x border-gray-200",
    tbody: "divide-y divide-gray-200",
    td: "px-3 py-2 text-sm text-gray-600 border-x border-gray-200",
    actionButton:
      "p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded",
    deleteButton: "p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded",
    trHover: "hover:bg-gray-50 transition-colors duration-150",
  };

  // Clase CSS para roles sin usar ternarios anidados
  const getRoleClass = (role) => {
    switch (role) {
      case 1:
        return "bg-blue-50 text-blue-700 ring-blue-200";
      case 2:
        return "bg-indigo-50 text-indigo-700 ring-indigo-200";
      case 3:
        return "bg-emerald-50 text-emerald-700 ring-emerald-200";
      case 4:
        return "bg-amber-50 text-amber-700 ring-amber-200";
      default:
        return "bg-gray-100 text-gray-700 ring-gray-200";
    }
  };

  return (
    <div className="mt-4 mx-2 sm:mx-0 space-y-3">
      {/* Buscador y resumen */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="opacity-80"
            >
              <path
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por identificación, nombres, correo, título o rol..."
            className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg bg-white/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm placeholder:text-gray-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Limpiar búsqueda"
              className="absolute inset-y-0 right-2 my-auto h-7 w-7 grid place-items-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              title="Limpiar"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                className="opacity-90"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-gray-600">
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
            {filteredUsers.length}
          </span>
          registro(s){searchTerm && " filtrados"}
        </span>
      </div>

      {/* Tabla */}
      <div className={`${tableStyles.container} bg-white/90`}>
        <table className={`${tableStyles.table} text-sm`}>
          <thead className={`${tableStyles.thead}`}>
            <tr>
              <th
                scope="col"
                className={`${tableStyles.th} sticky top-0 z-10 bg-gray-50 w-24`}
              >
                Acciones
              </th>
              {TABLE_HEADERS.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className={`${tableStyles.th} sticky top-0 z-10 bg-gray-50`}
                  title={header}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`${tableStyles.tbody}`}>
            {currentRows.map((registro) => (
              <tr
                key={registro.id}
                className={`${tableStyles.trHover} odd:bg-white even:bg-gray-50`}
              >
                <td className={`${tableStyles.td} align-top`}>
                  <div className="flex items-center gap-2">
                    <button
                      className={tableStyles.actionButton}
                      onClick={() => handleEdit(registro.id)}
                      aria-label="Editar"
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className={tableStyles.deleteButton}
                      onClick={() => handleDelete(registro.id)}
                      aria-label="Eliminar"
                      title="Eliminar"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
                {Object.keys(registro)
                  .filter((key) => key !== "id")
                  .map((key) => {
                    let cellContent;
                    switch (key) {
                      case "fun_admi_rol":
                        cellContent = (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${getRoleClass(
                              registro[key]
                            )}`}
                          >
                            {ROLE_NAMES[registro[key]] || ""}
                          </span>
                        );
                        break;
                      case "unidades_data":
                        cellContent = (
                          <div className="flex flex-wrap gap-1 max-w-[260px]">
                            {Array.isArray(registro[key]) &&
                            registro[key].length > 0 ? (
                              <>
                                {registro[key]
                                  .slice(0, 3)
                                  .map((item, index) => {
                                    const value =
                                      typeof item === "object"
                                        ? `${item.uni_unic} - ${item.uni_unid}`
                                        : item;
                                    return (
                                      <span
                                        key={
                                          typeof item === "object"
                                            ? item.id || index
                                            : index
                                        }
                                        className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 ring-1 ring-sky-200 text-xs truncate"
                                        title={value}
                                      >
                                        {value}
                                      </span>
                                    );
                                  })}
                                {registro[key].length > 3 && (
                                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 ring-1 ring-gray-200 text-xs">
                                    +{registro[key].length - 3}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">
                                No hay unidades asignadas
                              </span>
                            )}
                          </div>
                        );
                        break;
                      case "email":
                        cellContent = (
                          <a
                            href={`mailto:${registro[key]}`}
                            className="truncate block max-w-[220px] text-blue-600 hover:text-blue-800"
                            title={registro[key]}
                          >
                            {registro[key]}
                          </a>
                        );
                        break;
                      default:
                        cellContent =
                          typeof registro[key] === "object" ? (
                            <span
                              className="truncate block max-w-[260px] text-gray-600"
                              title={JSON.stringify(registro[key])}
                            >
                              {JSON.stringify(registro[key])}
                            </span>
                          ) : (
                            <span
                              className="truncate block max-w-[260px] text-gray-700"
                              title={registro[key]}
                            >
                              {registro[key]}
                            </span>
                          );
                    }
                    return (
                      <td key={key} className={`${tableStyles.td} align-top`}>
                        {cellContent}
                      </td>
                    );
                  })}
              </tr>
            ))}
            {currentRows.length === 0 && (
              <tr>
                <td
                  colSpan={1 + TABLE_HEADERS.length}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  {searchTerm
                    ? "No hay resultados para la búsqueda."
                    : "No hay registros."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between sm:items-center mt-2 px-1">
        <div className="text-xs sm:text-sm text-gray-700">
          Mostrando{" "}
          <span className="font-medium">
            {filteredUsers.length === 0 ? 0 : indexOfFirstRow + 1}
          </span>{" "}
          –{" "}
          <span className="font-medium">
            {Math.min(indexOfLastRow, filteredUsers.length)}
          </span>{" "}
          de <span className="font-medium">{filteredUsers.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="rowsPerPage" className="text-xs text-gray-700">
              Filas:
            </label>
            <select
              id="rowsPerPage"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="px-2 py-1 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-300"
            >
              {[5, 10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-2.5 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
            title="Primera página"
          >
            «
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700 px-1">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
          >
            Siguiente
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
            title="Última página"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};
TablaUsers.propTypes = {
  setFormData: PropTypes.func.isRequired,
  setVariableEstado: PropTypes.func.isRequired,
  setBotonEstado: PropTypes.func.isRequired,
  setIsEditing: PropTypes.func.isRequired,
  setIsLoading: PropTypes.func.isRequired,
  setSuccessMessage: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  refreshTable: PropTypes.number,
};

export default TablaUsers;
