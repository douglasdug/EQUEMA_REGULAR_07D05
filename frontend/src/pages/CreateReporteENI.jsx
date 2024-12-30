import React, { useState, useEffect } from "react";
import {
  getTotalDesperdicio,
  registerReporteENI,
  updateReporteENI,
  deleteReporteENI,
} from "../api/conexion.api.js";
import { validarDato, validarRegistroInfluenza } from "../api/validadorUtil.js";
import {
  inputStyle,
  buttonStylePrimario,
  buttonStyleSecundario,
  buttonStyleEliminar,
} from "../components/EstilosCustom.jsx";
import { toast } from "react-hot-toast";

const getInputType = (key) => {
  if (key === "inf_fech") {
    return { inputType: "date" };
  } else if (
    key === "rep_con_lot_bio_bcg" ||
    key === "rep_con_fec_cad_bcg" ||
    key === "rep_con_lot_bio_pent" ||
    key === "rep_con_fec_cad_pent" ||
    key === "rep_con_lot_bio_neum" ||
    key === "rep_con_fec_cad_neum" ||
    key === "rep_con_lot_bio_anti_fr20" ||
    key === "rep_con_fec_cad_anti_fr20" ||
    key === "rep_con_lot_bio_anti_fr25" ||
    key === "rep_con_fec_cad_anti_fr25" ||
    key === "rep_con_lot_bio_fipv_fr25" ||
    key === "rep_con_fec_cad_fipv_fr25" ||
    key === "rep_con_lot_bio_fipv_fr50" ||
    key === "rep_con_fec_cad_fipv_fr50" ||
    key === "rep_con_lot_bio_rota" ||
    key === "rep_con_fec_cad_rota" ||
    key === "rep_con_lot_bio_srp_unid" ||
    key === "rep_con_fec_cad_srp_unid" ||
    key === "rep_con_lot_bio_srp_mult" ||
    key === "rep_con_fec_cad_srp_mult" ||
    key === "rep_con_lot_bio_fieb_fr05" ||
    key === "rep_con_fec_cad_fieb_fr05" ||
    key === "rep_con_lot_bio_fieb_fr10" ||
    key === "rep_con_fec_cad_fieb_fr10" ||
    key === "rep_con_lot_bio_vari" ||
    key === "rep_con_fec_cad_vari" ||
    key === "rep_con_lot_bio_sr_unid" ||
    key === "rep_con_fec_cad_sr_unid" ||
    key === "rep_con_lot_bio_sr_mult" ||
    key === "rep_con_fec_cad_sr_mult" ||
    key === "rep_con_lot_bio_dift_frun" ||
    key === "rep_con_fec_cad_dift_frun" ||
    key === "rep_con_lot_bio_dift_fr10" ||
    key === "rep_con_fec_cad_dift_fr10" ||
    key === "rep_con_lot_bio_dtad" ||
    key === "rep_con_fec_cad_dtad" ||
    key === "rep_con_lot_bio_hpv" ||
    key === "rep_con_fec_cad_hpv" ||
    key === "rep_con_lot_bio_hepa" ||
    key === "rep_con_fec_cad_hepa" ||
    key === "rep_con_lot_bio_hbpe" ||
    key === "rep_con_fec_cad_hbpe" ||
    key === "rep_con_lot_bio_infped" ||
    key === "rep_con_fec_cad_infped" ||
    key === "rep_con_lot_bio_infadu" ||
    key === "rep_con_fec_cad_infadu" ||
    key === "rep_con_lot_bio_pfiz" ||
    key === "rep_con_fec_cad_pfiz" ||
    key === "rep_con_lot_bio_sino_unid" ||
    key === "rep_con_fec_cad_sino_unid" ||
    key === "rep_con_lot_bio_sino_mult" ||
    key === "rep_con_fec_cad_sino_mult" ||
    key === "rep_con_lot_bio_cans" ||
    key === "rep_con_fec_cad_cans" ||
    key === "rep_con_lot_bio_astr" ||
    key === "rep_con_fec_cad_astr" ||
    key === "rep_con_lot_bio_modr" ||
    key === "rep_con_fec_cad_modr" ||
    key === "rep_con_lot_bio_virsim" ||
    key === "rep_con_fec_cad_virsim" ||
    key === "rep_con_lot_bio_inm_anti" ||
    key === "rep_con_fec_cad_inm_anti" ||
    key === "rep_con_lot_bio_inm_ant_hep_b" ||
    key === "rep_con_fec_cad_inm_ant_hep_b" ||
    key === "rep_con_lot_bio_inm_ant_rrab" ||
    key === "rep_con_fec_cad_inm_ant_rrab" ||
    key === "rep_con_lot_bio_caj_bios" ||
    key === "rep_con_fec_cad_caj_bios"
  ) {
    return { inputType: "text" };
  } else {
    return { inputType: "number" };
  }
};

