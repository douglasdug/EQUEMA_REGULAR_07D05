import React, { useState, useEffect } from "react";
import { registerUser, buscarUsuarioAdmision } from "../api/conexion.api.js";
import { listaSelectAdmision } from "../components/AllList.jsx";
import { validarDato, validarIdenAdmision } from "../api/validadorUtil.js";
import {
  CustomSelect,
  inputStyle,
  buttonStylePrimario,
  buttonStyleSecundario,
} from "../components/EstilosCustom.jsx";
import { toast } from "react-hot-toast";

const initialState = {
  adm_dato_pers_tipo_iden: "",
  adm_dato_pers_nume_iden: "",
  adm_dato_pers_apel_prim: "",
  adm_dato_pers_apel_segu: "",
  adm_dato_pers_nomb_prim: "",
  adm_dato_pers_nomb_segu: "",
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
  { label: "Datos de Nacimiento", key: "nacimiento" },
  { label: "Datos de Residencia", key: "residencia" },
  { label: "Datos Autoidentificación", key: "autoidentificacion" },
  { label: "Datos Adicionales", key: "adicionales" },
  { label: "Datos del Representante", key: "representante" },
  { label: "Datos de Contacto", key: "contacto" },
];

const Admision = () => {
  const [formData, setFormData] = useState({
    adm_dato_pers_tipo_iden: "",
    adm_dato_pers_nume_iden: "",
    adm_dato_pers_apel_prim: "",
    adm_dato_pers_apel_segu: "",
    adm_dato_pers_nomb_prim: "",
    adm_dato_pers_nomb_segu: "",
    adm_dato_pers_esta_civi: "",
    adm_dato_pers_sexo: "",
    adm_dato_pers_corr_elec: "",
  });

  const [error, setError] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [form, setForm] = useState(initialState);
  const [activeTab, setActiveTab] = useState("personales");

  const initialVariableEstado = {
    adm_dato_pers_tipo_iden: false,
    adm_dato_pers_nume_iden: true,
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
        adm_dato_pers_corr_elec: data.adm_dato_pers_corr_elec || "",
      }));

      setVariableEstado((prevState) => ({
        ...prevState,
        adm_dato_pers_tipo_iden: true,
        adm_dato_pers_nume_iden: true,
        adm_dato_pers_apel_prim: true,
        adm_dato_pers_nomb_prim: true,
      }));

      setBotonEstado((prevState) => ({
        ...prevState,
        btnBuscar: true,
      }));

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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
  };

  const limpiarVariables = (e) => {
    setFormData({
      adm_dato_pers_tipo_iden: "",
      adm_dato_pers_nume_iden: "",
      adm_dato_pers_apel_prim: "",
      adm_dato_pers_nomb_prim: "",
      adm_dato_pers_esta_civi: "",
      adm_dato_pers_sexo: "",
      adm_dato_pers_corr_elec: "",
    });
    setError({});
    setSuccessMessage(null);
    setVariableEstado(initialVariableEstado);
    setBotonEstado(initialBotonEstado);
  };

  useEffect(() => {
    checkFormValidity();
  }, [formData]);

  const fieldClass = "mb-4 flex flex-col";
  const labelClass = "mb-1 font-medium text-gray-700";
  const inputClass =
    "rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400";
  const selectClass =
    "rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";

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
                  <span className="text-red-600">* </span>Tipo de
                  Identificación:
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
                  <span className="text-red-600">* </span>Número de
                  Identificación:
                </label>
                <input
                  type="text"
                  id="adm_dato_pers_nume_iden"
                  name="adm_dato_pers_nume_iden"
                  value={formData["adm_dato_pers_nume_iden"]}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              {/* BOTON BUSCAR */}
              {/* BOTON LIMPIAR */}
              <div className="flex">
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
                  <span className="text-red-600">* </span>Apellido Primero:
                </label>
                <input
                  type="text"
                  id="adm_dato_pers_apel_prim"
                  name="adm_dato_pers_apel_prim"
                  value={formData["adm_dato_pers_apel_prim"]}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_pers_apel_segu">
                  <span className="text-red-600">* </span> Apellido Segundo:
                </label>
                <input
                  type="text"
                  id="adm_dato_pers_apel_segu"
                  name="adm_dato_pers_apel_segu"
                  value={form.adm_dato_pers_apel_segu}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_pers_nomb_prim">
                  <span className="text-red-600">* </span> Nombre Primero:
                </label>
                <input
                  type="text"
                  id="adm_dato_pers_nomb_prim"
                  name="adm_dato_pers_nomb_prim"
                  value={formData["adm_dato_pers_nomb_prim"]}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_pers_nomb_segu">
                  <span className="text-red-600">* </span> Nombre Segundo:
                </label>
                <input
                  type="text"
                  id="adm_dato_pers_nomb_segu"
                  name="adm_dato_pers_nomb_segu"
                  value={form.adm_dato_pers_nomb_segu}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_pers_esta_civi">
                  Estado Civil:
                </label>
                <input
                  type="text"
                  id="adm_dato_pers_esta_civi"
                  name="adm_dato_pers_esta_civi"
                  value={formData["adm_dato_pers_esta_civi"]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_pers_sexo">
                  <span className="text-red-600">* </span> Sexo:
                </label>
                <input
                  type="text"
                  id="adm_dato_pers_sexo"
                  name="adm_dato_pers_sexo"
                  value={formData["adm_dato_pers_sexo"]}
                  onChange={handleChange}
                  required
                  className={inputClass}
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
                  value={form.adm_dato_pers_tele}
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
                  value={form.adm_dato_pers_celu}
                  onChange={handleChange}
                  required
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
                  required
                  className={inputClass}
                />
              </div>
            </fieldset>
          )}
          {/* DATOS DE NACIMIENTO */}
          {activeTab === "nacimiento" && (
            <fieldset className="border border-blue-200 rounded p-4 mb-6">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Datos de Nacimiento
              </legend>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_naci_luga_naci">
                  Lugar de Nacimiento:
                </label>
                <input
                  type="text"
                  id="adm_dato_naci_luga_naci"
                  name="adm_dato_naci_luga_naci"
                  value={form.adm_dato_naci_luga_naci}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_naci_naci">
                  <span className="text-red-600">* </span>Nacionalidad:
                </label>
                <input
                  type="text"
                  id="adm_dato_naci_naci"
                  name="adm_dato_naci_naci"
                  value={form.adm_dato_naci_naci}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_naci_fech_naci">
                  <span className="text-red-600">* </span>Fecha de Nacimiento:
                </label>
                <input
                  type="text"
                  id="adm_dato_naci_fech_naci"
                  name="adm_dato_naci_fech_naci"
                  value={form.adm_dato_naci_fech_naci}
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
                <label className={labelClass} htmlFor="adm_dato_resi_pais_resi">
                  <span className="text-red-600">* </span>País de Residencia:
                </label>
                <input
                  type="text"
                  id="adm_dato_resi_pais_resi"
                  name="adm_dato_resi_pais_resi"
                  value={form.adm_dato_resi_pais_resi}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_resi_prov">
                  <span className="text-red-600">* </span>Provincia:
                </label>
                <input
                  type="text"
                  id="adm_dato_resi_prov"
                  name="adm_dato_resi_prov"
                  value={form.adm_dato_resi_prov}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_resi_cant">
                  <span className="text-red-600">* </span>Cantón:
                </label>
                <input
                  type="text"
                  id="adm_dato_resi_cant"
                  name="adm_dato_resi_cant"
                  value={form.adm_dato_resi_cant}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_resi_parr">
                  <span className="text-red-600">* </span>Parroquia:
                </label>
                <input
                  type="text"
                  id="adm_dato_resi_parr"
                  name="adm_dato_resi_parr"
                  value={form.adm_dato_resi_parr}
                  onChange={handleChange}
                  required
                  className={inputClass}
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
                  value={form.adm_dato_resi_barr_sect}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_resi_call_prin}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_resi_call_secu}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_resi_refe_resi}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            </fieldset>
          )}
          {/* DATOS AUTOIDENTIFICACION */}
          {activeTab === "autoidentificacion" && (
            <fieldset className="border border-blue-200 rounded p-4 mb-6">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Datos Autoidentificación
              </legend>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_auto_auto_etni">
                  <span className="text-red-600">* </span>Autoidentificación
                  Étnica:
                </label>
                <input
                  type="text"
                  id="adm_dato_auto_auto_etni"
                  name="adm_dato_auto_auto_etni"
                  value={form.adm_dato_auto_auto_etni}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_auto_naci_etni}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_auto_pueb_kich}
                  onChange={handleChange}
                  required
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
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="adm_dato_adic_grup_prio">
                  Grupo Prioritario:
                </label>
                <input
                  type="text"
                  id="adm_dato_adic_grup_prio"
                  name="adm_dato_adic_grup_prio"
                  value={form.adm_dato_adic_grup_prio}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_adic_nive_educ}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_adic_esta_nive_educ}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_adic_tipo_empr_trab}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_adic_ocup_prof_prin}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_adic_tipo_segu}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_adic_tien_disc}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_repr_tipo_iden}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_repr_nume_iden}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_repr_apel}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_repr_nomb}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_repr_pare}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_repr_nume_tele}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_cont_enca_nece_llam}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_cont_pare}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_cont_dire}
                  onChange={handleChange}
                  required
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
                  value={form.adm_dato_cont_tele}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            </fieldset>
          )}
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Admision;
