import React, { useState } from "react";
import { tardioCreateApi } from "../api/tardio.api.js";
import { TardioList } from "../components/TardioList.jsx";
import { toast } from "react-hot-toast";

const CreateTardio = () => {
  const [formData, setFormData] = useState({
    tar_fech: "",
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
    eniUser: 1,
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await tardioCreateApi(formData);
      console.log("Success:", response.data);
      // Si response.data es un objeto, convierte el mensaje en una cadena de texto
      const successMessage = response.data.message || "Operación exitosa";
      toast.success(successMessage, {
        position: "bottom-right",
      });
    } catch (error) {
      setError(error.response.data.error);
      toast.error("Hubo un error en la operación", {
        position: "bottom-right",
      });
    }
  };

  return (
    <div className="container">
      <div className="max-w-md mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-5">Crear Tardio</h1>
        {error && <p className="text-red-500 mb-5">{error}</p>}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          {Object.keys(formData).map((key) => {
            let inputType = "text";
            if (key === "tar_fech") {
              inputType = "date";
            } else if (
              key === "tar_intr" ||
              key === "tar_extr_mies_cnh" ||
              key === "tar_extr_mies_cibv" ||
              key === "tar_extr_mine_egen" ||
              key === "tar_extr_mine_bach" ||
              key === "tar_extr_visi" ||
              key === "tar_extr_aten" ||
              key === "tar_otro" ||
              key === "tar_sexo_homb" ||
              key === "tar_sexo_muje" ||
              key === "tar_luga_pert" ||
              key === "tar_luga_nope" ||
              key === "tar_naci_ecua" ||
              key === "tar_naci_colo" ||
              key === "tar_naci_peru" ||
              key === "tar_naci_cuba" ||
              key === "tar_naci_vene" ||
              key === "tar_naci_otro" ||
              key === "tar_auto_indi" ||
              key === "tar_auto_afro" ||
              key === "tar_auto_negr" ||
              key === "tar_auto_mula" ||
              key === "tar_auto_mont" ||
              key === "tar_auto_mest" ||
              key === "tar_auto_blan" ||
              key === "tar_auto_otro" ||
              key === "tar_naci_achu" ||
              key === "tar_naci_ando" ||
              key === "tar_naci_awa" ||
              key === "tar_naci_chac" ||
              key === "tar_naci_cofa" ||
              key === "tar_naci_eper" ||
              key === "tar_naci_huan" ||
              key === "tar_naci_kich" ||
              key === "tar_naci_mant" ||
              key === "tar_naci_seco" ||
              key === "tar_naci_shiw" ||
              key === "tar_naci_shua" ||
              key === "tar_naci_sion" ||
              key === "tar_naci_tsac" ||
              key === "tar_naci_waor" ||
              key === "tar_naci_zapa" ||
              key === "tar_pueb_chib" ||
              key === "tar_pueb_kana" ||
              key === "tar_pueb_kara" ||
              key === "tar_pueb_kaya" ||
              key === "tar_pueb_kich" ||
              key === "tar_pueb_kisa" ||
              key === "tar_pueb_kitu" ||
              key === "tar_pueb_nata" ||
              key === "tar_pueb_otav" ||
              key === "tar_pueb_palt" ||
              key === "tar_pueb_panz" ||
              key === "tar_pueb_past" ||
              key === "tar_pueb_puru" ||
              key === "tar_pueb_sala" ||
              key === "tar_pueb_sara" ||
              key === "tar_pueb_toma" ||
              key === "tar_pueb_wara" ||
              key === "tar_1ano_1rad_fipv" ||
              key === "tar_1ano_1rad_hbpe" ||
              key === "tar_1ano_1rad_dpt" ||
              key === "tar_1ano_2dad_fipv" ||
              key === "tar_1ano_2dad_hbpe" ||
              key === "tar_1ano_2dad_dpt" ||
              key === "tar_1ano_3rad_bopv" ||
              key === "tar_1ano_3rad_hbpe" ||
              key === "tar_1ano_3rad_dpt" ||
              key === "tar_2ano_1rad_fipv" ||
              key === "tar_2ano_1rad_srp" ||
              key === "tar_2ano_1rad_hbpe" ||
              key === "tar_2ano_1rad_dpt" ||
              key === "tar_2ano_2dad_fipv" ||
              key === "tar_2ano_2dad_srp" ||
              key === "tar_2ano_2dad_hbpe" ||
              key === "tar_2ano_2dad_dpt" ||
              key === "tar_2ano_3rad_bopv" ||
              key === "tar_2ano_3rad_hbpe" ||
              key === "tar_2ano_3rad_dpt" ||
              key === "tar_2ano_4tad_bopv" ||
              key === "tar_2ano_4tad_dpt" ||
              key === "tar_2ano_dosi_fa" ||
              key === "tar_3ano_1rad_fipv" ||
              key === "tar_3ano_1rad_srp" ||
              key === "tar_3ano_1rad_hbpe" ||
              key === "tar_3ano_1rad_dpt" ||
              key === "tar_3ano_2dad_fipv" ||
              key === "tar_3ano_2dad_srp" ||
              key === "tar_3ano_2dad_hbpe" ||
              key === "tar_3ano_2dad_dpt" ||
              key === "tar_3ano_3rad_bopv" ||
              key === "tar_3ano_3rad_hbpe" ||
              key === "tar_3ano_3rad_dpt" ||
              key === "tar_3ano_4tad_bopv" ||
              key === "tar_3ano_4tad_dpt" ||
              key === "tar_3ano_dosi_fa" ||
              key === "tar_4ano_1rad_fipv" ||
              key === "tar_4ano_1rad_srp" ||
              key === "tar_4ano_1rad_hbpe" ||
              key === "tar_4ano_1rad_dpt" ||
              key === "tar_4ano_2dad_fipv" ||
              key === "tar_4ano_2dad_srp" ||
              key === "tar_4ano_2dad_hbpe" ||
              key === "tar_4ano_2dad_dpt" ||
              key === "tar_4ano_3rad_bopv" ||
              key === "tar_4ano_3rad_hbpe" ||
              key === "tar_4ano_3rad_dpt" ||
              key === "tar_4ano_4tad_bopv" ||
              key === "tar_4ano_4tad_dpt" ||
              key === "tar_4ano_dosi_fa" ||
              key === "tar_5ano_1rad_ipv" ||
              key === "tar_5ano_1rad_srp" ||
              key === "tar_5ano_1rad_hbpe" ||
              key === "tar_5ano_1rad_dpt" ||
              key === "tar_5ano_2dad_fipv" ||
              key === "tar_5ano_2dad_srp" ||
              key === "tar_5ano_2dad_hbpe" ||
              key === "tar_5ano_2dad_dpt" ||
              key === "tar_5ano_3rad_bopv" ||
              key === "tar_5ano_3rad_hbpe" ||
              key === "tar_5ano_3rad_dpt" ||
              key === "tar_5ano_4tad_bopv" ||
              key === "tar_5ano_4tad_dpt" ||
              key === "tar_5ano_dosi_fa" ||
              key === "tar_6ano_1rad_srp" ||
              key === "tar_6ano_2dad_srp" ||
              key === "tar_6ano_dosi_fa" ||
              key === "tar_7ano_1rad_sr" ||
              key === "tar_7ano_2dad_sr" ||
              key === "tar_7ano_dosi_fa" ||
              key === "tar_8ano_dosi_fa" ||
              key === "tar_7a14_dosi_dtad" ||
              key === "tar_9a14_dosi_fa" ||
              key === "tar_15a19_dosi_fa" ||
              key === "tar_20a59_dosi_fa" ||
              key === "tar_8a14_1rad_sr" ||
              key === "tar_8a14_2dad_sr" ||
              key === "tar_15a29_1rad_sr" ||
              key === "tar_15a29_2dad_sr" ||
              key === "tar_30a50_1rad_sr" ||
              key === "tar_30a50_2dad_sr" ||
              key === "tar_16a49mefne_dtad_prim" ||
              key === "tar_16a49mefne_dtad_segu" ||
              key === "tar_16a49mefne_dtad_terc" ||
              key === "tar_16a49mefne_dtad_cuar" ||
              key === "tar_16a49mefne_dtad_quin" ||
              key === "tar_mefe_dtad_prim" ||
              key === "tar_mefe_dtad_segu" ||
              key === "tar_mefe_dtad_terc" ||
              key === "tar_mefe_dtad_cuar" ||
              key === "tar_mefe_dtad_quin" ||
              key === "tar_16a49_dtad_prim" ||
              key === "tar_16a49_dtad_segu" ||
              key === "tar_16a49_dtad_terc" ||
              key === "tar_16a49_dtad_cuar" ||
              key === "tar_16a49_dtad_quin" ||
              key === "tar_hepa_trasal_prim" ||
              key === "tar_hepa_trasal_segu" ||
              key === "tar_hepa_trasal_terc" ||
              key === "tar_hepa_estsal_prim" ||
              key === "tar_hepa_estsal_segu" ||
              key === "tar_hepa_estsal_terc" ||
              key === "tar_hepa_trasex_prim" ||
              key === "tar_hepa_trasex_segu" ||
              key === "tar_hepa_trasex_terc" ||
              key === "tar_hepa_pervih_prim" ||
              key === "tar_hepa_pervih_segu" ||
              key === "tar_hepa_pervih_terc" ||
              key === "tar_hepa_perppl_prim" ||
              key === "tar_hepa_perppl_segu" ||
              key === "tar_hepa_perppl_terc" ||
              key === "tar_hepa_otro_prim" ||
              key === "tar_hepa_otro_segu" ||
              key === "tar_hepa_otro_terc" ||
              key === "tar_inmant" ||
              key === "tar_inmanthep" ||
              key === "tar_inmantrra" ||
              key === "eniUser"
            ) {
              inputType = "number";
            }
            return (
              <div className="mb-4" key={key}>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor={key}
                >
                  {key.replace(/_/g, " ")}
                </label>
                <input
                  type={inputType}
                  id={key}
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            );
          })}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Crear
          </button>
        </form>
      </div>
      <div className="mt-5">
        <TardioList />
      </div>
    </div>
  );
};

export default CreateTardio;