const CreateReporteENI = () => {
  const [formData, setFormData] = useState({
    row01: {
      rep_inf_sal_ant_bcg: 0,
      rep_inf_ing_ban_vac_bcg: 0,
      rep_inf_ing_con_fis_bcg: 0,
      rep_inf_ing_rec_otr_bcg: 0,
      rep_inf_ing_tot_ing_bcg: 0,
      rep_inf_tot_dis_bcg: 0,
      rep_inf_egr_apl_mes_bcg: 0,
      rep_inf_egr_per_vac_abi_bcg: 0,
      rep_inf_egr_per_vac_noa_bcg: 0,
      rep_inf_egr_tra_otr_bcg: 0,
      rep_inf_egr_dev_ban_bcg: 0,
      rep_inf_egr_tot_dos_bcg: 0,
      rep_inf_sal_mes_bcg: 0,
      rep_sol_nec_mes_bcg: 0,
      rep_sol_sol_mes_bcg: 0,
      rep_con_lot_bio_bcg: "",
      rep_con_fec_cad_bcg: "",
    },
    row02: {
      rep_inf_sal_ant_pent: 0,
      rep_inf_ing_ban_vac_pent: 0,
      rep_inf_ing_con_fis_pent: 0,
      rep_inf_ing_rec_otr_pent: 0,
      rep_inf_ing_tot_ing_pent: 0,
      rep_inf_tot_dis_pent: 0,
      rep_inf_egr_apl_mes_pent: 0,
      rep_inf_egr_per_vac_abi_pent: 0,
      rep_inf_egr_per_vac_noa_pent: 0,
      rep_inf_egr_tra_otr_pent: 0,
      rep_inf_egr_dev_ban_pent: 0,
      rep_inf_egr_tot_dos_pent: 0,
      rep_inf_sal_mes_pent: 0,
      rep_sol_nec_mes_pent: 0,
      rep_sol_sol_mes_pent: 0,
      rep_con_lot_bio_pent: "",
      rep_con_fec_cad_pent: "",
    },
    row03: {
      rep_inf_sal_ant_neum: 0,
      rep_inf_ing_ban_vac_neum: 0,
      rep_inf_ing_con_fis_neum: 0,
      rep_inf_ing_rec_otr_neum: 0,
      rep_inf_ing_tot_ing_neum: 0,
      rep_inf_tot_dis_neum: 0,
      rep_inf_egr_apl_mes_neum: 0,
      rep_inf_egr_per_vac_abi_neum: 0,
      rep_inf_egr_per_vac_noa_neum: 0,
      rep_inf_egr_tra_otr_neum: 0,
      rep_inf_egr_dev_ban_neum: 0,
      rep_inf_egr_tot_dos_neum: 0,
      rep_inf_sal_mes_neum: 0,
      rep_sol_nec_mes_neum: 0,
      rep_sol_sol_mes_neum: 0,
      rep_con_lot_bio_neum: "",
      rep_con_fec_cad_neum: "",
    },
    row04: {
      rep_inf_sal_ant_anti_fr20: 0,
      rep_inf_ing_ban_vac_anti_fr20: 0,
      rep_inf_ing_con_fis_anti_fr20: 0,
      rep_inf_ing_rec_otr_anti_fr20: 0,
      rep_inf_ing_tot_ing_anti_fr20: 0,
      rep_inf_tot_dis_anti_fr20: 0,
      rep_inf_egr_apl_mes_anti_fr20: 0,
      rep_inf_egr_per_vac_abi_anti_fr20: 0,
      rep_inf_egr_per_vac_noa_anti_fr20: 0,
      rep_inf_egr_tra_otr_anti_fr20: 0,
      rep_inf_egr_dev_ban_anti_fr20: 0,
      rep_inf_egr_tot_dos_anti_fr20: 0,
      rep_inf_sal_mes_anti_fr20: 0,
      rep_sol_nec_mes_anti_fr20: 0,
      rep_sol_sol_mes_anti_fr20: 0,
      rep_con_lot_bio_anti_fr20: "",
      rep_con_fec_cad_anti_fr20: "",
    },
    row05: {
      rep_inf_sal_ant_anti_fr25: 0,
      rep_inf_ing_ban_vac_anti_fr25: 0,
      rep_inf_ing_con_fis_anti_fr25: 0,
      rep_inf_ing_rec_otr_anti_fr25: 0,
      rep_inf_ing_tot_ing_anti_fr25: 0,
      rep_inf_tot_dis_anti_fr25: 0,
      rep_inf_egr_apl_mes_anti_fr25: 0,
      rep_inf_egr_per_vac_abi_anti_fr25: 0,
      rep_inf_egr_per_vac_noa_anti_fr25: 0,
      rep_inf_egr_tra_otr_anti_fr25: 0,
      rep_inf_egr_dev_ban_anti_fr25: 0,
      rep_inf_egr_tot_dos_anti_fr25: 0,
      rep_inf_sal_mes_anti_fr25: 0,
      rep_sol_nec_mes_anti_fr25: 0,
      rep_sol_sol_mes_anti_fr25: 0,
      rep_con_lot_bio_anti_fr25: "",
      rep_con_fec_cad_anti_fr25: "",
    },
    row06: {
      rep_inf_sal_ant_fipv_fr25: 0,
      rep_inf_ing_ban_vac_fipv_fr25: 0,
      rep_inf_ing_con_fis_fipv_fr25: 0,
      rep_inf_ing_rec_otr_fipv_fr25: 0,
      rep_inf_ing_tot_ing_fipv_fr25: 0,
      rep_inf_tot_dis_fipv_fr25: 0,
      rep_inf_egr_apl_mes_fipv_fr25: 0,
      rep_inf_egr_per_vac_abi_fipv_fr25: 0,
      rep_inf_egr_per_vac_noa_fipv_fr25: 0,
      rep_inf_egr_tra_otr_fipv_fr25: 0,
      rep_inf_egr_dev_ban_fipv_fr25: 0,
      rep_inf_egr_tot_dos_fipv_fr25: 0,
      rep_inf_sal_mes_fipv_fr25: 0,
      rep_sol_nec_mes_fipv_fr25: 0,
      rep_sol_sol_mes_fipv_fr25: 0,
      rep_con_lot_bio_fipv_fr25: "",
      rep_con_fec_cad_fipv_fr25: "",
    },
    row07: {
      rep_inf_sal_ant_fipv_fr50: 0,
      rep_inf_ing_ban_vac_fipv_fr50: 0,
      rep_inf_ing_con_fis_fipv_fr50: 0,
      rep_inf_ing_rec_otr_fipv_fr50: 0,
      rep_inf_ing_tot_ing_fipv_fr50: 0,
      rep_inf_tot_dis_fipv_fr50: 0,
      rep_inf_egr_apl_mes_fipv_fr50: 0,
      rep_inf_egr_per_vac_abi_fipv_fr50: 0,
      rep_inf_egr_per_vac_noa_fipv_fr50: 0,
      rep_inf_egr_tra_otr_fipv_fr50: 0,
      rep_inf_egr_dev_ban_fipv_fr50: 0,
      rep_inf_egr_tot_dos_fipv_fr50: 0,
      rep_inf_sal_mes_fipv_fr50: 0,
      rep_sol_nec_mes_fipv_fr50: 0,
      rep_sol_sol_mes_fipv_fr50: 0,
      rep_con_lot_bio_fipv_fr50: "",
      rep_con_fec_cad_fipv_fr50: "",
    },
    row08: {
      rep_inf_sal_ant_rota: 0,
      rep_inf_ing_ban_vac_rota: 0,
      rep_inf_ing_con_fis_rota: 0,
      rep_inf_ing_rec_otr_rota: 0,
      rep_inf_ing_tot_ing_rota: 0,
      rep_inf_tot_dis_rota: 0,
      rep_inf_egr_apl_mes_rota: 0,
      rep_inf_egr_per_vac_abi_rota: 0,
      rep_inf_egr_per_vac_noa_rota: 0,
      rep_inf_egr_tra_otr_rota: 0,
      rep_inf_egr_dev_ban_rota: 0,
      rep_inf_egr_tot_dos_rota: 0,
      rep_inf_sal_mes_rota: 0,
      rep_sol_nec_mes_rota: 0,
      rep_sol_sol_mes_rota: 0,
      rep_con_lot_bio_rota: "",
      rep_con_fec_cad_rota: "",
    },
    row09: {
      rep_inf_sal_ant_srp_unid: 0,
      rep_inf_ing_ban_vac_srp_unid: 0,
      rep_inf_ing_con_fis_srp_unid: 0,
      rep_inf_ing_rec_otr_srp_unid: 0,
      rep_inf_ing_tot_ing_srp_unid: 0,
      rep_inf_tot_dis_srp_unid: 0,
      rep_inf_egr_apl_mes_srp_unid: 0,
      rep_inf_egr_per_vac_abi_srp_unid: 0,
      rep_inf_egr_per_vac_noa_srp_unid: 0,
      rep_inf_egr_tra_otr_srp_unid: 0,
      rep_inf_egr_dev_ban_srp_unid: 0,
      rep_inf_egr_tot_dos_srp_unid: 0,
      rep_inf_sal_mes_srp_unid: 0,
      rep_sol_nec_mes_srp_unid: 0,
      rep_sol_sol_mes_srp_unid: 0,
      rep_con_lot_bio_srp_unid: "",
      rep_con_fec_cad_srp_unid: "",
    },
    row10: {
      rep_inf_sal_ant_srp_mult: 0,
      rep_inf_ing_ban_vac_srp_mult: 0,
      rep_inf_ing_con_fis_srp_mult: 0,
      rep_inf_ing_rec_otr_srp_mult: 0,
      rep_inf_ing_tot_ing_srp_mult: 0,
      rep_inf_tot_dis_srp_mult: 0,
      rep_inf_egr_apl_mes_srp_mult: 0,
      rep_inf_egr_per_vac_abi_srp_mult: 0,
      rep_inf_egr_per_vac_noa_srp_mult: 0,
      rep_inf_egr_tra_otr_srp_mult: 0,
      rep_inf_egr_dev_ban_srp_mult: 0,
      rep_inf_egr_tot_dos_srp_mult: 0,
      rep_inf_sal_mes_srp_mult: 0,
      rep_sol_nec_mes_srp_mult: 0,
      rep_sol_sol_mes_srp_mult: 0,
      rep_con_lot_bio_srp_mult: "",
      rep_con_fec_cad_srp_mult: "",
    },
    row11: {
      rep_inf_sal_ant_fieb_fr05: 0,
      rep_inf_ing_ban_vac_fieb_fr05: 0,
      rep_inf_ing_con_fis_fieb_fr05: 0,
      rep_inf_ing_rec_otr_fieb_fr05: 0,
      rep_inf_ing_tot_ing_fieb_fr05: 0,
      rep_inf_tot_dis_fieb_fr05: 0,
      rep_inf_egr_apl_mes_fieb_fr05: 0,
      rep_inf_egr_per_vac_abi_fieb_fr05: 0,
      rep_inf_egr_per_vac_noa_fieb_fr05: 0,
      rep_inf_egr_tra_otr_fieb_fr05: 0,
      rep_inf_egr_dev_ban_fieb_fr05: 0,
      rep_inf_egr_tot_dos_fieb_fr05: 0,
      rep_inf_sal_mes_fieb_fr05: 0,
      rep_sol_nec_mes_fieb_fr05: 0,
      rep_sol_sol_mes_fieb_fr05: 0,
      rep_con_lot_bio_fieb_fr05: "",
      rep_con_fec_cad_fieb_fr05: "",
    },
    row12: {
      rep_inf_sal_ant_fieb_fr10: 0,
      rep_inf_ing_ban_vac_fieb_fr10: 0,
      rep_inf_ing_con_fis_fieb_fr10: 0,
      rep_inf_ing_rec_otr_fieb_fr10: 0,
      rep_inf_ing_tot_ing_fieb_fr10: 0,
      rep_inf_tot_dis_fieb_fr10: 0,
      rep_inf_egr_apl_mes_fieb_fr10: 0,
      rep_inf_egr_per_vac_abi_fieb_fr10: 0,
      rep_inf_egr_per_vac_noa_fieb_fr10: 0,
      rep_inf_egr_tra_otr_fieb_fr10: 0,
      rep_inf_egr_dev_ban_fieb_fr10: 0,
      rep_inf_egr_tot_dos_fieb_fr10: 0,
      rep_inf_sal_mes_fieb_fr10: 0,
      rep_sol_nec_mes_fieb_fr10: 0,
      rep_sol_sol_mes_fieb_fr10: 0,
      rep_con_lot_bio_fieb_fr10: "",
      rep_con_fec_cad_fieb_fr10: "",
    },
    row13: {
      rep_inf_sal_ant_vari: 0,
      rep_inf_ing_ban_vac_vari: 0,
      rep_inf_ing_con_fis_vari: 0,
      rep_inf_ing_rec_otr_vari: 0,
      rep_inf_ing_tot_ing_vari: 0,
      rep_inf_tot_dis_vari: 0,
      rep_inf_egr_apl_mes_vari: 0,
      rep_inf_egr_per_vac_abi_vari: 0,
      rep_inf_egr_per_vac_noa_vari: 0,
      rep_inf_egr_tra_otr_vari: 0,
      rep_inf_egr_dev_ban_vari: 0,
      rep_inf_egr_tot_dos_vari: 0,
      rep_inf_sal_mes_vari: 0,
      rep_sol_nec_mes_vari: 0,
      rep_sol_sol_mes_vari: 0,
      rep_con_lot_bio_vari: "",
      rep_con_fec_cad_vari: "",
    },
    row14: {
      rep_inf_sal_ant_sr_unid: 0,
      rep_inf_ing_ban_vac_sr_unid: 0,
      rep_inf_ing_con_fis_sr_unid: 0,
      rep_inf_ing_rec_otr_sr_unid: 0,
      rep_inf_ing_tot_ing_sr_unid: 0,
      rep_inf_tot_dis_sr_unid: 0,
      rep_inf_egr_apl_mes_sr_unid: 0,
      rep_inf_egr_per_vac_abi_sr_unid: 0,
      rep_inf_egr_per_vac_noa_sr_unid: 0,
      rep_inf_egr_tra_otr_sr_unid: 0,
      rep_inf_egr_dev_ban_sr_unid: 0,
      rep_inf_egr_tot_dos_sr_unid: 0,
      rep_inf_sal_mes_sr_unid: 0,
      rep_sol_nec_mes_sr_unid: 0,
      rep_sol_sol_mes_sr_unid: 0,
      rep_con_lot_bio_sr_unid: "",
      rep_con_fec_cad_sr_unid: "",
    },
    row15: {
      rep_inf_sal_ant_sr_mult: 0,
      rep_inf_ing_ban_vac_sr_mult: 0,
      rep_inf_ing_con_fis_sr_mult: 0,
      rep_inf_ing_rec_otr_sr_mult: 0,
      rep_inf_ing_tot_ing_sr_mult: 0,
      rep_inf_tot_dis_sr_mult: 0,
      rep_inf_egr_apl_mes_sr_mult: 0,
      rep_inf_egr_per_vac_abi_sr_mult: 0,
      rep_inf_egr_per_vac_noa_sr_mult: 0,
      rep_inf_egr_tra_otr_sr_mult: 0,
      rep_inf_egr_dev_ban_sr_mult: 0,
      rep_inf_egr_tot_dos_sr_mult: 0,
      rep_inf_sal_mes_sr_mult: 0,
      rep_sol_nec_mes_sr_mult: 0,
      rep_sol_sol_mes_sr_mult: 0,
      rep_con_lot_bio_sr_mult: "",
      rep_con_fec_cad_sr_mult: "",
    },
    row16: {
      rep_inf_sal_ant_dift_frun: 0,
      rep_inf_ing_ban_vac_dift_frun: 0,
      rep_inf_ing_con_fis_dift_frun: 0,
      rep_inf_ing_rec_otr_dift_frun: 0,
      rep_inf_ing_tot_ing_dift_frun: 0,
      rep_inf_tot_dis_dift_frun: 0,
      rep_inf_egr_apl_mes_dift_frun: 0,
      rep_inf_egr_per_vac_abi_dift_frun: 0,
      rep_inf_egr_per_vac_noa_dift_frun: 0,
      rep_inf_egr_tra_otr_dift_frun: 0,
      rep_inf_egr_dev_ban_dift_frun: 0,
      rep_inf_egr_tot_dos_dift_frun: 0,
      rep_inf_sal_mes_dift_frun: 0,
      rep_sol_nec_mes_dift_frun: 0,
      rep_sol_sol_mes_dift_frun: 0,
      rep_con_lot_bio_dift_frun: "",
      rep_con_fec_cad_dift_frun: "",
    },
    row17: {
      rep_inf_sal_ant_dift_fr10: 0,
      rep_inf_ing_ban_vac_dift_fr10: 0,
      rep_inf_ing_con_fis_dift_fr10: 0,
      rep_inf_ing_rec_otr_dift_fr10: 0,
      rep_inf_ing_tot_ing_dift_fr10: 0,
      rep_inf_tot_dis_dift_fr10: 0,
      rep_inf_egr_apl_mes_dift_fr10: 0,
      rep_inf_egr_per_vac_abi_dift_fr10: 0,
      rep_inf_egr_per_vac_noa_dift_fr10: 0,
      rep_inf_egr_tra_otr_dift_fr10: 0,
      rep_inf_egr_dev_ban_dift_fr10: 0,
      rep_inf_egr_tot_dos_dift_fr10: 0,
      rep_inf_sal_mes_dift_fr10: 0,
      rep_sol_nec_mes_dift_fr10: 0,
      rep_sol_sol_mes_dift_fr10: 0,
      rep_con_lot_bio_dift_fr10: "",
      rep_con_fec_cad_dift_fr10: "",
    },
    row18: {
      rep_inf_sal_ant_dtad: 0,
      rep_inf_ing_ban_vac_dtad: 0,
      rep_inf_ing_con_fis_dtad: 0,
      rep_inf_ing_rec_otr_dtad: 0,
      rep_inf_ing_tot_ing_dtad: 0,
      rep_inf_tot_dis_dtad: 0,
      rep_inf_egr_apl_mes_dtad: 0,
      rep_inf_egr_per_vac_abi_dtad: 0,
      rep_inf_egr_per_vac_noa_dtad: 0,
      rep_inf_egr_tra_otr_dtad: 0,
      rep_inf_egr_dev_ban_dtad: 0,
      rep_inf_egr_tot_dos_dtad: 0,
      rep_inf_sal_mes_dtad: 0,
      rep_sol_nec_mes_dtad: 0,
      rep_sol_sol_mes_dtad: 0,
      rep_con_lot_bio_dtad: "",
      rep_con_fec_cad_dtad: "",
    },
    row19: {
      rep_inf_sal_ant_hpv: 0,
      rep_inf_ing_ban_vac_hpv: 0,
      rep_inf_ing_con_fis_hpv: 0,
      rep_inf_ing_rec_otr_hpv: 0,
      rep_inf_ing_tot_ing_hpv: 0,
      rep_inf_tot_dis_hpv: 0,
      rep_inf_egr_apl_mes_hpv: 0,
      rep_inf_egr_per_vac_abi_hpv: 0,
      rep_inf_egr_per_vac_noa_hpv: 0,
      rep_inf_egr_tra_otr_hpv: 0,
      rep_inf_egr_dev_ban_hpv: 0,
      rep_inf_egr_tot_dos_hpv: 0,
      rep_inf_sal_mes_hpv: 0,
      rep_sol_nec_mes_hpv: 0,
      rep_sol_sol_mes_hpv: 0,
      rep_con_lot_bio_hpv: "",
      rep_con_fec_cad_hpv: "",
    },
    row20: {
      rep_inf_sal_ant_hepa: 0,
      rep_inf_ing_ban_vac_hepa: 0,
      rep_inf_ing_con_fis_hepa: 0,
      rep_inf_ing_rec_otr_hepa: 0,
      rep_inf_ing_tot_ing_hepa: 0,
      rep_inf_tot_dis_hepa: 0,
      rep_inf_egr_apl_mes_hepa: 0,
      rep_inf_egr_per_vac_abi_hepa: 0,
      rep_inf_egr_per_vac_noa_hepa: 0,
      rep_inf_egr_tra_otr_hepa: 0,
      rep_inf_egr_dev_ban_hepa: 0,
      rep_inf_egr_tot_dos_hepa: 0,
      rep_inf_sal_mes_hepa: 0,
      rep_sol_nec_mes_hepa: 0,
      rep_sol_sol_mes_hepa: 0,
      rep_con_lot_bio_hepa: "",
      rep_con_fec_cad_hepa: "",
    },
    row21: {
      rep_inf_sal_ant_hbpe: 0,
      rep_inf_ing_ban_vac_hbpe: 0,
      rep_inf_ing_con_fis_hbpe: 0,
      rep_inf_ing_rec_otr_hbpe: 0,
      rep_inf_ing_tot_ing_hbpe: 0,
      rep_inf_tot_dis_hbpe: 0,
      rep_inf_egr_apl_mes_hbpe: 0,
      rep_inf_egr_per_vac_abi_hbpe: 0,
      rep_inf_egr_per_vac_noa_hbpe: 0,
      rep_inf_egr_tra_otr_hbpe: 0,
      rep_inf_egr_dev_ban_hbpe: 0,
      rep_inf_egr_tot_dos_hbpe: 0,
      rep_inf_sal_mes_hbpe: 0,
      rep_sol_nec_mes_hbpe: 0,
      rep_sol_sol_mes_hbpe: 0,
      rep_con_lot_bio_hbpe: "",
      rep_con_fec_cad_hbpe: "",
    },
    row22: {
      rep_inf_sal_ant_infped: 0,
      rep_inf_ing_ban_vac_infped: 0,
      rep_inf_ing_con_fis_infped: 0,
      rep_inf_ing_rec_otr_infped: 0,
      rep_inf_ing_tot_ing_infped: 0,
      rep_inf_tot_dis_infped: 0,
      rep_inf_egr_apl_mes_infped: 0,
      rep_inf_egr_per_vac_abi_infped: 0,
      rep_inf_egr_per_vac_noa_infped: 0,
      rep_inf_egr_tra_otr_infped: 0,
      rep_inf_egr_dev_ban_infped: 0,
      rep_inf_egr_tot_dos_infped: 0,
      rep_inf_sal_mes_infped: 0,
      rep_sol_nec_mes_infped: 0,
      rep_sol_sol_mes_infped: 0,
      rep_con_lot_bio_infped: "",
      rep_con_fec_cad_infped: "",
    },
    row23: {
      rep_inf_sal_ant_infadu: 0,
      rep_inf_ing_ban_vac_infadu: 0,
      rep_inf_ing_con_fis_infadu: 0,
      rep_inf_ing_rec_otr_infadu: 0,
      rep_inf_ing_tot_ing_infadu: 0,
      rep_inf_tot_dis_infadu: 0,
      rep_inf_egr_apl_mes_infadu: 0,
      rep_inf_egr_per_vac_abi_infadu: 0,
      rep_inf_egr_per_vac_noa_infadu: 0,
      rep_inf_egr_tra_otr_infadu: 0,
      rep_inf_egr_dev_ban_infadu: 0,
      rep_inf_egr_tot_dos_infadu: 0,
      rep_inf_sal_mes_infadu: 0,
      rep_sol_nec_mes_infadu: 0,
      rep_sol_sol_mes_infadu: 0,
      rep_con_lot_bio_infadu: "",
      rep_con_fec_cad_infadu: "",
    },
    row24: {
      rep_inf_sal_ant_pfiz: 0,
      rep_inf_ing_ban_vac_pfiz: 0,
      rep_inf_ing_con_fis_pfiz: 0,
      rep_inf_ing_rec_otr_pfiz: 0,
      rep_inf_ing_tot_ing_pfiz: 0,
      rep_inf_tot_dis_pfiz: 0,
      rep_inf_egr_apl_mes_pfiz: 0,
      rep_inf_egr_per_vac_abi_pfiz: 0,
      rep_inf_egr_per_vac_noa_pfiz: 0,
      rep_inf_egr_tra_otr_pfiz: 0,
      rep_inf_egr_dev_ban_pfiz: 0,
      rep_inf_egr_tot_dos_pfiz: 0,
      rep_inf_sal_mes_pfiz: 0,
      rep_sol_nec_mes_pfiz: 0,
      rep_sol_sol_mes_pfiz: 0,
      rep_con_lot_bio_pfiz: "",
      rep_con_fec_cad_pfiz: "",
    },
    row25: {
      rep_inf_sal_ant_sino_unid: 0,
      rep_inf_ing_ban_vac_sino_unid: 0,
      rep_inf_ing_con_fis_sino_unid: 0,
      rep_inf_ing_rec_otr_sino_unid: 0,
      rep_inf_ing_tot_ing_sino_unid: 0,
      rep_inf_tot_dis_sino_unid: 0,
      rep_inf_egr_apl_mes_sino_unid: 0,
      rep_inf_egr_per_vac_abi_sino_unid: 0,
      rep_inf_egr_per_vac_noa_sino_unid: 0,
      rep_inf_egr_tra_otr_sino_unid: 0,
      rep_inf_egr_dev_ban_sino_unid: 0,
      rep_inf_egr_tot_dos_sino_unid: 0,
      rep_inf_sal_mes_sino_unid: 0,
      rep_sol_nec_mes_sino_unid: 0,
      rep_sol_sol_mes_sino_unid: 0,
      rep_con_lot_bio_sino_unid: "",
      rep_con_fec_cad_sino_unid: "",
    },
    row26: {
      rep_inf_sal_ant_sino_mult: 0,
      rep_inf_ing_ban_vac_sino_mult: 0,
      rep_inf_ing_con_fis_sino_mult: 0,
      rep_inf_ing_rec_otr_sino_mult: 0,
      rep_inf_ing_tot_ing_sino_mult: 0,
      rep_inf_tot_dis_sino_mult: 0,
      rep_inf_egr_apl_mes_sino_mult: 0,
      rep_inf_egr_per_vac_abi_sino_mult: 0,
      rep_inf_egr_per_vac_noa_sino_mult: 0,
      rep_inf_egr_tra_otr_sino_mult: 0,
      rep_inf_egr_dev_ban_sino_mult: 0,
      rep_inf_egr_tot_dos_sino_mult: 0,
      rep_inf_sal_mes_sino_mult: 0,
      rep_sol_nec_mes_sino_mult: 0,
      rep_sol_sol_mes_sino_mult: 0,
      rep_con_lot_bio_sino_mult: "",
      rep_con_fec_cad_sino_mult: "",
    },
    row27: {
      rep_inf_sal_ant_cans: 0,
      rep_inf_ing_ban_vac_cans: 0,
      rep_inf_ing_con_fis_cans: 0,
      rep_inf_ing_rec_otr_cans: 0,
      rep_inf_ing_tot_ing_cans: 0,
      rep_inf_tot_dis_cans: 0,
      rep_inf_egr_apl_mes_cans: 0,
      rep_inf_egr_per_vac_abi_cans: 0,
      rep_inf_egr_per_vac_noa_cans: 0,
      rep_inf_egr_tra_otr_cans: 0,
      rep_inf_egr_dev_ban_cans: 0,
      rep_inf_egr_tot_dos_cans: 0,
      rep_inf_sal_mes_cans: 0,
      rep_sol_nec_mes_cans: 0,
      rep_sol_sol_mes_cans: 0,
      rep_con_lot_bio_cans: "",
      rep_con_fec_cad_cans: "",
    },
    row28: {
      rep_inf_sal_ant_astr: 0,
      rep_inf_ing_ban_vac_astr: 0,
      rep_inf_ing_con_fis_astr: 0,
      rep_inf_ing_rec_otr_astr: 0,
      rep_inf_ing_tot_ing_astr: 0,
      rep_inf_tot_dis_astr: 0,
      rep_inf_egr_apl_mes_astr: 0,
      rep_inf_egr_per_vac_abi_astr: 0,
      rep_inf_egr_per_vac_noa_astr: 0,
      rep_inf_egr_tra_otr_astr: 0,
      rep_inf_egr_dev_ban_astr: 0,
      rep_inf_egr_tot_dos_astr: 0,
      rep_inf_sal_mes_astr: 0,
      rep_sol_nec_mes_astr: 0,
      rep_sol_sol_mes_astr: 0,
      rep_con_lot_bio_astr: "",
      rep_con_fec_cad_astr: "",
    },
    row29: {
      rep_inf_sal_ant_modr: 0,
      rep_inf_ing_ban_vac_modr: 0,
      rep_inf_ing_con_fis_modr: 0,
      rep_inf_ing_rec_otr_modr: 0,
      rep_inf_ing_tot_ing_modr: 0,
      rep_inf_tot_dis_modr: 0,
      rep_inf_egr_apl_mes_modr: 0,
      rep_inf_egr_per_vac_abi_modr: 0,
      rep_inf_egr_per_vac_noa_modr: 0,
      rep_inf_egr_tra_otr_modr: 0,
      rep_inf_egr_dev_ban_modr: 0,
      rep_inf_egr_tot_dos_modr: 0,
      rep_inf_sal_mes_modr: 0,
      rep_sol_nec_mes_modr: 0,
      rep_sol_sol_mes_modr: 0,
      rep_con_lot_bio_modr: "",
      rep_con_fec_cad_modr: "",
    },
    row30: {
      rep_inf_sal_ant_virsim: 0,
      rep_inf_ing_ban_vac_virsim: 0,
      rep_inf_ing_con_fis_virsim: 0,
      rep_inf_ing_rec_otr_virsim: 0,
      rep_inf_ing_tot_ing_virsim: 0,
      rep_inf_tot_dis_virsim: 0,
      rep_inf_egr_apl_mes_virsim: 0,
      rep_inf_egr_per_vac_abi_virsim: 0,
      rep_inf_egr_per_vac_noa_virsim: 0,
      rep_inf_egr_tra_otr_virsim: 0,
      rep_inf_egr_dev_ban_virsim: 0,
      rep_inf_egr_tot_dos_virsim: 0,
      rep_inf_sal_mes_virsim: 0,
      rep_sol_nec_mes_virsim: 0,
      rep_sol_sol_mes_virsim: 0,
      rep_con_lot_bio_virsim: "",
      rep_con_fec_cad_virsim: "",
    },
    row31: {
      rep_inf_sal_ant_inm_anti: 0,
      rep_inf_ing_ban_vac_inm_anti: 0,
      rep_inf_ing_con_fis_inm_anti: 0,
      rep_inf_ing_rec_otr_inm_anti: 0,
      rep_inf_ing_tot_ing_inm_anti: 0,
      rep_inf_tot_dis_inm_anti: 0,
      rep_inf_egr_apl_mes_inm_anti: 0,
      rep_inf_egr_per_vac_abi_inm_anti: 0,
      rep_inf_egr_per_vac_noa_inm_anti: 0,
      rep_inf_egr_tra_otr_inm_anti: 0,
      rep_inf_egr_dev_ban_inm_anti: 0,
      rep_inf_egr_tot_dos_inm_anti: 0,
      rep_inf_sal_mes_inm_anti: 0,
      rep_sol_nec_mes_inm_anti: 0,
      rep_sol_sol_mes_inm_anti: 0,
      rep_con_lot_bio_inm_anti: "",
      rep_con_fec_cad_inm_anti: "",
    },
    row32: {
      rep_inf_sal_ant_inm_ant_hep_b: 0,
      rep_inf_ing_ban_vac_inm_ant_hep_b: 0,
      rep_inf_ing_con_fis_inm_ant_hep_b: 0,
      rep_inf_ing_rec_otr_inm_ant_hep_b: 0,
      rep_inf_ing_tot_ing_inm_ant_hep_b: 0,
      rep_inf_tot_dis_inm_ant_hep_b: 0,
      rep_inf_egr_apl_mes_inm_ant_hep_b: 0,
      rep_inf_egr_per_vac_abi_inm_ant_hep_b: 0,
      rep_inf_egr_per_vac_noa_inm_ant_hep_b: 0,
      rep_inf_egr_tra_otr_inm_ant_hep_b: 0,
      rep_inf_egr_dev_ban_inm_ant_hep_b: 0,
      rep_inf_egr_tot_dos_inm_ant_hep_b: 0,
      rep_inf_sal_mes_inm_ant_hep_b: 0,
      rep_sol_nec_mes_inm_ant_hep_b: 0,
      rep_sol_sol_mes_inm_ant_hep_b: 0,
      rep_con_lot_bio_inm_ant_hep_b: "",
      rep_con_fec_cad_inm_ant_hep_b: "",
    },
    row33: {
      rep_inf_sal_ant_inm_ant_rrab: 0,
      rep_inf_ing_ban_vac_inm_ant_rrab: 0,
      rep_inf_ing_con_fis_inm_ant_rrab: 0,
      rep_inf_ing_rec_otr_inm_ant_rrab: 0,
      rep_inf_ing_tot_ing_inm_ant_rrab: 0,
      rep_inf_tot_dis_inm_ant_rrab: 0,
      rep_inf_egr_apl_mes_inm_ant_rrab: 0,
      rep_inf_egr_per_vac_abi_inm_ant_rrab: 0,
      rep_inf_egr_per_vac_noa_inm_ant_rrab: 0,
      rep_inf_egr_tra_otr_inm_ant_rrab: 0,
      rep_inf_egr_dev_ban_inm_ant_rrab: 0,
      rep_inf_egr_tot_dos_inm_ant_rrab: 0,
      rep_inf_sal_mes_inm_ant_rrab: 0,
      rep_sol_nec_mes_inm_ant_rrab: 0,
      rep_sol_sol_mes_inm_ant_rrab: 0,
      rep_con_lot_bio_inm_ant_rrab: "",
      rep_con_fec_cad_inm_ant_rrab: "",
    },
    row34: {
      rep_inf_sal_ant_caj_bios: 0,
      rep_inf_ing_ban_vac_caj_bios: 0,
      rep_inf_ing_con_fis_caj_bios: 0,
      rep_inf_ing_rec_otr_caj_bios: 0,
      rep_inf_ing_tot_ing_caj_bios: 0,
      rep_inf_tot_dis_caj_bios: 0,
      rep_inf_egr_apl_mes_caj_bios: 0,
      rep_inf_egr_per_vac_abi_caj_bios: 0,
      rep_inf_egr_per_vac_noa_caj_bios: 0,
      rep_inf_egr_tra_otr_caj_bios: 0,
      rep_inf_egr_dev_ban_caj_bios: 0,
      rep_inf_egr_tot_dos_caj_bios: 0,
      rep_inf_sal_mes_caj_bios: 0,
      rep_sol_nec_mes_caj_bios: 0,
      rep_sol_sol_mes_caj_bios: 0,
      rep_con_lot_bio_caj_bios: "",
      rep_con_fec_cad_caj_bios: "",
    },
  });

  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isInputEstado, setIsInputEstado] = useState({
    input: false,
    inf_fech: false,
  });

  const [botonEstado, setBotonEstado] = useState({
    btnBuscar: true,
    btnLimpiar: false,
    btnRegistrarInf: true,
  });
  const [isIdInf, setIsIdInf] = useState({});

  const rowNames = {
    row01: "BCG",
    row02: "PENTAVALENTE (DPT-HB-Hib)",
    row03: "NEUMOCOCO CONJUGADA",
    row04: "ANTIPOLIOMIELITICA ORAL (OPV) Frasco por 20",
    row05: "ANTIPOLIOMIELITICA ORAL (OPV) Frasco por 25",
    row06: "fIPV Frasco por 25",
    row07: "fIPV Frasco por 50",
    row08: "ROTAVIRUS",
    row09: "SRP TRIPLE VIRAL (unidosis)",
    row10: "SRP TRIPLE VIRAL (multidosis)",
    row11: "Fiebre Amarilla Frasco por 5",
    row12: "Fiebre Amarilla Frasco por 10",
    row13: "Varicela",
    row14: "SR (dupla viral) (unidosis)",
    row15: "SR (dupla viral) (Multidosis)",
    row16: "DIFTERIA, TOSFERINA Y TETANOS (DPT) REF Frasco por UNO",
    row17: "DIFTERIA, TOSFERINA Y TETANOS (DPT) REF Frasco por 10",
    row18: "dT adultos",
    row19: "HPV",
    row20: "HEPATITIS B ADULTO",
    row21: "HB PEDIATRICA",
    row22: "INFLUENZA PEDIATRICA",
    row23: "INFLUENZA ADULTOS",
    row24: "PFIZER",
    row25: "SINOVAC UNI-DOSIS",
    row26: "SINOVAC MUL-DOSIS",
    row27: "CANSINO",
    row28: "ASTRAZENECA",
    row29: "MODERNA",
    row30: "VIRUELA SIMICA",
    row31: "Antitetánica",
    row32: "Anti Hepatitis B",
    row33: "Antirrábica",
    row34: "CAJAS DE BIOSEGURIDAD",
  };

  const keys = Object.keys(formData);

  const handleChange = (e, row, input) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      [row]: {
        ...formData[row],
        [input]: value,
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  const [meses, setMeses] = useState([]);

  useEffect(() => {
    const fetchMeses = async () => {
      try {
        const data = await getTotalDesperdicio(1);
        setMeses(data);
      } catch (error) {
        console.error("Error al obtener los meses:", error);
      }
    };
    fetchMeses();
  }, []);

  return (
    <div className="container">
      <div className="max-w-max m-auto mt-5">
        <h1 className="text-center text-2xl font-bold mb-1">
          Crear Reporte ENI
        </h1>
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
                  <th className="w-36 px-0 py-0">
                    <label htmlFor="rep_fech">Fecha de reporte</label>
                  </th>
                  <td colSpan={2} className="border-2 px-0 py-0">
                    <input
                      type="date"
                      id="rep_fech"
                      name="rep_fech"
                      placeholder="Información es requerida"
                      className={`${inputStyle} ${"bg-white text-gray-700 cursor-pointer"}`}
                      min="0"
                      max=""
                      required
                    />
                  </td>
                  <td></td>
                  <td>Mes a reportar</td>
                  <td colSpan={2} className="border-2 px-0 py-0">
                    <select
                      id="rep_eni_mes"
                      name="rep_eni_mes"
                      className={`${inputStyle} bg-white text-gray-700 cursor-pointer`}
                      required
                      value={formData.des_fech}
                      onChange={(e) => {
                        const dataDesperdicioMes = meses.find(
                          (mes) => mes.des_fech === e.target.value
                        );
                        console.log("Mes seleccionado:", dataDesperdicioMes);
                        setFormData({
                          ...formData,
                          row01: {
                            ...formData.row01,
                            rep_inf_egr_apl_mes_bcg: dataDesperdicioMes
                              ? dataDesperdicioMes.des_bcg_dosapli
                              : formData.row01.rep_inf_egr_apl_mes_bcg,
                          },
                          row02: {
                            ...formData.row02,
                            rep_inf_egr_apl_mes_pent: dataDesperdicioMes
                              ? dataDesperdicioMes.des_pent_dosapli
                              : formData.row02.rep_inf_egr_apl_mes_pent,
                          },
                          row03: {
                            ...formData.row03,
                            rep_inf_egr_apl_mes_neum: dataDesperdicioMes
                              ? dataDesperdicioMes.des_neum_dosapli
                              : formData.row03.rep_inf_egr_apl_mes_neum,
                          },
                          row09: {
                            ...formData.row09,
                            rep_inf_egr_apl_mes_srp_unid: dataDesperdicioMes
                              ? dataDesperdicioMes.des_srp_dosapli
                              : formData.row04.rep_inf_egr_apl_mes_srp_unid,
                          },
                          row10: {
                            ...formData.row10,
                            rep_inf_egr_apl_mes_srp_mult: dataDesperdicioMes
                              ? dataDesperdicioMes.des_srp_dosapli
                              : formData.row04.rep_inf_egr_apl_mes_srp_mult,
                          },
                        });
                      }}
                    >
                      <option value="">Seleccione un mes</option>
                      {meses.length > 0 ? (
                        meses.map((mes) => {
                          const [day, month, year] = mes.des_fech.split("/");
                          const date = new Date(`${year}-${month}-${day}`);

                          if (isNaN(date)) {
                            return (
                              <option key={mes.id} value="">
                                Fecha inválida
                              </option>
                            );
                          }

                          const monthName = date
                            .toLocaleString("es-ES", { month: "long" })
                            .toUpperCase();

                          return (
                            <option key={mes.id} value={mes.des_fech}>
                              {monthName} {year}
                            </option>
                          );
                        })
                      ) : (
                        <option value="">No hay datos</option>
                      )}
                    </select>
                  </td>
                  <td></td>
                  <td>
                    <button>Enivar</button>
                  </td>
                </tr>
                <tr>
                  {[
                    "TIPOS DE MEDICAMENTOS BIOLÓGICOS, DISPOSITIVOS MÉDICOS E INSUMOS",
                    "SALDO ANTERIOR",
                    "Del Banco de Vacunas",
                    "Constatación Física (reingresos)",
                    "Recibido de otro E.S. (traslados)",
                    "TOTAL DE INGRESOS",
                    "TOTAL DISPONIBLE",
                    "Aplicadas en el mes",
                    "Perdida de vacuna en fco. abierto / Jeringuillas por daño",
                    "Perdida de vacuna en frasco no abierto / Jeringuillas por perdida o contaminación",
                    "Traslado a otro E.S.",
                    "Devolución al Banco de Vacunas",
                    "TOTAL DOSIS UTILIZADAS",
                    "SALDO DEL MES",
                    "Necesidad para el siguiente mes",
                    "Solicitud para el siguiente mes",
                    "Lotes de Biológicos y Jeringas",
                    "Fecha de caducidad de Biologicos y Jeringas",
                  ].map((header, index) => {
                    return (
                      <th
                        key={header}
                        className={`text-sm text-gray-900 border-2 ${
                          index === 0 ? "w-36 px-0 py-0" : "w-20 px-0 py-1"
                        }`}
                      >
                        <div className="transform -rotate-90 h-32 flex justify-center items-center">
                          {header}
                        </div>
                      </th>
                    );
                  })}
                </tr>
                <tr>
                  {[
                    "",
                    "a",
                    "b",
                    "c",
                    "d",
                    "e=(b+c+d)",
                    "f=(a+e)",
                    "g",
                    "h",
                    "i",
                    "j",
                    "k",
                    "l=(g+h+i+j+k)",
                    "m=(f-l)",
                    "n",
                    "o=(m-n)",
                    "p",
                    "q",
                  ].map((subHeader) => (
                    <th
                      key={subHeader}
                      className="w-20 px-0 py-1 text-xs text-gray-900 border-2"
                    >
                      <div className="h-2 flex justify-center items-center">
                        {subHeader}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(formData).map((rowKey) => (
                  <tr key={rowKey}>
                    <th className="text-xs px-0 py-0 border">
                      {rowNames[rowKey] || rowKey}
                    </th>
                    {Object.keys(formData[rowKey]).map((key) => {
                      const { inputType } = getInputType(key);
                      return (
                        <td key={key} className="border-1 px-0 py-0">
                          <input
                            type={inputType}
                            id={key}
                            name={key}
                            value={formData[rowKey][key]}
                            onChange={(e) => handleChange(e, rowKey, key)}
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
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center mt-4">
            <button type="submit">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReporteENI;
