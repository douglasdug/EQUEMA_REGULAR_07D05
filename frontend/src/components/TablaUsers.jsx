import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getAllEniUsers } from "../api/conexion.api.js";

const TablaUsers = ({ setFormData, setVariableEstado, setBotonEstado }) => {
  const [eniUsers, setEniUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const loadEniUsers = async () => {
      try {
        const { data } = await getAllEniUsers();
        console.log(data); // Verifica que data es un array
        setEniUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        setError(error.message);
        console.error("Error al cargar los registros:", error);
      }
    };

    loadEniUsers();
  }, []);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = Array.isArray(eniUsers)
    ? eniUsers.slice(indexOfFirstRow, indexOfLastRow)
    : [];

  const totalPages = Math.ceil(eniUsers.length / rowsPerPage);

  const handleEdit = (id) => {
    const user = eniUsers.find((user) => user.id === id);
    if (user) {
      let funAdmiRol = 0;
      if (user.fun_admi_rol === 1) {
        funAdmiRol = 1;
      } else if (user.fun_admi_rol === 2) {
        funAdmiRol = 2;
      } else if (user.fun_admi_rol === 3) {
        funAdmiRol = 3;
      }
      setFormData({
        fun_tipo_iden: user.fun_tipo_iden || "",
        username: user.username || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        fun_sex: user.fun_sex || "",
        email: user.email || "",
        fun_titu: user.fun_titu || "",
        password1: user.password || "",
        password2: user.password || "",
        fun_admi_rol: funAdmiRol,
        uni_unic: user.uni_unic || "",
        fun_esta: user.fun_esta === 1 ? 1 : 0,
      });
      setVariableEstado({
        fun_tipo_iden: true,
        username: true,
        first_name: true,
        last_name: true,
        fun_sex: false,
        email: false,
        fun_titu: false,
        password1: true,
        password2: true,
        fun_admi_rol: true,
        uni_unic: true,
        fun_esta: false,
      });
      setBotonEstado({
        btnBuscar: true,
      });
    }
  };

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
                        <img src="/path/to/edit-icon.png" alt="Edit" />
                      </button>
                      <button
                        className="cursor-pointer"
                        onClick={() => handleEdit(registro.id)}
                        tabIndex={0}
                      >
                        <img src="/path/to/delete-icon.png" alt="Delete" />
                      </button>
                    </td>
                    {Object.keys(registro)
                      .filter((key) => key !== "id")
                      .map((key) => {
                        let cellContent;
                        switch (key) {
                          case "fun_esta":
                            cellContent =
                              registro[key] === 1 ? "ACTIVO" : "INACTIVO";
                            break;
                          case "password":
                            cellContent = (
                              <input
                                type="password"
                                value={registro[key]}
                                readOnly
                              />
                            );
                            break;
                          case "fun_admi_rol":
                            cellContent =
                              ["", "ADMINISTRADOR", "VACUNADOR", "MEDICO"][
                                registro[key]
                              ] || "";
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
};

export default TablaUsers;
