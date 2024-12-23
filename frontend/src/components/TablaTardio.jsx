import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaEdit, FaTrash } from "react-icons/fa";
import { getMesTardio, deleteTardio } from "../api/conexion.api.js";
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

const TablaTardio = ({
  setIsIdTar,
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
  const [yearTar, monthTar] = storedDateFecha.split("-");
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
    const loadTardio = async () => {
      try {
        const data = await getMesTardio(storedUserId, monthTar, yearTar);
        setEniUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        setError(error.message);
      }
    };
    loadTardio();
  }, [fechaInput, monthTar, yearTar, storedUserId, setError]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = Array.isArray(eniUsers)
    ? eniUsers.slice(indexOfFirstRow, indexOfLastRow)
    : [];

  const totalPages = Math.ceil(eniUsers.length / rowsPerPage);

  const handleEdit = (id) => {
    const user = eniUsers.find((user) => user.id === id);
    if (user) {
      setIsIdTar(id);
      setFormData(getFormData(user));
      setBotonEstado({ btnBuscarTabTar: true });
      setIsInputEstado({
        input: true,
        tar_fech: true,
      });
    }
  };

  const handleDelete = async (id) => {
    const user = eniUsers.find((user) => user.id === id);
    if (user) {
      if (!confirmDelete(user)) return;

      setIsLoading(true);
      try {
        let tar_fech = user.tar_fech;

        const [dia, mes, año] = tar_fech.split("/");
        if (dia && mes && año) {
          tar_fech = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
        }

        const formData = {
          eniUser: user.eniUser,
          tar_fech: tar_fech,
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
      `¿Estás seguro de que deseas eliminar este registro?\nFecha: ${user.tar_fech}`
    );
  };

  const deleteUserAndUpdateState = async (id, formData) => {
    const response = await deleteTardio(id, formData);
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
    if (user.tar_fech) {
      const [day, month, year] = user.tar_fech.split("/");
      if (day && month && year) {
        const date = new Date(year, parseInt(month) - 1, day);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split("T")[0];
        }
      }
    }
    return {
      tar_fech: formattedDate,
      tar_intr: user.tar_intr || 0,
      tar_extr_mies_cnh: user.tar_extr_mies_cnh || 0,
      tar_extr_mies_cibv: user.tar_extr_mies_cibv || 0,
      tar_extr_mine_egen: user.tar_extr_mine_egen || 0,
      tar_extr_mine_bach: user.tar_extr_mine_bach || 0,
      tar_extr_visi: user.tar_extr_visi || 0,
      tar_extr_aten: user.tar_extr_aten || 0,
      tar_otro: user.tar_otro || 0,
      tar_sexo_homb: user.tar_sexo_homb || 0,
      tar_sexo_muje: user.tar_sexo_muje || 0,
      tar_luga_pert: user.tar_luga_pert || 0,
      tar_luga_nope: user.tar_luga_nope || 0,
      tar_naci_ecua: user.tar_naci_ecua || 0,
      tar_naci_colo: user.tar_naci_colo || 0,
      tar_naci_peru: user.tar_naci_peru || 0,
      tar_naci_cuba: user.tar_naci_cuba || 0,
      tar_naci_vene: user.tar_naci_vene || 0,
      tar_naci_otro: user.tar_naci_otro || 0,
      tar_auto_indi: user.tar_auto_indi || 0,
      tar_auto_afro: user.tar_auto_afro || 0,
      tar_auto_negr: user.tar_auto_negr || 0,
      tar_auto_mula: user.tar_auto_mula || 0,
      tar_auto_mont: user.tar_auto_mont || 0,
      tar_auto_mest: user.tar_auto_mest || 0,
      tar_auto_blan: user.tar_auto_blan || 0,
      tar_auto_otro: user.tar_auto_otro || 0,
      tar_naci_achu: user.tar_naci_achu || 0,
      tar_naci_ando: user.tar_naci_ando || 0,
      tar_naci_awa: user.tar_naci_awa || 0,
      tar_naci_chac: user.tar_naci_chac || 0,
      tar_naci_cofa: user.tar_naci_cofa || 0,
      tar_naci_eper: user.tar_naci_eper || 0,
      tar_naci_huan: user.tar_naci_huan || 0,
      tar_naci_kich: user.tar_naci_kich || 0,
      tar_naci_mant: user.tar_naci_mant || 0,
      tar_naci_seco: user.tar_naci_seco || 0,
      tar_naci_shiw: user.tar_naci_shiw || 0,
      tar_naci_shua: user.tar_naci_shua || 0,
      tar_naci_sion: user.tar_naci_sion || 0,
      tar_naci_tsac: user.tar_naci_tsac || 0,
      tar_naci_waor: user.tar_naci_waor || 0,
      tar_naci_zapa: user.tar_naci_zapa || 0,
      tar_pueb_chib: user.tar_pueb_chib || 0,
      tar_pueb_kana: user.tar_pueb_kana || 0,
      tar_pueb_kara: user.tar_pueb_kara || 0,
      tar_pueb_kaya: user.tar_pueb_kaya || 0,
      tar_pueb_kich: user.tar_pueb_kich || 0,
      tar_pueb_kisa: user.tar_pueb_kisa || 0,
      tar_pueb_kitu: user.tar_pueb_kitu || 0,
      tar_pueb_nata: user.tar_pueb_nata || 0,
      tar_pueb_otav: user.tar_pueb_otav || 0,
      tar_pueb_palt: user.tar_pueb_palt || 0,
      tar_pueb_panz: user.tar_pueb_panz || 0,
      tar_pueb_past: user.tar_pueb_past || 0,
      tar_pueb_puru: user.tar_pueb_puru || 0,
      tar_pueb_sala: user.tar_pueb_sala || 0,
      tar_pueb_sara: user.tar_pueb_sara || 0,
      tar_pueb_toma: user.tar_pueb_toma || 0,
      tar_pueb_wara: user.tar_pueb_wara || 0,
      tar_1ano_1rad_fipv: user.tar_1ano_1rad_fipv || 0,
      tar_1ano_1rad_hbpe: user.tar_1ano_1rad_hbpe || 0,
      tar_1ano_1rad_dpt: user.tar_1ano_1rad_dpt || 0,
      tar_1ano_2dad_fipv: user.tar_1ano_2dad_fipv || 0,
      tar_1ano_2dad_hbpe: user.tar_1ano_2dad_hbpe || 0,
      tar_1ano_2dad_dpt: user.tar_1ano_2dad_dpt || 0,
      tar_1ano_3rad_bopv: user.tar_1ano_3rad_bopv || 0,
      tar_1ano_3rad_hbpe: user.tar_1ano_3rad_hbpe || 0,
      tar_1ano_3rad_dpt: user.tar_1ano_3rad_dpt || 0,
      tar_2ano_1rad_fipv: user.tar_2ano_1rad_fipv || 0,
      tar_2ano_1rad_srp: user.tar_2ano_1rad_srp || 0,
      tar_2ano_1rad_hbpe: user.tar_2ano_1rad_hbpe || 0,
      tar_2ano_1rad_dpt: user.tar_2ano_1rad_dpt || 0,
      tar_2ano_2dad_fipv: user.tar_2ano_2dad_fipv || 0,
      tar_2ano_2dad_srp: user.tar_2ano_2dad_srp || 0,
      tar_2ano_2dad_hbpe: user.tar_2ano_2dad_hbpe || 0,
      tar_2ano_2dad_dpt: user.tar_2ano_2dad_dpt || 0,
      tar_2ano_3rad_bopv: user.tar_2ano_3rad_bopv || 0,
      tar_2ano_3rad_hbpe: user.tar_2ano_3rad_hbpe || 0,
      tar_2ano_3rad_dpt: user.tar_2ano_3rad_dpt || 0,
      tar_2ano_4tad_bopv: user.tar_2ano_4tad_bopv || 0,
      tar_2ano_4tad_dpt: user.tar_2ano_4tad_dpt || 0,
      tar_2ano_dosi_fa: user.tar_2ano_dosi_fa || 0,
      tar_3ano_1rad_fipv: user.tar_3ano_1rad_fipv || 0,
      tar_3ano_1rad_srp: user.tar_3ano_1rad_srp || 0,
      tar_3ano_1rad_hbpe: user.tar_3ano_1rad_hbpe || 0,
      tar_3ano_1rad_dpt: user.tar_3ano_1rad_dpt || 0,
      tar_3ano_2dad_fipv: user.tar_3ano_2dad_fipv || 0,
      tar_3ano_2dad_srp: user.tar_3ano_2dad_srp || 0,
      tar_3ano_2dad_hbpe: user.tar_3ano_2dad_hbpe || 0,
      tar_3ano_2dad_dpt: user.tar_3ano_2dad_dpt || 0,
      tar_3ano_3rad_bopv: user.tar_3ano_3rad_bopv || 0,
      tar_3ano_3rad_hbpe: user.tar_3ano_3rad_hbpe || 0,
      tar_3ano_3rad_dpt: user.tar_3ano_3rad_dpt || 0,
      tar_3ano_4tad_bopv: user.tar_3ano_4tad_bopv || 0,
      tar_3ano_4tad_dpt: user.tar_3ano_4tad_dpt || 0,
      tar_3ano_dosi_fa: user.tar_3ano_dosi_fa || 0,
      tar_4ano_1rad_fipv: user.tar_4ano_1rad_fipv || 0,
      tar_4ano_1rad_srp: user.tar_4ano_1rad_srp || 0,
      tar_4ano_1rad_hbpe: user.tar_4ano_1rad_hbpe || 0,
      tar_4ano_1rad_dpt: user.tar_4ano_1rad_dpt || 0,
      tar_4ano_2dad_fipv: user.tar_4ano_2dad_fipv || 0,
      tar_4ano_2dad_srp: user.tar_4ano_2dad_srp || 0,
      tar_4ano_2dad_hbpe: user.tar_4ano_2dad_hbpe || 0,
      tar_4ano_2dad_dpt: user.tar_4ano_2dad_dpt || 0,
      tar_4ano_3rad_bopv: user.tar_4ano_3rad_bopv || 0,
      tar_4ano_3rad_hbpe: user.tar_4ano_3rad_hbpe || 0,
      tar_4ano_3rad_dpt: user.tar_4ano_3rad_dpt || 0,
      tar_4ano_4tad_bopv: user.tar_4ano_4tad_bopv || 0,
      tar_4ano_4tad_dpt: user.tar_4ano_4tad_dpt || 0,
      tar_4ano_dosi_fa: user.tar_4ano_dosi_fa || 0,
      tar_5ano_1rad_ipv: user.tar_5ano_1rad_ipv || 0,
      tar_5ano_1rad_srp: user.tar_5ano_1rad_srp || 0,
      tar_5ano_1rad_hbpe: user.tar_5ano_1rad_hbpe || 0,
      tar_5ano_1rad_dpt: user.tar_5ano_1rad_dpt || 0,
      tar_5ano_2dad_fipv: user.tar_5ano_2dad_fipv || 0,
      tar_5ano_2dad_srp: user.tar_5ano_2dad_srp || 0,
      tar_5ano_2dad_hbpe: user.tar_5ano_2dad_hbpe || 0,
      tar_5ano_2dad_dpt: user.tar_5ano_2dad_dpt || 0,
      tar_5ano_3rad_bopv: user.tar_5ano_3rad_bopv || 0,
      tar_5ano_3rad_hbpe: user.tar_5ano_3rad_hbpe || 0,
      tar_5ano_3rad_dpt: user.tar_5ano_3rad_dpt || 0,
      tar_5ano_4tad_bopv: user.tar_5ano_4tad_bopv || 0,
      tar_5ano_4tad_dpt: user.tar_5ano_4tad_dpt || 0,
      tar_5ano_dosi_fa: user.tar_5ano_dosi_fa || 0,
      tar_6ano_1rad_srp: user.tar_6ano_1rad_srp || 0,
      tar_6ano_2dad_srp: user.tar_6ano_2dad_srp || 0,
      tar_6ano_dosi_fa: user.tar_6ano_dosi_fa || 0,
      tar_7ano_1rad_sr: user.tar_7ano_1rad_sr || 0,
      tar_7ano_2dad_sr: user.tar_7ano_2dad_sr || 0,
      tar_7ano_dosi_fa: user.tar_7ano_dosi_fa || 0,
      tar_8ano_dosi_fa: user.tar_8ano_dosi_fa || 0,
      tar_7a14_dosi_dtad: user.tar_7a14_dosi_dtad || 0,
      tar_9a14_dosi_fa: user.tar_9a14_dosi_fa || 0,
      tar_15a19_dosi_fa: user.tar_15a19_dosi_fa || 0,
      tar_20a59_dosi_fa: user.tar_20a59_dosi_fa || 0,
      tar_8a14_1rad_sr: user.tar_8a14_1rad_sr || 0,
      tar_8a14_2dad_sr: user.tar_8a14_2dad_sr || 0,
      tar_15a29_1rad_sr: user.tar_15a29_1rad_sr || 0,
      tar_15a29_2dad_sr: user.tar_15a29_2dad_sr || 0,
      tar_30a50_1rad_sr: user.tar_30a50_1rad_sr || 0,
      tar_30a50_2dad_sr: user.tar_30a50_2dad_sr || 0,
      tar_16a49mefne_dtad_prim: user.tar_16a49mefne_dtad_prim || 0,
      tar_16a49mefne_dtad_segu: user.tar_16a49mefne_dtad_segu || 0,
      tar_16a49mefne_dtad_terc: user.tar_16a49mefne_dtad_terc || 0,
      tar_16a49mefne_dtad_cuar: user.tar_16a49mefne_dtad_cuar || 0,
      tar_16a49mefne_dtad_quin: user.tar_16a49mefne_dtad_quin || 0,
      tar_mefe_dtad_prim: user.tar_mefe_dtad_prim || 0,
      tar_mefe_dtad_segu: user.tar_mefe_dtad_segu || 0,
      tar_mefe_dtad_terc: user.tar_mefe_dtad_terc || 0,
      tar_mefe_dtad_cuar: user.tar_mefe_dtad_cuar || 0,
      tar_mefe_dtad_quin: user.tar_mefe_dtad_quin || 0,
      tar_16a49_dtad_prim: user.tar_16a49_dtad_prim || 0,
      tar_16a49_dtad_segu: user.tar_16a49_dtad_segu || 0,
      tar_16a49_dtad_terc: user.tar_16a49_dtad_terc || 0,
      tar_16a49_dtad_cuar: user.tar_16a49_dtad_cuar || 0,
      tar_16a49_dtad_quin: user.tar_16a49_dtad_quin || 0,
      tar_hepa_trasal_prim: user.tar_hepa_trasal_prim || 0,
      tar_hepa_trasal_segu: user.tar_hepa_trasal_segu || 0,
      tar_hepa_trasal_terc: user.tar_hepa_trasal_terc || 0,
      tar_hepa_estsal_prim: user.tar_hepa_estsal_prim || 0,
      tar_hepa_estsal_segu: user.tar_hepa_estsal_segu || 0,
      tar_hepa_estsal_terc: user.tar_hepa_estsal_terc || 0,
      tar_hepa_trasex_prim: user.tar_hepa_trasex_prim || 0,
      tar_hepa_trasex_segu: user.tar_hepa_trasex_segu || 0,
      tar_hepa_trasex_terc: user.tar_hepa_trasex_terc || 0,
      tar_hepa_pervih_prim: user.tar_hepa_pervih_prim || 0,
      tar_hepa_pervih_segu: user.tar_hepa_pervih_segu || 0,
      tar_hepa_pervih_terc: user.tar_hepa_pervih_terc || 0,
      tar_hepa_perppl_prim: user.tar_hepa_perppl_prim || 0,
      tar_hepa_perppl_segu: user.tar_hepa_perppl_segu || 0,
      tar_hepa_perppl_terc: user.tar_hepa_perppl_terc || 0,
      tar_hepa_otro_prim: user.tar_hepa_otro_prim || 0,
      tar_hepa_otro_segu: user.tar_hepa_otro_segu || 0,
      tar_hepa_otro_terc: user.tar_hepa_otro_terc || 0,
      tar_inmant: user.tar_inmant || 0,
      tar_inmanthep: user.tar_inmanthep || 0,
      tar_inmantrra: user.tar_inmantrra || 0,
    };
  };

  return (
    <div className="container">
      <div className="flex items-center justify-center">
        <h1 className="text-lg font-bold text-center text-green-50 dark:text-black">
          Para localizar los meses en la tabla, es necesario seleccionar el
          registro de la fecha correspondiente al mes de{" "}
          {getMonthName(monthTar)} del año {yearTar}.
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
                      "Intramural",
                      "Extramural MIES CNH",
                      "Extramural MIES CIBV",
                      "Extramural MINEDUC E. General Básica",
                      "Extramural MINEDUC Bachillerato",
                      "Extramural VISITAS DOMICILIARIAS",
                      "Extramural ATENCIÓN COMUNITARIA",
                      "OTROS",
                      "Sexo Hombre",
                      "Sexo Mujer",
                      "LUGAR DE RESIDENCIA HABITULA Pertenece al establecimiento de salud",
                      "LUGAR DE RESIDENCIA HABITULA No pertenece al establecimiento de salud",
                      "Nacionalidad Ecuatoriana",
                      "Nacionalidad Colombiano",
                      "Nacionalidad Peruano",
                      "Nacionalidad Cubano",
                      "Nacionalidad Venezolano",
                      "Nacionalidad Otros",
                      "Autoidentificación étnica Indigena",
                      "Autoidentificación étnica Afro ecuatoriano/ Afro descendiente",
                      "Autoidentificación étnica Negro/a",
                      "Autoidentificación étnica Mulato/a",
                      "Autoidentificación étnica Montubio/a",
                      "Autoidentificación étnica Mestizo/a",
                      "Autoidentificación étnica Blanco/a",
                      "Autoidentificación étnica Otro",
                      "NACIONALIDAD ETNICA Achuar",
                      "NACIONALIDAD ETNICA Andoa",
                      "NACIONALIDAD ETNICA Awa",
                      "NACIONALIDAD ETNICA Chachi",
                      "NACIONALIDAD ETNICA Cofan",
                      "NACIONALIDAD ETNICA Epera",
                      "NACIONALIDAD ETNICA Huancavilca",
                      "NACIONALIDAD ETNICA Kichwa",
                      "NACIONALIDAD ETNICA Manta",
                      "NACIONALIDAD ETNICA Secoya",
                      "NACIONALIDAD ETNICA Shiwiar",
                      "NACIONALIDAD ETNICA Shuar",
                      "NACIONALIDAD ETNICA Siona",
                      "NACIONALIDAD ETNICA Tsáchila",
                      "NACIONALIDAD ETNICA Waorani",
                      "NACIONALIDAD ETNICA Zapara",
                      "PUEBLOS Chibuleo",
                      "PUEBLOS Kañari",
                      "PUEBLOS Karanki",
                      "PUEBLOS Kayambi",
                      "PUEBLOS Kichwa Amazónico",
                      "PUEBLOS Kisapincha",
                      "PUEBLOS Kitukara",
                      "PUEBLOS Natabuela",
                      "PUEBLOS Otavalo",
                      "PUEBLOS Paltas",
                      "PUEBLOS Panzaleo",
                      "PUEBLOS Pastos",
                      "PUEBLOS Puruha",
                      "PUEBLOS Salasaka",
                      "PUEBLOS Saraguro",
                      "PUEBLOS Tomabela",
                      "PUEBLOS Waramka",
                      "1 año 1ra dosis fIPV",
                      "1 año 1ra dosis HB pediatrica",
                      "1 año 1ra dosis DPT",
                      "1 año 2da dosis fIPV",
                      "1 año 2da dosis HB pediatrica",
                      "1 año 2da dosis DPT",
                      "1 año 3ra dosis bOPV",
                      "1 año 3ra dosis HB pediatrica",
                      "1 año 3ra dosis DPT",
                      "2 años 1ra dosis fIPV",
                      "2 años 1ra dosis SRP",
                      "2 años 1ra dosis HB pediatrica",
                      "2 años 1ra dosis DPT",
                      "2 años 2da dosis fIPV",
                      "2 años 2da dosis SRP",
                      "2 años 2da dosis HB pediatrica",
                      "2 años 2da dosis DPT",
                      "2 años 3ra dosis bOPV",
                      "2 años 3ra dosis HB pediatrica",
                      "2 años 3ra dosis DPT",
                      "2 años 4ta Dosis Primer Refuerzo bOPV",
                      "2 años 4ta Dosis Primer Refuerzo DPT",
                      "2 años Dosis Unica FA",
                      "3 años 1ra dosis fIPV",
                      "3 años 1ra dosis SRP",
                      "3 años 1ra dosis HB pediatrica",
                      "3 años 1ra dosis DPT",
                      "3 años 2da dosis fIPV",
                      "3 años 2da dosis SRP",
                      "3 años 2da dosis HB pediatrica",
                      "3 años 2da dosis DPT",
                      "3 años 3ra dosis Bopv",
                      "3 años 3ra dosis HB pediatrica",
                      "3 años 3ra dosis DPT",
                      "3 años 4ta Dosis Primer Refuerzo bOPV",
                      "3 años 4ta Dosis Primer Refuerzo DPT",
                      "3 años Dosis Unica FA",
                      "4 años 1ra dosis fIPV",
                      "4 años 1ra dosis SRP",
                      "4 años 1ra dosis HB pediatrica",
                      "4 años 1ra dosis DPT",
                      "4 años 2da dosis fIPV",
                      "4 años 2da dosis SRP",
                      "4 años 2da dosis HB pediatrica",
                      "4 años 2da dosis DPT",
                      "4 años 3ra dosis bOPV",
                      "4 años 3ra dosis HB pediatrica",
                      "4 años 3ra dosis DPT",
                      "4 años 4ta Dosis Primer Refuerzo bOPV",
                      "4 años 4ta Dosis Primer Refuerzo DPT",
                      "4 años Dosis Unica FA",
                      "5 años* 1ra dosis IPV (Solo en el caso que no tenga historial vacunal de poliomielitis)",
                      "5 años* 1ra dosis SRP",
                      "5 años* 1ra dosis HB pediatrica",
                      "5 años* 1ra dosis DPT",
                      "5 años* 2da dosis fIPV",
                      "5 años* 2da dosis SRP",
                      "5 años* 2da dosis HB pediatrica",
                      "5 años* 2da dosis DPT",
                      "5 años* 3ra dosis bOPV",
                      "5 años* 3ra dosis HB pediatrica",
                      "5 años* 3ra dosis DPT",
                      "5 años* 4ta Dosis Primer Refuerzo bOPV",
                      "5 años* 4ta Dosis Primer Refuerzo DPT",
                      "5 años* Dosis Unica FA",
                      "6 años 1ra dosis SRP",
                      "6 años 2da dosis SRP",
                      "6 años Dosis Unica FA",
                      "7 años 1ra dosis SR",
                      "7 años 2da dosis SR",
                      "7 años Dosis Unica FA",
                      "8 años Dosis Unica FA",
                      "7 a 14 años Dosis dT adulto",
                      "9 a 14 años Dosis Unica FA",
                      "15 a 19 años Dosis Unica FA",
                      "20 a 59 años Dosis Unica FA",
                      "8 a 14 años 1ra dosis SR",
                      "8 a 14 años 2da dosis SR",
                      "15 a 29 años 1ra dosis SR",
                      "15 a 29 años 2da dosis SR",
                      "30 a 50 años 1ra dosis SR",
                      "30 a 50 años 2da dosis SR",
                      "**16 a 49 años de edad (MEF-No embarazadas) dT adulto Primera Dosis",
                      "**16 a 49 años de edad (MEF-No embarazadas) dT adulto Segunda Dosis",
                      "**16 a 49 años de edad (MEF-No embarazadas) dT adulto Tercera Dosis",
                      "**16 a 49 años de edad (MEF-No embarazadas) dT adulto Cuarta Dosis",
                      "**16 a 49 años de edad (MEF-No embarazadas) dT adulto Quinta Dosis",
                      "MEF-Embarazadas dT adulto Primera Dosis",
                      "MEF-Embarazadas dT adulto Segunda Dosis",
                      "MEF-Embarazadas dT adulto Tercera Dosis",
                      "MEF-Embarazadas dT adulto Cuarta Dosis",
                      "MEF-Embarazadas dT adulto Quinta Dosis",
                      "***16 a 49 años (Hombres) dT adulto Primera Dosis",
                      "***16 a 49 años (Hombres) dT adulto Segunda Dosis",
                      "***16 a 49 años (Hombres) dT adulto Tercera Dosis",
                      "***16 a 49 años (Hombres) dT adulto Cuarta Dosis",
                      "***16 a 49 años (Hombres) dT adulto Quinta Dosis",
                      "HEPATITIS B Trabajadores de Salud Primera Dosis",
                      "HEPATITIS B Trabajadores de Salud Segunda Dosis",
                      "HEPATITIS B Trabajadores de Salud Tercera Dosis",
                      "HEPATITIS B Estudiantes en Area de Salud Primera Dosis",
                      "HEPATITIS B Estudiantes en Area de Salud Segunda Dosis",
                      "HEPATITIS B Estudiantes en Area de Salud Tercera Dosis",
                      "HEPATITIS B Trabajadores Sexuales Primera Dosis",
                      "HEPATITIS B Trabajadores Sexuales Segunda Dosis",
                      "HEPATITIS B Trabajadores Sexuales Tercera Dosis",
                      "HEPATITIS B Personas Viviendo con VIH(PVV) Primera Dosis",
                      "HEPATITIS B Personas Viviendo con VIH(PVV) Segunda Dosis",
                      "HEPATITIS B Personas Viviendo con VIH(PVV) Tercera Dosis",
                      "HEPATITIS B Personas Privadas de Libertad (PPL) Primera Dosis",
                      "HEPATITIS B Personas Privadas de Libertad (PPL) Segunda Dosis",
                      "HEPATITIS B Personas Privadas de Libertad (PPL) Tercera Dosis",
                      "HEPATITIS B Otros Grupos de Riesgo Primera Dosis",
                      "HEPATITIS B Otros Grupos de Riesgo Segunda Dosis",
                      "HEPATITIS B Otros Grupos de Riesgo Tercera Dosis",
                      "Inmunoglobulina_Antitetánica",
                      "Inmunoglobulina_Anti Hepatitis B",
                      "Inmunoglobulina_Antirrábica",
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
                          {registro.tar_tota ? (
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
                              key !== "tar_tota" &&
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
TablaTardio.propTypes = {
  setIsIdTar: PropTypes.func.isRequired,
  setFormData: PropTypes.func.isRequired,
  storedUserId: PropTypes.number.isRequired,
  fechaInput: PropTypes.string.isRequired,
  setBotonEstado: PropTypes.func.isRequired,
  setIsInputEstado: PropTypes.func.isRequired,
  setIsLoading: PropTypes.func.isRequired,
  setSuccessMessage: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
};

export default TablaTardio;
