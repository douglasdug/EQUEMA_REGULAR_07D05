import React, { useState, useEffect } from "react";
import {
  registerAdmision,
  updateAdmision,
  buscarUsuarioAdmision,
} from "../api/conexion.api.js";
import { listaSelectAdmision } from "../components/AllList.jsx";
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

const Admision = () => {
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("personales");
  const [provinciasOptions, setProvinciasOptions] = useState([]);
  const [cantonesOptions, setCantonesOptions] = useState([]);
  const [parroquiasOptions, setParroquiasOptions] = useState([]);
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
  };

  const [variableEstado, setVariableEstado] = useState(initialVariableEstado);
  const [botonEstado, setBotonEstado] = useState(initialBotonEstado);

  const requiredFields = [
    "adm_dato_pers_tipo_iden",
    "adm_dato_pers_nume_iden",
    "adm_dato_pers_apel_prim",
    "adm_dato_pers_nomb_prim",
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
      const data = response.data;
      const message = response.message || "Operación exitosa";

      setFormData((prevData) => ({
        ...formData,
        adm_dato_pers_apel_prim: [
          data.adm_dato_pers_apel_prim || "",
          data.adm_dato_pers_apel_segu || "",
        ]
          .filter(Boolean)
          .join(" "),
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
        adm_dato_naci_fech_naci: data.adm_dato_naci_fech_naci
          ? data.adm_dato_naci_fech_naci.slice(0, 10)
          : "",
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

      setVariableEstado((prevState) => ({
        ...prevState,
        adm_dato_pers_tipo_iden: true,
        adm_dato_pers_nume_iden: true,
        adm_dato_pers_apel_prim: true,
        adm_dato_pers_nomb_prim: true,
        adm_dato_naci_fech_naci: true,
      }));

      setBotonEstado((prevState) => ({
        ...prevState,
        btnBuscar: true,
      }));
      setIsEditing(true);
      toast.success(message, {
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

  const handleChange = (e) => {
    validarDato(e, formData, setFormData);
    const { name, value } = e.target;
    if (name === "adm_dato_naci_fech_naci") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (name === "adm_dato_pers_tipo_iden") {
      setVariableEstado((prevState) => ({
        ...prevState,
        adm_dato_pers_nume_iden: !value,
      }));
      if (!value) {
        setFormData({
          adm_dato_pers_tipo_iden: value,
          adm_dato_pers_nume_iden: "",
          adm_dato_pers_apel_prim: "",
          adm_dato_pers_nomb_prim: "",
        });
        setVariableEstado(initialVariableEstado);
        setBotonEstado(initialBotonEstado);
      }
    } else if (name === "adm_dato_pers_nume_iden") {
      setBotonEstado((prevState) => ({
        ...prevState,
        btnBuscar: !value,
      }));
    }
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    let nuevoFormData = { ...formData, [name]: value };

    // Lógica especial para selects dependientes
    if (name === "adm_dato_naci_naci") {
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

    setFormData(nuevoFormData);
    checkFormValidity();
  };

  const checkFormValidity = () => {
    const isValid = requiredFields.every((field) => {
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
      navigate("/admision");
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
    setIsEditing(false);
  };

  useEffect(() => {
    checkFormValidity();
  }, [formData]);

  // Provincias dinámicas
  useEffect(() => {
    const nacionalidad = formData.adm_dato_naci_naci;
    setProvinciasOptions(
      nacionalidad && listaSelectAdmision.adm_dato_resi_prov[nacionalidad]
        ? listaSelectAdmision.adm_dato_resi_prov[nacionalidad]
        : []
    );
  }, [formData.adm_dato_naci_naci]);

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

  const fieldClass = "mb-4 flex flex-col";
  const labelClass = "block text-gray-700 text-sm font-bold mb-2";
  const inputClass =
    "rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400";
  const buttonText = isEditing ? "Actualizar Registro" : "Registrar";

  return (
    <div className="w-full h-full min-h-screen flex items-start justify-center bg-gray-100">
      <div className="w-full max-w-5xl p-2 bg-white rounded-lg shadow-md mt-2">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          Admisión de Pacientes
        </h2>
        {/* NAV TABS */}
        <nav className="flex border-b border-blue-200 mb-2">
          {tabs.map((tab) => (
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
          ))}
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
            <fieldset className="border border-blue-200 rounded p-4 mb-6">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Datos Personales
              </legend>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_pers_tipo_iden">
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
                <label className={labelClass} htmlFor="adm_dato_pers_nume_iden">
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
              <div className="flex">
                {/* BOTON BUSCAR */}
                <button
                  type="button"
                  id="btnBuscar"
                  name="btnBuscar"
                  className={`${buttonStylePrimario} ${
                    botonEstado.btnBuscar
                      ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
                  }`}
                  onClick={handleSearch}
                  disabled={botonEstado.btnBuscar}
                >
                  Buscar
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
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_pers_apel_prim">
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
                <label className={labelClass} htmlFor="adm_dato_pers_nomb_prim">
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
                <label className={labelClass} htmlFor="adm_dato_naci_fech_naci">
                  <span className="text-red-600">* </span>Fecha de Nacimiento:
                </label>
                <input
                  type="date"
                  id="adm_dato_naci_fech_naci"
                  name="adm_dato_naci_fech_naci"
                  value={formData["adm_dato_naci_fech_naci"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_pers_esta_civi">
                  Estado Civil:
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
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_pers_sexo">
                  <span className="text-red-600">* </span> Sexo:
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
                <label className={labelClass} htmlFor="adm_dato_pers_tele">
                  Teléfono:
                </label>
                <input
                  type="text"
                  id="adm_dato_pers_tele"
                  name="adm_dato_pers_tele"
                  value={formData["adm_dato_pers_tele"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_pers_celu">
                  <span className="text-red-600">* </span> Celular:
                </label>
                <input
                  type="text"
                  id="adm_dato_pers_celu"
                  name="adm_dato_pers_celu"
                  value={formData["adm_dato_pers_celu"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_pers_corr_elec">
                  <span className="text-red-600">* </span> Correo electrónico:
                </label>
                <input
                  type="email"
                  id="adm_dato_pers_corr_elec"
                  name="adm_dato_pers_corr_elec"
                  value={formData["adm_dato_pers_corr_elec"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </fieldset>
          )}
          {/* DATOS DE RESIDENCIA */}
          {activeTab === "residencia" && (
            <fieldset className="border border-blue-200 rounded p-4 mb-6">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Datos de Residencia
              </legend>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_naci_luga_naci">
                  Lugar de Nacimiento:
                </label>
                <input
                  type="text"
                  id="adm_dato_naci_luga_naci"
                  name="adm_dato_naci_luga_naci"
                  value={formData["adm_dato_naci_luga_naci"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_naci_naci">
                  <span className="text-red-600">* </span>Nacionalidad:
                </label>
                <CustomSelect
                  id="adm_dato_naci_naci"
                  name="adm_dato_naci_naci"
                  value={formData["adm_dato_naci_naci"]}
                  onChange={handleSelectChange}
                  options={listaSelectAdmision["adm_dato_naci_naci"]}
                  disabled={variableEstado["adm_dato_naci_naci"]}
                  variableEstado={variableEstado}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_resi_pais_resi">
                  <span className="text-red-600">* </span>País de Residencia:
                </label>
                <input
                  type="text"
                  id="adm_dato_resi_pais_resi"
                  name="adm_dato_resi_pais_resi"
                  value={formData["adm_dato_resi_pais_resi"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_resi_prov">
                  <span className="text-red-600">* </span>Provincia:
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
                  <span className="text-red-600">* </span>Cantón:
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
                  <span className="text-red-600">* </span>Parroquia:
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
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_resi_barr_sect">
                  <span className="text-red-600">* </span>Barrio o Sector:
                </label>
                <input
                  type="text"
                  id="adm_dato_resi_barr_sect"
                  name="adm_dato_resi_barr_sect"
                  value={formData["adm_dato_resi_barr_sect"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_resi_call_prin">
                  <span className="text-red-600">* </span>Calle Principal:
                </label>
                <input
                  type="text"
                  id="adm_dato_resi_call_prin"
                  name="adm_dato_resi_call_prin"
                  value={formData["adm_dato_resi_call_prin"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_resi_call_secu">
                  Calle Secundaria:
                </label>
                <input
                  type="text"
                  id="adm_dato_resi_call_secu"
                  name="adm_dato_resi_call_secu"
                  value={formData["adm_dato_resi_call_secu"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_resi_refe_resi">
                  Referencia de Residencia:
                </label>
                <input
                  type="text"
                  id="adm_dato_resi_refe_resi"
                  name="adm_dato_resi_refe_resi"
                  value={formData["adm_dato_resi_refe_resi"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </fieldset>
          )}
          {/* DATOS ADICIONALES */}
          {activeTab === "adicionales" && (
            <fieldset className="border border-blue-200 rounded p-4 mb-6">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Datos Adicionales
              </legend>
              {/* DATOS AUTOIDENTIFICACION */}
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_auto_auto_etni">
                  <span className="text-red-600">* </span>Autoidentificación
                  Étnica:
                </label>
                <input
                  type="text"
                  id="adm_dato_auto_auto_etni"
                  name="adm_dato_auto_auto_etni"
                  value={formData["adm_dato_auto_auto_etni"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_auto_naci_etni">
                  Nacionalidad Étnica/Pueblos:
                </label>
                <input
                  type="text"
                  id="adm_dato_auto_naci_etni"
                  name="adm_dato_auto_naci_etni"
                  value={formData["adm_dato_auto_naci_etni"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_auto_pueb_kich">
                  Pueblos Kichwa:
                </label>
                <input
                  type="text"
                  id="adm_dato_auto_pueb_kich"
                  name="adm_dato_auto_pueb_kich"
                  value={formData["adm_dato_auto_pueb_kich"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_adic_grup_prio">
                  Grupo Prioritario:
                </label>
                <input
                  type="text"
                  id="adm_dato_adic_grup_prio"
                  name="adm_dato_adic_grup_prio"
                  value={formData["adm_dato_adic_grup_prio"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_adic_nive_educ">
                  Nivel de Educación:
                </label>
                <input
                  type="text"
                  id="adm_dato_adic_nive_educ"
                  name="adm_dato_adic_nive_educ"
                  value={formData["adm_dato_adic_nive_educ"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="adm_dato_adic_esta_nive_educ"
                >
                  Estado de Nivel de Educación:
                </label>
                <input
                  type="text"
                  id="adm_dato_adic_esta_nive_educ"
                  name="adm_dato_adic_esta_nive_educ"
                  value={formData["adm_dato_adic_esta_nive_educ"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="adm_dato_adic_tipo_empr_trab"
                >
                  Tipo de Empresa de Trabajo:
                </label>
                <input
                  type="text"
                  id="adm_dato_adic_tipo_empr_trab"
                  name="adm_dato_adic_tipo_empr_trab"
                  value={formData["adm_dato_adic_tipo_empr_trab"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="adm_dato_adic_ocup_prof_prin"
                >
                  Ocupación/Profesión Principal:
                </label>
                <input
                  type="text"
                  id="adm_dato_adic_ocup_prof_prin"
                  name="adm_dato_adic_ocup_prof_prin"
                  value={formData["adm_dato_adic_ocup_prof_prin"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_adic_tipo_segu">
                  <span className="text-red-600">* </span>Tipo de Seguro:
                </label>
                <input
                  type="text"
                  id="adm_dato_adic_tipo_segu"
                  name="adm_dato_adic_tipo_segu"
                  value={formData["adm_dato_adic_tipo_segu"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_adic_tien_disc">
                  <span className="text-red-600">* </span>Tiene discapacidad?:
                </label>
                <input
                  type="text"
                  id="adm_dato_adic_tien_disc"
                  name="adm_dato_adic_tien_disc"
                  value={formData["adm_dato_adic_tien_disc"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </fieldset>
          )}
          {/* DATOS DEL REPRESENTANTE */}
          {activeTab === "representante" && (
            <fieldset className="border border-blue-200 rounded p-4 mb-6">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Datos del Representante
              </legend>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_repr_tipo_iden">
                  Tipo de Identificación:
                </label>
                <input
                  type="text"
                  id="adm_dato_repr_tipo_iden"
                  name="adm_dato_repr_tipo_iden"
                  value={formData["adm_dato_repr_tipo_iden"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_repr_nume_iden">
                  Número de Identificación:
                </label>
                <input
                  type="text"
                  id="adm_dato_repr_nume_iden"
                  name="adm_dato_repr_nume_iden"
                  value={formData["adm_dato_repr_nume_iden"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_repr_apel">
                  Apellidos:
                </label>
                <input
                  type="text"
                  id="adm_dato_repr_apel"
                  name="adm_dato_repr_apel"
                  value={formData["adm_dato_repr_apel"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_repr_nomb">
                  Nombres:
                </label>
                <input
                  type="text"
                  id="adm_dato_repr_nomb"
                  name="adm_dato_repr_nomb"
                  value={formData["adm_dato_repr_nomb"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_repr_pare">
                  Parentesco:
                </label>
                <input
                  type="text"
                  id="adm_dato_repr_pare"
                  name="adm_dato_repr_pare"
                  value={formData["adm_dato_repr_pare"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_repr_nume_tele">
                  Número telefónico:
                </label>
                <input
                  type="text"
                  id="adm_dato_repr_nume_tele"
                  name="adm_dato_repr_nume_tele"
                  value={formData["adm_dato_repr_nume_tele"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </fieldset>
          )}
          {/* DATOS DE CONTACTO */}
          {activeTab === "contacto" && (
            <fieldset className="border border-blue-200 rounded p-4 mb-6">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Datos de Contacto
              </legend>
              <div className={fieldClass}>
                <label
                  className={labelClass}
                  htmlFor="adm_dato_cont_enca_nece_llam"
                >
                  Contacto de emergencia - Nombre completo:
                </label>
                <input
                  type="text"
                  id="adm_dato_cont_enca_nece_llam"
                  name="adm_dato_cont_enca_nece_llam"
                  value={formData["adm_dato_cont_enca_nece_llam"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_cont_pare">
                  Parentesco:
                </label>
                <input
                  type="text"
                  id="adm_dato_cont_pare"
                  name="adm_dato_cont_pare"
                  value={formData["adm_dato_cont_pare"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_cont_dire">
                  Dirección:
                </label>
                <input
                  type="text"
                  id="adm_dato_cont_dire"
                  name="adm_dato_cont_dire"
                  value={formData["adm_dato_cont_dire"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_cont_tele">
                  Teléfono:
                </label>
                <input
                  type="text"
                  id="adm_dato_cont_tele"
                  name="adm_dato_cont_tele"
                  value={formData["adm_dato_cont_tele"]}
                  onChange={handleChange}
                  className={inputClass}
                />
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
              {buttonText}
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
