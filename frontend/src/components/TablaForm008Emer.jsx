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
  const rowsPerPage = 10;
  const ROLE_NAMES = [
    "",
    "ADMINISTRADOR",
    "VACUNADOR",
    "MEDICO",
    "VACUNADOR Y MEDICO",
  ];
  const STATUS_NAMES = ["INACTIVO", "ACTIVO"];
  const TABLE_HEADERS = [
    "UNICODIGO",
    "NOMBRE DEL ESTABLECIMIENTO DE SALUD",
    "FECHA DE ATENCIÓN",
    "TIPO DE DOCUMENTO DE IDENTIFICACIÓN",
    "NÚMERO DE IDENTIFICACION",
    "PRIMER APELLIDO",
    "SEGUNDO APELLIDO",
    "PRIMER NOMBRE",
    "SEGUNDO NOMBRE",
    "SEXO",
    "EDAD",
    "CONDICIÓN DE LA EDAD",
    "NACIONALIDAD",
    "ETNIA",
    "GRUPO PRIORITARIO",
    "TIPO DE SEGURO",
    "PROVINCIA DE RECIDENCIA",
    "CANTON DE RECIDENCIA",
    "PARROQUIA DE RECIDENCIA",
    "ESPECIALIDAD DEL PROFESIONAL",
    "CIE-10 (PRINCIPAL)",
    "DIAGNÓSTICO 1 (PRINCIPAL)",
    "CONDICIÓN DEL DIAGNÓSTICO",
    "CIE-10 (CAUSA EXTERNA)",
    "DIAGNOSTICO (CAUSA  EXTERNA)",
    "HOSPITALIZACIÓN",
    "HORA ATENCIÓN",
    "CONDICIÓN DEL ALTA",
    "OBSERVACIÓN",
    "FECHA DE REPORTE",
    "RESPONSABLE DE LA ATENCION MEDICA",
    "APOYO EN LA ATENCION MEDICA",
    "EDAD GESTACIONAL",
    "RIESGO OBSTETRICO",
    "UNIDAD DE SALUD RESPONSABLE DE SEGUIMIENTO DE ATENCIÓN",
    "DIRECCIÓN DE DOMICILIO",
    "TELEFONO DE PACIENTE",
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
    [eniUsers.length, rowsPerPage]
  );

  const currentRows = useMemo(
    () =>
      Array.isArray(eniUsers)
        ? eniUsers.slice(indexOfFirstRow, indexOfLastRow)
        : [],
    [eniUsers, indexOfFirstRow, indexOfLastRow]
  );

  const handleEdit = (id) => {
    const user = eniUsers.find((user) => user.id === id);
    if (user) {
      const funAdmiRol = getFunAdmiRol(user.fun_admi_rol);
      setFormData(getFormData(user, funAdmiRol));
      setVariableEstado(getVariableEstado());
      setBotonEstado({ btnBuscar: true });
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
    setEniUsers(eniUsers.filter((u) => u.id !== id));
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
      ? user.unidades_salud_detalle.map((item) => {
          if (typeof item === "object" && item !== null) {
            return {
              value: item.id || item.uni_unic,
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
    password1: true,
    password2: true,
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
    td: "px-1 py-1 text-sm text-gray-600 border-x border-gray-200",
    actionButton:
      "p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded",
    deleteButton: "p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded",
    trHover: "hover:bg-gray-50 transition-colors duration-150",
  };

  return (
    <div className="mt-4 mx-2 sm:mx-0">
      <div className={tableStyles.container}>
        <table className={tableStyles.table}>
          <thead className={tableStyles.thead}>
            <tr>
              <th scope="col" className={tableStyles.th}>
                Acciones
              </th>
              {TABLE_HEADERS.map((header) => (
                <th key={header} scope="col" className={tableStyles.th}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={tableStyles.tbody}>
            {currentRows.map((registro) => (
              <tr key={registro.id} className={tableStyles.trHover}>
                <td className={tableStyles.td}>
                  <div className="flex space-x-2">
                    <button
                      className={tableStyles.actionButton}
                      onClick={() => handleEdit(registro.id)}
                      aria-label="Editar"
                    >
                      <FaEdit />
                    </button>
                    {/* <button
                      className={tableStyles.deleteButton}
                      onClick={() => handleDelete(registro.id)}
                      aria-label="Eliminar"
                    >
                      <FaTrash />
                    </button> */}
                  </div>
                </td>
                {Object.keys(registro)
                  .filter(
                    (key) =>
                      key !== "id" &&
                      key !== "for_008_emer_inst_sist" &&
                      key !== "for_008_emer_zona" &&
                      key !== "for_008_emer_prov" &&
                      key !== "for_008_emer_cant" &&
                      key !== "for_008_emer_dist" &&
                      key !== "for_008_emer_nive" &&
                      key !== "for_008_emer_aten_fina" &&
                      key !== "admision_datos" &&
                      key !== "eniUser"
                  )
                  .map((key) => {
                    let cellContent;
                    switch (key) {
                      case "for_008_emer_fech_repor":
                        let fechaFormateada = "";
                        let horaFormateada = "";
                        if (registro[key]) {
                          const [fechaISO, horaISO] = registro[key].split("T");
                          if (fechaISO) {
                            const [anio, mes, dia] = fechaISO.split("-");
                            fechaFormateada = `${dia}/${mes}/${anio}`;
                          }
                          if (horaISO) {
                            horaFormateada = horaISO.substring(0, 5); // "18:09"
                          }
                        }
                        cellContent = (
                          <span>
                            {fechaFormateada} <br />
                            {horaFormateada}
                          </span>
                        );
                        break;
                      case "for_008_emer_edad_gest":
                        cellContent = <span>{registro[key]}</span>;
                        break;
                      case "for_008_emer_dire_domi":
                      case "for_008_emer_obse":
                        cellContent = (
                          <span className="text-xs block max-w-[150px]">
                            {registro[key]}
                          </span>
                        );
                        break;
                      default:
                        cellContent =
                          typeof registro[key] === "object"
                            ? JSON.stringify(registro[key])
                            : registro[key];
                    }
                    return (
                      <td key={key} className={tableStyles.td}>
                        {cellContent}
                      </td>
                    );
                  })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4 px-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-700">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none"
        >
          Siguiente
        </button>
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
