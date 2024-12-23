import React, { useState, useEffect } from "react";
import {
  registerTardio,
  updateTardio,
  deleteTardio,
} from "../api/conexion.api.js";
import { validarDato, validarRegistroTardio } from "../api/validadorUtil.js";
import {
  inputStyle,
  buttonStylePrimario,
  buttonStyleSecundario,
  buttonStyleEliminar,
} from "../components/EstilosCustom.jsx";
import TablaTardio from "../components/TablaTardio.jsx";
import { toast } from "react-hot-toast";

const getInputType = (key) => {
  if (key === "tar_fech") {
    return { inputType: "date" };
  } else {
    return { inputType: "number" };
  }
};

const CreateTardio = () => {
  const storedUserId = localStorage.getItem("userId") || "";
  const storedInputFech =
    localStorage.getItem("dateInputFech") ||
    new Date().toISOString().slice(0, 10);
  const [fechaInput, setFechaInput] = useState("");

  const [formData, setFormData] = useState({
    tar_fech: storedInputFech,
    tar_intr: 0,
    tar_extr_mies_cnh: 0,
    tar_extr_mies_cibv: 0,
    tar_extr_mine_egen: 0,
    tar_extr_mine_bach: 0,
    tar_extr_visi: 0,
    tar_extr_aten: 0,
    tar_otro: 0,
    tar_sexo_homb: 0,
    tar_sexo_muje: 0,
    tar_luga_pert: 0,
    tar_luga_nope: 0,
    tar_naci_ecua: 0,
    tar_naci_colo: 0,
    tar_naci_peru: 0,
    tar_naci_cuba: 0,
    tar_naci_vene: 0,
    tar_naci_otro: 0,
    tar_auto_indi: 0,
    tar_auto_afro: 0,
    tar_auto_negr: 0,
    tar_auto_mula: 0,
    tar_auto_mont: 0,
    tar_auto_mest: 0,
    tar_auto_blan: 0,
    tar_auto_otro: 0,
    tar_naci_achu: 0,
    tar_naci_ando: 0,
    tar_naci_awa: 0,
    tar_naci_chac: 0,
    tar_naci_cofa: 0,
    tar_naci_eper: 0,
    tar_naci_huan: 0,
    tar_naci_kich: 0,
    tar_naci_mant: 0,
    tar_naci_seco: 0,
    tar_naci_shiw: 0,
    tar_naci_shua: 0,
    tar_naci_sion: 0,
    tar_naci_tsac: 0,
    tar_naci_waor: 0,
    tar_naci_zapa: 0,
    tar_pueb_chib: 0,
    tar_pueb_kana: 0,
    tar_pueb_kara: 0,
    tar_pueb_kaya: 0,
    tar_pueb_kich: 0,
    tar_pueb_kisa: 0,
    tar_pueb_kitu: 0,
    tar_pueb_nata: 0,
    tar_pueb_otav: 0,
    tar_pueb_palt: 0,
    tar_pueb_panz: 0,
    tar_pueb_past: 0,
    tar_pueb_puru: 0,
    tar_pueb_sala: 0,
    tar_pueb_sara: 0,
    tar_pueb_toma: 0,
    tar_pueb_wara: 0,
    tar_1ano_1rad_fipv: 0,
    tar_1ano_1rad_hbpe: 0,
    tar_1ano_1rad_dpt: 0,
    tar_1ano_2dad_fipv: 0,
    tar_1ano_2dad_hbpe: 0,
    tar_1ano_2dad_dpt: 0,
    tar_1ano_3rad_bopv: 0,
    tar_1ano_3rad_hbpe: 0,
    tar_1ano_3rad_dpt: 0,
    tar_2ano_1rad_fipv: 0,
    tar_2ano_1rad_srp: 0,
    tar_2ano_1rad_hbpe: 0,
    tar_2ano_1rad_dpt: 0,
    tar_2ano_2dad_fipv: 0,
    tar_2ano_2dad_srp: 0,
    tar_2ano_2dad_hbpe: 0,
    tar_2ano_2dad_dpt: 0,
    tar_2ano_3rad_bopv: 0,
    tar_2ano_3rad_hbpe: 0,
    tar_2ano_3rad_dpt: 0,
    tar_2ano_4tad_bopv: 0,
    tar_2ano_4tad_dpt: 0,
    tar_2ano_dosi_fa: 0,
    tar_3ano_1rad_fipv: 0,
    tar_3ano_1rad_srp: 0,
    tar_3ano_1rad_hbpe: 0,
    tar_3ano_1rad_dpt: 0,
    tar_3ano_2dad_fipv: 0,
    tar_3ano_2dad_srp: 0,
    tar_3ano_2dad_hbpe: 0,
    tar_3ano_2dad_dpt: 0,
    tar_3ano_3rad_bopv: 0,
    tar_3ano_3rad_hbpe: 0,
    tar_3ano_3rad_dpt: 0,
    tar_3ano_4tad_bopv: 0,
    tar_3ano_4tad_dpt: 0,
    tar_3ano_dosi_fa: 0,
    tar_4ano_1rad_fipv: 0,
    tar_4ano_1rad_srp: 0,
    tar_4ano_1rad_hbpe: 0,
    tar_4ano_1rad_dpt: 0,
    tar_4ano_2dad_fipv: 0,
    tar_4ano_2dad_srp: 0,
    tar_4ano_2dad_hbpe: 0,
    tar_4ano_2dad_dpt: 0,
    tar_4ano_3rad_bopv: 0,
    tar_4ano_3rad_hbpe: 0,
    tar_4ano_3rad_dpt: 0,
    tar_4ano_4tad_bopv: 0,
    tar_4ano_4tad_dpt: 0,
    tar_4ano_dosi_fa: 0,
    tar_5ano_1rad_ipv: 0,
    tar_5ano_1rad_srp: 0,
    tar_5ano_1rad_hbpe: 0,
    tar_5ano_1rad_dpt: 0,
    tar_5ano_2dad_fipv: 0,
    tar_5ano_2dad_srp: 0,
    tar_5ano_2dad_hbpe: 0,
    tar_5ano_2dad_dpt: 0,
    tar_5ano_3rad_bopv: 0,
    tar_5ano_3rad_hbpe: 0,
    tar_5ano_3rad_dpt: 0,
    tar_5ano_4tad_bopv: 0,
    tar_5ano_4tad_dpt: 0,
    tar_5ano_dosi_fa: 0,
    tar_6ano_1rad_srp: 0,
    tar_6ano_2dad_srp: 0,
    tar_6ano_dosi_fa: 0,
    tar_7ano_1rad_sr: 0,
    tar_7ano_2dad_sr: 0,
    tar_7ano_dosi_fa: 0,
    tar_8ano_dosi_fa: 0,
    tar_7a14_dosi_dtad: 0,
    tar_9a14_dosi_fa: 0,
    tar_15a19_dosi_fa: 0,
    tar_20a59_dosi_fa: 0,
    tar_8a14_1rad_sr: 0,
    tar_8a14_2dad_sr: 0,
    tar_15a29_1rad_sr: 0,
    tar_15a29_2dad_sr: 0,
    tar_30a50_1rad_sr: 0,
    tar_30a50_2dad_sr: 0,
    tar_16a49mefne_dtad_prim: 0,
    tar_16a49mefne_dtad_segu: 0,
    tar_16a49mefne_dtad_terc: 0,
    tar_16a49mefne_dtad_cuar: 0,
    tar_16a49mefne_dtad_quin: 0,
    tar_mefe_dtad_prim: 0,
    tar_mefe_dtad_segu: 0,
    tar_mefe_dtad_terc: 0,
    tar_mefe_dtad_cuar: 0,
    tar_mefe_dtad_quin: 0,
    tar_16a49_dtad_prim: 0,
    tar_16a49_dtad_segu: 0,
    tar_16a49_dtad_terc: 0,
    tar_16a49_dtad_cuar: 0,
    tar_16a49_dtad_quin: 0,
    tar_hepa_trasal_prim: 0,
    tar_hepa_trasal_segu: 0,
    tar_hepa_trasal_terc: 0,
    tar_hepa_estsal_prim: 0,
    tar_hepa_estsal_segu: 0,
    tar_hepa_estsal_terc: 0,
    tar_hepa_trasex_prim: 0,
    tar_hepa_trasex_segu: 0,
    tar_hepa_trasex_terc: 0,
    tar_hepa_pervih_prim: 0,
    tar_hepa_pervih_segu: 0,
    tar_hepa_pervih_terc: 0,
    tar_hepa_perppl_prim: 0,
    tar_hepa_perppl_segu: 0,
    tar_hepa_perppl_terc: 0,
    tar_hepa_otro_prim: 0,
    tar_hepa_otro_segu: 0,
    tar_hepa_otro_terc: 0,
    tar_inmant: 0,
    tar_inmanthep: 0,
    tar_inmantrra: 0,
  });

  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isInputEstado, setIsInputEstado] = useState({
    input: false,
    tar_fech: false,
  });

  const [botonEstado, setBotonEstado] = useState({
    btnBuscar: true,
    btnLimpiar: false,
    btnRegistrarTar: true,
  });
  const [isIdTar, setIsIdTar] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resValidarRegistro = validarRegistroTardio(formData, setError);

    if (isLoading) return;
    setIsLoading(true);
    setError({});
    let errorMessage = "Hubo un error en la operación";
    if (!storedUserId) {
      setError({ eniUser: "El usuario no está autenticado." });
      return;
    }

    // Lógica para enviar los datos al servidor
    try {
      let response;
      if (resValidarRegistro.success) {
        if (isInputEstado.input) {
          response = await updateTardio(isIdTar, {
            ...formData,
            eniUser: storedUserId,
          });
          setSuccessMessage(resValidarRegistro.message);
          const message = response.message || "Registro actualizado con éxito!";
          toast.success(message, {
            position: "bottom-right",
          });
        } else {
          await registerTardio({ ...formData, eniUser: storedUserId });
          setSuccessMessage(resValidarRegistro.message);
          toast.success(resValidarRegistro.message, {
            position: "bottom-right",
          });
        }
        window.location.reload("/create-tardio/");
      } else {
        // Hubo un error en la validación
        setError(resValidarRegistro.error);
        toast.error(resValidarRegistro.error, {
          position: "bottom-right",
        });
      }
    } catch (error) {
      const getErrorMessage = (error) => {
        if (error.response?.data) {
          const data = error.response.data;
          if (typeof data === "object") {
            const firstKey = Object.keys(data)[0];
            const firstError = data[firstKey];
            if (Array.isArray(firstError) && firstError.length > 0) {
              return firstError[0];
            } else if (typeof firstError === "string") {
              return firstError;
            } else if (data.message) {
              return data.message;
            } else if (data.error) {
              return data.error;
            }
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
      errorMessage = getErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage, { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar este registro?\n\nFecha: ${formData.tar_fech}`
    );
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      let tar_fech = formData.tar_fech;
      const [dia, mes, año] = tar_fech.split("/");
      if (dia && mes && año) {
        tar_fech = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
      }
      const dataToSend = {
        eniUser: storedUserId,
        tar_fech: tar_fech,
      };
      const response = await deleteTardio(isIdTar, dataToSend);
      setSuccessMessage("Registro eliminado con éxito!");
      const message = response.message || "Registro eliminado con éxito!";
      toast.success(message, {
        position: "bottom-right",
      });
      window.location.reload("/create-tardio/");
    } catch (error) {
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
    } finally {
      setIsLoading(false);
    }
  };

  const labelMap = {
    tar_fech: "Fecha",
    tar_intr: "Intramural",
    tar_extr_mies_cnh: "CNH",
    tar_extr_mies_cibv: "CIBV",
    tar_extr_mine_egen: "E. General Básica",
    tar_extr_mine_bach: "Bachillerato",
    tar_extr_visi: "VISITAS DOMICILIARIAS",
    tar_extr_aten: "ATENCIÓN COMUNITARIA",
    tar_otro: "OTROS",
    tar_sexo_homb: "Hombre",
    tar_sexo_muje: "Mujer",
    tar_luga_pert: "Pertenece al establecimiento de salud",
    tar_luga_nope: "No pertenece al establecimiento de salud",
    tar_naci_ecua: "Ecuatoriana",
    tar_naci_colo: "Colombiano",
    tar_naci_peru: "Peruano",
    tar_naci_cuba: "Cubano",
    tar_naci_vene: "Venezolano",
    tar_naci_otro: "Otros",
    tar_auto_indi: "Indigena",
    tar_auto_afro: "Afro ecuatoriano/ Afro descendiente",
    tar_auto_negr: "Negro/a",
    tar_auto_mula: "Mulato/a",
    tar_auto_mont: "Montubio/a",
    tar_auto_mest: "Mestizo/a",
    tar_auto_blan: "Blanco/a",
    tar_auto_otro: "Otro",
    tar_naci_achu: "Achuar",
    tar_naci_ando: "Andoa",
    tar_naci_awa: "Awa",
    tar_naci_chac: "Chachi",
    tar_naci_cofa: "Cofan",
    tar_naci_eper: "Epera",
    tar_naci_huan: "Huancavilca",
    tar_naci_kich: "Kichwa",
    tar_naci_mant: "Manta",
    tar_naci_seco: "Secoya",
    tar_naci_shiw: "Shiwiar",
    tar_naci_shua: "Shuar",
    tar_naci_sion: "Siona",
    tar_naci_tsac: "Tsáchila",
    tar_naci_waor: "Waorani",
    tar_naci_zapa: "Zapara",
    tar_pueb_chib: "Chibuleo",
    tar_pueb_kana: "Kañari",
    tar_pueb_kara: "Karanki",
    tar_pueb_kaya: "Kayambi",
    tar_pueb_kich: "Kichwa Amazónico",
    tar_pueb_kisa: "Kisapincha",
    tar_pueb_kitu: "Kitukara",
    tar_pueb_nata: "Natabuela",
    tar_pueb_otav: "Otavalo",
    tar_pueb_palt: "Paltas",
    tar_pueb_panz: "Panzaleo",
    tar_pueb_past: "Pastos",
    tar_pueb_puru: "Puruha",
    tar_pueb_sala: "Salasaka",
    tar_pueb_sara: "Saraguro",
    tar_pueb_toma: "Tomabela",
    tar_pueb_wara: "Waramka",
    tar_1ano_1rad_fipv: "fIPV",
    tar_1ano_1rad_hbpe: "HB pediatrica",
    tar_1ano_1rad_dpt: "DPT",
    tar_1ano_2dad_fipv: "fIPV",
    tar_1ano_2dad_hbpe: "HB pediatrica",
    tar_1ano_2dad_dpt: "DPT",
    tar_1ano_3rad_bopv: "bOPV",
    tar_1ano_3rad_hbpe: "HB pediatrica",
    tar_1ano_3rad_dpt: "DPT",
    tar_2ano_1rad_fipv: "fIPV",
    tar_2ano_1rad_srp: "SRP",
    tar_2ano_1rad_hbpe: "HB pediatrica",
    tar_2ano_1rad_dpt: "DPT",
    tar_2ano_2dad_fipv: "fIPV",
    tar_2ano_2dad_srp: "SRP",
    tar_2ano_2dad_hbpe: "HB pediatrica",
    tar_2ano_2dad_dpt: "DPT",
    tar_2ano_3rad_bopv: "bOPV",
    tar_2ano_3rad_hbpe: "HB pediatrica",
    tar_2ano_3rad_dpt: "DPT",
    tar_2ano_4tad_bopv: "bOPV",
    tar_2ano_4tad_dpt: "DPT",
    tar_2ano_dosi_fa: "FA",
    tar_3ano_1rad_fipv: "fIPV",
    tar_3ano_1rad_srp: "SRP",
    tar_3ano_1rad_hbpe: "HB pediatrica",
    tar_3ano_1rad_dpt: "DPT",
    tar_3ano_2dad_fipv: "fIPV",
    tar_3ano_2dad_srp: "SRP",
    tar_3ano_2dad_hbpe: "HB pediatrica",
    tar_3ano_2dad_dpt: "DPT",
    tar_3ano_3rad_bopv: "Bopv",
    tar_3ano_3rad_hbpe: "HB pediatrica",
    tar_3ano_3rad_dpt: "DPT",
    tar_3ano_4tad_bopv: "bOPV",
    tar_3ano_4tad_dpt: "DPT",
    tar_3ano_dosi_fa: "FA",
    tar_4ano_1rad_fipv: "fIPV",
    tar_4ano_1rad_srp: "SRP",
    tar_4ano_1rad_hbpe: "HB pediatrica",
    tar_4ano_1rad_dpt: "DPT",
    tar_4ano_2dad_fipv: "fIPV",
    tar_4ano_2dad_srp: "SRP",
    tar_4ano_2dad_hbpe: "HB pediatrica",
    tar_4ano_2dad_dpt: "DPT",
    tar_4ano_3rad_bopv: "bOPV",
    tar_4ano_3rad_hbpe: "HB pediatrica",
    tar_4ano_3rad_dpt: "DPT",
    tar_4ano_4tad_bopv: "bOPV",
    tar_4ano_4tad_dpt: "DPT",
    tar_4ano_dosi_fa: "FA",
    tar_5ano_1rad_ipv:
      "IPV (Solo en el caso que no tenga historial vacunal de poliomielitis)",
    tar_5ano_1rad_srp: "SRP",
    tar_5ano_1rad_hbpe: "HB pediatrica",
    tar_5ano_1rad_dpt: "DPT",
    tar_5ano_2dad_fipv: "fIPV",
    tar_5ano_2dad_srp: "SRP",
    tar_5ano_2dad_hbpe: "HB pediatrica",
    tar_5ano_2dad_dpt: "DPT",
    tar_5ano_3rad_bopv: "bOPV",
    tar_5ano_3rad_hbpe: "HB pediatrica",
    tar_5ano_3rad_dpt: "DPT",
    tar_5ano_4tad_bopv: "bOPV",
    tar_5ano_4tad_dpt: "DPT",
    tar_5ano_dosi_fa: "FA",
    tar_6ano_1rad_srp: "SRP",
    tar_6ano_2dad_srp: "SRP",
    tar_6ano_dosi_fa: "FA",
    tar_7ano_1rad_sr: "SR",
    tar_7ano_2dad_sr: "SR",
    tar_7ano_dosi_fa: "FA",
    tar_8ano_dosi_fa: "FA",
    tar_7a14_dosi_dtad: "dT adulto",
    tar_9a14_dosi_fa: "FA",
    tar_15a19_dosi_fa: "FA",
    tar_20a59_dosi_fa: "FA",
    tar_8a14_1rad_sr: "SR",
    tar_8a14_2dad_sr: "SR",
    tar_15a29_1rad_sr: "SR",
    tar_15a29_2dad_sr: "SR",
    tar_30a50_1rad_sr: "SR",
    tar_30a50_2dad_sr: "SR",
    tar_16a49mefne_dtad_prim: "Primera Dosis",
    tar_16a49mefne_dtad_segu: "Segunda Dosis",
    tar_16a49mefne_dtad_terc: "Tercera Dosis",
    tar_16a49mefne_dtad_cuar: "Cuarta Dosis",
    tar_16a49mefne_dtad_quin: "Quinta Dosis",
    tar_mefe_dtad_prim: "Primera Dosis",
    tar_mefe_dtad_segu: "Segunda Dosis",
    tar_mefe_dtad_terc: "Tercera Dosis",
    tar_mefe_dtad_cuar: "Cuarta Dosis",
    tar_mefe_dtad_quin: "Quinta Dosis",
    tar_16a49_dtad_prim: "Primera Dosis",
    tar_16a49_dtad_segu: "Segunda Dosis",
    tar_16a49_dtad_terc: "Tercera Dosis",
    tar_16a49_dtad_cuar: "Cuarta Dosis",
    tar_16a49_dtad_quin: "Quinta Dosis",
    tar_hepa_trasal_prim: "Primera Dosis",
    tar_hepa_trasal_segu: "Segunda Dosis",
    tar_hepa_trasal_terc: "Tercera Dosis",
    tar_hepa_estsal_prim: "Primera Dosis",
    tar_hepa_estsal_segu: "Segunda Dosis",
    tar_hepa_estsal_terc: "Tercera Dosis",
    tar_hepa_trasex_prim: "Primera Dosis",
    tar_hepa_trasex_segu: "Segunda Dosis",
    tar_hepa_trasex_terc: "Tercera Dosis",
    tar_hepa_pervih_prim: "Primera Dosis",
    tar_hepa_pervih_segu: "Segunda Dosis",
    tar_hepa_pervih_terc: "Tercera Dosis",
    tar_hepa_perppl_prim: "Primera Dosis",
    tar_hepa_perppl_segu: "Segunda Dosis",
    tar_hepa_perppl_terc: "Tercera Dosis",
    tar_hepa_otro_prim: "Primera Dosis",
    tar_hepa_otro_segu: "Segunda Dosis",
    tar_hepa_otro_terc: "Tercera Dosis",
    tar_inmant: "Inmunoglobulina_Antitetánica",
    tar_inmanthep: "Inmunoglobulina_Anti Hepatitis B",
    tar_inmantrra: "Inmunoglobulina_Antirrábica",
  };

  const keys = Object.keys(formData);
  const [showAutoIndi, setShowAutoIndi] = useState(false);
  const [showNaciKich, setShowNaciKich] = useState(false);

  const handleChange = (e) => {
    validarDato(e, formData, setFormData);
    const { name, value } = e.target;
    if (value >= 0 || name === "tar_fech") {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    if (name === "tar_auto_indi") {
      setShowAutoIndi(value >= 1);
    }
    if (name === "tar_naci_kich") {
      setShowNaciKich(value >= 1);
    }
  };

  const limpiarVariables = () => {
    setFormData({
      tar_fech: storedInputFech,
      tar_intr: 0,
      tar_extr_mies_cnh: 0,
      tar_extr_mies_cibv: 0,
      tar_extr_mine_egen: 0,
      tar_extr_mine_bach: 0,
      tar_extr_visi: 0,
      tar_extr_aten: 0,
      tar_otro: 0,
      tar_sexo_homb: 0,
      tar_sexo_muje: 0,
      tar_luga_pert: 0,
      tar_luga_nope: 0,
      tar_naci_ecua: 0,
      tar_naci_colo: 0,
      tar_naci_peru: 0,
      tar_naci_cuba: 0,
      tar_naci_vene: 0,
      tar_naci_otro: 0,
      tar_auto_indi: 0,
      tar_auto_afro: 0,
      tar_auto_negr: 0,
      tar_auto_mula: 0,
      tar_auto_mont: 0,
      tar_auto_mest: 0,
      tar_auto_blan: 0,
      tar_auto_otro: 0,
      tar_naci_achu: 0,
      tar_naci_ando: 0,
      tar_naci_awa: 0,
      tar_naci_chac: 0,
      tar_naci_cofa: 0,
      tar_naci_eper: 0,
      tar_naci_huan: 0,
      tar_naci_kich: 0,
      tar_naci_mant: 0,
      tar_naci_seco: 0,
      tar_naci_shiw: 0,
      tar_naci_shua: 0,
      tar_naci_sion: 0,
      tar_naci_tsac: 0,
      tar_naci_waor: 0,
      tar_naci_zapa: 0,
      tar_pueb_chib: 0,
      tar_pueb_kana: 0,
      tar_pueb_kara: 0,
      tar_pueb_kaya: 0,
      tar_pueb_kich: 0,
      tar_pueb_kisa: 0,
      tar_pueb_kitu: 0,
      tar_pueb_nata: 0,
      tar_pueb_otav: 0,
      tar_pueb_palt: 0,
      tar_pueb_panz: 0,
      tar_pueb_past: 0,
      tar_pueb_puru: 0,
      tar_pueb_sala: 0,
      tar_pueb_sara: 0,
      tar_pueb_toma: 0,
      tar_pueb_wara: 0,
      tar_1ano_1rad_fipv: 0,
      tar_1ano_1rad_hbpe: 0,
      tar_1ano_1rad_dpt: 0,
      tar_1ano_2dad_fipv: 0,
      tar_1ano_2dad_hbpe: 0,
      tar_1ano_2dad_dpt: 0,
      tar_1ano_3rad_bopv: 0,
      tar_1ano_3rad_hbpe: 0,
      tar_1ano_3rad_dpt: 0,
      tar_2ano_1rad_fipv: 0,
      tar_2ano_1rad_srp: 0,
      tar_2ano_1rad_hbpe: 0,
      tar_2ano_1rad_dpt: 0,
      tar_2ano_2dad_fipv: 0,
      tar_2ano_2dad_srp: 0,
      tar_2ano_2dad_hbpe: 0,
      tar_2ano_2dad_dpt: 0,
      tar_2ano_3rad_bopv: 0,
      tar_2ano_3rad_hbpe: 0,
      tar_2ano_3rad_dpt: 0,
      tar_2ano_4tad_bopv: 0,
      tar_2ano_4tad_dpt: 0,
      tar_2ano_dosi_fa: 0,
      tar_3ano_1rad_fipv: 0,
      tar_3ano_1rad_srp: 0,
      tar_3ano_1rad_hbpe: 0,
      tar_3ano_1rad_dpt: 0,
      tar_3ano_2dad_fipv: 0,
      tar_3ano_2dad_srp: 0,
      tar_3ano_2dad_hbpe: 0,
      tar_3ano_2dad_dpt: 0,
      tar_3ano_3rad_bopv: 0,
      tar_3ano_3rad_hbpe: 0,
      tar_3ano_3rad_dpt: 0,
      tar_3ano_4tad_bopv: 0,
      tar_3ano_4tad_dpt: 0,
      tar_3ano_dosi_fa: 0,
      tar_4ano_1rad_fipv: 0,
      tar_4ano_1rad_srp: 0,
      tar_4ano_1rad_hbpe: 0,
      tar_4ano_1rad_dpt: 0,
      tar_4ano_2dad_fipv: 0,
      tar_4ano_2dad_srp: 0,
      tar_4ano_2dad_hbpe: 0,
      tar_4ano_2dad_dpt: 0,
      tar_4ano_3rad_bopv: 0,
      tar_4ano_3rad_hbpe: 0,
      tar_4ano_3rad_dpt: 0,
      tar_4ano_4tad_bopv: 0,
      tar_4ano_4tad_dpt: 0,
      tar_4ano_dosi_fa: 0,
      tar_5ano_1rad_ipv: 0,
      tar_5ano_1rad_srp: 0,
      tar_5ano_1rad_hbpe: 0,
      tar_5ano_1rad_dpt: 0,
      tar_5ano_2dad_fipv: 0,
      tar_5ano_2dad_srp: 0,
      tar_5ano_2dad_hbpe: 0,
      tar_5ano_2dad_dpt: 0,
      tar_5ano_3rad_bopv: 0,
      tar_5ano_3rad_hbpe: 0,
      tar_5ano_3rad_dpt: 0,
      tar_5ano_4tad_bopv: 0,
      tar_5ano_4tad_dpt: 0,
      tar_5ano_dosi_fa: 0,
      tar_6ano_1rad_srp: 0,
      tar_6ano_2dad_srp: 0,
      tar_6ano_dosi_fa: 0,
      tar_7ano_1rad_sr: 0,
      tar_7ano_2dad_sr: 0,
      tar_7ano_dosi_fa: 0,
      tar_8ano_dosi_fa: 0,
      tar_7a14_dosi_dtad: 0,
      tar_9a14_dosi_fa: 0,
      tar_15a19_dosi_fa: 0,
      tar_20a59_dosi_fa: 0,
      tar_8a14_1rad_sr: 0,
      tar_8a14_2dad_sr: 0,
      tar_15a29_1rad_sr: 0,
      tar_15a29_2dad_sr: 0,
      tar_30a50_1rad_sr: 0,
      tar_30a50_2dad_sr: 0,
      tar_16a49mefne_dtad_prim: 0,
      tar_16a49mefne_dtad_segu: 0,
      tar_16a49mefne_dtad_terc: 0,
      tar_16a49mefne_dtad_cuar: 0,
      tar_16a49mefne_dtad_quin: 0,
      tar_mefe_dtad_prim: 0,
      tar_mefe_dtad_segu: 0,
      tar_mefe_dtad_terc: 0,
      tar_mefe_dtad_cuar: 0,
      tar_mefe_dtad_quin: 0,
      tar_16a49_dtad_prim: 0,
      tar_16a49_dtad_segu: 0,
      tar_16a49_dtad_terc: 0,
      tar_16a49_dtad_cuar: 0,
      tar_16a49_dtad_quin: 0,
      tar_hepa_trasal_prim: 0,
      tar_hepa_trasal_segu: 0,
      tar_hepa_trasal_terc: 0,
      tar_hepa_estsal_prim: 0,
      tar_hepa_estsal_segu: 0,
      tar_hepa_estsal_terc: 0,
      tar_hepa_trasex_prim: 0,
      tar_hepa_trasex_segu: 0,
      tar_hepa_trasex_terc: 0,
      tar_hepa_pervih_prim: 0,
      tar_hepa_pervih_segu: 0,
      tar_hepa_pervih_terc: 0,
      tar_hepa_perppl_prim: 0,
      tar_hepa_perppl_segu: 0,
      tar_hepa_perppl_terc: 0,
      tar_hepa_otro_prim: 0,
      tar_hepa_otro_segu: 0,
      tar_hepa_otro_terc: 0,
      tar_inmant: 0,
      tar_inmanthep: 0,
      tar_inmantrra: 0,
    });
    setError({});
    setSuccessMessage(null);
    setBotonEstado({
      btnBuscar: true,
      btnLimpiar: false,
      btnRegistrarTar: false,
    });
    setIsInputEstado({
      input: false,
    });
  };

  useEffect(() => {
    const resValidarRegistro = validarRegistroTardio(formData);
    setBotonEstado({
      btnRegistrarTar: !resValidarRegistro.success,
    });
  }, [formData]);

  const txtBtnRegAct = isInputEstado.input
    ? "Actualizar Registro"
    : "Registrar";

  return (
    <div className="container">
      <div className="max-w-max m-auto mt-5">
        <h1 className="text-center text-2xl font-bold mb-1">Crear Tardio</h1>
        {error && (
          <p style={{ color: "red" }}>
            {Object.keys(error).length > 0 ? JSON.stringify(error) : ""}
          </p>
        )}
        {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-1 rounded-lg shadow-md"
        >
          <div className="relative overflow-x-auto px-1 py-4">
            <table className="table-fixed w-full text-sm text-left rtl:text-right text-black dark:text-black">
              <thead className="text-xs bg-gray-50 dark:bg-gray-100">
                <tr>
                  {keys.map((key, index) => {
                    const isAutoIndi = [
                      "tar_naci_achu",
                      "tar_naci_ando",
                      "tar_naci_awa",
                      "tar_naci_chac",
                      "tar_naci_cofa",
                      "tar_naci_eper",
                      "tar_naci_huan",
                      "tar_naci_kich",
                      "tar_naci_mant",
                      "tar_naci_seco",
                      "tar_naci_shiw",
                      "tar_naci_shua",
                      "tar_naci_sion",
                      "tar_naci_tsac",
                      "tar_naci_waor",
                      "tar_naci_zapa",
                    ].includes(key);
                    const isNaciKich = [
                      "tar_pueb_chib",
                      "tar_pueb_kana",
                      "tar_pueb_kara",
                      "tar_pueb_kaya",
                      "tar_pueb_kich",
                      "tar_pueb_kisa",
                      "tar_pueb_kitu",
                      "tar_pueb_nata",
                      "tar_pueb_otav",
                      "tar_pueb_palt",
                      "tar_pueb_panz",
                      "tar_pueb_past",
                      "tar_pueb_puru",
                      "tar_pueb_sala",
                      "tar_pueb_sara",
                      "tar_pueb_toma",
                      "tar_pueb_wara",
                    ].includes(key);
                    if (isAutoIndi && !showAutoIndi) {
                      return null; // No renderizar este th si no debe ser visible
                    }
                    if (isNaciKich && !showNaciKich) {
                      return null; // No renderizar este th si no debe ser visible
                    }
                    return (
                      <th
                        key={key}
                        className={`border ${
                          index === 0 ? "w-36 px-8 py-2" : "w-20 px-0 py-2"
                        }`}
                      >
                        <div className="transform -rotate-90 h-24 flex justify-start items-center">
                          {labelMap[key]}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {keys.map((key) => {
                    const { inputType } = getInputType(key);
                    const isAutoIndi = [
                      "tar_naci_achu",
                      "tar_naci_ando",
                      "tar_naci_awa",
                      "tar_naci_chac",
                      "tar_naci_cofa",
                      "tar_naci_eper",
                      "tar_naci_huan",
                      "tar_naci_kich",
                      "tar_naci_mant",
                      "tar_naci_seco",
                      "tar_naci_shiw",
                      "tar_naci_shua",
                      "tar_naci_sion",
                      "tar_naci_tsac",
                      "tar_naci_waor",
                      "tar_naci_zapa",
                    ].includes(key);
                    const isNaciKich = [
                      "tar_pueb_chib",
                      "tar_pueb_kana",
                      "tar_pueb_kara",
                      "tar_pueb_kaya",
                      "tar_pueb_kich",
                      "tar_pueb_kisa",
                      "tar_pueb_kitu",
                      "tar_pueb_nata",
                      "tar_pueb_otav",
                      "tar_pueb_palt",
                      "tar_pueb_panz",
                      "tar_pueb_past",
                      "tar_pueb_puru",
                      "tar_pueb_sala",
                      "tar_pueb_sara",
                      "tar_pueb_toma",
                      "tar_pueb_wara",
                    ].includes(key);
                    if (isAutoIndi && !showAutoIndi) {
                      return null; // No renderizar este input si no debe ser visible
                    }
                    if (isNaciKich && !showNaciKich) {
                      return null; // No renderizar este th si no debe ser visible
                    }
                    return (
                      <td key={key} className="border px-0 py-0">
                        <input
                          type={inputType}
                          id={key}
                          name={key}
                          value={formData[key]}
                          onChange={handleChange}
                          placeholder="Información es requerida"
                          className={`${inputStyle} ${
                            isInputEstado[key]
                              ? "bg-gray-200 text-gray-700 cursor-no-drop"
                              : "bg-white text-gray-700 cursor-pointer"
                          }`}
                          disabled={isInputEstado[key]}
                          min="0"
                          max=""
                          required
                        />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center mt-4">
            <button
              type="submit"
              id="btnRegistrarTar"
              name="btnRegistrarTar"
              className={`${buttonStylePrimario} ${
                botonEstado.btnRegistrarTar
                  ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
              }`}
              disabled={botonEstado.btnRegistrarTar}
              onClick={handleSubmit}
            >
              {txtBtnRegAct}
            </button>
            <button
              type="button"
              id="btnLimpiar"
              name="btnLimpiar"
              className={buttonStyleSecundario}
              onClick={limpiarVariables}
            >
              Limpiar
            </button>
            {isInputEstado.input && (
              <button
                type="button"
                id="btnEliminar"
                name="btnEliminar"
                className={buttonStyleEliminar}
                onClick={handleDelete}
              >
                Eliminar registro
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="mt-5">
        <TablaTardio
          setIsIdTar={setIsIdTar}
          setFormData={setFormData}
          storedUserId={parseInt(storedUserId)}
          fechaInput={fechaInput}
          setBotonEstado={setBotonEstado}
          setIsInputEstado={setIsInputEstado}
          setIsLoading={setIsLoading}
          setSuccessMessage={setSuccessMessage}
          setError={setError}
        />
      </div>
    </div>
  );
};

export default CreateTardio;
