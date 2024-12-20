import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaEdit, FaTrash } from "react-icons/fa";
import { getMesInfluenza, deleteInfluenza } from "../api/conexion.api.js";
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

const TablaInfluenza = ({
  setIsIdInf,
  setFormData,
  storedUserId,
  fechaInput,
  setBotonEstado,
  setIsInputEstado,
  setIsLoading,
  setSuccessMessage,
  setError,
}) => {
  const [eniUsers, setEniUsers] = useState([]);
  const storedDateFecha =
    localStorage.getItem("dateInputFech") ||
    new Date().toISOString().slice(0, 10);
  const [yearInf, monthInf] = storedDateFecha.split("-");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const getMonthName = (monthNumber) => {
    const months = [
      "ENERO",
      "FEBRERO",
      "MARZO",
      "ABRIL",
      "MAYO",
      "JUNIO",
      "JULIO",
      "AGOSTO",
      "SEPTIEMBRE",
      "OCTUBRE",
      "NOVIEMBRE",
      "DICIEMBRE",
    ];
    return months[parseInt(monthNumber, 10) - 1];
  };

  useEffect(() => {
    if (fechaInput) {
      localStorage.setItem("dateInputFech", fechaInput);
    }
    const loadInfluenza = async () => {
      try {
        const data = await getMesInfluenza(storedUserId, monthInf, yearInf);
        setEniUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        setError(error.message);
      }
    };
    loadInfluenza();
  }, [fechaInput, monthInf, yearInf, storedUserId, setError]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = Array.isArray(eniUsers)
    ? eniUsers.slice(indexOfFirstRow, indexOfLastRow)
    : [];

  const totalPages = Math.ceil(eniUsers.length / rowsPerPage);

  const handleEdit = (id) => {
    const user = eniUsers.find((user) => user.id === id);
    if (user) {
      setIsIdInf(id);
      setFormData(getFormData(user));
      setBotonEstado({ btnBuscarTabInf: true });
    }
  };

  const handleDelete = async (id) => {
    const user = eniUsers.find((user) => user.id === id);
    if (user) {
      if (!confirmDelete(user)) return;

      setIsLoading(true);
      try {
        let inf_fech = user.inf_fech;

        const [dia, mes, año] = inf_fech.split("/");
        if (dia && mes && año) {
          inf_fech = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
        }

        const formData = {
          eniUser: user.eniUser,
          inf_fech: inf_fech,
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
      `¿Estás seguro de que deseas eliminar este registro?\nFecha: ${user.inf_fech}`
    );
  };

  const deleteUserAndUpdateState = async (id, formData) => {
    const response = await deleteInfluenza(id, formData);
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
    if (user.inf_fech) {
      const [day, month, year] = user.inf_fech.split("/");
      if (day && month && year) {
        const date = new Date(year, parseInt(month) - 1, day);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split("T")[0];
        }
      }
    }
    return {
      inf_fech: formattedDate,
      inf_intr: user.inf_intr || 0,
      inf_extr_mies_cnh: user.inf_extr_mies_cnh || 0,
      inf_extr_mies_cibv: user.inf_extr_mies_cibv || 0,
      inf_extr_mine_egen: user.inf_extr_mine_egen || 0,
      inf_extr_mine_bach: user.inf_extr_mine_bach || 0,
      inf_extr_visi: user.inf_extr_visi || 0,
      inf_extr_aten: user.inf_extr_aten || 0,
      inf_otro: user.inf_otro || 0,
      inf_sexo_homb: user.inf_sexo_homb || 0,
      inf_sexo_muje: user.inf_sexo_muje || 0,
      inf_luga_pert: user.inf_luga_pert || 0,
      inf_luga_nope: user.inf_luga_nope || 0,
      inf_naci_ecua: user.inf_naci_ecua || 0,
      inf_naci_colo: user.inf_naci_colo || 0,
      inf_naci_peru: user.inf_naci_peru || 0,
      inf_naci_cuba: user.inf_naci_cuba || 0,
      inf_naci_vene: user.inf_naci_vene || 0,
      inf_naci_otro: user.inf_naci_otro || 0,
      inf_auto_indi: user.inf_auto_indi || 0,
      inf_auto_afro: user.inf_auto_afro || 0,
      inf_auto_negr: user.inf_auto_negr || 0,
      inf_auto_mula: user.inf_auto_mula || 0,
      inf_auto_mont: user.inf_auto_mont || 0,
      inf_auto_mest: user.inf_auto_mest || 0,
      inf_auto_blan: user.inf_auto_blan || 0,
      inf_auto_otro: user.inf_auto_otro || 0,
      inf_naci_achu: user.inf_naci_achu || 0,
      inf_naci_ando: user.inf_naci_ando || 0,
      inf_naci_awa: user.inf_naci_awa || 0,
      inf_naci_chac: user.inf_naci_chac || 0,
      inf_naci_cofa: user.inf_naci_cofa || 0,
      inf_naci_eper: user.inf_naci_eper || 0,
      inf_naci_huan: user.inf_naci_huan || 0,
      inf_naci_kich: user.inf_naci_kich || 0,
      inf_naci_mant: user.inf_naci_mant || 0,
      inf_naci_seco: user.inf_naci_seco || 0,
      inf_naci_shiw: user.inf_naci_shiw || 0,
      inf_naci_shua: user.inf_naci_shua || 0,
      inf_naci_sion: user.inf_naci_sion || 0,
      inf_naci_tsac: user.inf_naci_tsac || 0,
      inf_naci_waor: user.inf_naci_waor || 0,
      inf_naci_zapa: user.inf_naci_zapa || 0,
      inf_pueb_chib: user.inf_pueb_chib || 0,
      inf_pueb_kana: user.inf_pueb_kana || 0,
      inf_pueb_kara: user.inf_pueb_kara || 0,
      inf_pueb_kaya: user.inf_pueb_kaya || 0,
      inf_pueb_kich: user.inf_pueb_kich || 0,
      inf_pueb_kisa: user.inf_pueb_kisa || 0,
      inf_pueb_kitu: user.inf_pueb_kitu || 0,
      inf_pueb_nata: user.inf_pueb_nata || 0,
      inf_pueb_otav: user.inf_pueb_otav || 0,
      inf_pueb_palt: user.inf_pueb_palt || 0,
      inf_pueb_panz: user.inf_pueb_panz || 0,
      inf_pueb_past: user.inf_pueb_past || 0,
      inf_pueb_puru: user.inf_pueb_puru || 0,
      inf_pueb_sala: user.inf_pueb_sala || 0,
      inf_pueb_sara: user.inf_pueb_sara || 0,
      inf_pueb_toma: user.inf_pueb_toma || 0,
      inf_pueb_wara: user.inf_pueb_wara || 0,
      inf_6a11_prim: user.inf_6a11_prim || 0,
      inf_6a11_segu: user.inf_6a11_segu || 0,
      inf_1ano_dosi: user.inf_1ano_dosi || 0,
      inf_2ano_dosi: user.inf_2ano_dosi || 0,
      inf_3ano_dosi: user.inf_3ano_dosi || 0,
      inf_4ano_dosi: user.inf_4ano_dosi || 0,
      inf_5ano_dosi: user.inf_5ano_dosi || 0,
      inf_6ano_dosi: user.inf_6ano_dosi || 0,
      inf_7ano_dosi: user.inf_7ano_dosi || 0,
      inf_65an_dosi: user.inf_65an_dosi || 0,
      inf_emba_dosi: user.inf_emba_dosi || 0,
      inf_8a64_dosi: user.inf_8a64_dosi || 0,
      inf_puer_dosi: user.inf_puer_dosi || 0,
      inf_pers_salu_dosi: user.inf_pers_salu_dosi || 0,
      inf_pers_disc_dosi: user.inf_pers_disc_dosi || 0,
      inf_cuid_adul_dosi: user.inf_cuid_adul_dosi || 0,
      inf_pers_cuid_dosi: user.inf_pers_cuid_dosi || 0,
      inf_trab_avic_dosi: user.inf_trab_avic_dosi || 0,
      inf_ppl_dosi: user.inf_ppl_dosi || 0,
      inf_otro_ries_dosi: user.inf_otro_ries_dosi || 0,
      inf_pobl_gene_dosi: user.inf_pobl_gene_dosi || 0,
    };
  };

  return (
    <div className="container">
      <div className="flex items-center justify-center">
        <h1 className="text-lg font-bold text-center text-green-50 dark:text-black">
          Para localizar los meses en la tabla, es necesario seleccionar el
          registro de la fecha correspondiente al mes de{" "}
          {getMonthName(monthInf)} del año {yearInf}.
        </h1>
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
                      "6 A 11 MESES Primera dosis",
                      "6 A 11 MESES Segunda dosis ",
                      "1 año Dosis Única",
                      "2 años Dosis Única",
                      "3 años Dosis Única",
                      "4 años Dosis Única",
                      "5 años Dosis Única",
                      "6 años Dosis Única",
                      "7 años Dosis Única",
                      "65 años y más Dosis Única",
                      "Embarazadas Dosis Única",
                      "8 a 64 años con enfermedades crónicas Dosis Única",
                      "Puérperas Dosis Única",
                      "Personal de salud Dosis Única",
                      "Personas con Discapacidad Dosis Única",
                      "Cuidadores de adultos mayores y/ o personas con discapacidad Dosis Única",
                      "Personal que labora en los centros de cuidados infantiles. Dosis Única",
                      "Trabajadores de avícolas de críaderos de cerdos Dosis Única",
                      "PPL Dosis Única",
                      "Otros grupos de riesgo (Docentes, policias, bomberos, recolectores de basura, recicladores, fuerzas armadas) Dosis Única",
                      "Población general (Tripulación y personal que labora en terminales aéreos, terrestres y marítimos) Dosis Única",
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
                          {registro.inf_tota ? (
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
                              key !== "inf_tota" &&
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
TablaInfluenza.propTypes = {
  setIsIdInf: PropTypes.func.isRequired,
  setFormData: PropTypes.func.isRequired,
  storedUserId: PropTypes.number.isRequired,
  fechaInput: PropTypes.string.isRequired,
  setBotonEstado: PropTypes.func.isRequired,
  setIsInputEstado: PropTypes.func.isRequired,
  setIsLoading: PropTypes.func.isRequired,
  setSuccessMessage: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
};

export default TablaInfluenza;
