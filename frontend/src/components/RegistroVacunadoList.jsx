import { useEffect, useState } from "react";
import { getAllRegistroVacunado } from "../api/conexion.api.js";
import { useNavigate } from "react-router-dom";

export function RegistroVacunadoList() {
  const navigate = useNavigate();
  const [registroVacunado, setRegistroVacunado] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    async function loadRegistroVacunado() {
      const res = await getAllRegistroVacunado(1, 9, 2024);
      setRegistroVacunado(res.data);
    }
    loadRegistroVacunado();
  }, []);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = registroVacunado.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(registroVacunado.length / rowsPerPage);

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full py-2">
          <div className="overflow-hidden">
            <table className="min-w-full text-sm text-left text-gray-100 dark:text-gray-800">
              <thead className="text-center text-gray-100 bg-gray-50 dark:bg-gray-100 dark:text-gray-100 tracking-tighter uppercase border-2">
                <tr>
                  {[
                    "Dia/Mes/Año aplicacion",
                    "Punto vacunacion",
                    "Unicódigo establecimiento",
                    "Nombre establecimiento de salud",
                    "Zona",
                    "Distrito",
                    "Provincia",
                    "Canton",
                    "Apellidos",
                    "Nombres",
                    "Tipo identificación",
                    "Número de identificación",
                    "Sexo",
                    "Dia/Mes/Año nacimiento",
                    "Nacionalidad",
                    "Etnia",
                    "Nacionalidad étnica",
                    "Pueblo",
                    "Residencia provincia",
                    "Residencia cantón",
                    "Residencia parroquia",
                    "Tel. de contacto",
                    "Correo electronico",
                    "Grupo de riesgo",
                    "Fase vacuna",
                    "Estado vacunación",
                    "Tipo esquema",
                    "Vacuna",
                    "Lote vacuna",
                    "Dosis aplicada",
                    "Paciente agendado",
                    "Nombre vacunador",
                    "Identificación vacunador",
                    "Nombre del profesional que registra",
                    "Recibió dosis previa exterior",
                    "Nombre dosis exterior",
                    "Fecha Dia/Mes/Año dosis exterior",
                    "Pais dosis exterior",
                    "Lote dosis exterior",
                    "Usuario",
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
                    {Object.keys(registro)
                      .filter((key) => key !== "id")
                      .map((key) => (
                        <td
                          key={key}
                          className="whitespace-nowrap px-1 py-1 border"
                        >
                          {key === "vac_reg_ano_mes_dia_apli" ? (
                            <button
                              className="hover:underline"
                              onClick={() =>
                                navigate(
                                  `/ceateRegistroVacunado/${registro.id}`
                                )
                              }
                            >
                              {registro[key]}
                            </button>
                          ) : (
                            registro[key]
                          )}
                        </td>
                      ))}
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
}
