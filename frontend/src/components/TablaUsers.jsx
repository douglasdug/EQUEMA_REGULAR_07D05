import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getAllEniUsers, deleteUser } from "../api/conexion.api.js";
import { listaUnidadesSalud } from "./AllList.jsx";
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
}) => {
  const [eniUsers, setEniUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const loadEniUsers = async () => {
      try {
        const data = await getAllEniUsers();
        setEniUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        setError(error.message);
      }
    };
    loadEniUsers();
  }, [setError]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = Array.isArray(eniUsers)
    ? eniUsers.slice(indexOfFirstRow, indexOfLastRow)
    : [];

  const totalPages = Math.ceil(eniUsers.length / rowsPerPage);

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
    const message = response.message || "Registro eliminado con éxito!";
    toast.success(message, {
      position: "bottom-right",
    });
    // Actualiza la lista de usuarios después de la eliminación
    setEniUsers(eniUsers.filter((u) => u.id !== id));
  };

  const handleDeleteError = (error) => {
    let errorMessage = "Hubo un error en la operación";
    if (error.response) {
      if (error.response.data && error.response.data.error) {
        setError(error.response.data.error);
        errorMessage = error.response.data.error;
      } else if (error.response.data && error.response.data.message) {
        setError(error.response.data.message);
        errorMessage = error.response.data.message;
      } else {
        setError("Error del servidor");
      }
    } else if (error.request) {
      setError("No se recibió respuesta del servidor");
    } else {
      setError("Error desconocido");
    }
    toast.error(errorMessage, { position: "bottom-right" });
  };

  const getFunAdmiRol = (fun_admi_rol) => {
    switch (fun_admi_rol) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 3:
        return 3;
      case 4:
        return 4;
      default:
        return 0;
    }
  };

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
    uni_unic: Array.isArray(user.uni_unic)
      ? user.uni_unic.map((item) => ({
          value: item,
          label: `${listaUnidadesSalud[item] || item}`.trim(),
        }))
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

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full py-2">
          <div className="overflow-hidden">
            <table className="min-w-full text-sm text-left text-gray-100 dark:text-gray-800">
              <thead className="text-center text-gray-100 bg-gray-50 dark:bg-gray-100 dark:text-gray-100 tracking-tighter uppercase border-2">
                <tr>
                  <th className="px-1 py-1 text-gray-900 border-x-2">
                    Acciones
                  </th>
                  {[
                    "Tipo de Identificacion",
                    "Número de Identificación",
                    "Apellido completo",
                    "Nombre completo",
                    "Sexo",
                    "Correo Electrónico",
                    "Titulo del Funcionario",
                    "Clave",
                    "Rol de usuario",
                    "Activar cuenta",
                    "Unidad de Salud",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-1 py-1 text-gray-900 border-x-2"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white border">
                {currentRows.map((registro) => (
                  <tr key={registro.id}>
                    <td className="whitespace-nowrap px-1 py-1 border">
                      <button
                        className="mr-2 cursor-pointer"
                        onClick={() => handleEdit(registro.id)}
                        tabIndex={0}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="cursor-pointer"
                        onClick={() => handleDelete(registro.id)}
                        tabIndex={0}
                      >
                        <FaTrash />
                      </button>
                    </td>
                    {Object.keys(registro)
                      .filter((key) => key !== "id")
                      .map((key) => {
                        let cellContent;
                        switch (key) {
                          case "fun_esta":
                            cellContent =
                              ["INACTIVO", "ACTIVO"][registro[key]] || "";
                            break;
                          case "password":
                            cellContent = (
                              <input
                                id={registro[key]}
                                name={registro[key]}
                                type="password"
                                value={registro[key]}
                                readOnly
                              />
                            );
                            break;
                          case "fun_admi_rol":
                            cellContent =
                              [
                                "",
                                "ADMINISTRADOR",
                                "VACUNADOR",
                                "MEDICO",
                                "VACUNADOR Y MEDICO",
                              ][registro[key]] || "";
                            break;
                          case "uni_unic":
                            cellContent = (
                              <ul>
                                {registro[key].map((item, index) => (
                                  <li key={item}>
                                    {listaUnidadesSalud[item] || item}
                                  </li>
                                ))}
                              </ul>
                            );
                            break;
                          default:
                            cellContent = registro[key];
                        }
                        return (
                          <td
                            key={key}
                            className="whitespace-nowrap px-1 py-1 border"
                          >
                            {cellContent}
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
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
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
};

export default TablaUsers;
