import React, { useState, useEffect } from "react";
import {
  registerAdmision,
  updateAdmision,
  buscarUsuarioAdmision,
} from "../api/conexion.api.js";
import {
  listaSelectAdmision,
  nacionalidadAPais,
} from "../components/AllList.jsx";
import {
  validarDato,
  validarNumeroIdentificacion,
} from "../api/validadorUtil.js";
import {
  CustomSelect,
  inputStyle,
  buttonStylePrimario,
  buttonStyleSecundario,
} from "../components/EstilosCustom.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const initialState = {
  id_adm: "",
  adm_dato_pers_tipo_iden: "",
  adm_dato_pers_nume_iden: "",
  adm_dato_pers_apel_prim: "",
  adm_dato_pers_nomb_prim: "",
  adm_dato_pers_esta_civi: "",
  adm_dato_pers_sexo: "",
  adm_dato_pers_tele: "",
  adm_dato_pers_celu: "",
  adm_dato_pers_corr_elec: "",
  adm_dato_naci_luga_naci: "",
  adm_dato_naci_naci: "",
  adm_dato_no_ident_prov: "",
  adm_dato_naci_fech_naci: "",
  adm_dato_resi_pais_resi: "",
  adm_dato_resi_prov: "",
  adm_dato_resi_cant: "",
  adm_dato_resi_parr: "",
  adm_dato_resi_barr_sect: "",
  adm_dato_resi_call_prin: "",
  adm_dato_resi_call_secu: "",
  adm_dato_resi_refe_resi: "",
  adm_dato_auto_auto_etni: "",
  adm_dato_auto_naci_etni: "",
  adm_dato_auto_pueb_kich: "",
  adm_dato_adic_grup_prio: "",
  adm_dato_adic_nive_educ: "",
  adm_dato_adic_esta_nive_educ: "",
  adm_dato_adic_tipo_empr_trab: "",
  adm_dato_adic_ocup_prof_prin: "",
  adm_dato_adic_tipo_segu: "",
  adm_dato_adic_tien_disc: "",
  adm_dato_repr_tipo_iden: "",
  adm_dato_repr_nume_iden: "",
  adm_dato_repr_apel: "",
  adm_dato_repr_nomb: "",
  adm_dato_repr_fech_naci: "",
  adm_dato_repr_pare: "",
  adm_dato_repr_nume_tele: "",
  adm_dato_repr_naci: "",
  adm_dato_repr_no_ident_prov: "",
  adm_dato_cont_enca_nece_llam: "",
  adm_dato_cont_pare: "",
  adm_dato_cont_dire: "",
  adm_dato_cont_tele: "",
};

const tabs = [
  { label: "Datos Personales", key: "personales" },
  { label: "Datos de Residencia", key: "residencia" },
  { label: "Datos Adicionales", key: "adicionales" },
  { label: "Datos del Representante", key: "representante" },
  { label: "Datos de Contacto", key: "contacto" },
];

function calcularEdad(fechaNacimientoStr) {
  if (!fechaNacimientoStr) return "";
  const [year, month, day] = fechaNacimientoStr.split("-").map(Number);
  const fechaNacimiento = new Date(year, month - 1, day);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fechaNacimiento > hoy) {
    return "ERROR La fecha de nacimiento no puede ser mayor a la fecha actual";
  }

  let años = hoy.getFullYear() - fechaNacimiento.getFullYear();
  let meses = hoy.getMonth() - fechaNacimiento.getMonth();
  let dias = hoy.getDate() - fechaNacimiento.getDate();

  if (dias < 0) {
    meses--;
    dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
  }
  if (meses < 0) {
    años--;
    meses += 12;
  }

  let textoEdad = "";
  if (años > 0) textoEdad += años + (años === 1 ? " AÑO " : " AÑOS ");
  if (meses > 0) textoEdad += meses + (meses === 1 ? " MES " : " MESES ");
  if (dias > 0) textoEdad += dias + (dias === 1 ? " DÍA" : " DÍAS");
  if (!textoEdad) textoEdad = "0 DÍAS";

  return textoEdad.trim();
}

function generarCadenaNombres(nombres) {
  if (!nombres?.trim()) return "NN";
  const partes = nombres.toUpperCase().split(/\s+/);
  const p1 =
    partes[0] === "NN" ? "N" : (partes[0] || "").substring(0, 2).padEnd(2, "N");
  const p2 =
    partes[1] === "NN" ? "N" : (partes[1] || "").substring(0, 1) || "N";
  return p1 + p2;
}

function generarCadenaApellidos(apellidos) {
  if (!apellidos?.trim()) return "NN";
  const partes = apellidos.toUpperCase().split(/\s+/);
  const a1 =
    partes[0] === "NN" ? "N" : (partes[0] || "").substring(0, 2).padEnd(2, "N");
  const a2 =
    partes[1] === "NN" ? "N" : (partes[1] || "").substring(0, 1) || "N";
  return a1 + a2;
}

function generarCadenaNacionalidad(nacionalidad, noIdentProv) {
  if (nacionalidad?.toUpperCase() === "ECUATORIANO/A") {
    return (noIdentProv || "NN").substring(0, 2);
  }
  return "99";
}

function generarCadenaFecha(fecha) {
  if (!fecha) return "000000000";
  const [yyyy, mm, dd] = fecha.split("-");
  const decade = yyyy[2] || "0";
  return yyyy + mm + dd + decade;
}

function generarNumeIden(nombres, apellidos, naci, fecha, noIdentProv) {
  return (
    generarCadenaNombres(nombres) +
    generarCadenaApellidos(apellidos) +
    generarCadenaNacionalidad(naci, noIdentProv) +
    generarCadenaFecha(fecha)
  );
}

