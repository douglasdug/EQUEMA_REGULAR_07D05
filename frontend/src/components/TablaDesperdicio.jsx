import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaEdit, FaTrash } from "react-icons/fa";
import { getMesDesperdicio, deleteDesperdicio } from "../api/conexion.api.js";
import {
  buttonStylePrimario,
  buttonStyleSecundario,
  buttonStyleEliminar,
} from "../components/EstilosCustom.jsx";
import { toast } from "react-hot-toast";

const InputField = ({
  label,
  type,
  name,
  id,
  value,
  onChange,
  placeholder,
  icon,
  onIconClick,
  isButtonIcon,
}) => (
  <div
    className={`flex items-center border-2 rounded-md overflow-hidden relative mb-0 ${
      value ? "border-blue-500" : ""
    } focus-within:border-blue-500`}
  >
    <input
      type={type}
      name={name}
      id={id}
      value={value}
      onChange={onChange}
      className="py-2 px-1 w-24 text-base text-black bg-transparent focus:outline-none peer"
      placeholder={placeholder}
    />
    <label
      htmlFor={name}
      className="absolute left-2 text-sm text-gray-700 duration-300 transform -translate-y-4 scale-90 top-3 origin-[1] bg-gray-100 px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-4"
    >
      {label}
    </label>
  </div>
);

InputField.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  icon: PropTypes.node,
  onIconClick: PropTypes.func,
  isButtonIcon: PropTypes.bool,
};

