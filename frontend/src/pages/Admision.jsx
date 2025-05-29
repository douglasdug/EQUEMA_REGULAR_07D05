import React, { useState } from "react";

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
  const [form, setForm] = useState(initialState);
  const [activeTab, setActiveTab] = useState("personales");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
  };

  const fieldClass = "mb-4 flex flex-col";
  const labelClass = "mb-1 font-medium text-gray-700";
  const inputClass =
    "rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400";
  const selectClass =
    "rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";

  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-5xl p-6 bg-white rounded-lg shadow-md mt-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          Admisión de Pacientes
        </h2>
        {/* NAV TABS */}
        <nav className="flex border-b border-blue-200 mb-6">
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
        <form onSubmit={handleSubmit}>
          {/* DATOS PERSONALES */}
          {activeTab === "personales" && (
            <fieldset className="border border-blue-200 rounded p-4 mb-6">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Datos Personales
              </legend>
              {/* ...campos... */}
              <div className={fieldClass}>
                <label className={labelClass}>Tipo de Identificación*:</label>
                <input
                  type="text"
                  name="adm_dato_pers_tipo_iden"
                  value={form.adm_dato_pers_tipo_iden}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              {/* ...resto de los campos igual... */}
              <div className={fieldClass}>
                <label className={labelClass}>Correo electrónico*:</label>
                <input
                  type="email"
                  name="adm_dato_pers_corr_elec"
                  value={form.adm_dato_pers_corr_elec}
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
              {/* ...campos... */}
              <div className={fieldClass}>
                <label className={labelClass}>Lugar de Nacimiento:</label>
                <input
                  type="text"
                  name="adm_dato_naci_luga_naci"
                  value={form.adm_dato_naci_luga_naci}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              {/* ...resto de los campos igual... */}
            </fieldset>
          )}
          {/* DATOS DE RESIDENCIA */}
          {activeTab === "residencia" && (
            <fieldset className="border border-blue-200 rounded p-4 mb-6">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Datos de Residencia
              </legend>
              {/* ...campos... */}
            </fieldset>
          )}
          {/* DATOS AUTOIDENTIFICACION */}
          {activeTab === "autoidentificacion" && (
            <fieldset className="border border-blue-200 rounded p-4 mb-6">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Datos Autoidentificación
              </legend>
              {/* ...campos... */}
            </fieldset>
          )}
          {/* DATOS ADICIONALES */}
          {activeTab === "adicionales" && (
            <fieldset className="border border-blue-200 rounded p-4 mb-6">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Datos Adicionales
              </legend>
              {/* ...campos... */}
            </fieldset>
          )}
          {/* DATOS DEL REPRESENTANTE */}
          {activeTab === "representante" && (
            <fieldset className="border border-blue-200 rounded p-4 mb-6">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Datos del Representante
              </legend>
              {/* ...campos... */}
            </fieldset>
          )}
          {/* DATOS DE CONTACTO */}
          {activeTab === "contacto" && (
            <fieldset className="border border-blue-200 rounded p-4 mb-6">
              <legend className="text-lg font-semibold text-blue-600 px-2">
                Datos de Contacto
              </legend>
              {/* ...campos... */}
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
