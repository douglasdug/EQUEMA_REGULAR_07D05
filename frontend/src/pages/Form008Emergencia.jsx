import React, { useState } from "react";

const initialState = {
  for_008_emer_inst_sist: "",
  for_008_emer_unic: "",
  for_008_emer_nomb_esta_salu: "",
  for_008_emer_zona: "",
  for_008_emer_prov: "",
  for_008_emer_cant: "",
  for_008_emer_dist: "",
  for_008_emer_nive: "",
  for_008_emer_fech_aten: "",
  for_008_emer_tipo_docu_iden: "",
  for_008_emer_nume_iden: "",
  for_008_emer_prim_apel: "",
  for_008_emer_segu_apel: "",
  for_008_emer_prim_nomb: "",
  for_008_emer_segu_nomb: "",
  for_008_emer_sexo: "",
  for_008_emer_edad: "",
  for_008_emer_cond_edad: "",
  for_008_emer_naci: "",
  for_008_emer_etni: "",
  for_008_emer_grup_prio: "",
  for_008_emer_tipo_segu: "",
  for_008_emer_prov_reci: "",
  for_008_emer_cant_reci: "",
  for_008_emer_parr_reci: "",
  for_008_emer_espe_prof: "",
  for_008_emer_cie_10_prin: "",
  for_008_emer_diga_prin: "",
  for_008_emer_cond_diag: "",
  for_008_emer_cie_10_caus_exte: "",
  for_008_emer_diag_caus_exte: "",
  for_008_emer_hosp: "",
  for_008_emer_hora_aten: "",
  for_008_emer_cond_alta: "",
  for_008_emer_obse: "",
  for_008_emer_resp_aten_medi: "",
  for_008_emer_apoy_aten_medi: "",
  for_008_emer_edad_gest: "",
  for_008_emer_ries_obst: "",
  for_008_emer_indi_paci_fami: "",
  for_008_emer_unid_salu_resp_segu_aten: "",
  for_008_emer_dire_domi: "",
  for_008_emer_tele_paci: "",
};

const fieldLabels = {
  for_008_emer_inst_sist: "INSTITUCIÓN DEL SISTEMA",
  for_008_emer_unic: "UNICODIGO",
  for_008_emer_nomb_esta_salu: "NOMBRE DEL ESTABLECIMIENTO DE SALUD",
  for_008_emer_zona: "ZONA",
  for_008_emer_prov: "PROVINCIA",
  for_008_emer_cant: "CANTON",
  for_008_emer_dist: "DISTRITO",
  for_008_emer_nive: "NIVEL",
  for_008_emer_fech_aten: "FECHA DE ATENCIÓN",
  for_008_emer_tipo_docu_iden: "TIPO DE DOCUMENTO DE IDENTIFICACIÓN",
  for_008_emer_nume_iden: "NÚMERO DE IDENTIFICACION",
  for_008_emer_prim_apel: "PRIMER APELLIDO",
  for_008_emer_segu_apel: "SEGUNDO APELLIDO",
  for_008_emer_prim_nomb: "PRIMER NOMBRE",
  for_008_emer_segu_nomb: "SEGUNDO NOMBRE",
  for_008_emer_sexo: "SEXO",
  for_008_emer_edad: "EDAD",
  for_008_emer_cond_edad: "CONDICIÓN DE LA EDAD",
  for_008_emer_naci: "NACIONALIDAD",
  for_008_emer_etni: "ETNIA",
  for_008_emer_grup_prio: "GRUPO PRIORITARIO",
  for_008_emer_tipo_segu: "TIPO DE SEGURO",
  for_008_emer_prov_reci: "PROVINCIA DE RECIDENCIA",
  for_008_emer_cant_reci: "CANTON DE RECIDENCIA",
  for_008_emer_parr_reci: "PARROQUIA DE RECIDENCIA",
  for_008_emer_espe_prof: "ESPECIALIDAD DEL PROFESIONAL",
  for_008_emer_cie_10_prin: "CIE-10 (PRINCIPAL)",
  for_008_emer_diga_prin: "DIGANÓSTICO 1 (PRINCIPAL)",
  for_008_emer_cond_diag: "CONDICIÓN DEL DIAGNÓSTICO",
  for_008_emer_cie_10_caus_exte: "CIE-10 (CAUSA EXTERNA)",
  for_008_emer_diag_caus_exte: "DIAGNOSTICO (CAUSA  EXTERNA)",
  for_008_emer_hosp: "HOSPITALIZACIÓN",
  for_008_emer_hora_aten: "HORA ATENCIÓN",
  for_008_emer_cond_alta: "CONDICIÓN DEL ALTA ",
  for_008_emer_obse: "OBSERVACIÓN",
  for_008_emer_resp_aten_medi: "RESPONSABLE DE LA ATENCION MEDICA",
  for_008_emer_apoy_aten_medi: "APOYO EN LA ATENCION MEDICA",
  for_008_emer_edad_gest: "EDAD GESTACIONAL",
  for_008_emer_ries_obst: "RIESGO OBSTETRICO",
  for_008_emer_indi_paci_fami: "INDICACIONES PARA EL PACIENTE O LA FAMILIA",
  for_008_emer_unid_salu_resp_segu_aten:
    "UNIDAD DE SALUD RESPONSABLE DE SEGUIMIENTO DE ATENCIÓN",
  for_008_emer_dire_domi: "DIRECCIÓN DE DOMICILIO",
  for_008_emer_tele_paci: "TELEFONO DE PACIENTE",
};

const Form008Emergencia = () => {
  const [formData, setFormData] = useState(initialState);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar los datos a la API
    setSuccess("Formulario enviado correctamente");
    setError("");
    // console.log(formData);
  };

  return (
    <div className="w-full h-screen flex items-stretch justify-stretch bg-gray-100">
      <div className="w-full h-full p-4 m-4 bg-white rounded-lg shadow-md mt-1">
        <h2 className="text-2xl font-bold mb-1 text-center text-blue-700">
          Formulario 008 Emergencia
        </h2>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.keys(initialState).map((key) => {
              let inputType = "text";
              if (key.includes("fech")) {
                inputType = "date";
              } else if (key.includes("hora")) {
                inputType = "time";
              }
              return (
                <div key={key} className="mb-1 flex flex-col">
                  <label
                    htmlFor={key}
                    className="mb-1 font-semibold text-gray-700"
                  >
                    {fieldLabels[key] || key}
                  </label>
                  <input
                    id={key}
                    name={key}
                    type={inputType}
                    value={formData[key]}
                    onChange={handleChange}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              );
            })}
          </div>
          <div className="md:col-span-2 flex justify-end mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              Registrar
            </button>
          </div>
        </form>
        {success && (
          <div className="mt-4 text-green-600 font-semibold">{success}</div>
        )}
        {error && (
          <div className="mt-4 text-red-600 font-semibold">{error}</div>
        )}
      </div>
    </div>
  );
};

export default Form008Emergencia;