const TablaDesperdicio = ({
  setIsIdDes,
  setFormData,
  storedUserId,
  yearDes,
  monthDes,
  setBotonEstado,
  setIsInputEstado,
  setIsLoading,
  setSuccessMessage,
  setError,
}) => {
  const [eniUsers, setEniUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [selectedMonthYear, setSelectedMonthYear] = useState(() => {
    const storedValue = localStorage.getItem("selectedMonthYear");
    if (storedValue) {
      return storedValue;
    }
    const formattedMonth = monthTem.toString().padStart(2, "0");
    return `${yearTem}-${formattedMonth}`;
  });

  useEffect(() => {
    localStorage.setItem("selectedMonthYear", selectedMonthYear);
    console.log("txtMesAnioDes", selectedMonthYear);
    const [yearDes, monthDes] = selectedMonthYear.split("-");
    const loadDesperdicio = async () => {
      try {
        const data = await getMesDesperdicio(storedUserId, monthDes, yearDes);
        setEniUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        setError(error.message);
      }
    };
    loadDesperdicio();
  }, [setError, selectedMonthYear]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = Array.isArray(eniUsers)
    ? eniUsers.slice(indexOfFirstRow, indexOfLastRow)
    : [];

  const totalPages = Math.ceil(eniUsers.length / rowsPerPage);

  const handleSearch = async () => {
    if (selectedMonthYear) {
      const [yearDes, monthDes] = selectedMonthYear.split("-");
      try {
        const data = await getMesDesperdicio(storedUserId, monthDes, yearDes);
        setEniUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const [isValid, setIsValid] = useState(false);

  const valRegAnoMes = (e) => {
    let value = e.target.value;
    // Eliminar cualquier carácter que no sea número o guion
    value = value.replace(/[^\d]/g, "");
    // Insertar el guion después de cuatro dígitos (año)
    if (value.length > 3 && value[4] !== "-") {
      value = value.slice(0, 4) + "-" + value.slice(4);
    }
    // Limitar el tamaño máximo a 7 caracteres (AAAA-MM)
    if (value.length > 7) {
      value = value.slice(0, 7);
    }
    // Validar el año
    const anio = value.slice(0, 4);
    if (anio.length === 4) {
      const anioNum = parseInt(anio, 10);
      const anioActual = new Date().getFullYear();
      if (anioNum < 1900 || anioNum > anioActual) {
        // Año inválido
        return;
      }
    }
    // Validar el mes
    const mes = value.slice(5);
    if (mes.length === 2) {
      const mesNum = parseInt(mes, 10);
      if (mesNum < 1 || mesNum > 12) {
        // Mes inválido
        return;
      }
    }
    setSelectedMonthYear(value);
    const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
    setIsValid(regex.test(value));
  };

  const handleEdit = (id) => {
    const user = eniUsers.find((user) => user.id === id);
    if (user) {
      setIsIdDes(id);
      setFormData(getFormData(user));
      setBotonEstado({ btnBuscarTabDes: true });
      setIsInputEstado({
        input: true,
        des_fech: true,
        des_bcg_dosapli: true,
        des_hbpe_dosapli: true,
        des_rota_dosapli: true,
        des_pent_dosapli: true,
        des_fipv_dosapli: true,
        des_anti_dosapli: true,
        des_neum_dosapli: true,
        des_sr_dosapli: true,
        des_srp_dosapli: true,
        des_vari_dosapli: true,
        des_fieb_dosapli: true,
        des_dift_dosapli: true,
        des_hpv_dosapli: true,
        des_dtad_dosapli: true,
        des_hepa_dosapli: true,
        des_inmant_dosapli: true,
        des_inmanthepb_dosapli: true,
        des_inmantrra_dosapli: true,
        des_infped_dosapli: true,
        des_infadu_dosapli: true,
        des_viru_dosapli: true,
        des_vacsin_dosapli: true,
        des_vacpfi_dosapli: true,
        des_vacmod_dosapli: true,
        des_vacvphcam_dosapli: true,
      });
    }
  };

  const handleDelete = async (id) => {
    const user = eniUsers.find((user) => user.id === id);
    if (user) {
      if (!confirmDelete(user)) return;

      setIsLoading(true);
      try {
        let des_fech = user.des_fech;

        const [dia, mes, año] = des_fech.split("/");
        if (dia && mes && año) {
          des_fech = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
        }

        const formData = {
          eniUser: user.eniUser,
          des_fech: des_fech,
        };
        await deleteUserAndUpdateState(id, formData);
      } catch (error) {
        handleDeleteError(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const confirmDelete = (user) => {
    return window.confirm(
      `¿Estás seguro de que deseas eliminar este registro?\nFecha: ${user.des_fech}`
    );
  };

  const deleteUserAndUpdateState = async (id, formData) => {
    const response = await deleteDesperdicio(id, formData);
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
      if (error.response?.data?.error) {
        setError(error.response.data.error);
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
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

  const getFormData = (user) => {
    let formattedDate = "";
    if (user.des_fech) {
      const [day, month, year] = user.des_fech.split("/");
      if (day && month && year) {
        const date = new Date(year, parseInt(month) - 1, day);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split("T")[0];
        }
      }
    }
    return {
      des_fech: formattedDate,
      des_bcg_dosapli: user.des_bcg_dosapli || 0,
      des_bcg_pervacenfabi: user.des_bcg_pervacenfabi || 0,
      des_bcg_pervacfrasnoabi: user.des_bcg_pervacfrasnoabi || 0,
      des_hbpe_dosapli: user.des_hbpe_dosapli || 0,
      des_hbpe_pervacenfabi: user.des_hbpe_pervacenfabi || 0,
      des_hbpe_pervacfrasnoabi: user.des_hbpe_pervacfrasnoabi || 0,
      des_rota_dosapli: user.des_rota_dosapli || 0,
      des_rota_pervacenfabi: user.des_rota_pervacenfabi || 0,
      des_rota_pervacfrasnoabi: user.des_rota_pervacfrasnoabi || 0,
      des_pent_dosapli: user.des_pent_dosapli || 0,
      des_pent_pervacenfabi: user.des_pent_pervacenfabi || 0,
      des_pent_pervacfrasnoabi: user.des_pent_pervacfrasnoabi || 0,
      des_fipv_dosapli: user.des_fipv_dosapli || 0,
      des_fipv_pervacenfabi: user.des_fipv_pervacenfabi || 0,
      des_fipv_pervacfrasnoabi: user.des_fipv_pervacfrasnoabi || 0,
      des_anti_dosapli: user.des_anti_dosapli || 0,
      des_anti_pervacenfabi: user.des_anti_pervacenfabi || 0,
      des_anti_pervacfrasnoabi: user.des_anti_pervacfrasnoabi || 0,
      des_neum_dosapli: user.des_neum_dosapli || 0,
      des_neum_pervacenfabi: user.des_neum_pervacenfabi || 0,
      des_neum_pervacfrasnoabi: user.des_neum_pervacfrasnoabi || 0,
      des_sr_dosapli: user.des_sr_dosapli || 0,
      des_sr_pervacenfabi: user.des_sr_pervacenfabi || 0,
      des_sr_pervacfrasnoabi: user.des_sr_pervacfrasnoabi || 0,
      des_srp_dosapli: user.des_srp_dosapli || 0,
      des_srp_pervacenfabi: user.des_srp_pervacenfabi || 0,
      des_srp_pervacfrasnoabi: user.des_srp_pervacfrasnoabi || 0,
      des_vari_dosapli: user.des_vari_dosapli || 0,
      des_vari_pervacenfabi: user.des_vari_pervacenfabi || 0,
      des_vari_pervacfrasnoabi: user.des_vari_pervacfrasnoabi || 0,
      des_fieb_dosapli: user.des_fieb_dosapli || 0,
      des_fieb_pervacenfabi: user.des_fieb_pervacenfabi || 0,
      des_fieb_pervacfrasnoabi: user.des_fieb_pervacfrasnoabi || 0,
      des_dift_dosapli: user.des_dift_dosapli || 0,
      des_dift_pervacenfabi: user.des_dift_pervacenfabi || 0,
      des_dift_pervacfrasnoabi: user.des_dift_pervacfrasnoabi || 0,
      des_hpv_dosapli: user.des_hpv_dosapli || 0,
      des_hpv_pervacenfabi: user.des_hpv_pervacenfabi || 0,
      des_hpv_pervacfrasnoabi: user.des_hpv_pervacfrasnoabi || 0,
      des_dtad_dosapli: user.des_dtad_dosapli || 0,
      des_dtad_pervacenfabi: user.des_dtad_pervacenfabi || 0,
      des_dtad_pervacfrasnoabi: user.des_dtad_pervacfrasnoabi || 0,
      des_hepa_dosapli: user.des_hepa_dosapli || 0,
      des_hepa_pervacenfabi: user.des_hepa_pervacenfabi || 0,
      des_hepa_pervacfrasnoabi: user.des_hepa_pervacfrasnoabi || 0,
      des_inmant_dosapli: user.des_inmant_dosapli || 0,
      des_inmant_pervacenfabi: user.des_inmant_pervacenfabi || 0,
      des_inmant_pervacfrasnoabi: user.des_inmant_pervacfrasnoabi || 0,
      des_inmanthepb_dosapli: user.des_inmanthepb_dosapli || 0,
      des_inmanthepb_pervacenfabi: user.des_inmanthepb_pervacenfabi || 0,
      des_inmanthepb_pervacfrasnoabi: user.des_inmanthepb_pervacfrasnoabi || 0,
      des_inmantrra_dosapli: user.des_inmantrra_dosapli || 0,
      des_inmantrra_pervacenfabi: user.des_inmantrra_pervacenfabi || 0,
      des_inmantrra_pervacfrasnoabi: user.des_inmantrra_pervacfrasnoabi || 0,
      des_infped_dosapli: user.des_infped_dosapli || 0,
      des_infped_pervacenfabi: user.des_infped_pervacenfabi || 0,
      des_infped_pervacfrasnoabi: user.des_infped_pervacfrasnoabi || 0,
      des_infadu_dosapli: user.des_infadu_dosapli || 0,
      des_infadu_pervacenfabi: user.des_infadu_pervacenfabi || 0,
      des_infadu_pervacfrasnoabi: user.des_infadu_pervacfrasnoabi || 0,
      des_viru_dosapli: user.des_viru_dosapli || 0,
      des_viru_pervacenfabi: user.des_viru_pervacenfabi || 0,
      des_viru_pervacfrasnoabi: user.des_viru_pervacfrasnoabi || 0,
      des_vacsin_dosapli: user.des_vacsin_dosapli || 0,
      des_vacsin_pervacenfabi: user.des_vacsin_pervacenfabi || 0,
      des_vacsin_pervacfrasnoabi: user.des_vacsin_pervacfrasnoabi || 0,
      des_vacpfi_dosapli: user.des_vacpfi_dosapli || 0,
      des_vacpfi_pervacenfabi: user.des_vacpfi_pervacenfabi || 0,
      des_vacpfi_pervacfrasnoabi: user.des_vacpfi_pervacfrasnoabi || 0,
      des_vacmod_dosapli: user.des_vacmod_dosapli || 0,
      des_vacmod_pervacenfabi: user.des_vacmod_pervacenfabi || 0,
      des_vacmod_pervacfrasnoabi: user.des_vacmod_pervacfrasnoabi || 0,
      des_vacvphcam_dosapli: user.des_vacvphcam_dosapli || 0,
      des_vacvphcam_pervacenfabi: user.des_vacvphcam_pervacenfabi || 0,
      des_vacvphcam_pervacfrasnoabi: user.des_vacvphcam_pervacfrasnoabi || 0,
    };
  };

  return (
    <div className="container">
      <div className="flex items-center justify-center">
        <InputField
          htmlFor="txtMesAnioDes"
          label={"AAAA-MM"}
          type="month"
          name="txtMesAnioDes"
          id="txtMesAnioDes"
          value={selectedMonthYear}
          onChange={valRegAnoMes}
          placeholder="AAAA-MM"
          icon=""
          isButtonIcon={false}
        />
        <button
          type="button"
          id="btnBuscarTabDes"
          name="btnBuscarTabDes"
          className={`${buttonStylePrimario} ${
            !isValid
              ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
          }`}
          onClick={handleSearch}
          disabled={!isValid}
        >
          Buscar
        </button>
      </div>
      <div className="flex flex-col">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full py-2">
            <div className="overflow-hidden">
              <table className="min-w-full text-xs text-left text-gray-100 dark:text-gray-800">
                <thead className="text-center text-gray-100 bg-gray-50 dark:bg-gray-100 dark:text-gray-100 tracking-tighter border-2">
                  <tr>
                    {[
                      "Acciones",
                      "Fecha de registro",
                      "BCG Dosis aplicadas",
                      "BCG Perdida de vacuna en frasco abierto",
                      "BCG Perdida de vacuna en frasco no abierto",
                      "HB PEDIATRICA Dosis aplicadas",
                      "HB PEDIATRICA Perdida de vacuna en frasco abierto",
                      "HB PEDIATRICA Perdida de vacuna en frasco no abierto",
                      "ROTAVIRUS Dosis aplicadas",
                      "ROTAVIRUS Perdida de vacuna en frasco abierto",
                      "ROTAVIRUS Perdida de vacuna en frasco no abierto",
                      "PENTAVALENTE (DPT-HB-Hib) Dosis aplicadas",
                      "PENTAVALENTE (DPT-HB-Hib) Perdida de vacuna en frasco abierto",
                      "PENTAVALENTE (DPT-HB-Hib) Perdida de vacuna en frasco no abierto",
                      "fIPV Dosis aplicadas",
                      "fIPV Perdida de vacuna en frasco abierto",
                      "fIPV Perdida de vacuna en frasco no abierto",
                      "ANTIPOLIOMIELITICA ORAL (OPV) Dosis aplicadas",
                      "ANTIPOLIOMIELITICA ORAL (OPV) Perdida de vacuna en frasco abierto",
                      "ANTIPOLIOMIELITICA ORAL (OPV) Perdida de vacuna en frasco no abierto",
                      "NEUMOCOCO CONJUGADA Dosis aplicadas",
                      "NEUMOCOCO CONJUGADA Perdida de vacuna en frasco abierto",
                      "NEUMOCOCO CONJUGADA Perdida de vacuna en frasco no abierto",
                      "SR Dosis aplicadas",
                      "SR Perdida de vacuna en frasco abierto",
                      "SR Perdida de vacuna en frasco no abierto",
                      "SRP Dosis aplicadas",
                      "SRP Perdida de vacuna en frasco abierto",
                      "SRP Perdida de vacuna en frasco no abierto",
                      "Varicela Dosis aplicadas",
                      "Varicela Perdida de vacuna en frasco abierto",
                      "Varicela Perdida de vacuna en frasco no abierto",
                      "Fiebre Amarilla Dosis aplicadas",
                      "Fiebre Amarilla Perdida de vacuna en frasco abierto",
                      "Fiebre Amarilla Perdida de vacuna en frasco no abierto",
                      "DIFTERIA, TOSFERINA Y TETANOS (DPT) REF Dosis aplicadas",
                      "DIFTERIA, TOSFERINA Y TETANOS (DPT) REF Perdida de vacuna en frasco abierto",
                      "DIFTERIA, TOSFERINA Y TETANOS (DPT) REF Perdida de vacuna en frasco no abierto",
                      "HPV Dosis aplicadas",
                      "HPV Perdida de vacuna en frasco abierto",
                      "HPV Perdida de vacuna en frasco no abierto",
                      "dT adultos Dosis aplicadas",
                      "dT adultos Perdida de vacuna en frasco abierto",
                      "dT adultos Perdida de vacuna en frasco no abierto",
                      "HEPATITIS B ADULTO Dosis aplicadas",
                      "HEPATITIS B ADULTO Perdida de vacuna en frasco abierto",
                      "HEPATITIS B ADULTO Perdida de vacuna en frasco no abierto",
                      "Inmunoglobulina_Antitetánica Dosis aplicadas",
                      "Inmunoglobulina_Antitetánica Perdida de vacuna en frasco abierto",
                      "Inmunoglobulina_Antitetánica Perdida de vacuna en frasco no abierto",
                      "Inmunoglobulina_Anti Hepatitis B Dosis aplicadas",
                      "Inmunoglobulina_Anti Hepatitis B Perdida de vacuna en frasco abierto",
                      "Inmunoglobulina_Anti Hepatitis B Perdida de vacuna en frasco no abierto",
                      "Inmunoglobulina_Antirrábica Dosis aplicadas",
                      "Inmunoglobulina_Antirrábica Perdida de vacuna en frasco abierto",
                      "Inmunoglobulina_Antirrábica Perdida de vacuna en frasco no abierto",
                      "INFLUENZA PEDIATRICA Dosis aplicadas",
                      "INFLUENZA PEDIATRICA Perdida de vacuna en frasco abierto",
                      "INFLUENZA PEDIATRICA Perdida de vacuna en frasco no abierto",
                      "INFLUENZA ADULTOS Dosis aplicadas",
                      "INFLUENZA ADULTOS Perdida de vacuna en frasco abierto",
                      "INFLUENZA ADULTOS Perdida de vacuna en frasco no abierto",
                      "VIRUELA SIMICA Dosis aplicadas",
                      "VIRUELA SIMICA Perdida de vacuna en frasco abierto",
                      "VIRUELA SIMICA Perdida de vacuna en frasco no abierto",
                      "VACUNA SINOVAC Dosis aplicadas",
                      "VACUNA SINOVAC Perdida de vacuna en frasco abierto",
                      "VACUNA SINOVAC Perdida de vacuna en frasco no abierto",
                      "VACUNA PFIZER Dosis aplicadas",
                      "VACUNA PFIZER Perdida de vacuna en frasco abierto",
                      "VACUNA PFIZER Perdida de vacuna en frasco no abierto",
                      "VACUNA MODERNA Dosis aplicadas",
                      "VACUNA MODERNA Perdida de vacuna en frasco abierto",
                      "VACUNA MODERNA Perdida de vacuna en frasco no abierto",
                      "VACUNA VPH CAMPAÑA Dosis aplicadas",
                      "VACUNA VPH CAMPAÑA Perdida de vacuna en frasco abierto",
                      "VACUNA VPH CAMPAÑA Perdida de vacuna en frasco no abierto",
                    ].map((header) => (
                      <th
                        key={header}
                        className="w-20 px-0 py-2 text-gray-900 border-x-2"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white border">
                  {Array.isArray(currentRows) && currentRows.length > 0 ? (
                    currentRows.map((registro) => (
                      <tr key={registro.id}>
                        <td className="whitespace-nowrap px-1 py-1 border">
                          {registro.des_tota ? (
                            "Total"
                          ) : (
                            <>
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
                            </>
                          )}
                        </td>
                        {Object.keys(registro)
                          .filter(
                            (key) =>
                              key !== "id" &&
                              key !== "des_tota" &&
                              key !== "eniUser"
                          )
                          .map((key) => {
                            let cellContent = registro[key];
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="100%">No hay datos disponibles</td>
                    </tr>
                  )}
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
};
TablaDesperdicio.propTypes = {
  setIsIdDes: PropTypes.func.isRequired,
  setFormData: PropTypes.func.isRequired,
  storedUserId: PropTypes.number.isRequired,
  yearDes: PropTypes.number.isRequired,
  monthDes: PropTypes.number.isRequired,
  setBotonEstado: PropTypes.func.isRequired,
  setIsInputEstado: PropTypes.func.isRequired,
  setIsLoading: PropTypes.func.isRequired,
  setSuccessMessage: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
};

export default TablaDesperdicio;