const Admision = () => {
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isBuscar, setIsBuscar] = useState(false);
  const [isBuscarRepresentante, setIsBuscarRepresentante] = useState(false);
  const [activeTab, setActiveTab] = useState("personales");
  const [provinciasOptions, setProvinciasOptions] = useState([]);
  const [cantonesOptions, setCantonesOptions] = useState([]);
  const [parroquiasOptions, setParroquiasOptions] = useState([]);
  const [naciEtnicaPuebloOptions, setNaciEtnicaPuebloOptions] = useState([]);
  const [puebKichwaOptions, setPuebKichwaOptions] = useState([]);
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [fechaNacimientoRepresentante, setFechaNacimientoRepresentante] =
    useState("");
  const [edad, setEdad] = useState("");
  const [edadRepresentante, setEdadRepresentante] = useState("");
  const navigate = useNavigate();

  const initialVariableEstado = {
    adm_dato_pers_tipo_iden: false,
    adm_dato_pers_nume_iden: true,
    adm_dato_pers_apel_prim: true,
    adm_dato_pers_nomb_prim: true,
    adm_dato_pers_esta_civi: true,
    adm_dato_pers_sexo: true,
    adm_dato_pers_tele: true,
    adm_dato_pers_celu: true,
    adm_dato_pers_corr_elec: true,
    adm_dato_naci_luga_naci: true,
    adm_dato_naci_naci: true,
    adm_dato_naci_fech_naci: true,
    adm_dato_resi_pais_resi: true,
    adm_dato_resi_prov: true,
    adm_dato_resi_cant: true,
    adm_dato_resi_parr: true,
    adm_dato_resi_barr_sect: true,
    adm_dato_resi_call_prin: true,
    adm_dato_resi_call_secu: true,
    adm_dato_resi_refe_resi: true,
    adm_dato_auto_auto_etni: true,
    adm_dato_auto_naci_etni: true,
    adm_dato_auto_pueb_kich: true,
    adm_dato_adic_grup_prio: true,
    adm_dato_adic_nive_educ: true,
    adm_dato_adic_esta_nive_educ: true,
    adm_dato_adic_tipo_empr_trab: true,
    adm_dato_adic_ocup_prof_prin: true,
    adm_dato_adic_tipo_segu: true,
    adm_dato_adic_tien_disc: true,
    adm_dato_repr_tipo_iden: true,
    adm_dato_repr_nume_iden: true,
    adm_dato_repr_apel: true,
    adm_dato_repr_nomb: true,
    adm_dato_repr_fech_naci: true,
    adm_dato_repr_pare: true,
    adm_dato_repr_nume_tele: true,
    adm_dato_repr_naci: true,
    adm_dato_repr_no_ident_prov: true,
    adm_dato_cont_enca_nece_llam: true,
    adm_dato_cont_pare: true,
    adm_dato_cont_dire: true,
    adm_dato_cont_tele: true,
  };
  const initialBotonEstado = {
    btnBuscar: true,
    btnBuscarRepresentante: true,
    btnRegistrar: true,
    btnLimpiar: false,
    btnLimpiarRepresentante: false,
  };

  const [variableEstado, setVariableEstado] = useState(initialVariableEstado);
  const [botonEstado, setBotonEstado] = useState(initialBotonEstado);

  const requiredFields = [
    "adm_dato_pers_tipo_iden",
    "adm_dato_pers_nume_iden",
    "adm_dato_pers_apel_prim",
    "adm_dato_pers_nomb_prim",
    "adm_dato_naci_fech_naci",
    "adm_dato_pers_sexo",
    "adm_dato_naci_naci",
    "adm_dato_no_ident_prov",
    "adm_dato_resi_pais_resi",
    "adm_dato_resi_prov",
    "adm_dato_resi_cant",
    "adm_dato_resi_parr",
    "adm_dato_auto_auto_etni",
    "adm_dato_auto_naci_etni",
    "adm_dato_auto_pueb_kich",
    "adm_dato_adic_grup_prio",
    "adm_dato_adic_tipo_segu",
    "adm_dato_repr_tipo_iden",
    "adm_dato_repr_nume_iden",
    "adm_dato_repr_apel",
    "adm_dato_repr_nomb",
    "adm_dato_repr_fech_naci",
    "adm_dato_repr_pare",
    "adm_dato_repr_naci",
    "adm_dato_repr_no_ident_prov",
  ];

  const labelMap = {
    adm_dato_pers_tipo_iden: "Tipo de Identificación:",
    adm_dato_pers_nume_iden: "Número de Identificación:",
    adm_dato_pers_apel_prim: "Apellidos:",
    adm_dato_pers_nomb_prim: "Nombres:",
    adm_dato_pers_esta_civi: "Estado Civil:",
    adm_dato_pers_sexo: "Sexo:",
    adm_dato_pers_tele: "Teléfono:",
    adm_dato_pers_celu: "Celular:",
    adm_dato_pers_corr_elec: "Correo electronico:",
    adm_dato_naci_luga_naci: "Lugar de Nacimiento:",
    adm_dato_no_ident_prov: "Provincia de Nacimiento (NO IDENTIFICADO):",
    adm_dato_naci_naci: "Nacionalidad:",
    adm_dato_naci_fech_naci: "Fecha de Nacimiento:",
    adm_dato_resi_pais_resi: "País de Residencia:",
    adm_dato_resi_prov: "Provincia:",
    adm_dato_resi_cant: "Cantón:",
    adm_dato_resi_parr: "Parroquia:",
    adm_dato_resi_barr_sect: "Barrio o Sector:",
    adm_dato_resi_call_prin: "Calle Principal:",
    adm_dato_resi_call_secu: "Calle Secundaria:",
    adm_dato_resi_refe_resi: "Referencia de Residencia:",
    adm_dato_auto_auto_etni: "Autoidentificación Étnica:",
    adm_dato_auto_naci_etni: "Nacionalidad Étnica/Pueblos:",
    adm_dato_auto_pueb_kich: "Pueblos Kichwa:",
    adm_dato_adic_grup_prio: "Grupo Prioritario:",
    adm_dato_adic_nive_educ: "Nivel de Educación:",
    adm_dato_adic_esta_nive_educ: "Estado de Nivel de Educación:",
    adm_dato_adic_tipo_empr_trab: "Tipo de Empresa de Trabajo:",
    adm_dato_adic_ocup_prof_prin: "Ocupación/Profesión Principal:",
    adm_dato_adic_tipo_segu: "Tipo de Seguro:",
    adm_dato_adic_tien_disc: "Tiene discapacidad?:",
    adm_dato_repr_tipo_iden: "Tipo de Identificación:",
    adm_dato_repr_nume_iden: "Número de Identificación:",
    adm_dato_repr_apel: "Apellidos:",
    adm_dato_repr_nomb: "Nombres:",
    adm_dato_repr_fech_naci: "Fecha de Nacimiento:",
    adm_dato_repr_pare: "Parentesco:",
    adm_dato_repr_nume_tele: "Número telefónico:",
    adm_dato_repr_naci: "Nacionalidad:",
    adm_dato_repr_no_ident_prov: "Provincia de Nacimiento (NO IDENTIFICADO):",
    adm_dato_cont_enca_nece_llam: "Contacto de emergencia - Nombre completo:",
    adm_dato_cont_pare: "Parentesco:",
    adm_dato_cont_dire: "Dirección:",
    adm_dato_cont_tele: "Teléfono:",
  };

  const getErrorMessage = (error) => {
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === "object" && data !== null) {
        if (data.message) return data.message;
        if (data.error) return data.error;
        const firstKey = Object.keys(data)[0];
        const firstError = data[firstKey];
        if (Array.isArray(firstError) && firstError.length > 0) {
          return firstError[0];
        } else if (typeof firstError === "string") {
          return firstError;
        }
        return JSON.stringify(data);
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

  const handleSearch = async (tipo = "paciente") => {
    let tipoId, numIden;
    if (tipo === "representante") {
      tipoId = formData.adm_dato_repr_tipo_iden;
      numIden = formData.adm_dato_repr_nume_iden;
    } else {
      tipoId = formData.adm_dato_pers_tipo_iden;
      numIden = formData.adm_dato_pers_nume_iden;
    }

    if (!numIden) {
      toast.error("Por favor, ingrese una identificación.", {
        position: "bottom-right",
      });
      return;
    }
    const resultado = validarNumeroIdentificacion(tipoId, numIden);
    if (!resultado.valido) {
      setError(resultado.mensaje);
      setTimeout(() => setError(""), 8000);
      toast.error(resultado.mensaje, { position: "bottom-right" });
      return;
    }
    try {
      const response = await buscarUsuarioAdmision(tipoId, numIden);
      if (!response)
        throw new Error("No se pudo obtener una respuesta de la API.");

      // Si es representante, actualiza solo los campos del representante
      if (tipo === "representante") {
        actualizarFormDataConRespuestaRepresentante(response.data);
        ajustarVariableEstadoExitoso();
        setSuccessMessage(response.message || "Operación exitosa");
        setTimeout(() => setSuccessMessage(""), 10000);
        setError("");
        toast.success(response.message || "Operación exitosa", {
          position: "bottom-right",
        });
      } else {
        actualizarFormDataConRespuesta(response.data);
        ajustarVariableEstadoExitoso();
        setIsEditing(true);
        setSuccessMessage(response.message || "Operación exitosa");
        setTimeout(() => setSuccessMessage(""), 10000);
        setError("");
        toast.success(response.message || "Operación exitosa", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (tipo === "representante") {
        ajustarVariableEstadoFalsoRepr();
      } else {
        ajustarVariableEstadoFalso();
      }
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      setSuccessMessage("");
      toast.error(errorMessage, { position: "bottom-right" });
    }
  };

  const actualizarFormDataConRespuesta = (data) => {
    const getNoIdentProv = (tipoId, numIden, provData) => {
      if (tipoId === "NO IDENTIFICADO" && numIden) {
        return numIden.length >= 8 ? numIden.substring(6, 8) : "99";
      }
      return provData || "";
    };

    const noIdentProv = getNoIdentProv(
      formData.adm_dato_pers_tipo_iden,
      formData.adm_dato_pers_nume_iden,
      data.adm_dato_no_ident_prov
    );
    const noIdentProvRepr = getNoIdentProv(
      data.adm_dato_repr_tipo_iden,
      data.adm_dato_repr_nume_iden,
      data.adm_dato_repr_no_ident_prov
    );

    const fechaNac = data.adm_dato_naci_fech_naci
      ? new Date(data.adm_dato_naci_fech_naci).toISOString().slice(0, 10)
      : "";
    const fechaNacRepr = data.adm_dato_repr_fech_naci
      ? new Date(data.adm_dato_repr_fech_naci).toISOString().slice(0, 10)
      : "";

    setFechaNacimiento(fechaNac);
    setFechaNacimientoRepresentante(fechaNacRepr);
    setEdad(calcularEdad(fechaNac));
    setEdadRepresentante(calcularEdad(fechaNacRepr));
    setFormData((prevData) => ({
      ...prevData,
      id_adm: data.id_adm || data.id || "",
      // Combina apellidos
      adm_dato_pers_apel_prim: [
        data.adm_dato_pers_apel_prim || "",
        data.adm_dato_pers_apel_segu || "",
      ]
        .filter(Boolean)
        .join(" "),
      // Combina nombres
      adm_dato_pers_nomb_prim: [
        data.adm_dato_pers_nomb_prim || "",
        data.adm_dato_pers_nomb_segu || "",
      ]
        .filter(Boolean)
        .join(" "),
      adm_dato_pers_esta_civi: data.adm_dato_pers_esta_civi || "",
      adm_dato_pers_sexo: data.adm_dato_pers_sexo || "",
      adm_dato_pers_tele: data.adm_dato_pers_tele || "",
      adm_dato_pers_celu: data.adm_dato_pers_celu || "",
      adm_dato_pers_corr_elec: data.adm_dato_pers_corr_elec || "",
      adm_dato_naci_luga_naci: data.adm_dato_naci_luga_naci || "",
      adm_dato_naci_naci: data.adm_dato_naci_naci || "",
      adm_dato_no_ident_prov: noIdentProv,
      adm_dato_naci_fech_naci: fechaNac,
      adm_dato_resi_pais_resi: data.adm_dato_resi_pais_resi || "",
      adm_dato_resi_prov: data.adm_dato_resi_prov || "",
      adm_dato_resi_cant: data.adm_dato_resi_cant || "",
      adm_dato_resi_parr: data.adm_dato_resi_parr || "",
      adm_dato_resi_barr_sect: data.adm_dato_resi_barr_sect || "",
      adm_dato_resi_call_prin: data.adm_dato_resi_call_prin || "",
      adm_dato_resi_call_secu: data.adm_dato_resi_call_secu || "",
      adm_dato_resi_refe_resi: data.adm_dato_resi_refe_resi || "",
      adm_dato_auto_auto_etni: data.adm_dato_auto_auto_etni || "",
      adm_dato_auto_naci_etni: data.adm_dato_auto_naci_etni || "",
      adm_dato_auto_pueb_kich: data.adm_dato_auto_pueb_kich || "",
      adm_dato_adic_grup_prio: data.adm_dato_adic_grup_prio || "",
      adm_dato_adic_nive_educ: data.adm_dato_adic_nive_educ || "",
      adm_dato_adic_esta_nive_educ: data.adm_dato_adic_esta_nive_educ || "",
      adm_dato_adic_tipo_empr_trab: data.adm_dato_adic_tipo_empr_trab || "",
      adm_dato_adic_ocup_prof_prin: data.adm_dato_adic_ocup_prof_prin || "",
      adm_dato_adic_tipo_segu: data.adm_dato_adic_tipo_segu || "",
      adm_dato_adic_tien_disc: data.adm_dato_adic_tien_disc || "",
      adm_dato_repr_tipo_iden: data.adm_dato_repr_tipo_iden || "",
      adm_dato_repr_nume_iden: data.adm_dato_repr_nume_iden || "",
      adm_dato_repr_apel: data.adm_dato_repr_apel || "",
      adm_dato_repr_nomb: data.adm_dato_repr_nomb || "",
      adm_dato_repr_fech_naci: fechaNacRepr,
      adm_dato_repr_pare: data.adm_dato_repr_pare || "",
      adm_dato_repr_nume_tele: data.adm_dato_repr_nume_tele || "",
      adm_dato_repr_naci: data.adm_dato_repr_naci || "",
      adm_dato_repr_no_ident_prov: noIdentProvRepr,
      adm_dato_cont_enca_nece_llam: data.adm_dato_cont_enca_nece_llam || "",
      adm_dato_cont_pare: data.adm_dato_cont_pare || "",
      adm_dato_cont_dire: data.adm_dato_cont_dire || "",
      adm_dato_cont_tele: data.adm_dato_cont_tele || "",
    }));
  };

  const actualizarFormDataConRespuestaRepresentante = (data) => {
    const getNoIdentProv = (tipoId, numIden, provData) => {
      if (tipoId === "NO IDENTIFICADO" && numIden) {
        return numIden.length >= 8 ? numIden.substring(6, 8) : "99";
      }
      return provData || "";
    };

    // Si es NO IDENTIFICADO, vacía los campos requeridos
    const esNoIdentificado = data.adm_dato_repr_tipo_iden === "NO IDENTIFICADO";
    const fechaNac = esNoIdentificado
      ? ""
      : data.adm_dato_naci_fech_naci
      ? new Date(data.adm_dato_naci_fech_naci).toISOString().slice(0, 10)
      : "";
    const naci = esNoIdentificado ? "" : data.adm_dato_naci_naci || "";
    const noIdentProv = esNoIdentificado
      ? ""
      : getNoIdentProv(
          formData.adm_dato_repr_tipo_iden,
          formData.adm_dato_repr_nume_iden,
          data.adm_dato_repr_no_ident_prov
        );

    setFechaNacimientoRepresentante(fechaNac);
    setEdadRepresentante(calcularEdad(fechaNac));
    setFormData((prevData) => ({
      ...prevData,
      id_adm: data.id_adm || data.id || "",
      adm_dato_repr_apel: [
        data.adm_dato_pers_apel_prim || "",
        data.adm_dato_pers_apel_segu || "",
      ]
        .filter(Boolean)
        .join(" "),
      adm_dato_repr_nomb: [
        data.adm_dato_pers_nomb_prim || "",
        data.adm_dato_pers_nomb_segu || "",
      ]
        .filter(Boolean)
        .join(" "),
      adm_dato_repr_nume_tele: data.adm_dato_pers_celu || "",
      adm_dato_repr_fech_naci: fechaNac,
      adm_dato_repr_naci: naci,
      adm_dato_repr_no_ident_prov: noIdentProv,
    }));
  };

  const ajustarVariableEstadoExitoso = () => {
    setVariableEstado((prevState) => ({
      ...prevState,
      adm_dato_pers_tipo_iden: true,
      adm_dato_pers_nume_iden: true,
      adm_dato_pers_apel_prim: false,
      adm_dato_pers_nomb_prim: false,
      adm_dato_pers_esta_civi: false,
      adm_dato_pers_sexo: false,
      adm_dato_pers_tele: false,
      adm_dato_pers_celu: false,
      adm_dato_pers_corr_elec: false,
      adm_dato_naci_luga_naci: false,
      adm_dato_naci_naci: false,
      adm_dato_naci_fech_naci: false,
      adm_dato_resi_pais_resi: false,
      adm_dato_resi_prov: false,
      adm_dato_resi_cant: false,
      adm_dato_resi_parr: false,
      adm_dato_resi_barr_sect: false,
      adm_dato_resi_call_prin: false,
      adm_dato_resi_call_secu: false,
      adm_dato_resi_refe_resi: false,
      adm_dato_auto_auto_etni: false,
      adm_dato_auto_naci_etni: false,
      adm_dato_auto_pueb_kich: false,
      adm_dato_adic_grup_prio: false,
      adm_dato_adic_nive_educ: false,
      adm_dato_adic_esta_nive_educ: false,
      adm_dato_adic_tipo_empr_trab: false,
      adm_dato_adic_ocup_prof_prin: false,
      adm_dato_adic_tipo_segu: false,
      adm_dato_adic_tien_disc: false,
      adm_dato_repr_tipo_iden: false,
      adm_dato_repr_nume_iden: true,
      adm_dato_repr_apel: false,
      adm_dato_repr_nomb: false,
      adm_dato_repr_fech_naci: false,
      adm_dato_repr_pare: false,
      adm_dato_repr_nume_tele: false,
      adm_dato_repr_naci: false,
      adm_dato_repr_no_ident_prov: false,
      adm_dato_cont_enca_nece_llam: false,
      adm_dato_cont_pare: false,
      adm_dato_cont_dire: false,
      adm_dato_cont_tele: false,
    }));
    setBotonEstado((prevState) => ({
      btnBuscar: true,
      btnBuscarRepresentante: true,
    }));
  };

  const ajustarVariableEstadoFalso = () => {
    setVariableEstado((prevState) => ({
      ...prevState,
      adm_dato_pers_tipo_iden: true,
      adm_dato_pers_nume_iden: true,
      adm_dato_pers_apel_prim: false,
      adm_dato_pers_nomb_prim: false,
      adm_dato_pers_esta_civi: false,
      adm_dato_pers_sexo: false,
      adm_dato_pers_tele: false,
      adm_dato_pers_celu: false,
      adm_dato_pers_corr_elec: false,
      adm_dato_naci_luga_naci: false,
      adm_dato_naci_naci: false,
      adm_dato_naci_fech_naci: false,
      adm_dato_resi_pais_resi: false,
      adm_dato_resi_prov: false,
      adm_dato_resi_cant: false,
      adm_dato_resi_parr: false,
      adm_dato_resi_barr_sect: false,
      adm_dato_resi_call_prin: false,
      adm_dato_resi_call_secu: false,
      adm_dato_resi_refe_resi: false,
      adm_dato_auto_auto_etni: false,
      adm_dato_auto_naci_etni: false,
      adm_dato_auto_pueb_kich: false,
      adm_dato_adic_grup_prio: false,
      adm_dato_adic_nive_educ: false,
      adm_dato_adic_esta_nive_educ: false,
      adm_dato_adic_tipo_empr_trab: false,
      adm_dato_adic_ocup_prof_prin: false,
      adm_dato_adic_tipo_segu: false,
      adm_dato_adic_tien_disc: false,
      adm_dato_repr_tipo_iden: false,
      adm_dato_repr_nume_iden: true,
      adm_dato_repr_apel: true,
      adm_dato_repr_nomb: true,
      adm_dato_repr_fech_naci: true,
      adm_dato_repr_pare: true,
      adm_dato_repr_nume_tele: true,
      adm_dato_repr_naci: true,
      adm_dato_repr_no_ident_prov: true,
      adm_dato_cont_enca_nece_llam: false,
      adm_dato_cont_pare: false,
      adm_dato_cont_dire: false,
      adm_dato_cont_tele: false,
    }));
    setBotonEstado((prevState) => ({
      btnBuscar: true,
      btnRegistrar: true,
    }));
  };

  const ajustarVariableEstadoFalsoRepr = () => {
    setVariableEstado((prevState) => ({
      ...prevState,
      adm_dato_repr_tipo_iden: false,
      adm_dato_repr_nume_iden: true,
      adm_dato_repr_apel: false,
      adm_dato_repr_nomb: false,
      adm_dato_repr_fech_naci: false,
      adm_dato_repr_pare: false,
      adm_dato_repr_nume_tele: false,
      adm_dato_repr_naci: false,
      adm_dato_repr_no_ident_prov: false,
    }));
    setBotonEstado((prevState) => ({
      btnBuscar: true,
      btnBuscarRepresentante: true,
      btnRegistrar: true,
    }));
  };

  const limpiarEstadoRepr = () => {
    setFormData((prev) => ({
      ...prev,
      adm_dato_repr_tipo_iden: "",
      adm_dato_repr_nume_iden: "",
      adm_dato_repr_apel: "",
      adm_dato_repr_nomb: "",
      adm_dato_repr_pare: "",
      adm_dato_repr_nume_tele: "",
      adm_dato_repr_fech_naci: "",
      adm_dato_repr_naci: "",
    }));
    setVariableEstado((prevState) => ({
      ...prevState,
      adm_dato_repr_tipo_iden: false,
      adm_dato_repr_nume_iden: true,
      adm_dato_repr_apel: true,
      adm_dato_repr_nomb: true,
      adm_dato_repr_fech_naci: true,
      adm_dato_repr_pare: true,
      adm_dato_repr_nume_tele: true,
      adm_dato_repr_naci: true,
      adm_dato_repr_no_ident_prov: true,
    }));
    setBotonEstado((prevState) => ({
      btnBuscarRepresentante: true,
      btnRegistrar: true,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updatedForm = { ...prev, [name]: value };
      if (!isEditing && isBuscar) {
        updatedForm.adm_dato_pers_nume_iden = generarNumeIden(
          updatedForm.adm_dato_pers_nomb_prim,
          updatedForm.adm_dato_pers_apel_prim,
          updatedForm.adm_dato_naci_naci,
          updatedForm.adm_dato_naci_fech_naci,
          updatedForm.adm_dato_no_ident_prov
        );
      }
      return updatedForm;
    });

    setFormData((prev) => {
      const updatedForm = { ...prev, [name]: value };
      if (!isEditing && isBuscarRepresentante) {
        updatedForm.adm_dato_repr_nume_iden = generarNumeIden(
          updatedForm.adm_dato_repr_nomb,
          updatedForm.adm_dato_repr_apel,
          updatedForm.adm_dato_repr_naci,
          updatedForm.adm_dato_repr_fech_naci,
          updatedForm.adm_dato_repr_no_ident_prov
        );
      }
      return updatedForm;
    });

    const actualizarFechaNacimiento = (val, name) => {
      if (name === "adm_dato_naci_fech_naci") {
        setFormData((prev) => ({ ...prev, adm_dato_naci_fech_naci: val }));
        setFechaNacimiento(val);
        setEdad(calcularEdad(val));
      } else if (name === "adm_dato_repr_fech_naci") {
        setFormData((prev) => ({ ...prev, adm_dato_repr_fech_naci: val }));
        setFechaNacimientoRepresentante(val);
        setEdadRepresentante(calcularEdad(val));
      }
      validarDato(
        { target: { name, value: val } },
        { ...formData, [name]: val },
        setFormData,
        error,
        setError,
        setBotonEstado
      );
    };

    const resetCamposPersona = () => {
      limpiarVariables();
      setVariableEstado(initialVariableEstado);
      setBotonEstado(initialBotonEstado);
      setIsBuscar(false);
    };

    const resetCamposRepresentante = () => {
      setFormData((prev) => ({
        ...prev,
        adm_dato_repr_nume_iden: "",
        adm_dato_repr_apel: "",
        adm_dato_repr_nomb: "",
        adm_dato_repr_fech_naci: "",
        adm_dato_repr_pare: "",
        adm_dato_repr_nume_tele: "",
        adm_dato_repr_naci: "",
        adm_dato_repr_no_ident_prov: "",
      }));
      setIsBuscarRepresentante(false);
    };

    switch (name) {
      // Casos de datos personales
      case "adm_dato_naci_fech_naci":
        actualizarFechaNacimiento(value, name);
        break;

      case "adm_dato_pers_tipo_iden":
        setFormData((prev) => ({
          ...prev,
          adm_dato_pers_nume_iden: "",
          adm_dato_auto_auto_etni: "",
        }));
        setVariableEstado((prev) => ({
          ...prev,
          adm_dato_pers_nume_iden: !value,
        }));
        if (!value) {
          resetCamposPersona();
        } else if (value === "NO IDENTIFICADO") {
          if (formData.adm_dato_pers_nume_iden) {
            setIsBuscar(false);
            setBotonEstado((prev) => ({ ...prev, btnBuscar: !value }));
          } else {
            setIsBuscar(true);
            setBotonEstado((prev) => ({ ...prev, btnBuscar: false }));
          }
        } else {
          setIsBuscar(false);
          setBotonEstado((prev) => ({ ...prev, btnBuscar: true }));
        }
        validarDato(
          e,
          { ...formData, [name]: value, adm_dato_pers_nume_iden: "" },
          setFormData,
          error,
          setError,
          setBotonEstado
        );
        break;

      case "adm_dato_pers_nume_iden":
        if (formData.adm_dato_pers_tipo_iden === "NO IDENTIFICADO") {
          if (value) {
            setIsBuscar(false);
            setBotonEstado((prev) => ({ ...prev, btnBuscar: false }));
          } else {
            setIsBuscar(true);
          }
        } else {
          setIsBuscar(false);
          setBotonEstado((prev) => ({ ...prev, btnBuscar: !value }));
        }
        validarDato(
          e,
          { ...formData, [name]: value },
          setFormData,
          error,
          setError,
          setBotonEstado
        );
        break;

      // Casos de representante
      case "adm_dato_repr_fech_naci":
        actualizarFechaNacimiento(value, name);
        break;

      case "adm_dato_repr_tipo_iden":
        setFormData((prev) => ({
          ...prev,
          adm_dato_repr_nume_iden: "",
        }));
        setVariableEstado((prev) => ({
          ...prev,
          adm_dato_repr_nume_iden: !value,
          adm_dato_repr_apel: true,
          adm_dato_repr_nomb: true,
          adm_dato_repr_fech_naci: true,
          adm_dato_repr_pare: true,
          adm_dato_repr_nume_tele: true,
          adm_dato_repr_naci: true,
          adm_dato_repr_no_ident_prov: true,
        }));
        if (!value) {
          resetCamposRepresentante();
        } else if (value === "NO IDENTIFICADO") {
          if (formData.adm_dato_repr_nume_iden) {
            setIsBuscarRepresentante(false);
            setBotonEstado((prev) => ({
              ...prev,
              btnBuscarRepresentante: !value,
            }));
          } else {
            setIsBuscarRepresentante(true);
            setBotonEstado((prev) => ({
              ...prev,
              btnBuscarRepresentante: false,
            }));
          }
        } else {
          setIsBuscarRepresentante(false);
          setBotonEstado((prev) => ({
            ...prev,
            btnBuscarRepresentante: true,
          }));
        }
        validarDato(
          e,
          {
            ...formData,
            [name]: value,
            adm_dato_repr_nume_iden: "",
            adm_dato_repr_apel: "",
            adm_dato_repr_nomb: "",
            adm_dato_repr_pare: "",
            adm_dato_repr_nume_tele: "",
            adm_dato_repr_naci: "",
            adm_dato_repr_no_ident_prov: "",
          },
          setFormData,
          error,
          setError,
          setBotonEstado,
          setFechaNacimientoRepresentante(""),
          setEdadRepresentante("")
        );
        break;

      case "adm_dato_repr_nume_iden":
        if (formData.adm_dato_repr_tipo_iden === "NO IDENTIFICADO") {
          if (value) {
            setIsBuscarRepresentante(false);
            setBotonEstado((prev) => ({
              ...prev,
              btnBuscarRepresentante: false,
            }));
          } else {
            setIsBuscarRepresentante(true);
          }
        } else {
          setIsBuscarRepresentante(false);
          setBotonEstado((prev) => ({
            ...prev,
            btnBuscarRepresentante: !value,
          }));
        }
        validarDato(
          e,
          { ...formData, [name]: value },
          setFormData,
          error,
          setError,
          setBotonEstado
        );
        break;

      // Default para el resto de campos
      default:
        setFormData((prev) => ({ ...prev, [name]: value }));
        validarDato(
          e,
          { ...formData, [name]: value },
          setFormData,
          error,
          setError,
          setBotonEstado
        );
        break;
    }
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    let nuevoFormData = { ...formData, [name]: value };

    if (name === "adm_dato_resi_pais_resi") {
      nuevoFormData.adm_dato_resi_prov = "";
      nuevoFormData.adm_dato_resi_cant = "";
      nuevoFormData.adm_dato_resi_parr = "";
    }
    if (name === "adm_dato_resi_prov") {
      nuevoFormData.adm_dato_resi_cant = "";
      nuevoFormData.adm_dato_resi_parr = "";
    }
    if (name === "adm_dato_resi_cant") {
      nuevoFormData.adm_dato_resi_parr = "";
    }
    if (name === "adm_dato_auto_auto_etni") {
      nuevoFormData.adm_dato_auto_naci_etni = "";
      nuevoFormData.adm_dato_auto_pueb_kich = "";
    }
    if (name === "adm_dato_auto_naci_etni") {
      nuevoFormData.adm_dato_auto_pueb_kich = "";
    }
    if (name === "adm_dato_naci_naci") {
      nuevoFormData.adm_dato_no_ident_prov = "";
      nuevoFormData.adm_dato_auto_auto_etni = "";
      const nuevoLugarNaci = nacionalidadAPais[value] || "";
      nuevoFormData.adm_dato_naci_luga_naci = nuevoLugarNaci;
    }
    if (name === "adm_dato_repr_naci") {
      nuevoFormData.adm_dato_repr_no_ident_prov = "";
    }
    setFormData(nuevoFormData);
  };

  const getOpcionesNacionalidad = (tipoId) => {
    const opciones = listaSelectAdmision["adm_dato_naci_naci"] || [];
    if (["PASAPORTE", "VISA", "CARNÉT DE REFUGIADO"].includes(tipoId)) {
      return opciones.filter((opt) => opt.value !== "ECUATORIANO/A");
    }
    return opciones;
  };

  const getOpcionesNacionalidadPaci = () =>
    getOpcionesNacionalidad(formData.adm_dato_pers_tipo_iden);

  const getOpcionesNacionalidadRepr = () =>
    getOpcionesNacionalidad(formData.adm_dato_repr_tipo_iden);

  const getOpcionesGrupoPrioritario = () => {
    const sexo = formData.adm_dato_pers_sexo;
    const opciones = listaSelectAdmision["adm_dato_adic_grup_prio"] || [];
    const edadNum = parseInt(edad);

    if (sexo !== "MUJER" || isNaN(edadNum) || edadNum < 10 || edadNum > 49) {
      return opciones.filter((opt) => opt.value !== "EMBARAZADAS");
    }
    return opciones;
  };

  const isFieldVisible = (field) => {
    const camposRepresentante = [
      "adm_dato_repr_tipo_iden",
      "adm_dato_repr_nume_iden",
      "adm_dato_repr_apel",
      "adm_dato_repr_nomb",
      "adm_dato_repr_pare",
      //"adm_dato_repr_fech_naci",
      //"adm_dato_repr_naci",
      //"adm_dato_repr_no_ident_prov",
    ];
    if (
      (field === "adm_dato_repr_fech_naci" ||
        field === "adm_dato_repr_naci" ||
        field === "adm_dato_repr_no_ident_prov") &&
      formData.adm_dato_repr_tipo_iden !== "NO IDENTIFICADO"
    ) {
      return false;
    }
    if (camposRepresentante.includes(field)) {
      const edadNum = parseInt(edad);
      return !isNaN(edadNum) && edadNum < 18;
    }

    if (field === "adm_dato_auto_naci_etni") {
      return formData.adm_dato_auto_auto_etni === "INDÍGENA";
    }

    if (field === "adm_dato_auto_pueb_kich") {
      return formData.adm_dato_auto_naci_etni === "KICHWA";
    }

    if (field === "adm_dato_no_ident_prov") {
      return (
        formData.adm_dato_naci_naci === "ECUATORIANO/A" &&
        formData.adm_dato_pers_tipo_iden === "NO IDENTIFICADO"
      );
    }

    if (field === "adm_dato_repr_no_ident_prov") {
      return (
        formData.adm_dato_repr_tipo_iden === "NO IDENTIFICADO" &&
        formData.adm_dato_repr_naci === "ECUATORIANO/A"
      );
    }

    return true;
  };

  const checkFormValidity = () => {
    // requiredFields.forEach((field) => {
    //   console.log(
    //     `${field}:`,
    //     formData[field],
    //     "visible:",
    //     isFieldVisible(field)
    //   );
    // });
    const isValid = requiredFields.filter(isFieldVisible).every((field) => {
      if (Array.isArray(formData[field])) {
        return formData[field].length > 0;
      }
      return formData[field];
    });
    const isValidationError =
      error && typeof error === "object" && error.type === "validacion";
    setBotonEstado((prevState) => ({
      ...prevState,
      btnRegistrar: !isValid || isValidationError,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    const formDataToSend = {
      ...formData,
      adm_dato_repr_fech_naci: formData.adm_dato_repr_fech_naci
        ? formData.adm_dato_repr_fech_naci
        : null,
    };
    try {
      let response;
      if (isEditing) {
        response = await updateAdmision(formDataToSend);
        const message = response?.message || "Registro actualizado con éxito!";
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(""), 10000);
        toast.success(message, { position: "bottom-right" });
        navigate("/admision/");
        limpiarVariables(true);
      } else {
        try {
          const searchResponse = await buscarUsuarioAdmision(
            formData.adm_dato_pers_tipo_iden,
            formData.adm_dato_pers_nume_iden
          );
          const msg = `Ya existe un registro en Admisión con ${formData.adm_dato_pers_tipo_iden}: ${formData.adm_dato_pers_nume_iden} ${searchResponse.adm_dato_pers_apel_prim}`;
          setError(msg);
          setTimeout(() => setError(""), 10000);
          toast.error(msg, { position: "bottom-right" });
        } catch (error) {
          if (error.response && error.response.status === 404) {
            const response = await registerAdmision(formDataToSend);
            const message = response?.message || "Registro guardado con éxito!";
            setSuccessMessage(message);
            setTimeout(() => setSuccessMessage(""), 10000);
            toast.success(message, { position: "bottom-right" });
            navigate("/admision/");
            limpiarVariables(true);
          } else {
            const errorMessage = getErrorMessage(error);
            setError(errorMessage);
            setTimeout(() => setError(""), 10000);
            toast.error(errorMessage, { position: "bottom-right" });
          }
        }
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setTimeout(() => setError(""), 10000);
      toast.error(errorMessage, { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = (e) => {
    if (botonEstado.btnRegistrar) {
      e.preventDefault();
      toast.error("Todos los campos con * en rojo tienen que estar llenos!", {
        position: "bottom-right",
      });
    }
  };

  const limpiarVariables = (esBtnLimpiar = false) => {
    setFormData(initialState);
    if (esBtnLimpiar) {
      setTimeout(() => setSuccessMessage(""), 5000);
      setTimeout(() => setError(""), 5000);
    } else {
      setSuccessMessage("");
      setError("");
    }
    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
    setFechaNacimiento("");
    setFechaNacimientoRepresentante("");
    setEdad("");
    setEdadRepresentante("");
    setIsEditing(false);
  };

  useEffect(() => {
    checkFormValidity();
  }, [formData, error]);

  useEffect(() => {
    const pais = formData.adm_dato_resi_pais_resi;
    setProvinciasOptions(
      pais && listaSelectAdmision.adm_dato_resi_prov[pais]
        ? listaSelectAdmision.adm_dato_resi_prov[pais]
        : []
    );
  }, [formData.adm_dato_resi_pais_resi]);

  useEffect(() => {
    const provincia = formData.adm_dato_resi_prov;
    setCantonesOptions(
      provincia && listaSelectAdmision.adm_dato_resi_cant[provincia]
        ? listaSelectAdmision.adm_dato_resi_cant[provincia]
        : []
    );
  }, [formData.adm_dato_resi_prov]);

  useEffect(() => {
    const canton = formData.adm_dato_resi_cant;
    setParroquiasOptions(
      canton && listaSelectAdmision.adm_dato_resi_parr[canton]
        ? listaSelectAdmision.adm_dato_resi_parr[canton]
        : []
    );
  }, [formData.adm_dato_resi_cant]);

  useEffect(() => {
    const autoEtnica = formData.adm_dato_auto_auto_etni;
    setNaciEtnicaPuebloOptions(
      autoEtnica && listaSelectAdmision.adm_dato_auto_naci_etni[autoEtnica]
        ? listaSelectAdmision.adm_dato_auto_naci_etni[autoEtnica]
        : []
    );
  }, [formData.adm_dato_auto_auto_etni]);

  useEffect(() => {
    const naciEtnicaPueblo = formData.adm_dato_auto_naci_etni;
    setPuebKichwaOptions(
      naciEtnicaPueblo &&
        listaSelectAdmision.adm_dato_auto_pueb_kich[naciEtnicaPueblo]
        ? listaSelectAdmision.adm_dato_auto_pueb_kich[naciEtnicaPueblo]
        : []
    );
  }, [formData.adm_dato_auto_naci_etni]);

  useEffect(() => {
    const campoDisabled = variableEstado.adm_dato_pers_nume_iden;
    const btnBuscarDisabled = botonEstado.btnBuscar;
    const tieneInfo =
      formData.adm_dato_pers_nomb_prim?.trim() &&
      formData.adm_dato_pers_apel_prim?.trim() &&
      formData.adm_dato_naci_naci?.trim() &&
      formData.adm_dato_naci_fech_naci?.trim();

    if (
      campoDisabled &&
      btnBuscarDisabled &&
      tieneInfo &&
      formData.adm_dato_pers_tipo_iden === "NO IDENTIFICADO" &&
      !isEditing
    ) {
      setFormData((prev) => ({
        ...prev,
        adm_dato_pers_nume_iden: generarNumeIden(
          prev.adm_dato_pers_nomb_prim,
          prev.adm_dato_pers_apel_prim,
          prev.adm_dato_naci_naci,
          prev.adm_dato_naci_fech_naci,
          prev.adm_dato_no_ident_prov
        ),
      }));
    }
  }, [
    variableEstado.adm_dato_pers_nume_iden,
    botonEstado.btnBuscar,
    formData.adm_dato_pers_nomb_prim,
    formData.adm_dato_pers_apel_prim,
    formData.adm_dato_naci_naci,
    formData.adm_dato_naci_fech_naci,
    formData.adm_dato_no_ident_prov,
  ]);

  useEffect(() => {
    const campoDisabled = variableEstado.adm_dato_repr_nume_iden;
    const btnBuscarDisabled = botonEstado.btnBuscarRepresentante;
    const tieneInfo =
      formData.adm_dato_repr_nomb?.trim() &&
      formData.adm_dato_repr_apel?.trim() &&
      formData.adm_dato_repr_naci?.trim() &&
      formData.adm_dato_repr_fech_naci?.trim();

    if (
      campoDisabled &&
      btnBuscarDisabled &&
      tieneInfo &&
      formData.adm_dato_repr_tipo_iden === "NO IDENTIFICADO" &&
      !isEditing
    ) {
      setFormData((prev) => ({
        ...prev,
        adm_dato_repr_nume_iden: generarNumeIden(
          prev.adm_dato_repr_nomb,
          prev.adm_dato_repr_apel,
          prev.adm_dato_repr_naci,
          prev.adm_dato_repr_fech_naci,
          prev.adm_dato_repr_no_ident_prov
        ),
      }));
    }
  }, [
    variableEstado.adm_dato_repr_nume_iden,
    botonEstado.btnBuscarRepresentante,
    formData.adm_dato_repr_nomb,
    formData.adm_dato_repr_apel,
    formData.adm_dato_repr_naci,
    formData.adm_dato_repr_fech_naci,
    formData.adm_dato_repr_no_ident_prov,
  ]);

  useEffect(() => {
    if (
      formData.adm_dato_pers_tipo_iden === "CÉDULA DE IDENTIDAD" &&
      formData.adm_dato_pers_nume_iden &&
      botonEstado.btnBuscar === true
    ) {
      setFormData((prev) => ({
        ...prev,
        adm_dato_naci_naci: "ECUATORIANO/A" || "",
        adm_dato_naci_luga_naci: "ECUADOR" || "",
        adm_dato_resi_pais_resi: "ECUADOR" || "",
      }));
    }
  }, [
    formData.adm_dato_pers_tipo_iden,
    formData.adm_dato_pers_nume_iden,
    botonEstado.btnBuscar,
  ]);

  useEffect(() => {
    const sexo = formData.adm_dato_pers_sexo;
    const edadNum = parseInt(edad);
    if (
      formData.adm_dato_adic_grup_prio === "EMBARAZADAS" &&
      (sexo !== "MUJER" || isNaN(edadNum) || edadNum < 10 || edadNum > 49)
    ) {
      setFormData((prev) => ({ ...prev, adm_dato_adic_grup_prio: "" }));
    }
  }, [formData.adm_dato_pers_sexo, edad]);

  useEffect(() => {
    const edadNum = parseInt(edad);
    if (!isNaN(edadNum) && edadNum >= 18) {
      setFormData((prev) => ({
        ...prev,
        adm_dato_repr_tipo_iden: "",
        adm_dato_repr_nume_iden: "",
        adm_dato_repr_apel: "",
        adm_dato_repr_nomb: "",
        adm_dato_repr_fech_naci: "",
        adm_dato_repr_pare: "",
        adm_dato_repr_naci: "",
        adm_dato_repr_no_ident_prov: "",
      }));
    }
  }, [edad]);

  const opcionesEtniaEcuatoriano = [
    { value: "INDÍGENA", label: "01 INDÍGENA" },
    {
      value: "AFROECUATORIANO/AFRODESCENDIENTE",
      label: "02 AFROECUATORIANO/AFRODESCENDIENTE",
    },
    { value: "NEGRO/A", label: "03 NEGRO/A" },
    { value: "MULATO/A", label: "04 MULATO/A" },
    { value: "MONTUBIO/A", label: "05 MONTUBIO/A" },
    { value: "MESTIZO/A", label: "06 MESTIZO/A" },
    { value: "BLANCO/A", label: "07 BLANCO/A" },
  ];
  const opcionesEtniaOtro = [{ value: "OTRO/A", label: "08 OTRO/A" }];

  const getOpcionesAutoEtnia = () => {
    const tipoId = formData.adm_dato_pers_tipo_iden;
    const nacionalidad = formData.adm_dato_naci_naci;

    if (
      tipoId === "CÉDULA DE IDENTIDAD" ||
      (tipoId === "NO IDENTIFICADO" && nacionalidad === "ECUATORIANO/A")
    ) {
      return opcionesEtniaEcuatoriano;
    }
    if (
      (tipoId === "NO IDENTIFICADO" ||
        tipoId === "PASAPORTE" ||
        tipoId === "VISA" ||
        tipoId === "CARNÉT DE REFUGIADO") &&
      nacionalidad !== "ECUATORIANO/A"
    ) {
      return opcionesEtniaOtro;
    }
    return [];
  };

  const fieldClass = "mb-1 flex flex-col";
  const labelClass = "block text-gray-700 text-sm font-bold mb-1";
  const inputClass =
    "rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400";
  const buttonTextRegistro = isEditing ? "Actualizar Registro" : "Registrar";
  const buttonTextBuscar = isBuscar ? "Nuevo Registro" : "Buscar";
  const buttonTextBuscarRepresentante = isBuscarRepresentante
    ? "Nuevo Registro"
    : "Buscar";

  return (
    <div className="w-full h-full min-h-screen flex items-start justify-center bg-gray-100">
      <div className="w-full max-w-5xl p-2 bg-white rounded-lg shadow-md mt-2">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          Admisión de Pacientes
        </h2>
        {/* NAV TABS */}
        <nav className="flex border-b border-blue-200 mb-2 sticky top-20 z-50 bg-white items-start justify-center">
          {tabs.map((tab) =>
            tab.key === "representante" &&
            !(edad !== null && parseInt(edad) < 18) ? null : (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 -mb-px font-semibold border-b-2 transition-colors duration-200
                              ${
                                activeTab === tab.key
                                  ? "border-blue-600 text-blue-600"
                                  : "border-transparent text-gray-500 hover:text-blue-600"
                              }`}
              >
                {tab.label}
              </button>
            )
          )}
        </nav>
        <form onSubmit={handleSubmit}>
          {/* DATOS PERSONALES */}
          {activeTab === "personales" && (
            <>
              <fieldset className="border border-blue-200 rounded p-4 mb-1">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Datos Personales
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_pers_tipo_iden"
                    >
                      {requiredFields.includes("adm_dato_pers_tipo_iden") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_pers_tipo_iden"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_pers_tipo_iden"
                      name="adm_dato_pers_tipo_iden"
                      value={formData["adm_dato_pers_tipo_iden"]}
                      onChange={handleChange}
                      options={listaSelectAdmision["adm_dato_pers_tipo_iden"]}
                      disabled={variableEstado["adm_dato_pers_tipo_iden"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_pers_nume_iden"
                    >
                      {requiredFields.includes("adm_dato_pers_nume_iden") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_pers_nume_iden"]}
                    </label>
                    <input
                      type="text"
                      id="adm_dato_pers_nume_iden"
                      name="adm_dato_pers_nume_iden"
                      value={formData["adm_dato_pers_nume_iden"]}
                      onChange={handleChange}
                      placeholder="Información es requerida"
                      required
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_pers_nume_iden"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_pers_nume_iden"]}
                    />
                  </div>
                  <div className="flex items-center justify-start -mb-4">
                    <button
                      type="button"
                      id="btnBuscar"
                      name="btnBuscar"
                      className={`${buttonStylePrimario} ${
                        botonEstado.btnBuscar
                          ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
                      }`}
                      onClick={
                        isBuscar ? ajustarVariableEstadoFalso : handleSearch
                      }
                      disabled={botonEstado.btnBuscar}
                    >
                      {buttonTextBuscar}
                    </button>
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_pers_apel_prim"
                    >
                      {requiredFields.includes("adm_dato_pers_apel_prim") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_pers_apel_prim"]}
                    </label>
                    <input
                      type="text"
                      id="adm_dato_pers_apel_prim"
                      name="adm_dato_pers_apel_prim"
                      value={formData["adm_dato_pers_apel_prim"]}
                      onChange={handleChange}
                      placeholder="Información es requerida"
                      required
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_pers_apel_prim"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_pers_apel_prim"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_pers_nomb_prim"
                    >
                      {requiredFields.includes("adm_dato_pers_nomb_prim") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_pers_nomb_prim"]}
                    </label>
                    <input
                      type="text"
                      id="adm_dato_pers_nomb_prim"
                      name="adm_dato_pers_nomb_prim"
                      value={formData["adm_dato_pers_nomb_prim"]}
                      onChange={handleChange}
                      placeholder="Información es requerida"
                      required
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_pers_nomb_prim"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_pers_nomb_prim"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_naci_fech_naci"
                    >
                      {requiredFields.includes("adm_dato_naci_fech_naci") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_naci_fech_naci"]}
                    </label>
                    <input
                      type="date"
                      id="adm_dato_naci_fech_naci"
                      name="adm_dato_naci_fech_naci"
                      value={fechaNacimiento}
                      onChange={handleChange}
                      placeholder="Información es requerida"
                      required
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_naci_fech_naci"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_naci_fech_naci"]}
                    />
                    <label id="edad_paciente" style={{ marginLeft: "10px" }}>
                      {edad}
                    </label>
                  </div>
                  <div className={fieldClass}>
                    <label className={labelClass} htmlFor="adm_dato_pers_sexo">
                      {requiredFields.includes("adm_dato_pers_sexo") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_pers_sexo"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_pers_sexo"
                      name="adm_dato_pers_sexo"
                      value={formData["adm_dato_pers_sexo"]}
                      onChange={handleSelectChange}
                      options={listaSelectAdmision["adm_dato_pers_sexo"]}
                      disabled={variableEstado["adm_dato_pers_sexo"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_pers_esta_civi"
                    >
                      {requiredFields.includes("adm_dato_pers_esta_civi") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_pers_esta_civi"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_pers_esta_civi"
                      name="adm_dato_pers_esta_civi"
                      value={formData["adm_dato_pers_esta_civi"]}
                      onChange={handleSelectChange}
                      options={listaSelectAdmision["adm_dato_pers_esta_civi"]}
                      disabled={variableEstado["adm_dato_pers_esta_civi"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                </div>
              </fieldset>
              <fieldset className="border border-blue-200 rounded p-4 mb-1">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Información de Contacto
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={fieldClass}>
                    <label className={labelClass} htmlFor="adm_dato_pers_tele">
                      {requiredFields.includes("adm_dato_pers_tele") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_pers_tele"]}
                    </label>
                    <input
                      type="tel"
                      id="adm_dato_pers_tele"
                      name="adm_dato_pers_tele"
                      value={formData["adm_dato_pers_tele"]}
                      onChange={handleChange}
                      placeholder="071112223"
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_pers_tele"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_pers_tele"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label className={labelClass} htmlFor="adm_dato_pers_celu">
                      {requiredFields.includes("adm_dato_pers_celu") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_pers_celu"]}
                    </label>
                    <input
                      type="tel"
                      id="adm_dato_pers_celu"
                      name="adm_dato_pers_celu"
                      value={formData["adm_dato_pers_celu"]}
                      onChange={handleChange}
                      placeholder="0911122233"
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_pers_celu"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_pers_celu"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_pers_corr_elec"
                    >
                      {requiredFields.includes("adm_dato_pers_corr_elec") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_pers_corr_elec"]}
                    </label>
                    <input
                      type="email"
                      id="adm_dato_pers_corr_elec"
                      name="adm_dato_pers_corr_elec"
                      value={formData["adm_dato_pers_corr_elec"]}
                      onChange={handleChange}
                      placeholder="ejemplo@dominio.com"
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_pers_corr_elec"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_pers_corr_elec"]}
                    />
                  </div>
                </div>
              </fieldset>
              <fieldset className="border border-blue-200 rounded p-4 mb-1">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Datos de Nacimiento
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_naci_luga_naci"
                    >
                      {requiredFields.includes("adm_dato_naci_luga_naci") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_naci_luga_naci"]}
                    </label>
                    <input
                      type="text"
                      id="adm_dato_naci_luga_naci"
                      name="adm_dato_naci_luga_naci"
                      value={formData.adm_dato_naci_luga_naci}
                      onChange={handleChange}
                      placeholder="Información es requerida"
                      className={`${inputStyle} ${"bg-gray-200 text-gray-700 cursor-no-drop"}`}
                      disabled
                    />
                  </div>
                  <div className={fieldClass}>
                    <label className={labelClass} htmlFor="adm_dato_naci_naci">
                      {requiredFields.includes("adm_dato_naci_naci") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_naci_naci"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_naci_naci"
                      name="adm_dato_naci_naci"
                      value={formData.adm_dato_naci_naci}
                      onChange={handleSelectChange}
                      options={getOpcionesNacionalidadPaci()}
                      disabled={variableEstado["adm_dato_naci_naci"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                  {formData.adm_dato_pers_tipo_iden === "NO IDENTIFICADO" &&
                    formData.adm_dato_naci_naci === "ECUATORIANO/A" && (
                      <div className={fieldClass}>
                        <label
                          className={labelClass}
                          htmlFor="adm_dato_no_ident_prov"
                        >
                          {requiredFields.includes(
                            "adm_dato_no_ident_prov"
                          ) && <span className="text-red-500">* </span>}
                          {labelMap["adm_dato_no_ident_prov"]}
                        </label>
                        <CustomSelect
                          id="adm_dato_no_ident_prov"
                          name="adm_dato_no_ident_prov"
                          value={formData.adm_dato_no_ident_prov || ""}
                          onChange={handleChange}
                          options={
                            listaSelectAdmision["adm_dato_no_ident_prov"]
                          }
                          disabled={false}
                          variableEstado={variableEstado}
                        />
                      </div>
                    )}
                </div>
              </fieldset>
            </>
          )}
          {/* DATOS DE RESIDENCIA */}
          {activeTab === "residencia" && (
            <>
              <fieldset className="border border-blue-200 rounded p-4 mb-1">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Datos de Domicilio Actual
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_resi_pais_resi"
                    >
                      {requiredFields.includes("adm_dato_resi_pais_resi") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_resi_pais_resi"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_resi_pais_resi"
                      name="adm_dato_resi_pais_resi"
                      value={formData["adm_dato_resi_pais_resi"]}
                      onChange={handleSelectChange}
                      options={listaSelectAdmision["adm_dato_resi_pais_resi"]}
                      disabled={variableEstado["adm_dato_resi_pais_resi"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label className={labelClass} htmlFor="adm_dato_resi_prov">
                      {requiredFields.includes("adm_dato_resi_prov") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_resi_prov"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_resi_prov"
                      name="adm_dato_resi_prov"
                      value={formData["adm_dato_resi_prov"]}
                      onChange={handleSelectChange}
                      options={provinciasOptions}
                      disabled={variableEstado["adm_dato_resi_prov"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label className={labelClass} htmlFor="adm_dato_resi_cant">
                      {requiredFields.includes("adm_dato_resi_cant") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_resi_cant"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_resi_cant"
                      name="adm_dato_resi_cant"
                      value={formData["adm_dato_resi_cant"]}
                      onChange={handleSelectChange}
                      options={cantonesOptions}
                      disabled={variableEstado["adm_dato_resi_cant"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label className={labelClass} htmlFor="adm_dato_resi_parr">
                      {requiredFields.includes("adm_dato_resi_parr") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_resi_parr"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_resi_parr"
                      name="adm_dato_resi_parr"
                      value={formData["adm_dato_resi_parr"]}
                      onChange={handleSelectChange}
                      options={parroquiasOptions}
                      disabled={variableEstado["adm_dato_resi_parr"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                </div>
              </fieldset>
              <fieldset className="border border-blue-200 rounded p-4 mb-1">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Dirección de Residencia
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_resi_barr_sect"
                    >
                      {requiredFields.includes("adm_dato_resi_barr_sect") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_resi_barr_sect"]}
                    </label>
                    <input
                      type="text"
                      id="adm_dato_resi_barr_sect"
                      name="adm_dato_resi_barr_sect"
                      value={formData["adm_dato_resi_barr_sect"]}
                      onChange={handleChange}
                      placeholder="Información es requerida"
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_resi_barr_sect"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_resi_barr_sect"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_resi_call_prin"
                    >
                      {requiredFields.includes("adm_dato_resi_call_prin") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_resi_call_prin"]}
                    </label>
                    <input
                      type="text"
                      id="adm_dato_resi_call_prin"
                      name="adm_dato_resi_call_prin"
                      value={formData["adm_dato_resi_call_prin"]}
                      onChange={handleChange}
                      placeholder="Información es requerida"
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_resi_call_prin"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_resi_call_prin"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_resi_call_secu"
                    >
                      {requiredFields.includes("adm_dato_resi_call_secu") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_resi_call_secu"]}
                    </label>
                    <input
                      type="text"
                      id="adm_dato_resi_call_secu"
                      name="adm_dato_resi_call_secu"
                      value={formData["adm_dato_resi_call_secu"]}
                      onChange={handleChange}
                      placeholder="Información es requerida"
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_resi_call_secu"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_resi_call_secu"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_resi_refe_resi"
                    >
                      {requiredFields.includes("adm_dato_resi_refe_resi") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_resi_refe_resi"]}
                    </label>
                    <input
                      type="text"
                      id="adm_dato_resi_refe_resi"
                      name="adm_dato_resi_refe_resi"
                      value={formData["adm_dato_resi_refe_resi"]}
                      onChange={handleChange}
                      placeholder="Información es requerida"
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_resi_refe_resi"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_resi_refe_resi"]}
                    />
                  </div>
                </div>
              </fieldset>
            </>
          )}
          {/* DATOS ADICIONALES */}
          {activeTab === "adicionales" && (
            <>
              <fieldset className="border border-blue-200 rounded p-4 mb-1">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Identidad Étnica y Cultural
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_auto_auto_etni"
                    >
                      {requiredFields.includes("adm_dato_auto_auto_etni") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_auto_auto_etni"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_auto_auto_etni"
                      name="adm_dato_auto_auto_etni"
                      value={formData["adm_dato_auto_auto_etni"]}
                      onChange={handleSelectChange}
                      options={getOpcionesAutoEtnia()}
                      disabled={variableEstado["adm_dato_auto_auto_etni"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                  {formData.adm_dato_auto_auto_etni === "INDÍGENA" && (
                    <div className={fieldClass}>
                      <label
                        className={labelClass}
                        htmlFor="adm_dato_auto_naci_etni"
                      >
                        {requiredFields.includes("adm_dato_auto_naci_etni") && (
                          <span className="text-red-500">* </span>
                        )}
                        {labelMap["adm_dato_auto_naci_etni"]}
                      </label>
                      <CustomSelect
                        id="adm_dato_auto_naci_etni"
                        name="adm_dato_auto_naci_etni"
                        value={formData["adm_dato_auto_naci_etni"]}
                        onChange={handleSelectChange}
                        options={naciEtnicaPuebloOptions}
                        disabled={variableEstado["adm_dato_auto_naci_etni"]}
                        variableEstado={variableEstado}
                      />
                    </div>
                  )}
                  {formData.adm_dato_auto_naci_etni === "KICHWA" && (
                    <div className={fieldClass}>
                      <label
                        className={labelClass}
                        htmlFor="adm_dato_auto_pueb_kich"
                      >
                        {requiredFields.includes("adm_dato_auto_pueb_kich") && (
                          <span className="text-red-500">* </span>
                        )}
                        {labelMap["adm_dato_auto_pueb_kich"]}
                      </label>
                      <CustomSelect
                        id="adm_dato_auto_pueb_kich"
                        name="adm_dato_auto_pueb_kich"
                        value={formData["adm_dato_auto_pueb_kich"]}
                        onChange={handleSelectChange}
                        options={puebKichwaOptions}
                        disabled={variableEstado["adm_dato_auto_pueb_kich"]}
                        variableEstado={variableEstado}
                      />
                    </div>
                  )}
                </div>
              </fieldset>
              <fieldset className="border border-blue-200 rounded p-4 mb-1">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Condición Prioritaria
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_adic_grup_prio"
                    >
                      {requiredFields.includes("adm_dato_adic_grup_prio") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_adic_grup_prio"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_adic_grup_prio"
                      name="adm_dato_adic_grup_prio"
                      value={formData["adm_dato_adic_grup_prio"]}
                      onChange={handleChange}
                      options={getOpcionesGrupoPrioritario()}
                      disabled={variableEstado["adm_dato_adic_grup_prio"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                </div>
              </fieldset>
              <fieldset className="border border-blue-200 rounded p-4 mb-1">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Formación Académica
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_adic_nive_educ"
                    >
                      {requiredFields.includes("adm_dato_adic_nive_educ") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_adic_nive_educ"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_adic_nive_educ"
                      name="adm_dato_adic_nive_educ"
                      value={formData["adm_dato_adic_nive_educ"]}
                      onChange={handleChange}
                      options={listaSelectAdmision["adm_dato_adic_nive_educ"]}
                      disabled={variableEstado["adm_dato_adic_nive_educ"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_adic_esta_nive_educ"
                    >
                      {requiredFields.includes(
                        "adm_dato_adic_esta_nive_educ"
                      ) && <span className="text-red-500">* </span>}
                      {labelMap["adm_dato_adic_esta_nive_educ"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_adic_esta_nive_educ"
                      name="adm_dato_adic_esta_nive_educ"
                      value={formData["adm_dato_adic_esta_nive_educ"]}
                      onChange={handleChange}
                      options={
                        listaSelectAdmision["adm_dato_adic_esta_nive_educ"]
                      }
                      disabled={variableEstado["adm_dato_adic_esta_nive_educ"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                </div>
              </fieldset>
              <fieldset className="border border-blue-200 rounded p-4 mb-1">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Información Laboral
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_adic_tipo_empr_trab"
                    >
                      {requiredFields.includes(
                        "adm_dato_adic_tipo_empr_trab"
                      ) && <span className="text-red-500">* </span>}
                      {labelMap["adm_dato_adic_tipo_empr_trab"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_adic_tipo_empr_trab"
                      name="adm_dato_adic_tipo_empr_trab"
                      value={formData["adm_dato_adic_tipo_empr_trab"]}
                      onChange={handleChange}
                      options={
                        listaSelectAdmision["adm_dato_adic_tipo_empr_trab"]
                      }
                      disabled={variableEstado["adm_dato_adic_tipo_empr_trab"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_adic_ocup_prof_prin"
                    >
                      {requiredFields.includes(
                        "adm_dato_adic_ocup_prof_prin"
                      ) && <span className="text-red-500">* </span>}
                      {labelMap["adm_dato_adic_ocup_prof_prin"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_adic_ocup_prof_prin"
                      name="adm_dato_adic_ocup_prof_prin"
                      value={formData["adm_dato_adic_ocup_prof_prin"]}
                      onChange={handleChange}
                      options={
                        listaSelectAdmision["adm_dato_adic_ocup_prof_prin"]
                      }
                      disabled={variableEstado["adm_dato_adic_ocup_prof_prin"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_adic_tipo_segu"
                    >
                      {requiredFields.includes("adm_dato_adic_tipo_segu") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_adic_tipo_segu"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_adic_tipo_segu"
                      name="adm_dato_adic_tipo_segu"
                      value={formData["adm_dato_adic_tipo_segu"]}
                      onChange={handleChange}
                      options={listaSelectAdmision["adm_dato_adic_tipo_segu"]}
                      disabled={variableEstado["adm_dato_adic_tipo_segu"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                </div>
              </fieldset>
              <fieldset className="border border-blue-200 rounded p-4 mb-1">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Discapacidad
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_adic_tien_disc"
                    >
                      {requiredFields.includes("adm_dato_adic_tien_disc") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_adic_tien_disc"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_adic_tien_disc"
                      name="adm_dato_adic_tien_disc"
                      value={formData["adm_dato_adic_tien_disc"]}
                      onChange={handleChange}
                      options={listaSelectAdmision["adm_dato_adic_tien_disc"]}
                      disabled={variableEstado["adm_dato_adic_tien_disc"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                </div>
              </fieldset>
            </>
          )}
          {/* DATOS DEL REPRESENTANTE */}
          {edad !== null &&
            parseInt(edad) < 18 &&
            activeTab === "representante" && (
              <fieldset className="border border-blue-200 rounded p-4 mb-1">
                <legend className="text-lg font-semibold text-blue-600 px-2">
                  Datos de Representante o Familiar
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_repr_tipo_iden"
                    >
                      {requiredFields.includes("adm_dato_repr_tipo_iden") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_repr_tipo_iden"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_repr_tipo_iden"
                      name="adm_dato_repr_tipo_iden"
                      value={formData["adm_dato_repr_tipo_iden"]}
                      onChange={handleChange}
                      options={listaSelectAdmision["adm_dato_repr_tipo_iden"]}
                      disabled={variableEstado["adm_dato_repr_tipo_iden"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_repr_nume_iden"
                    >
                      {requiredFields.includes("adm_dato_repr_nume_iden") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_repr_nume_iden"]}
                    </label>
                    <input
                      type="text"
                      id="adm_dato_repr_nume_iden"
                      name="adm_dato_repr_nume_iden"
                      value={formData["adm_dato_repr_nume_iden"]}
                      onChange={handleChange}
                      placeholder="Información es requerida"
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_repr_nume_iden"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_repr_nume_iden"]}
                    />
                  </div>
                  <div className="flex items-center justify-start -mb-4">
                    <button
                      type="button"
                      id="btnBuscarRepresentante"
                      name="btnBuscarRepresentante"
                      className={`${buttonStylePrimario} ${
                        botonEstado.btnBuscarRepresentante
                          ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
                      }`}
                      onClick={
                        isBuscarRepresentante
                          ? ajustarVariableEstadoFalsoRepr
                          : () => handleSearch("representante")
                      }
                      disabled={botonEstado.btnBuscarRepresentante}
                    >
                      {buttonTextBuscarRepresentante}
                    </button>
                    <button
                      type="button"
                      id="btnLimpiarRepresentante"
                      name="btnLimpiarRepresentante"
                      className={`${buttonStylePrimario} ${
                        botonEstado.btnLimpiarRepresentante
                          ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
                      }`}
                      onClick={() => limpiarEstadoRepr()}
                      disabled={botonEstado.btnLimpiarRepresentante}
                    >
                      Limpiar
                    </button>
                  </div>
                  <div className={fieldClass}>
                    <label className={labelClass} htmlFor="adm_dato_repr_apel">
                      {requiredFields.includes("adm_dato_repr_apel") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_repr_apel"]}
                    </label>
                    <input
                      type="text"
                      id="adm_dato_repr_apel"
                      name="adm_dato_repr_apel"
                      value={formData["adm_dato_repr_apel"]}
                      onChange={handleChange}
                      placeholder="Información es requerida"
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_repr_apel"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_repr_apel"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label className={labelClass} htmlFor="adm_dato_repr_nomb">
                      {requiredFields.includes("adm_dato_repr_nomb") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_repr_nomb"]}
                    </label>
                    <input
                      type="text"
                      id="adm_dato_repr_nomb"
                      name="adm_dato_repr_nomb"
                      value={formData["adm_dato_repr_nomb"]}
                      onChange={handleChange}
                      placeholder="Información es requerida"
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_repr_nomb"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_repr_nomb"]}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label className={labelClass} htmlFor="adm_dato_repr_pare">
                      {requiredFields.includes("adm_dato_repr_pare") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_repr_pare"]}
                    </label>
                    <CustomSelect
                      id="adm_dato_repr_pare"
                      name="adm_dato_repr_pare"
                      value={formData["adm_dato_repr_pare"]}
                      onChange={handleChange}
                      options={listaSelectAdmision["adm_dato_repr_pare"]}
                      disabled={variableEstado["adm_dato_repr_pare"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label
                      className={labelClass}
                      htmlFor="adm_dato_repr_nume_tele"
                    >
                      {requiredFields.includes("adm_dato_repr_nume_tele") && (
                        <span className="text-red-500">* </span>
                      )}
                      {labelMap["adm_dato_repr_nume_tele"]}
                    </label>
                    <input
                      type="tel"
                      id="adm_dato_repr_nume_tele"
                      name="adm_dato_repr_nume_tele"
                      value={formData["adm_dato_repr_nume_tele"]}
                      onChange={handleChange}
                      placeholder="0911122233"
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_repr_nume_tele"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_repr_nume_tele"]}
                    />
                  </div>
                  {formData.adm_dato_repr_tipo_iden === "NO IDENTIFICADO" && (
                    <>
                      <div className={fieldClass}>
                        <label
                          className={labelClass}
                          htmlFor="adm_dato_repr_fech_naci"
                        >
                          {requiredFields.includes(
                            "adm_dato_repr_fech_naci"
                          ) && <span className="text-red-500">* </span>}
                          {labelMap["adm_dato_repr_fech_naci"]}
                        </label>
                        <input
                          type="date"
                          id="adm_dato_repr_fech_naci"
                          name="adm_dato_repr_fech_naci"
                          value={fechaNacimientoRepresentante}
                          onChange={handleChange}
                          placeholder="Información es requerida"
                          required
                          className={`${inputStyle} ${
                            variableEstado["adm_dato_repr_fech_naci"]
                              ? "bg-gray-200 text-gray-700 cursor-no-drop"
                              : "bg-white text-gray-700 cursor-pointer"
                          }`}
                          disabled={variableEstado["adm_dato_repr_fech_naci"]}
                        />
                        <label
                          id="edad_paciente"
                          style={{ marginLeft: "10px" }}
                        >
                          {edadRepresentante}
                        </label>
                      </div>
                      <div className={fieldClass}>
                        <label
                          className={labelClass}
                          htmlFor="adm_dato_repr_naci"
                        >
                          {requiredFields.includes("adm_dato_repr_naci") && (
                            <span className="text-red-500">* </span>
                          )}
                          {labelMap["adm_dato_repr_naci"]}
                        </label>
                        <CustomSelect
                          id="adm_dato_repr_naci"
                          name="adm_dato_repr_naci"
                          value={formData.adm_dato_repr_naci}
                          onChange={handleSelectChange}
                          options={getOpcionesNacionalidadRepr()}
                          disabled={variableEstado["adm_dato_repr_naci"]}
                          variableEstado={variableEstado}
                        />
                      </div>
                    </>
                  )}
                  {formData.adm_dato_repr_tipo_iden === "NO IDENTIFICADO" &&
                    formData.adm_dato_repr_naci === "ECUATORIANO/A" && (
                      <div className={fieldClass}>
                        <label
                          className={labelClass}
                          htmlFor="adm_dato_repr_no_ident_prov"
                        >
                          {requiredFields.includes(
                            "adm_dato_repr_no_ident_prov"
                          ) && <span className="text-red-500">* </span>}
                          {labelMap["adm_dato_repr_no_ident_prov"]}
                        </label>
                        <CustomSelect
                          id="adm_dato_repr_no_ident_prov"
                          name="adm_dato_repr_no_ident_prov"
                          value={formData.adm_dato_repr_no_ident_prov || ""}
                          onChange={handleChange}
                          options={
                            listaSelectAdmision["adm_dato_no_ident_prov"]
                          }
                          disabled={false}
                          variableEstado={variableEstado}
                        />
                      </div>
                    )}
                </div>
              </fieldset>
            )}
          {/* DATOS DE CONTACTO */}
          {activeTab === "contacto" && (
            <fieldset className="border border-blue-200 rounded p-4 mb-1">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Contacto de Emergencia
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={fieldClass}>
                  <label
                    className={labelClass}
                    htmlFor="adm_dato_cont_enca_nece_llam"
                  >
                    {requiredFields.includes(
                      "adm_dato_cont_enca_nece_llam"
                    ) && <span className="text-red-500">* </span>}
                    {labelMap["adm_dato_cont_enca_nece_llam"]}
                  </label>
                  <input
                    type="text"
                    id="adm_dato_cont_enca_nece_llam"
                    name="adm_dato_cont_enca_nece_llam"
                    value={formData["adm_dato_cont_enca_nece_llam"]}
                    onChange={handleChange}
                    placeholder="Información es requerida"
                    className={`${inputStyle} ${
                      variableEstado["adm_dato_cont_enca_nece_llam"]
                        ? "bg-gray-200 text-gray-700 cursor-no-drop"
                        : "bg-white text-gray-700 cursor-pointer"
                    }`}
                    disabled={variableEstado["adm_dato_cont_enca_nece_llam"]}
                  />
                </div>
                <div className={fieldClass}>
                  <label className={labelClass} htmlFor="adm_dato_cont_pare">
                    {requiredFields.includes("adm_dato_cont_pare") && (
                      <span className="text-red-500">* </span>
                    )}
                    {labelMap["adm_dato_cont_pare"]}
                  </label>
                  <CustomSelect
                    id="adm_dato_cont_pare"
                    name="adm_dato_cont_pare"
                    value={formData["adm_dato_cont_pare"]}
                    onChange={handleChange}
                    options={listaSelectAdmision["adm_dato_cont_pare"]}
                    disabled={variableEstado["adm_dato_cont_pare"]}
                    variableEstado={variableEstado}
                  />
                </div>
                <div className={fieldClass}>
                  <label className={labelClass} htmlFor="adm_dato_cont_dire">
                    {requiredFields.includes("adm_dato_cont_dire") && (
                      <span className="text-red-500">* </span>
                    )}
                    {labelMap["adm_dato_cont_dire"]}
                  </label>
                  <input
                    type="text"
                    id="adm_dato_cont_dire"
                    name="adm_dato_cont_dire"
                    value={formData["adm_dato_cont_dire"]}
                    onChange={handleChange}
                    placeholder="Información es requerida"
                    className={`${inputStyle} ${
                      variableEstado["adm_dato_cont_dire"]
                        ? "bg-gray-200 text-gray-700 cursor-no-drop"
                        : "bg-white text-gray-700 cursor-pointer"
                    }`}
                    disabled={variableEstado["adm_dato_cont_dire"]}
                  />
                </div>
                <div className={fieldClass}>
                  <label className={labelClass} htmlFor="adm_dato_cont_tele">
                    {requiredFields.includes("adm_dato_cont_tele") && (
                      <span className="text-red-500">* </span>
                    )}
                    {labelMap["adm_dato_cont_tele"]}
                  </label>
                  <input
                    type="tel"
                    id="adm_dato_cont_tele"
                    name="adm_dato_cont_tele"
                    value={formData["adm_dato_cont_tele"]}
                    onChange={handleChange}
                    placeholder="0911122233"
                    className={`${inputStyle} ${
                      variableEstado["adm_dato_cont_tele"]
                        ? "bg-gray-200 text-gray-700 cursor-no-drop"
                        : "bg-white text-gray-700 cursor-pointer"
                    }`}
                    disabled={variableEstado["adm_dato_cont_tele"]}
                  />
                </div>
              </div>
            </fieldset>
          )}
          <div className="flex justify-center">
            <button
              type="submit"
              id="btnRegistrar"
              name="btnRegistrar"
              className={`${buttonStylePrimario} ${
                botonEstado.btnRegistrar
                  ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
              }`}
              disabled={botonEstado.btnRegistrar}
              onClick={handleButtonClick}
            >
              {buttonTextRegistro}
            </button>
            {/* BOTON LIMPIAR */}
            <button
              type="button"
              id="btnLimpiar"
              name="btnLimpiar"
              className={`${buttonStyleSecundario} ${
                botonEstado.btnLimpiar
                  ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
              }`}
              disabled={botonEstado.btnLimpiar}
              onClick={() => limpiarVariables()}
            >
              Limpiar Todo
            </button>
            <button
              type="button"
              className="ml-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              onClick={() => navigate("/")}
            >
              Cancelar
            </button>
          </div>
        </form>
        <div className="bg-white rounded-lg shadow-md">
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2"
              role="alert"
            >
              <strong className="font-bold">
                {typeof error === "object" && error.type === "validacion"
                  ? "¡Error de Validación! "
                  : "¡Error! "}
              </strong>
              <span className="block sm:inline">
                {typeof error === "object" ? error.message : error}
              </span>
            </div>
          )}
          {successMessage && (
            <div
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-2"
              role="alert"
            >
              <strong className="font-bold">¡Éxito! </strong>
              <span className="block sm:inline">{successMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admision;
