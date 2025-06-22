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
import { validarDato, validarIdenAdmision } from "../api/validadorUtil.js";
import {
  CustomSelect,
  inputStyle,
  buttonStylePrimario,
  buttonStyleSecundario,
} from "../components/EstilosCustom.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const initialState = {
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
  adm_dato_repr_pare: "",
  adm_dato_repr_nume_tele: "",
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
    // Si noIdentProv tiene valor, retorna los dos primeros caracteres
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
  const [error, setError] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isBuscar, setIsBuscar] = useState(false);
  const [activeTab, setActiveTab] = useState("personales");
  const [provinciasOptions, setProvinciasOptions] = useState([]);
  const [cantonesOptions, setCantonesOptions] = useState([]);
  const [parroquiasOptions, setParroquiasOptions] = useState([]);
  const [naciEtnicaPuebloOptions, setNaciEtnicaPuebloOptions] = useState([]);
  const [puebKichwaOptions, setPuebKichwaOptions] = useState([]);
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [edad, setEdad] = useState("");
  const [nacionalidad, setNacionalidad] = useState("");
  const [lugarNaci, setLugarNaci] = useState("");
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
    adm_dato_repr_pare: true,
    adm_dato_repr_nume_tele: true,
    adm_dato_cont_enca_nece_llam: true,
    adm_dato_cont_pare: true,
    adm_dato_cont_dire: true,
    adm_dato_cont_tele: true,
  };
  const initialBotonEstado = {
    btnBuscar: true,
    btnLimpiar: false,
    btnRegistrar: true,
    btnNuevoRegistro: false,
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
    "adm_dato_repr_pare",
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
    adm_dato_repr_pare: "Parentesco:",
    adm_dato_repr_nume_tele: "Número telefónico:",
    adm_dato_cont_enca_nece_llam: "Contacto de emergencia - Nombre completo:",
    adm_dato_cont_pare: "Parentesco:",
    adm_dato_cont_dire: "Dirección:",
    adm_dato_cont_tele: "Teléfono:",
  };

  const handleSearch = async () => {
    const { adm_dato_pers_tipo_iden, adm_dato_pers_nume_iden } = formData;
    if (!adm_dato_pers_nume_iden) {
      toast.error("Por favor, ingrese una identificación.", {
        position: "bottom-right",
      });
      return;
    }
    if (
      !validarIdenAdmision(adm_dato_pers_tipo_iden, adm_dato_pers_nume_iden)
    ) {
      return;
    }
    try {
      const response = await buscarUsuarioAdmision(
        formData.adm_dato_pers_tipo_iden,
        adm_dato_pers_nume_iden
      );
      if (!response)
        throw new Error("No se pudo obtener una respuesta de la API.");
      const message = response.message || "Operación exitosa";

      actualizarFormDataConRespuesta(response.data);
      ajustarVariableEstadoExitoso();
      setBotonEstado((prevState) => ({
        ...prevState,
        btnBuscar: true,
      }));
      setIsEditing(true);
      toast.success(response.message || "Operación exitosa", {
        position: "bottom-right",
      });
      checkFormValidity();
    } catch (error) {
      let errorMessage = "Hubo un error en la operación";
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === "object") {
          const firstKey = Object.keys(data)[0];
          const firstErrorArray = data[firstKey];
          if (Array.isArray(firstErrorArray) && firstErrorArray.length > 0) {
            errorMessage = firstErrorArray[0];
          } else if (typeof firstErrorArray === "string") {
            errorMessage = firstErrorArray;
          }
        } else if (typeof data === "string") {
          errorMessage = data;
        }
      }
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
        adm_dato_repr_nume_iden: false,
        adm_dato_repr_apel: false,
        adm_dato_repr_nomb: false,
        adm_dato_repr_pare: false,
        adm_dato_repr_nume_tele: false,
        adm_dato_cont_enca_nece_llam: false,
        adm_dato_cont_pare: false,
        adm_dato_cont_dire: false,
        adm_dato_cont_tele: false,
      }));
      setBotonEstado((prevState) => ({
        btnBuscar: true,
        btnRegistrar: true,
      }));
      setError(errorMessage);
      toast.error(errorMessage, { position: "bottom-right" });
    }
  };

  const actualizarFormDataConRespuesta = (data) => {
    setFormData((prevData) => ({
      ...prevData,
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
      adm_dato_naci_luga_naci: setLugarNaci(data.adm_dato_naci_luga_naci || ""),
      adm_dato_naci_naci: setNacionalidad(data.adm_dato_naci_naci || ""),
      adm_dato_naci_fech_naci: setFechaNacimiento(
        new Date(data.adm_dato_naci_fech_naci).toISOString().slice(0, 10) || ""
      ),
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
      adm_dato_repr_pare: data.adm_dato_repr_pare || "",
      adm_dato_repr_nume_tele: data.adm_dato_repr_nume_tele || "",
      adm_dato_cont_enca_nece_llam: data.adm_dato_cont_enca_nece_llam || "",
      adm_dato_cont_pare: data.adm_dato_cont_pare || "",
      adm_dato_cont_dire: data.adm_dato_cont_dire || "",
      adm_dato_cont_tele: data.adm_dato_cont_tele || "",
    }));
  };

  const ajustarVariableEstadoExitoso = () => {
    setVariableEstado((prevState) => ({
      ...prevState,
      adm_dato_pers_tipo_iden: true,
      adm_dato_pers_nume_iden: true,
      adm_dato_pers_apel_prim: true,
      adm_dato_pers_nomb_prim: true,
      adm_dato_pers_esta_civi: false,
      adm_dato_pers_sexo: false,
      adm_dato_pers_tele: false,
      adm_dato_pers_celu: false,
      adm_dato_pers_corr_elec: false,
      adm_dato_naci_luga_naci: false,
      adm_dato_naci_naci: false,
      adm_dato_naci_fech_naci: true,
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
      adm_dato_repr_nume_iden: false,
      adm_dato_repr_apel: false,
      adm_dato_repr_nomb: false,
      adm_dato_repr_pare: false,
      adm_dato_repr_nume_tele: false,
      adm_dato_cont_enca_nece_llam: false,
      adm_dato_cont_pare: false,
      adm_dato_cont_dire: false,
      adm_dato_cont_tele: false,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updatedForm = { ...prev, [name]: value };
      if (isBuscar) {
        updatedForm.adm_dato_pers_nume_iden = generarNumeIden(
          updatedForm.adm_dato_pers_nomb_prim,
          updatedForm.adm_dato_pers_apel_prim,
          updatedForm.adm_dato_naci_naci,
          updatedForm.adm_dato_naci_fech_naci,
          updatedForm.adm_dato_no_ident_prov
        );
      }
      // ...resto del código...
      return updatedForm;
    });

    const actualizarFechaNacimiento = (val) => {
      setFormData((prev) => ({ ...prev, [name]: val }));
      setFechaNacimiento(val);
      setEdad(calcularEdad(val));
      validarDato(
        { target: { name, value: val } },
        { ...formData, [name]: val },
        setFormData
      );
    };

    const resetCamposPersona = () => {
      limpiarVariables();
      setVariableEstado(initialVariableEstado);
      setBotonEstado(initialBotonEstado);
      setIsBuscar(false);
    };

    switch (name) {
      case "adm_dato_naci_fech_naci":
        actualizarFechaNacimiento(value);
        break;

      case "adm_dato_pers_tipo_iden":
        // Se limpia el número de identificación al cambiar el tipo
        setFormData((prev) => ({
          ...prev,
          adm_dato_pers_nume_iden: "",
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
          setFormData
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
        validarDato(e, { ...formData, [name]: value }, setFormData);
        break;

      default:
        // Se actualiza normalmente si no hay lógica adicional
        setFormData((prev) => ({ ...prev, [name]: value }));
        validarDato(e, { ...formData, [name]: value }, setFormData);
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
      setNacionalidad(value);
      const nuevoLugarNaci = nacionalidadAPais[value] || "";
      setLugarNaci(nuevoLugarNaci);
      nuevoFormData.adm_dato_naci_luga_naci = nuevoLugarNaci;
    }
    setFormData(nuevoFormData);
    checkFormValidity();
  };

  const isFieldVisible = (field) => {
    // Campos de Representante
    const camposRepresentante = [
      "adm_dato_repr_tipo_iden",
      "adm_dato_repr_nume_iden",
      "adm_dato_repr_apel",
      "adm_dato_repr_nomb",
      "adm_dato_repr_pare",
    ];
    if (camposRepresentante.includes(field)) {
      const edadNum = parseInt(edad);
      const algunDato = camposRepresentante.some((f) =>
        formData[f]?.toString().trim()
      );
      return !isNaN(edadNum) && edadNum < 18 && algunDato;
    }

    if (field === "adm_dato_auto_naci_etni") {
      return formData.adm_dato_auto_auto_etni === "INDÍGENA";
    }

    if (field === "adm_dato_auto_pueb_kich") {
      return formData.adm_dato_auto_naci_etni === "KICHWA";
    }

    if (field === "adm_dato_no_ident_prov") {
      return formData.adm_dato_naci_naci === "ECUATORIANO/A";
    }

    return true;
  };

  const checkFormValidity = () => {
    const isValid = requiredFields.filter(isFieldVisible).every((field) => {
      if (Array.isArray(formData[field])) {
        return formData[field].length > 0;
      }
      return formData[field];
    });
    setBotonEstado((prevState) => ({
      ...prevState,
      btnRegistrar: !isValid,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      let response;
      if (isEditing) {
        response = await updateAdmision(formData);
        setSuccessMessage("Registro actualizado con éxito!");
        const message = response.message || "Registro actualizado con éxito!";
        toast.success(message, {
          position: "bottom-right",
        });
      } else {
        response = await registerAdmision(formData);
        setSuccessMessage("Registro guardado con éxito!");
        const message = response.message || "Registro guardado con éxito!";
        toast.success(message, {
          position: "bottom-right",
        });
      }
      navigate("/admision/");
      limpiarVariables();
      console.log("Registro exitoso:", response);
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
      let errorMessage = "Hubo un error en la operación";
      errorMessage = getErrorMessage(error);
      setError(errorMessage);
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

  const limpiarVariables = (e) => {
    setFormData(initialState);
    setError({});
    setSuccessMessage(null);
    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
    setFechaNacimiento("");
    setNacionalidad("");
    setLugarNaci("");
    setEdad("");
    setIsEditing(false);
  };

  useEffect(() => {
    checkFormValidity();
  }, [formData]);

  // Provincias dinámicas
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
      formData.adm_dato_naci_fech_naci?.trim() &&
      formData.adm_dato_naci_fech_naci?.trim();

    if (campoDisabled && btnBuscarDisabled && tieneInfo) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    variableEstado.adm_dato_pers_nume_iden,
    botonEstado.btnBuscar,
    formData.adm_dato_pers_nomb_prim,
    formData.adm_dato_pers_apel_prim,
    formData.adm_dato_naci_naci,
    formData.adm_dato_naci_fech_naci,
    formData.adm_dato_no_ident_prov,
  ]);

  const onClickNuevoRegistro = () => {
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
      adm_dato_repr_nume_iden: false,
      adm_dato_repr_apel: false,
      adm_dato_repr_nomb: false,
      adm_dato_repr_pare: false,
      adm_dato_repr_nume_tele: false,
      adm_dato_cont_enca_nece_llam: false,
      adm_dato_cont_pare: false,
      adm_dato_cont_dire: false,
      adm_dato_cont_tele: false,
    }));
    setBotonEstado((prevState) => ({
      btnBuscar: true,
      btnRegistrar: true,
      btnNuevoRegistro: true,
    }));
  };

  const fieldClass = "mb-1 flex flex-col";
  const labelClass = "block text-gray-700 text-sm font-bold mb-1";
  const inputClass =
    "rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400";
  const buttonTextRegistro = isEditing ? "Actualizar Registro" : "Registrar";
  const buttonTextBuscar = isBuscar ? "Nuevo Registro" : "Buscar";

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
        <div className="bg-white rounded-lg shadow-md">
          {error && (
            <p style={{ color: "red" }}>
              {Object.keys(error).length > 0 ? JSON.stringify(error) : ""}
            </p>
          )}
          {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
        </div>
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
                      onClick={isBuscar ? onClickNuevoRegistro : handleSearch}
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
                      type="text"
                      id="adm_dato_pers_tele"
                      name="adm_dato_pers_tele"
                      value={formData["adm_dato_pers_tele"]}
                      onChange={handleChange}
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
                      type="text"
                      id="adm_dato_pers_celu"
                      name="adm_dato_pers_celu"
                      value={formData["adm_dato_pers_celu"]}
                      onChange={handleChange}
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
                      value={lugarNaci}
                      onChange={handleChange}
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
                      value={nacionalidad}
                      onChange={handleSelectChange}
                      options={listaSelectAdmision["adm_dato_naci_naci"]}
                      disabled={variableEstado["adm_dato_naci_naci"]}
                      variableEstado={variableEstado}
                    />
                  </div>
                  {isBuscar &&
                    variableEstado.adm_dato_pers_nume_iden &&
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
                      options={listaSelectAdmision["adm_dato_auto_auto_etni"]}
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
                      options={listaSelectAdmision["adm_dato_adic_grup_prio"]}
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
                      type="text"
                      id="adm_dato_repr_nume_tele"
                      name="adm_dato_repr_nume_tele"
                      value={formData["adm_dato_repr_nume_tele"]}
                      onChange={handleChange}
                      placeholder="Información es requerida"
                      className={`${inputStyle} ${
                        variableEstado["adm_dato_repr_nume_tele"]
                          ? "bg-gray-200 text-gray-700 cursor-no-drop"
                          : "bg-white text-gray-700 cursor-pointer"
                      }`}
                      disabled={variableEstado["adm_dato_repr_nume_tele"]}
                    />
                  </div>
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
                    type="text"
                    id="adm_dato_cont_tele"
                    name="adm_dato_cont_tele"
                    value={formData["adm_dato_cont_tele"]}
                    onChange={handleChange}
                    placeholder="Información es requerida"
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
              className={buttonStyleSecundario}
              onClick={limpiarVariables}
            >
              Limpiar
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
      </div>
    </div>
  );
};

export default Admision;
