import { useState } from "react";
// import {
//   getAllRegistroVacunado,
//   getDescargarCsvRegistroVacunado,
// } from "../api/conexion.api.js";
import { useNavigate } from "react-router-dom";

export function RegistroVacunadoList() {
  const navigate = useNavigate();
  const [registroVacunado, setRegistroVacunado] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [mesBuscar, setMesBuscar] = useState(0);
  const [anoBuscar, setAnoBuscar] = useState(0);

  const [fechaBuscar, setFechaBuscar] = useState("");
  const [errorBuscar, setErrorBuscar] = useState("");

  const handleDateChangeBuscarGetAll = (e) => {
    const value = e.target.value;
    const regex = /^(0[1-9]|1[0-2])\/\d{4}$/;

    if (regex.test(value)) {
      setErrorBuscar("");
      const [mes, ano] = value.split("/").map(Number);
      setMesBuscar(mes);
      setAnoBuscar(ano);
    } else {
      setErrorBuscar("Formato inválido. Use MM/YYYY");
    }

    setFechaBuscar(value);
  };

  const buscarFechaTabla = async (e) => {
    e.preventDefault();
    //const token = "TU_TOKEN_DE_AUTENTICACION"; // Reemplaza esto con la forma en que obtienes tu token
    try {
      const res = await getAllRegistroVacunado(mesBuscar, anoBuscar);
      setRegistroVacunado(res.data);
    } catch (error) {
      console.error("Error al cargar los registros:", error);
      if (error.response && error.response.status === 401) {
        //navigate("/login"); // Redirige al usuario a la página de login si no está autorizado
      }
    }
  };

  const descargarCsv = async (e) => {
    e.preventDefault();
    console.log(fechaInicio, fechaFin);
    try {
      const res = await getDescargarCsvRegistroVacunado(fechaInicio, fechaFin, {
        responseType: "blob", // Importante para manejar archivos binarios
      });
      // Crear un enlace de descarga
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "registro_vacunado.csv"); // Nombre del archivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al descargar el archivo CSV", error);
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = registroVacunado.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(registroVacunado.length / rowsPerPage);

  const handleDateChangeInicio = (e) => {
    setFechaInicio(e.target.value);
  };

  const handleDateChangeFin = (e) => {
    setFechaFin(e.target.value);
  };

  return (
    <div className="container">
      <div className="max-w-max m-auto mt-5">
        <h2 className="text-center text-2xl font-bold mb-5">
          Descargar archivo CSV de Registro de Vacunados.
        </h2>
        <form className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center" key="txtDescargarCsv">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="fecha_inicio"
              >
                Fecha de inicio:
              </label>
              <input
                type="date"
                id="fecha_inicio"
                name="fecha_inicio"
                value={fechaInicio}
                onChange={handleDateChangeInicio}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="fecha_fin"
              >
                Fecha de fin:
              </label>
              <input
                type="date"
                id="fecha_fin"
                name="fecha_fin"
                value={fechaFin}
                onChange={handleDateChangeFin}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <button
              onClick={descargarCsv}
              type="button"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Descargar
            </button>
          </div>
        </form>
        <h2 className="text-center text-2xl font-bold mb-5">
          Buscar en tabla de Registro de Vacunados.
        </h2>
        <form className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center" key="txtBuscarTabla">
              <label
                className="block text-gray-700 text-sm font-bold mr-2"
                htmlFor="getAllBuscarTabla"
              >
                Fecha (MM/YYYY):
              </label>
              <input
                type="text"
                id="getAllBuscarTabla"
                name="getAllBuscarTabla"
                value={fechaBuscar}
                onChange={handleDateChangeBuscarGetAll}
                placeholder="MM/YYYY"
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {errorBuscar && <p style={{ color: "red" }}>{errorBuscar}</p>}
            </div>
            <button
              onClick={buscarFechaTabla}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Buscar
            </button>
          </div>
        </form>
      </div>
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
    </div>
  );
}
