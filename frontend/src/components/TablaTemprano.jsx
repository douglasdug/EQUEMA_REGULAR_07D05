import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaEdit, FaTrash } from "react-icons/fa";
import { getMesTemprano, deleteTemprano } from "../api/conexion.api.js";
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

const TablaTemprano = ({
  setIsIdTem,
  setFormData,
  storedUserId,
  yearTem,
  monthTem,
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
    console.log("txtMesAnioTem", selectedMonthYear);
    const [yearTem, monthTem] = selectedMonthYear.split("-");
    const loadTemprano = async () => {
      try {
        const data = await getMesTemprano(storedUserId, monthTem, yearTem);
        setEniUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        setError(error.message);
      }
    };
    loadTemprano();
  }, [setError, selectedMonthYear]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = Array.isArray(eniUsers)
    ? eniUsers.slice(indexOfFirstRow, indexOfLastRow)
    : [];

  const totalPages = Math.ceil(eniUsers.length / rowsPerPage);

  const handleSearch = async () => {
    if (selectedMonthYear) {
      const [yearTem, monthTem] = selectedMonthYear.split("-");
      try {
        const data = await getMesTemprano(storedUserId, monthTem, yearTem);
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
      setIsIdTem(id);
      setFormData(getFormData(user));
      setBotonEstado({ btnBuscarTabTem: true });
      setIsInputEstado({
        input: true,
        tem_fech: true,
      });
    }
  };

  const handleDelete = async (id) => {
    const user = eniUsers.find((user) => user.id === id);
    if (user) {
      if (!confirmDelete(user)) return;

      setIsLoading(true);
      try {
        await deleteUserAndUpdateState(id);
      } catch (error) {
        handleDeleteError(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const confirmDelete = (user) => {
    return window.confirm(
      `¿Estás seguro de que deseas eliminar este registro?\nFecha: ${user.tem_fech}`
    );
  };

  const deleteUserAndUpdateState = async (id) => {
    const response = await deleteTemprano(id);
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
    if (user.tem_fech) {
      const [day, month, year] = user.tem_fech.split("/");
      if (day && month && year) {
        const date = new Date(year, parseInt(month) - 1, day);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split("T")[0];
        }
      }
    }
    return {
      tem_fech: formattedDate,
      tem_intr: user.tem_intr || 0,
      tem_extr_mies_cnh: user.tem_extr_mies_cnh || 0,
      tem_extr_mies_cibv: user.tem_extr_mies_cibv || 0,
      tem_extr_mine_egen: user.tem_extr_mine_egen || 0,
      tem_extr_mine_bach: user.tem_extr_mine_bach || 0,
      tem_extr_visi: user.tem_extr_visi || 0,
      tem_extr_aten: user.tem_extr_aten || 0,
      tem_otro: user.tem_otro || 0,
      tem_sexo_homb: user.tem_sexo_homb || 0,
      tem_sexo_muje: user.tem_sexo_muje || 0,
      tem_luga_pert: user.tem_luga_pert || 0,
      tem_luga_nope: user.tem_luga_nope || 0,
      tem_naci_ecua: user.tem_naci_ecua || 0,
      tem_naci_colo: user.tem_naci_colo || 0,
      tem_naci_peru: user.tem_naci_peru || 0,
      tem_naci_cuba: user.tem_naci_cuba || 0,
      tem_naci_vene: user.tem_naci_vene || 0,
      tem_naci_otro: user.tem_naci_otro || 0,
      tem_auto_indi: user.tem_auto_indi || 0,
      tem_auto_afro: user.tem_auto_afro || 0,
      tem_auto_negr: user.tem_auto_negr || 0,
      tem_auto_mula: user.tem_auto_mula || 0,
      tem_auto_mont: user.tem_auto_mont || 0,
      tem_auto_mest: user.tem_auto_mest || 0,
      tem_auto_blan: user.tem_auto_blan || 0,
      tem_auto_otro: user.tem_auto_otro || 0,
      tem_naci_achu: user.tem_naci_achu || 0,
      tem_naci_ando: user.tem_naci_ando || 0,
      tem_naci_awa: user.tem_naci_awa || 0,
      tem_naci_chac: user.tem_naci_chac || 0,
      tem_naci_cofa: user.tem_naci_cofa || 0,
      tem_naci_eper: user.tem_naci_eper || 0,
      tem_naci_huan: user.tem_naci_huan || 0,
      tem_naci_kich: user.tem_naci_kich || 0,
      tem_naci_mant: user.tem_naci_mant || 0,
      tem_naci_seco: user.tem_naci_seco || 0,
      tem_naci_shiw: user.tem_naci_shiw || 0,
      tem_naci_shua: user.tem_naci_shua || 0,
      tem_naci_sion: user.tem_naci_sion || 0,
      tem_naci_tsac: user.tem_naci_tsac || 0,
      tem_naci_waor: user.tem_naci_waor || 0,
      tem_naci_zapa: user.tem_naci_zapa || 0,
      tem_pueb_chib: user.tem_pueb_chib || 0,
      tem_pueb_kana: user.tem_pueb_kana || 0,
      tem_pueb_kara: user.tem_pueb_kara || 0,
      tem_pueb_kaya: user.tem_pueb_kaya || 0,
      tem_pueb_kich: user.tem_pueb_kich || 0,
      tem_pueb_kisa: user.tem_pueb_kisa || 0,
      tem_pueb_kitu: user.tem_pueb_kitu || 0,
      tem_pueb_nata: user.tem_pueb_nata || 0,
      tem_pueb_otav: user.tem_pueb_otav || 0,
      tem_pueb_palt: user.tem_pueb_palt || 0,
      tem_pueb_panz: user.tem_pueb_panz || 0,
      tem_pueb_past: user.tem_pueb_past || 0,
      tem_pueb_puru: user.tem_pueb_puru || 0,
      tem_pueb_sala: user.tem_pueb_sala || 0,
      tem_pueb_sara: user.tem_pueb_sara || 0,
      tem_pueb_toma: user.tem_pueb_toma || 0,
      tem_pueb_wara: user.tem_pueb_wara || 0,
      tem_men1_dosi_bcgp: user.tem_men1_dosi_bcgp || 0,
      tem_men1_dosi_hbpr: user.tem_men1_dosi_hbpr || 0,
      tem_men1_dosi_bcgd: user.tem_men1_dosi_bcgd || 0,
      tem_men1_1rad_rota: user.tem_men1_1rad_rota || 0,
      tem_men1_1rad_fipv: user.tem_men1_1rad_fipv || 0,
      tem_men1_1rad_neum: user.tem_men1_1rad_neum || 0,
      tem_men1_1rad_pent: user.tem_men1_1rad_pent || 0,
      tem_men1_2dad_rota: user.tem_men1_2dad_rota || 0,
      tem_men1_2dad_fipv: user.tem_men1_2dad_fipv || 0,
      tem_men1_2dad_neum: user.tem_men1_2dad_neum || 0,
      tem_men1_2dad_pent: user.tem_men1_2dad_pent || 0,
      tem_men1_3rad_bopv: user.tem_men1_3rad_bopv || 0,
      tem_men1_3rad_neum: user.tem_men1_3rad_neum || 0,
      tem_men1_3rad_pent: user.tem_men1_3rad_pent || 0,
      tem_12a23m_1rad_srp: user.tem_12a23m_1rad_srp || 0,
      tem_12a23m_dosi_fa: user.tem_12a23m_dosi_fa || 0,
      tem_12a23m_dosi_vari: user.tem_12a23m_dosi_vari || 0,
      tem_12a23m_2dad_srp: user.tem_12a23m_2dad_srp || 0,
      tem_12a23m_4tad_bopv: user.tem_12a23m_4tad_bopv || 0,
      tem_12a23m_4tad_dpt: user.tem_12a23m_4tad_dpt || 0,
      tem_5ano_5tad_bopv: user.tem_5ano_5tad_bopv || 0,
      tem_5ano_5tad_dpt: user.tem_5ano_5tad_dpt || 0,
      tem_9ano_1rad_hpv: user.tem_9ano_1rad_hpv || 0,
      tem_9ano_2dad_hpv: user.tem_9ano_2dad_hpv || 0,
      tem_10an_2dad_hpv: user.tem_10an_2dad_hpv || 0,
      tem_15an_terc_dtad: user.tem_15an_terc_dtad || 0,
    };
  };

  return (
    <div className="container">
      <div className="flex items-center justify-center">
        <InputField
          htmlFor="txtMesAnioTem"
          label={"AAAA-MM"}
          type="month"
          name="txtMesAnioTem"
          id="txtMesAnioTem"
          value={selectedMonthYear}
          onChange={valRegAnoMes}
          placeholder="AAAA-MM"
          icon=""
          isButtonIcon={false}
        />
        <button
          type="button"
          id="btnBuscarTabTem"
          name="btnBuscarTabTem"
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
                      "Intramural ",
                      "Extramural MIES CNH",
                      "Extramural MIES CIBV",
                      "Extramural MINEDUC E. General Básica",
                      "Extramural MINEDUC Bachillerato",
                      "Extramural VISITAS DOMICILIARIAS ",
                      "Extramural ATENCIÓN COMUNITARIA ",
                      "OTROS ",
                      "Sexo Hombre",
                      "Sexo Mujer",
                      "LUGAR DE RESIDENCIA HABITULA Pertenece al establecimiento de salud ",
                      "LUGAR DE RESIDENCIA HABITULA No pertenece al establecimiento de salud ",
                      "Nacionalidad Ecuatoriana ",
                      "Nacionalidad Colombiano ",
                      "Nacionalidad Peruano ",
                      "Nacionalidad Cubano ",
                      "Nacionalidad Venezolano ",
                      "Nacionalidad Otros ",
                      "Autoidentificación étnica Indigena ",
                      "Autoidentificación étnica Afro ecuatoriano/ Afro descendiente ",
                      "Autoidentificación étnica Negro/a ",
                      "Autoidentificación étnica Mulato/a ",
                      "Autoidentificación étnica Montubio/a ",
                      "Autoidentificación étnica Mestizo/a ",
                      "Autoidentificación étnica Blanco/a ",
                      "Autoidentificación étnica Otro ",
                      "NACIONALIDAD ETNICA Achuar ",
                      "NACIONALIDAD ETNICA Andoa ",
                      "NACIONALIDAD ETNICA Awa ",
                      "NACIONALIDAD ETNICA Chachi ",
                      "NACIONALIDAD ETNICA Cofan ",
                      "NACIONALIDAD ETNICA Epera ",
                      "NACIONALIDAD ETNICA Huancavilca ",
                      "NACIONALIDAD ETNICA Kichwa ",
                      "NACIONALIDAD ETNICA Manta ",
                      "NACIONALIDAD ETNICA Secoya ",
                      "NACIONALIDAD ETNICA Shiwiar ",
                      "NACIONALIDAD ETNICA Shuar ",
                      "NACIONALIDAD ETNICA Siona ",
                      "NACIONALIDAD ETNICA Tsáchila ",
                      "NACIONALIDAD ETNICA Waorani ",
                      "NACIONALIDAD ETNICA Zapara ",
                      "PUEBLOS Chibuleo ",
                      "PUEBLOS Kañari ",
                      "PUEBLOS Karanki ",
                      "PUEBLOS Kayambi ",
                      "PUEBLOS Kichwa Amazónico ",
                      "PUEBLOS Kisapincha ",
                      "PUEBLOS Kitukara ",
                      "PUEBLOS Natabuela ",
                      "PUEBLOS Otavalo ",
                      "PUEBLOS Paltas ",
                      "PUEBLOS Panzaleo ",
                      "PUEBLOS Pastos ",
                      "PUEBLOS Puruha ",
                      "PUEBLOS Salasaka ",
                      "PUEBLOS Saraguro ",
                      "PUEBLOS Tomabela ",
                      "PUEBLOS Waramka ",
                      "(0 a 11 meses) Dosis única BCG primeras 24 horas de nacido",
                      "(0 a 11 meses) Dosis única HB primeras 24 horas de nacido",
                      "(0 a 11 meses) Dosis única *BCG desde el 2do día de nacido hasta los 364 días (Tardía)",
                      "(0 a 11 meses) 1ra Dosis Rotavirus",
                      "(0 a 11 meses) 1ra Dosis fIPV",
                      "(0 a 11 meses) 1ra Dosis Neumococo",
                      "(0 a 11 meses) 1ra Dosis Pentavalente",
                      "(0 a 11 meses) 2da Dosis Rotavirus",
                      "(0 a 11 meses) 2da Dosis fIPV",
                      "(0 a 11 meses) 2da Dosis Neumococo",
                      "(0 a 11 meses) 2da Dosis Pentavalente",
                      "(0 a 11 meses) 3ra Dosis bOPV",
                      "(0 a 11 meses) 3ra Dosis Neumococo",
                      "(0 a 11 meses) 3ra Dosis Pentavalente",
                      "12 a 23 meses 1ra Dosis SRP",
                      "12 a 23 meses Dosis única FA",
                      "12 a 23 meses Dosis única Varicela",
                      "12 a 23 meses 2da Dosis SRP",
                      "12 a 23 meses 4ta Dosis bOPV",
                      "12 a 23 meses 4ta Dosis DPT",
                      "5 años 5ta Dosis bOPV",
                      "5 años 5ta Dosis DPT",
                      "9 AÑOS (NIÑAS) 1ra Dosis HPV",
                      "9 AÑOS (NIÑAS) 2da Dosis HPV",
                      "10 Años (NIÑAS) 2da Dosis HPV",
                      "15 años Tercer Refuerzo dT adulto",
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
                          {registro.tem_tota ? (
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
                              key !== "tem_tota" &&
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
TablaTemprano.propTypes = {
  setIsIdTem: PropTypes.func.isRequired,
  setFormData: PropTypes.func.isRequired,
  storedUserId: PropTypes.number.isRequired,
  yearTem: PropTypes.number.isRequired,
  monthTem: PropTypes.number.isRequired,
  setBotonEstado: PropTypes.func.isRequired,
  setIsInputEstado: PropTypes.func.isRequired,
  setIsLoading: PropTypes.func.isRequired,
  setSuccessMessage: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
};

export default TablaTemprano;
