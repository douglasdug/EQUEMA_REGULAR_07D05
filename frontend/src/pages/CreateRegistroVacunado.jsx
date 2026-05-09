import React, { useState } from "react";
// import { registroVacunadoCreateApi } from "../api/conexion.api.js";
//import { getDescargarCsvRegistroVacunado } from "../api/conexion.api.js";
import { RegistroVacunadoList } from "../components/RegistroVacunadoList.jsx";
import { RegistroAdmision } from "../components/RegistroAdmision.jsx";
import { AllList } from "../components/listaAdmision.jsx";
import { toast } from "react-hot-toast";

const CreateRegistroVacunado = () => {
  const [formData, setFormData] = useState({
    vac_reg_ano_mes_dia_apli: "",
    vac_reg_punt_vacu: "",
    vac_reg_unic_esta: "",
    vac_reg_nomb_esta_salu: "",
    vac_reg_zona: "",
    vac_reg_dist: "",
    vac_reg_prov: "",
    vac_reg_cant: "",
    vac_reg_apel: "",
    vac_reg_nomb: "",
    vac_reg_tipo_iden: "",
    vac_reg_nume_iden: "",
    vac_reg_sexo: "",
    vac_reg_ano_mes_dia_naci: "",
    vac_reg_naci: "",
    vac_reg_etni: "",
    vac_reg_naci_etni: "",
    vac_reg_pueb: "",
    vac_reg_resi_prov: "",
    vac_reg_resi_cant: "",
    vac_reg_resi_parr: "",
    vac_reg_teld_cont: "",
    vac_reg_corr_elec: "",
    vac_reg_grup_ries: "",
    vac_reg_fase_vacu: 0,
    vac_reg_esta_vacu: "",
    vac_reg_tipo_esqu: "",
    vac_reg_vacu: "",
    vac_reg_lote_vacu: "",
    vac_reg_dosi_apli: 0,
    vac_reg_paci_agen: "",
    vac_reg_nomb_vacu: "",
    vac_reg_iden_vacu: "",
    vac_reg_nomb_prof_regi: "",
    vac_reg_reci_dosi_prev_exte: "",
    vac_reg_nomb_dosi_exte: "",
    vac_reg_fech_anio_mes_dia_dosi_exte: "",
    vac_reg_pais_dosi_exte: "",
    vac_reg_lote_dosi_exte: "",
    eniUser: 1,
  });
  const [error, setError] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const requiredFields = [
    "vac_reg_ano_mes_dia_apli",
    "vac_reg_punt_vacu",
    "vac_reg_unic_esta",
    "vac_reg_nomb_esta_salu",
    "vac_reg_zona",
    "vac_reg_dist",
    "vac_reg_prov",
    "vac_reg_cant",
    "vac_reg_apel",
    "vac_reg_nomb",
    "vac_reg_tipo_iden",
    "vac_reg_nume_iden",
    "vac_reg_sexo",
    "vac_reg_ano_mes_dia_naci",
    "vac_reg_naci",
    "vac_reg_etni",
    "vac_reg_naci_etni",
    "vac_reg_pueb",
    "vac_reg_resi_prov",
    "vac_reg_resi_cant",
    "vac_reg_resi_parr",
    "vac_reg_teld_cont",
    "vac_reg_corr_elec",
    "vac_reg_grup_ries",
    "vac_reg_esta_vacu",
    "vac_reg_tipo_esqu",
    "vac_reg_vacu",
    "vac_reg_lote_vacu",
    "vac_reg_dosi_apli",
    "vac_reg_nomb_vacu",
    "vac_reg_iden_vacu",
    "vac_reg_nomb_prof_regi",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    let isValid = true;
    let formattedValue = value;

    if (e.target.type === "text") {
      formattedValue = value.toUpperCase().replace(/\s{2,}/g, " ");
      isValid = true; // formattedValue.trim() !== ""; Allow empty values for text inputs
    } else if (e.target.type === "number") {
      isValid = value > 0;
    } else if (e.target.type === "date") {
      isValid = !isNaN(new Date(value).getTime());
    }

    if (isValid) {
      setFormData({
        ...formData,
        [name]: formattedValue,
      });
    }

    setIsButtonDisabled(
      !requiredFields.every((field) => {
        const val = field === name ? formattedValue : formData[field];
        if (typeof val === "string") {
          return val.trim() !== "";
        } else if (typeof val === "number") {
          return val > 0;
        } else if (val instanceof Date) {
          return !isNaN(val.getTime());
        }
        return true;
      }),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await registroVacunadoCreateApi(formData);
      console.log("Success:", response.data);
      const successMessage = response.data.message || "Operación exitosa";
      toast.success(successMessage, {
        position: "bottom-right",
      });
      window.location.href = "/createRegistroVacunado/";
    } catch (error) {
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
      toast.error(errorMessage, {
        position: "bottom-right",
      });
    }
  };

  // const fecha_inicio = "2024-09-01";
  // const fecha_fin = "2024-09-30";
  // const eniUser_id = 1;

  // const descargarCsvSubmit = async (e) => {
  //   e.preventDefault();
  //   console.log(fecha_inicio, fecha_fin, eniUser_id);
  //   try {
  //     const response = await getDescargarCsvRegistroVacunado(
  //       fecha_inicio,
  //       fecha_fin,
  //       eniUser_id
  //     );
  //     descargarCsvSuccess(response);
  //   } catch (error) {
  //     descargarCsvError(error);
  //   }
  // };

  // const descargarCsvSuccess = (response) => {
  //   const successMessage = response.data.message || "Operación exitosa";
  //   toast.success(successMessage, { position: "bottom-right" });
  //   // Uso de navigate en lugar de window.location.href
  //   navigate("/createRegistroVacunado/");
  // };

  // const descargarCsvError = (error) => {
  //   let errorMessage = "Hubo un error en la operación";

  //   if (error.response) {
  //     errorMessage =
  //       error.response.data?.error ||
  //       error.response.data?.message ||
  //       "Error del servidor";
  //     setError(errorMessage);
  //   } else if (error.request) {
  //     errorMessage = "No se recibió respuesta del servidor";
  //     setError(errorMessage);
  //   } else {
  //     errorMessage = "Error desconocido";
  //     setError(errorMessage);
  //   }

  //   toast.error(errorMessage, { position: "bottom-right" });
  // };

  const handleButtonClick = (e) => {
    if (isButtonDisabled) {
      e.preventDefault();
      console.log("Todos los campos con * en rojo tienen que estar llenos!");
      toast.error("Todos los campos con * en rojo tienen que estar llenos!", {
        position: "bottom-right",
      });
    }
  };

  const labelMap = {
    vac_reg_ano_mes_dia_apli: "Año/Mes/Día aplicación",
    vac_reg_punt_vacu: "Punto vacunacion",
    vac_reg_unic_esta: "Unicódigo establecimiento",
    vac_reg_nomb_esta_salu: "Nombre establecimiento de salud",
    vac_reg_zona: "Zona",
    vac_reg_dist: "Distrito",
    vac_reg_prov: "Provincia",
    vac_reg_cant: "Canton",
    vac_reg_apel: "Apellidos",
    vac_reg_nomb: "Nombres",
    vac_reg_tipo_iden: "Tipo identificación",
    vac_reg_nume_iden: "Número de identificación",
    vac_reg_sexo: "Sexo",
    vac_reg_ano_mes_dia_naci: "Año/Mes/Día nacimiento",
    vac_reg_naci: "Nacionalidad",
    vac_reg_etni: "Etnia",
    vac_reg_naci_etni: "Nacionalidad étnica",
    vac_reg_pueb: "Pueblo",
    vac_reg_resi_prov: "Residencia provincia",
    vac_reg_resi_cant: "Residencia cantón",
    vac_reg_resi_parr: "Residencia parroquia",
    vac_reg_teld_cont: "Tel. de contacto",
    vac_reg_corr_elec: "Correo electronico",
    vac_reg_grup_ries: "Grupo de riesgo",
    vac_reg_fase_vacu: "Fase vacuna",
    vac_reg_esta_vacu: "Estado vacunación",
    vac_reg_tipo_esqu: "Tipo esquema",
    vac_reg_vacu: "Vacuna",
    vac_reg_lote_vacu: "Lote vacuna",
    vac_reg_dosi_apli: "Dosis aplicada",
    vac_reg_paci_agen: "Paciente agendado",
    vac_reg_nomb_vacu: "Nombre vacunador",
    vac_reg_iden_vacu: "Identificación vacunador",
    vac_reg_nomb_prof_regi: "Nombre del profesional que registra",
    vac_reg_reci_dosi_prev_exte: "Recibió dosis previa exterior",
    vac_reg_nomb_dosi_exte: "Nombre dosis exterior",
    vac_reg_fech_anio_mes_dia_dosi_exte: "Fecha Año/Mes/Día dosis exterior",
    vac_reg_pais_dosi_exte: "Pais dosis exterior",
    vac_reg_lote_dosi_exte: "Lote dosis exterior",
  };

  const groupedFields = [];
  const keys = Object.keys(formData).filter((key) => key !== "eniUser");

  for (let i = 0; i < keys.length; i += 6) {
    groupedFields.push(keys.slice(i, i + 6));
  }

  const selectOptions = {};

  return (
    <div className="container">
      <div className="max-w-max m-auto mt-5">
        <h2 className="text-center text-2xl font-bold mb-5">
          Registrar Vacunado
        </h2>
        <form className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center" key="txtBuscarVacunado">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="txtBuscarVacunado"
              >
                Buscar vacunado:
              </label>
              <input
                type="text"
                id="txtBuscarVacunado"
                name="txtBuscarVacunado"
                //value=""
                onChange={handleChange}
                placeholder="Buscar por cédula"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <div></div>
            </div>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
              Buscar paciente
            </button>
          </div>
        </form>
      </div>
      <div className="mt-5">
        <h1>Provincias lista</h1>
        <AllList />
      </div>
      <div className="mt-5">
        <RegistroAdmision />
      </div>
      <div className="max-w-max m-auto mt-5">
        <h1 className="text-center text-2xl font-bold mb-5">
          Crear Registro de Vacunado
        </h1>
        {error && <p className="text-red-500 mb-5">{error}</p>}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          {groupedFields.map((group, groupIndex) => (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6"
              key={groupIndex}
            >
              {group.map((key) => {
                let inputType;
                if (selectOptions[key]) {
                  return (
                    <div className="mb-2" key={key}>
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor={key}
                      >
                        {labelMap[key]}
                        {requiredFields.includes(key) && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      <select
                        id={key}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      >
                        <option value="">Seleccione una opción</option>
                        {selectOptions[key].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                } else {
                  if (
                    key === "vac_reg_ano_mes_dia_apli" ||
                    key === "vac_reg_ano_mes_dia_naci" ||
                    key === "vac_reg_fech_anio_mes_dia_dosi_exte"
                  ) {
                    inputType = "date";
                  } else if (
                    key === "vac_reg_fase_vacu" ||
                    key === "vac_reg_dosi_apli"
                  ) {
                    inputType = "number";
                  } else if (key === "vac_reg_corr_elec") {
                    inputType = "email";
                  } else {
                    inputType = "text";
                  }
                  return (
                    <div className="mb-2" key={key}>
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor={key}
                      >
                        {labelMap[key]}
                        {requiredFields.includes(key) && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      <input
                        type={inputType}
                        id={key}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        placeholder="Información es requerida"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        min="0"
                      />
                    </div>
                  );
                }
              })}
            </div>
          ))}
          <div className="flex flex-col items-center">
            <button
              type="submit"
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isButtonDisabled}
              onClick={handleButtonClick}
            >
              Crear
            </button>
          </div>
        </form>
      </div>

      <div className="mt-5">
        <RegistroVacunadoList />
      </div>
    </div>
  );
};

export default CreateRegistroVacunado;
