import React, { useState } from "react";

const Form008Emergencia = ({ buscarPaciente }) => {
  const [form, setForm] = useState({
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
    for_008_emer_núme_iden: "",
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
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes enviar los datos a tu backend
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Ejemplo de input */}
      <label>Institución del sistema</label>
      <input
        name="for_008_emer_inst_sist"
        value={form.for_008_emer_inst_sist}
        onChange={handleChange}
      />

      <label>Unidad</label>
      <input
        name="for_008_emer_unic"
        value={form.for_008_emer_unic}
        onChange={handleChange}
      />

      <label>Nombre establecimiento de salud</label>
      <input
        name="for_008_emer_nomb_esta_salu"
        value={form.for_008_emer_nomb_esta_salu}
        onChange={handleChange}
      />

      {/* ...agrega los demás inputs siguiendo el mismo patrón... */}

      <button type="submit">Registrar Atención</button>
    </form>
  );
};

export default Form008Emergencia;
