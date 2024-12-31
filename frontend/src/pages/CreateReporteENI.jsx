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
  if (key === "rep_fech") {
    return { inputType: "date" };
  } else if (
    key === "rep_con_lot_bio_bcg" ||
    key === "rep_con_fec_cad_bcg" ||
    key === "rep_con_lot_bio_pent" ||
    key === "rep_con_fec_cad_pent" ||
    key === "rep_con_lot_bio_neum" ||
    key === "rep_con_fec_cad_neum" ||
    key === "rep_con_lot_bio_anti" ||
    key === "rep_con_fec_cad_anti" ||
    key === "rep_con_lot_bio_fipv" ||
    key === "rep_con_fec_cad_fipv" ||
    key === "rep_con_lot_bio_rota" ||
    key === "rep_con_fec_cad_rota" ||
    key === "rep_con_lot_bio_srp" ||
    key === "rep_con_fec_cad_srp" ||
    key === "rep_con_lot_bio_fieb" ||
    key === "rep_con_fec_cad_fieb" ||
    key === "rep_con_lot_bio_vari" ||
    key === "rep_con_fec_cad_vari" ||
    key === "rep_con_lot_bio_sr" ||
    key === "rep_con_fec_cad_sr" ||
    key === "rep_con_lot_bio_dift" ||
    key === "rep_con_fec_cad_dift" ||
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
    key === "rep_con_lot_bio_sino" ||
    key === "rep_con_fec_cad_sino" ||
    key === "rep_con_lot_bio_cans" ||
    key === "rep_con_fec_cad_cans" ||
    key === "rep_con_lot_bio_astr" ||
    key === "rep_con_fec_cad_astr" ||
    key === "rep_con_lot_bio_modr" ||
    key === "rep_con_fec_cad_modr" ||
    key === "rep_con_lot_bio_virsim" ||
    key === "rep_con_fec_cad_virsim" ||
    key === "rep_con_lot_bio_vacvphcam" ||
    key === "rep_con_fec_cad_vacvphcam" ||
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
      rep_inf_sal_ant_anti: 0,
      rep_inf_ing_ban_vac_anti: 0,
      rep_inf_ing_con_fis_anti: 0,
      rep_inf_ing_rec_otr_anti: 0,
      rep_inf_ing_tot_ing_anti: 0,
      rep_inf_tot_dis_anti: 0,
      rep_inf_egr_apl_mes_anti: 0,
      rep_inf_egr_per_vac_abi_anti: 0,
      rep_inf_egr_per_vac_noa_anti: 0,
      rep_inf_egr_tra_otr_anti: 0,
      rep_inf_egr_dev_ban_anti: 0,
      rep_inf_egr_tot_dos_anti: 0,
      rep_inf_sal_mes_anti: 0,
      rep_sol_nec_mes_anti: 0,
      rep_sol_sol_mes_anti: 0,
      rep_con_lot_bio_anti: "",
      rep_con_fec_cad_anti: "",
    },
    row05: {
      rep_inf_sal_ant_fipv: 0,
      rep_inf_ing_ban_vac_fipv: 0,
      rep_inf_ing_con_fis_fipv: 0,
      rep_inf_ing_rec_otr_fipv: 0,
      rep_inf_ing_tot_ing_fipv: 0,
      rep_inf_tot_dis_fipv: 0,
      rep_inf_egr_apl_mes_fipv: 0,
      rep_inf_egr_per_vac_abi_fipv: 0,
      rep_inf_egr_per_vac_noa_fipv: 0,
      rep_inf_egr_tra_otr_fipv: 0,
      rep_inf_egr_dev_ban_fipv: 0,
      rep_inf_egr_tot_dos_fipv: 0,
      rep_inf_sal_mes_fipv: 0,
      rep_sol_nec_mes_fipv: 0,
      rep_sol_sol_mes_fipv: 0,
      rep_con_lot_bio_fipv: "",
      rep_con_fec_cad_fipv: "",
    },
    row06: {
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
    row07: {
      rep_inf_sal_ant_srp: 0,
      rep_inf_ing_ban_vac_srp: 0,
      rep_inf_ing_con_fis_srp: 0,
      rep_inf_ing_rec_otr_srp: 0,
      rep_inf_ing_tot_ing_srp: 0,
      rep_inf_tot_dis_srp: 0,
      rep_inf_egr_apl_mes_srp: 0,
      rep_inf_egr_per_vac_abi_srp: 0,
      rep_inf_egr_per_vac_noa_srp: 0,
      rep_inf_egr_tra_otr_srp: 0,
      rep_inf_egr_dev_ban_srp: 0,
      rep_inf_egr_tot_dos_srp: 0,
      rep_inf_sal_mes_srp: 0,
      rep_sol_nec_mes_srp: 0,
      rep_sol_sol_mes_srp: 0,
      rep_con_lot_bio_srp: "",
      rep_con_fec_cad_srp: "",
    },
    row08: {
      rep_inf_sal_ant_fieb: 0,
      rep_inf_ing_ban_vac_fieb: 0,
      rep_inf_ing_con_fis_fieb: 0,
      rep_inf_ing_rec_otr_fieb: 0,
      rep_inf_ing_tot_ing_fieb: 0,
      rep_inf_tot_dis_fieb: 0,
      rep_inf_egr_apl_mes_fieb: 0,
      rep_inf_egr_per_vac_abi_fieb: 0,
      rep_inf_egr_per_vac_noa_fieb: 0,
      rep_inf_egr_tra_otr_fieb: 0,
      rep_inf_egr_dev_ban_fieb: 0,
      rep_inf_egr_tot_dos_fieb: 0,
      rep_inf_sal_mes_fieb: 0,
      rep_sol_nec_mes_fieb: 0,
      rep_sol_sol_mes_fieb: 0,
      rep_con_lot_bio_fieb: "",
      rep_con_fec_cad_fieb: "",
    },
    row09: {
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
    row10: {
      rep_inf_sal_ant_sr: 0,
      rep_inf_ing_ban_vac_sr: 0,
      rep_inf_ing_con_fis_sr: 0,
      rep_inf_ing_rec_otr_sr: 0,
      rep_inf_ing_tot_ing_sr: 0,
      rep_inf_tot_dis_sr: 0,
      rep_inf_egr_apl_mes_sr: 0,
      rep_inf_egr_per_vac_abi_sr: 0,
      rep_inf_egr_per_vac_noa_sr: 0,
      rep_inf_egr_tra_otr_sr: 0,
      rep_inf_egr_dev_ban_sr: 0,
      rep_inf_egr_tot_dos_sr: 0,
      rep_inf_sal_mes_sr: 0,
      rep_sol_nec_mes_sr: 0,
      rep_sol_sol_mes_sr: 0,
      rep_con_lot_bio_sr: "",
      rep_con_fec_cad_sr: "",
    },
    row11: {
      rep_inf_sal_ant_dift: 0,
      rep_inf_ing_ban_vac_dift: 0,
      rep_inf_ing_con_fis_dift: 0,
      rep_inf_ing_rec_otr_dift: 0,
      rep_inf_ing_tot_ing_dift: 0,
      rep_inf_tot_dis_dift: 0,
      rep_inf_egr_apl_mes_dift: 0,
      rep_inf_egr_per_vac_abi_dift: 0,
      rep_inf_egr_per_vac_noa_dift: 0,
      rep_inf_egr_tra_otr_dift: 0,
      rep_inf_egr_dev_ban_dift: 0,
      rep_inf_egr_tot_dos_dift: 0,
      rep_inf_sal_mes_dift: 0,
      rep_sol_nec_mes_dift: 0,
      rep_sol_sol_mes_dift: 0,
      rep_con_lot_bio_dift: "",
      rep_con_fec_cad_dift: "",
    },
    row12: {
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
    row13: {
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
    row14: {
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
    row15: {
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
    row16: {
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
    row17: {
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
    row18: {
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
    row19: {
      rep_inf_sal_ant_sino: 0,
      rep_inf_ing_ban_vac_sino: 0,
      rep_inf_ing_con_fis_sino: 0,
      rep_inf_ing_rec_otr_sino: 0,
      rep_inf_ing_tot_ing_sino: 0,
      rep_inf_tot_dis_sino: 0,
      rep_inf_egr_apl_mes_sino: 0,
      rep_inf_egr_per_vac_abi_sino: 0,
      rep_inf_egr_per_vac_noa_sino: 0,
      rep_inf_egr_tra_otr_sino: 0,
      rep_inf_egr_dev_ban_sino: 0,
      rep_inf_egr_tot_dos_sino: 0,
      rep_inf_sal_mes_sino: 0,
      rep_sol_nec_mes_sino: 0,
      rep_sol_sol_mes_sino: 0,
      rep_con_lot_bio_sino: "",
      rep_con_fec_cad_sino: "",
    },
    row20: {
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
    row21: {
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
    row22: {
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
    row23: {
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
    row24: {
      rep_inf_sal_ant_vacvphcam: 0,
      rep_inf_ing_ban_vac_vacvphcam: 0,
      rep_inf_ing_con_fis_vacvphcam: 0,
      rep_inf_ing_rec_otr_vacvphcam: 0,
      rep_inf_ing_tot_ing_vacvphcam: 0,
      rep_inf_tot_dis_vacvphcam: 0,
      rep_inf_egr_apl_mes_vacvphcam: 0,
      rep_inf_egr_per_vac_abi_vacvphcam: 0,
      rep_inf_egr_per_vac_noa_vacvphcam: 0,
      rep_inf_egr_tra_otr_vacvphcam: 0,
      rep_inf_egr_dev_ban_vacvphcam: 0,
      rep_inf_egr_tot_dos_vacvphcam: 0,
      rep_inf_sal_mes_vacvphcam: 0,
      rep_sol_nec_mes_vacvphcam: 0,
      rep_sol_sol_mes_vacvphcam: 0,
      rep_con_lot_bio_vacvphcam: "",
      rep_con_fec_cad_vacvphcam: "",
    },
    row25: {
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
    row26: {
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
    row27: {
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
    row28: {
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
    row04: "ANTIPOLIOMIELITICA ORAL (OPV)",
    row05: "fIPV",
    row06: "ROTAVIRUS",
    row07: "SRP TRIPLE VIRAL",
    row08: "Fiebre Amarilla",
    row09: "Varicela",
    row10: "SR (dupla viral)",
    row11: "DIFTERIA, TOSFERINA Y TETANOS (DPT) REF",
    row12: "dT adultos",
    row13: "HPV",
    row14: "HEPATITIS B ADULTO",
    row15: "HB PEDIATRICA",
    row16: "INFLUENZA PEDIATRICA",
    row17: "INFLUENZA ADULTOS",
    row18: "PFIZER",
    row19: "SINOVAC",
    row20: "CANSINO",
    row21: "ASTRAZENECA",
    row22: "MODERNA",
    row23: "VIRUELA SIMICA",
    row24: "VACUNA VPH CAMPAÑA",
    row25: "Antitetánica",
    row26: "Anti Hepatitis B",
    row27: "Antirrábica",
    row28: "CAJAS DE BIOSEGURIDAD",
  };

  const keys = Object.keys(formData);

  const handleChange = (e, row, input) => {
    const { value } = e.target;
    const newValue = Number(value);

    setFormData((prevData) => {
      const updatedRow = {
        ...prevData[row],
        [input]: newValue,
      };

      if (
        input === "rep_inf_ing_ban_vac_bcg" ||
        input === "rep_inf_ing_con_fis_bcg" ||
        input === "rep_inf_ing_rec_otr_bcg"
      ) {
        updatedRow.rep_inf_ing_tot_ing_bcg =
          (updatedRow.rep_inf_ing_ban_vac_bcg ||
            prevData[row].rep_inf_ing_ban_vac_bcg) +
          (updatedRow.rep_inf_ing_con_fis_bcg ||
            prevData[row].rep_inf_ing_con_fis_bcg) +
          (updatedRow.rep_inf_ing_rec_otr_bcg ||
            prevData[row].rep_inf_ing_rec_otr_bcg);
      }
      if (
        input === "rep_inf_ing_ban_vac_pent" ||
        input === "rep_inf_ing_con_fis_pent" ||
        input === "rep_inf_ing_rec_otr_pent"
      ) {
        updatedRow.rep_inf_ing_tot_ing_pent =
          (updatedRow.rep_inf_ing_ban_vac_pent ||
            prevData[row].rep_inf_ing_ban_vac_pent) +
          (updatedRow.rep_inf_ing_con_fis_pent ||
            prevData[row].rep_inf_ing_con_fis_pent) +
          (updatedRow.rep_inf_ing_rec_otr_pent ||
            prevData[row].rep_inf_ing_rec_otr_pent);
      }
      if (
        input === "rep_inf_ing_ban_vac_neum" ||
        input === "rep_inf_ing_con_fis_neum" ||
        input === "rep_inf_ing_rec_otr_neum"
      ) {
        updatedRow.rep_inf_ing_tot_ing_neum =
          (updatedRow.rep_inf_ing_ban_vac_neum ||
            prevData[row].rep_inf_ing_ban_vac_neum) +
          (updatedRow.rep_inf_ing_con_fis_neum ||
            prevData[row].rep_inf_ing_con_fis_neum) +
          (updatedRow.rep_inf_ing_rec_otr_neum ||
            prevData[row].rep_inf_ing_rec_otr_neum);
      }
      if (
        input === "rep_inf_ing_ban_vac_anti" ||
        input === "rep_inf_ing_con_fis_anti" ||
        input === "rep_inf_ing_rec_otr_anti"
      ) {
        updatedRow.rep_inf_ing_tot_ing_anti =
          (updatedRow.rep_inf_ing_ban_vac_anti ||
            prevData[row].rep_inf_ing_ban_vac_anti) +
          (updatedRow.rep_inf_ing_con_fis_anti ||
            prevData[row].rep_inf_ing_con_fis_anti) +
          (updatedRow.rep_inf_ing_rec_otr_anti ||
            prevData[row].rep_inf_ing_rec_otr_anti);
      }
      if (
        input === "rep_inf_ing_ban_vac_fipv" ||
        input === "rep_inf_ing_con_fis_fipv" ||
        input === "rep_inf_ing_rec_otr_fipv"
      ) {
        updatedRow.rep_inf_ing_tot_ing_fipv =
          (updatedRow.rep_inf_ing_ban_vac_fipv ||
            prevData[row].rep_inf_ing_ban_vac_fipv) +
          (updatedRow.rep_inf_ing_con_fis_fipv ||
            prevData[row].rep_inf_ing_con_fis_fipv) +
          (updatedRow.rep_inf_ing_rec_otr_fipv ||
            prevData[row].rep_inf_ing_rec_otr_fipv);
      }
      if (
        input === "rep_inf_ing_ban_vac_rota" ||
        input === "rep_inf_ing_con_fis_rota" ||
        input === "rep_inf_ing_rec_otr_rota"
      ) {
        updatedRow.rep_inf_ing_tot_ing_rota =
          (updatedRow.rep_inf_ing_ban_vac_rota ||
            prevData[row].rep_inf_ing_ban_vac_rota) +
          (updatedRow.rep_inf_ing_con_fis_rota ||
            prevData[row].rep_inf_ing_con_fis_rota) +
          (updatedRow.rep_inf_ing_rec_otr_rota ||
            prevData[row].rep_inf_ing_rec_otr_rota);
      }
      if (
        input === "rep_inf_ing_ban_vac_srp" ||
        input === "rep_inf_ing_con_fis_srp" ||
        input === "rep_inf_ing_rec_otr_srp"
      ) {
        updatedRow.rep_inf_ing_tot_ing_srp =
          (updatedRow.rep_inf_ing_ban_vac_srp ||
            prevData[row].rep_inf_ing_ban_vac_srp) +
          (updatedRow.rep_inf_ing_con_fis_srp ||
            prevData[row].rep_inf_ing_con_fis_srp) +
          (updatedRow.rep_inf_ing_rec_otr_srp ||
            prevData[row].rep_inf_ing_rec_otr_srp);
      }
      if (
        input === "rep_inf_ing_ban_vac_fieb" ||
        input === "rep_inf_ing_con_fis_fieb" ||
        input === "rep_inf_ing_rec_otr_fieb"
      ) {
        updatedRow.rep_inf_ing_tot_ing_fieb =
          (updatedRow.rep_inf_ing_ban_vac_fieb ||
            prevData[row].rep_inf_ing_ban_vac_fieb) +
          (updatedRow.rep_inf_ing_con_fis_fieb ||
            prevData[row].rep_inf_ing_con_fis_fieb) +
          (updatedRow.rep_inf_ing_rec_otr_fieb ||
            prevData[row].rep_inf_ing_rec_otr_fieb);
      }
      if (
        input === "rep_inf_ing_ban_vac_vari" ||
        input === "rep_inf_ing_con_fis_vari" ||
        input === "rep_inf_ing_rec_otr_vari"
      ) {
        updatedRow.rep_inf_ing_tot_ing_vari =
          (updatedRow.rep_inf_ing_ban_vac_vari ||
            prevData[row].rep_inf_ing_ban_vac_vari) +
          (updatedRow.rep_inf_ing_con_fis_vari ||
            prevData[row].rep_inf_ing_con_fis_vari) +
          (updatedRow.rep_inf_ing_rec_otr_vari ||
            prevData[row].rep_inf_ing_rec_otr_vari);
      }
      if (
        input === "rep_inf_ing_ban_vac_sr" ||
        input === "rep_inf_ing_con_fis_sr" ||
        input === "rep_inf_ing_rec_otr_sr"
      ) {
        updatedRow.rep_inf_ing_tot_ing_sr =
          (updatedRow.rep_inf_ing_ban_vac_sr ||
            prevData[row].rep_inf_ing_ban_vac_sr) +
          (updatedRow.rep_inf_ing_con_fis_sr ||
            prevData[row].rep_inf_ing_con_fis_sr) +
          (updatedRow.rep_inf_ing_rec_otr_sr ||
            prevData[row].rep_inf_ing_rec_otr_sr);
      }
      if (
        input === "rep_inf_ing_ban_vac_dift" ||
        input === "rep_inf_ing_con_fis_dift" ||
        input === "rep_inf_ing_rec_otr_dift"
      ) {
        updatedRow.rep_inf_ing_tot_ing_dift =
          (updatedRow.rep_inf_ing_ban_vac_dift ||
            prevData[row].rep_inf_ing_ban_vac_dift) +
          (updatedRow.rep_inf_ing_con_fis_dift ||
            prevData[row].rep_inf_ing_con_fis_dift) +
          (updatedRow.rep_inf_ing_rec_otr_dift ||
            prevData[row].rep_inf_ing_rec_otr_dift);
      }
      if (
        input === "rep_inf_ing_ban_vac_dtad" ||
        input === "rep_inf_ing_con_fis_dtad" ||
        input === "rep_inf_ing_rec_otr_dtad"
      ) {
        updatedRow.rep_inf_ing_tot_ing_dtad =
          (updatedRow.rep_inf_ing_ban_vac_dtad ||
            prevData[row].rep_inf_ing_ban_vac_dtad) +
          (updatedRow.rep_inf_ing_con_fis_dtad ||
            prevData[row].rep_inf_ing_con_fis_dtad) +
          (updatedRow.rep_inf_ing_rec_otr_dtad ||
            prevData[row].rep_inf_ing_rec_otr_dtad);
      }
      if (
        input === "rep_inf_ing_ban_vac_hpv" ||
        input === "rep_inf_ing_con_fis_hpv" ||
        input === "rep_inf_ing_rec_otr_hpv"
      ) {
        updatedRow.rep_inf_ing_tot_ing_hpv =
          (updatedRow.rep_inf_ing_ban_vac_hpv ||
            prevData[row].rep_inf_ing_ban_vac_hpv) +
          (updatedRow.rep_inf_ing_con_fis_hpv ||
            prevData[row].rep_inf_ing_con_fis_hpv) +
          (updatedRow.rep_inf_ing_rec_otr_hpv ||
            prevData[row].rep_inf_ing_rec_otr_hpv);
      }
      if (
        input === "rep_inf_ing_ban_vac_hepa" ||
        input === "rep_inf_ing_con_fis_hepa" ||
        input === "rep_inf_ing_rec_otr_hepa"
      ) {
        updatedRow.rep_inf_ing_tot_ing_hepa =
          (updatedRow.rep_inf_ing_ban_vac_hepa ||
            prevData[row].rep_inf_ing_ban_vac_hepa) +
          (updatedRow.rep_inf_ing_con_fis_hepa ||
            prevData[row].rep_inf_ing_con_fis_hepa) +
          (updatedRow.rep_inf_ing_rec_otr_hepa ||
            prevData[row].rep_inf_ing_rec_otr_hepa);
      }
      if (
        input === "rep_inf_ing_ban_vac_hbpe" ||
        input === "rep_inf_ing_con_fis_hbpe" ||
        input === "rep_inf_ing_rec_otr_hbpe"
      ) {
        updatedRow.rep_inf_ing_tot_ing_hbpe =
          (updatedRow.rep_inf_ing_ban_vac_hbpe ||
            prevData[row].rep_inf_ing_ban_vac_hbpe) +
          (updatedRow.rep_inf_ing_con_fis_hbpe ||
            prevData[row].rep_inf_ing_con_fis_hbpe) +
          (updatedRow.rep_inf_ing_rec_otr_hbpe ||
            prevData[row].rep_inf_ing_rec_otr_hbpe);
      }
      if (
        input === "rep_inf_ing_ban_vac_infped" ||
        input === "rep_inf_ing_con_fis_infped" ||
        input === "rep_inf_ing_rec_otr_infped"
      ) {
        updatedRow.rep_inf_ing_tot_ing_infped =
          (updatedRow.rep_inf_ing_ban_vac_infped ||
            prevData[row].rep_inf_ing_ban_vac_infped) +
          (updatedRow.rep_inf_ing_con_fis_infped ||
            prevData[row].rep_inf_ing_con_fis_infped) +
          (updatedRow.rep_inf_ing_rec_otr_infped ||
            prevData[row].rep_inf_ing_rec_otr_infped);
      }
      if (
        input === "rep_inf_ing_ban_vac_infadu" ||
        input === "rep_inf_ing_con_fis_infadu" ||
        input === "rep_inf_ing_rec_otr_infadu"
      ) {
        updatedRow.rep_inf_ing_tot_ing_infadu =
          (updatedRow.rep_inf_ing_ban_vac_infadu ||
            prevData[row].rep_inf_ing_ban_vac_infadu) +
          (updatedRow.rep_inf_ing_con_fis_infadu ||
            prevData[row].rep_inf_ing_con_fis_infadu) +
          (updatedRow.rep_inf_ing_rec_otr_infadu ||
            prevData[row].rep_inf_ing_rec_otr_infadu);
      }
      if (
        input === "rep_inf_ing_ban_vac_pfiz" ||
        input === "rep_inf_ing_con_fis_pfiz" ||
        input === "rep_inf_ing_rec_otr_pfiz"
      ) {
        updatedRow.rep_inf_ing_tot_ing_pfiz =
          (updatedRow.rep_inf_ing_ban_vac_pfiz ||
            prevData[row].rep_inf_ing_ban_vac_pfiz) +
          (updatedRow.rep_inf_ing_con_fis_pfiz ||
            prevData[row].rep_inf_ing_con_fis_pfiz) +
          (updatedRow.rep_inf_ing_rec_otr_pfiz ||
            prevData[row].rep_inf_ing_rec_otr_pfiz);
      }
      if (
        input === "rep_inf_ing_ban_vac_sino" ||
        input === "rep_inf_ing_con_fis_sino" ||
        input === "rep_inf_ing_rec_otr_sino"
      ) {
        updatedRow.rep_inf_ing_tot_ing_sino =
          (updatedRow.rep_inf_ing_ban_vac_sino ||
            prevData[row].rep_inf_ing_ban_vac_sino) +
          (updatedRow.rep_inf_ing_con_fis_sino ||
            prevData[row].rep_inf_ing_con_fis_sino) +
          (updatedRow.rep_inf_ing_rec_otr_sino ||
            prevData[row].rep_inf_ing_rec_otr_sino);
      }
      if (
        input === "rep_inf_ing_ban_vac_cans" ||
        input === "rep_inf_ing_con_fis_cans" ||
        input === "rep_inf_ing_rec_otr_cans"
      ) {
        updatedRow.rep_inf_ing_tot_ing_cans =
          (updatedRow.rep_inf_ing_ban_vac_cans ||
            prevData[row].rep_inf_ing_ban_vac_cans) +
          (updatedRow.rep_inf_ing_con_fis_cans ||
            prevData[row].rep_inf_ing_con_fis_cans) +
          (updatedRow.rep_inf_ing_rec_otr_cans ||
            prevData[row].rep_inf_ing_rec_otr_cans);
      }
      if (
        input === "rep_inf_ing_ban_vac_astr" ||
        input === "rep_inf_ing_con_fis_astr" ||
        input === "rep_inf_ing_rec_otr_astr"
      ) {
        updatedRow.rep_inf_ing_tot_ing_astr =
          (updatedRow.rep_inf_ing_ban_vac_astr ||
            prevData[row].rep_inf_ing_ban_vac_astr) +
          (updatedRow.rep_inf_ing_con_fis_astr ||
            prevData[row].rep_inf_ing_con_fis_astr) +
          (updatedRow.rep_inf_ing_rec_otr_astr ||
            prevData[row].rep_inf_ing_rec_otr_astr);
      }
      if (
        input === "rep_inf_ing_ban_vac_modr" ||
        input === "rep_inf_ing_con_fis_modr" ||
        input === "rep_inf_ing_rec_otr_modr"
      ) {
        updatedRow.rep_inf_ing_tot_ing_modr =
          (updatedRow.rep_inf_ing_ban_vac_modr ||
            prevData[row].rep_inf_ing_ban_vac_modr) +
          (updatedRow.rep_inf_ing_con_fis_modr ||
            prevData[row].rep_inf_ing_con_fis_modr) +
          (updatedRow.rep_inf_ing_rec_otr_modr ||
            prevData[row].rep_inf_ing_rec_otr_modr);
      }
      if (
        input === "rep_inf_ing_ban_vac_virsim" ||
        input === "rep_inf_ing_con_fis_virsim" ||
        input === "rep_inf_ing_rec_otr_virsim"
      ) {
        updatedRow.rep_inf_ing_tot_ing_virsim =
          (updatedRow.rep_inf_ing_ban_vac_virsim ||
            prevData[row].rep_inf_ing_ban_vac_virsim) +
          (updatedRow.rep_inf_ing_con_fis_virsim ||
            prevData[row].rep_inf_ing_con_fis_virsim) +
          (updatedRow.rep_inf_ing_rec_otr_virsim ||
            prevData[row].rep_inf_ing_rec_otr_virsim);
      }
      if (
        input === "rep_inf_ing_ban_vac_vacvphcam" ||
        input === "rep_inf_ing_con_fis_vacvphcam" ||
        input === "rep_inf_ing_rec_otr_vacvphcam"
      ) {
        updatedRow.rep_inf_ing_tot_ing_vacvphcam =
          (updatedRow.rep_inf_ing_ban_vac_vacvphcam ||
            prevData[row].rep_inf_ing_ban_vac_vacvphcam) +
          (updatedRow.rep_inf_ing_con_fis_vacvphcam ||
            prevData[row].rep_inf_ing_con_fis_vacvphcam) +
          (updatedRow.rep_inf_ing_rec_otr_vacvphcam ||
            prevData[row].rep_inf_ing_rec_otr_vacvphcam);
      }
      if (
        input === "rep_inf_ing_ban_vac_inm_anti" ||
        input === "rep_inf_ing_con_fis_inm_anti" ||
        input === "rep_inf_ing_rec_otr_inm_anti"
      ) {
        updatedRow.rep_inf_ing_tot_ing_inm_anti =
          (updatedRow.rep_inf_ing_ban_vac_inm_anti ||
            prevData[row].rep_inf_ing_ban_vac_inm_anti) +
          (updatedRow.rep_inf_ing_con_fis_inm_anti ||
            prevData[row].rep_inf_ing_con_fis_inm_anti) +
          (updatedRow.rep_inf_ing_rec_otr_inm_anti ||
            prevData[row].rep_inf_ing_rec_otr_inm_anti);
      }
      if (
        input === "rep_inf_ing_ban_vac_inm_ant_hep_b" ||
        input === "rep_inf_ing_con_fis_inm_ant_hep_b" ||
        input === "rep_inf_ing_rec_otr_inm_ant_hep_b"
      ) {
        updatedRow.rep_inf_ing_tot_ing_inm_ant_hep_b =
          (updatedRow.rep_inf_ing_ban_vac_inm_ant_hep_b ||
            prevData[row].rep_inf_ing_ban_vac_inm_ant_hep_b) +
          (updatedRow.rep_inf_ing_con_fis_inm_ant_hep_b ||
            prevData[row].rep_inf_ing_con_fis_inm_ant_hep_b) +
          (updatedRow.rep_inf_ing_rec_otr_inm_ant_hep_b ||
            prevData[row].rep_inf_ing_rec_otr_inm_ant_hep_b);
      }
      if (
        input === "rep_inf_ing_ban_vac_inm_ant_rrab" ||
        input === "rep_inf_ing_con_fis_inm_ant_rrab" ||
        input === "rep_inf_ing_rec_otr_inm_ant_rrab"
      ) {
        updatedRow.rep_inf_ing_tot_ing_inm_ant_rrab =
          (updatedRow.rep_inf_ing_ban_vac_inm_ant_rrab ||
            prevData[row].rep_inf_ing_ban_vac_inm_ant_rrab) +
          (updatedRow.rep_inf_ing_con_fis_inm_ant_rrab ||
            prevData[row].rep_inf_ing_con_fis_inm_ant_rrab) +
          (updatedRow.rep_inf_ing_rec_otr_inm_ant_rrab ||
            prevData[row].rep_inf_ing_rec_otr_inm_ant_rrab);
      }
      if (
        input === "rep_inf_ing_ban_vac_caj_bios" ||
        input === "rep_inf_ing_con_fis_caj_bios" ||
        input === "rep_inf_ing_rec_otr_caj_bios"
      ) {
        updatedRow.rep_inf_ing_tot_ing_caj_bios =
          (updatedRow.rep_inf_ing_ban_vac_caj_bios ||
            prevData[row].rep_inf_ing_ban_vac_caj_bios) +
          (updatedRow.rep_inf_ing_con_fis_caj_bios ||
            prevData[row].rep_inf_ing_con_fis_caj_bios) +
          (updatedRow.rep_inf_ing_rec_otr_caj_bios ||
            prevData[row].rep_inf_ing_rec_otr_caj_bios);
      }

      return {
        ...prevData,
        [row]: updatedRow,
      };
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

  const dataDesperdicioMes = (e) => {
    const selectedValue = e.target.value;
    const dataDesperdicioMes = meses.find(
      (mes) => mes.des_fech === selectedValue
    );
    limpiarVariables();

    setFormData((prevData) => ({
      ...prevData,
      row01: {
        ...prevData.row01,
        rep_inf_egr_apl_mes_bcg:
          dataDesperdicioMes?.des_bcg_dosapli ||
          prevData.row01.rep_inf_egr_apl_mes_bcg,
        rep_inf_egr_per_vac_abi_bcg:
          dataDesperdicioMes?.des_bcg_pervacenfabi ||
          prevData.row01.rep_inf_egr_per_vac_abi_bcg,
        rep_inf_egr_per_vac_noa_bcg:
          dataDesperdicioMes?.des_bcg_pervacfrasnoabi ||
          prevData.row01.rep_inf_egr_per_vac_noa_bcg,
      },
      row02: {
        ...prevData.row02,
        rep_inf_egr_apl_mes_pent:
          dataDesperdicioMes?.des_pent_dosapli ||
          prevData.row02.rep_inf_egr_apl_mes_pent,
        rep_inf_egr_per_vac_abi_pent:
          dataDesperdicioMes?.des_pent_pervacenfabi ||
          prevData.row02.rep_inf_egr_per_vac_abi_pent,
        rep_inf_egr_per_vac_noa_pent:
          dataDesperdicioMes?.des_pent_pervacfrasnoabi ||
          prevData.row02.rep_inf_egr_per_vac_noa_pent,
      },
      row03: {
        ...prevData.row03,
        rep_inf_egr_apl_mes_neum:
          dataDesperdicioMes?.des_neum_dosapli ||
          prevData.row03.rep_inf_egr_apl_mes_neum,
        rep_inf_egr_per_vac_abi_neum:
          dataDesperdicioMes?.des_neum_pervacenfabi ||
          prevData.row03.rep_inf_egr_per_vac_abi_neum,
        rep_inf_egr_per_vac_noa_neum:
          dataDesperdicioMes?.des_neum_pervacfrasnoabi ||
          prevData.row03.rep_inf_egr_per_vac_noa_neum,
      },
      row04: {
        ...prevData.row04,
        rep_inf_egr_apl_mes_anti:
          dataDesperdicioMes?.des_anti_dosapli ||
          prevData.row04.rep_inf_egr_apl_mes_anti,
        rep_inf_egr_per_vac_abi_anti:
          dataDesperdicioMes?.des_anti_pervacenfabi ||
          prevData.row04.rep_inf_egr_per_vac_abi_anti,
        rep_inf_egr_per_vac_noa_anti:
          dataDesperdicioMes?.des_anti_pervacfrasnoabi ||
          prevData.row04.rep_inf_egr_per_vac_noa_anti,
      },
      row05: {
        ...prevData.row05,
        rep_inf_egr_apl_mes_fipv:
          dataDesperdicioMes?.des_fipv_dosapli ||
          prevData.row05.rep_inf_egr_apl_mes_fipv,
        rep_inf_egr_per_vac_abi_fipv:
          dataDesperdicioMes?.des_fipv_pervacenfabi ||
          prevData.row05.rep_inf_egr_per_vac_abi_fipv,
        rep_inf_egr_per_vac_noa_fipv:
          dataDesperdicioMes?.des_fipv_pervacfrasnoabi ||
          prevData.row05.rep_inf_egr_per_vac_noa_fipv,
      },
      row06: {
        ...prevData.row06,
        rep_inf_egr_apl_mes_rota:
          dataDesperdicioMes?.des_rota_dosapli ||
          prevData.row06.rep_inf_egr_apl_mes_rota,
        rep_inf_egr_per_vac_abi_rota:
          dataDesperdicioMes?.des_rota_pervacenfabi ||
          prevData.row06.rep_inf_egr_per_vac_abi_rota,
        rep_inf_egr_per_vac_noa_rota:
          dataDesperdicioMes?.des_rota_pervacfrasnoabi ||
          prevData.row06.rep_inf_egr_per_vac_noa_rota,
      },
      row07: {
        ...prevData.row07,
        rep_inf_egr_apl_mes_srp:
          dataDesperdicioMes?.des_srp_dosapli ||
          prevData.row07.rep_inf_egr_apl_mes_srp,
        rep_inf_egr_per_vac_abi_srp:
          dataDesperdicioMes?.des_srp_pervacenfabi ||
          prevData.row07.rep_inf_egr_per_vac_abi_srp,
        rep_inf_egr_per_vac_noa_srp:
          dataDesperdicioMes?.des_srp_pervacfrasnoabi ||
          prevData.row07.rep_inf_egr_per_vac_noa_srp,
      },
      row08: {
        ...prevData.row08,
        rep_inf_egr_apl_mes_fieb:
          dataDesperdicioMes?.des_fieb_dosapli ||
          prevData.row08.rep_inf_egr_apl_mes_fieb,
        rep_inf_egr_per_vac_abi_fieb:
          dataDesperdicioMes?.des_fieb_pervacenfabi ||
          prevData.row08.rep_inf_egr_per_vac_abi_fieb,
        rep_inf_egr_per_vac_noa_fieb:
          dataDesperdicioMes?.des_fieb_pervacfrasnoabi ||
          prevData.row08.rep_inf_egr_per_vac_noa_fieb,
      },
      row09: {
        ...prevData.row09,
        rep_inf_egr_apl_mes_vari:
          dataDesperdicioMes?.des_vari_dosapli ||
          prevData.row09.rep_inf_egr_apl_mes_vari,
        rep_inf_egr_per_vac_abi_vari:
          dataDesperdicioMes?.des_vari_pervacenfabi ||
          prevData.row09.rep_inf_egr_per_vac_abi_vari,
        rep_inf_egr_per_vac_noa_vari:
          dataDesperdicioMes?.des_vari_pervacfrasnoabi ||
          prevData.row09.rep_inf_egr_per_vac_noa_vari,
      },
      row10: {
        ...prevData.row10,
        rep_inf_egr_apl_mes_sr:
          dataDesperdicioMes?.des_sr_dosapli ||
          prevData.row10.rep_inf_egr_apl_mes_sr,
        rep_inf_egr_per_vac_abi_sr:
          dataDesperdicioMes?.des_sr_pervacenfabi ||
          prevData.row10.rep_inf_egr_per_vac_abi_sr,
        rep_inf_egr_per_vac_noa_sr:
          dataDesperdicioMes?.des_sr_pervacfrasnoabi ||
          prevData.row10.rep_inf_egr_per_vac_noa_sr,
      },
      row11: {
        ...prevData.row11,
        rep_inf_egr_apl_mes_dift:
          dataDesperdicioMes?.des_dift_dosapli ||
          prevData.row11.rep_inf_egr_apl_mes_dift,
        rep_inf_egr_per_vac_abi_dift:
          dataDesperdicioMes?.des_dift_pervacenfabi ||
          prevData.row11.rep_inf_egr_per_vac_abi_dift,
        rep_inf_egr_per_vac_noa_dift:
          dataDesperdicioMes?.des_dift_pervacfrasnoabi ||
          prevData.row11.rep_inf_egr_per_vac_noa_dift,
      },
      row12: {
        ...prevData.row12,
        rep_inf_egr_apl_mes_dtad:
          dataDesperdicioMes?.des_dtad_dosapli ||
          prevData.row12.rep_inf_egr_apl_mes_dtad,
        rep_inf_egr_per_vac_abi_dtad:
          dataDesperdicioMes?.des_dtad_pervacenfabi ||
          prevData.row12.rep_inf_egr_per_vac_abi_dtad,
        rep_inf_egr_per_vac_noa_dtad:
          dataDesperdicioMes?.des_dtad_pervacfrasnoabi ||
          prevData.row12.rep_inf_egr_per_vac_noa_dtad,
      },
      row13: {
        ...prevData.row13,
        rep_inf_egr_apl_mes_hpv:
          dataDesperdicioMes?.des_hpv_dosapli ||
          prevData.row13.rep_inf_egr_apl_mes_hpv,
        rep_inf_egr_per_vac_abi_hpv:
          dataDesperdicioMes?.des_hpv_pervacenfabi ||
          prevData.row13.rep_inf_egr_per_vac_abi_hpv,
        rep_inf_egr_per_vac_noa_hpv:
          dataDesperdicioMes?.des_hpv_pervacfrasnoabi ||
          prevData.row13.rep_inf_egr_per_vac_noa_hpv,
      },
      row14: {
        ...prevData.row14,
        rep_inf_egr_apl_mes_hepa:
          dataDesperdicioMes?.des_hepa_dosapli ||
          prevData.row14.rep_inf_egr_apl_mes_hepa,
        rep_inf_egr_per_vac_abi_hepa:
          dataDesperdicioMes?.des_hepa_pervacenfabi ||
          prevData.row14.rep_inf_egr_per_vac_abi_hepa,
        rep_inf_egr_per_vac_noa_hepa:
          dataDesperdicioMes?.des_hepa_pervacfrasnoabi ||
          prevData.row14.rep_inf_egr_per_vac_noa_hepa,
      },
      row15: {
        ...prevData.row15,
        rep_inf_egr_apl_mes_hbpe:
          dataDesperdicioMes?.des_hbpe_dosapli ||
          prevData.row15.rep_inf_egr_apl_mes_hbpe,
        rep_inf_egr_per_vac_abi_hbpe:
          dataDesperdicioMes?.des_hbpe_pervacenfabi ||
          prevData.row15.rep_inf_egr_per_vac_abi_hbpe,
        rep_inf_egr_per_vac_noa_hbpe:
          dataDesperdicioMes?.des_hbpe_pervacfrasnoabi ||
          prevData.row15.rep_inf_egr_per_vac_noa_hbpe,
      },
      row16: {
        ...prevData.row16,
        rep_inf_egr_apl_mes_infped:
          dataDesperdicioMes?.des_infped_dosapli ||
          prevData.row16.rep_inf_egr_apl_mes_infped,
        rep_inf_egr_per_vac_abi_infped:
          dataDesperdicioMes?.des_infped_pervacenfabi ||
          prevData.row16.rep_inf_egr_per_vac_abi_infped,
        rep_inf_egr_per_vac_noa_infped:
          dataDesperdicioMes?.des_infped_pervacfrasnoabi ||
          prevData.row16.rep_inf_egr_per_vac_noa_infped,
      },
      row17: {
        ...prevData.row17,
        rep_inf_egr_apl_mes_infadu:
          dataDesperdicioMes?.des_infadu_dosapli ||
          prevData.row17.rep_inf_egr_apl_mes_infadu,
        rep_inf_egr_per_vac_abi_infadu:
          dataDesperdicioMes?.des_infadu_pervacenfabi ||
          prevData.row17.rep_inf_egr_per_vac_abi_infadu,
        rep_inf_egr_per_vac_noa_infadu:
          dataDesperdicioMes?.des_infadu_pervacfrasnoabi ||
          prevData.row17.rep_inf_egr_per_vac_noa_infadu,
      },
      row18: {
        ...prevData.row18,
        rep_inf_egr_apl_mes_pfiz:
          dataDesperdicioMes?.des_vacpfi_dosapli ||
          prevData.row18.rep_inf_egr_apl_mes_pfiz,
        rep_inf_egr_per_vac_abi_pfiz:
          dataDesperdicioMes?.des_vacpfi_pervacenfabi ||
          prevData.row18.rep_inf_egr_per_vac_abi_pfiz,
        rep_inf_egr_per_vac_noa_pfiz:
          dataDesperdicioMes?.des_vacpfi_pervacfrasnoabi ||
          prevData.row18.rep_inf_egr_per_vac_noa_pfiz,
      },
      row19: {
        ...prevData.row19,
        rep_inf_egr_apl_mes_sino:
          dataDesperdicioMes?.des_vacsin_dosapli ||
          prevData.row19.rep_inf_egr_apl_mes_sino,
        rep_inf_egr_per_vac_abi_sino:
          dataDesperdicioMes?.des_vacsin_pervacenfabi ||
          prevData.row19.rep_inf_egr_per_vac_abi_sino,
        rep_inf_egr_per_vac_noa_sino:
          dataDesperdicioMes?.des_vacsin_pervacfrasnoabi ||
          prevData.row19.rep_inf_egr_per_vac_noa_sino,
      },
      row22: {
        ...prevData.row22,
        rep_inf_egr_apl_mes_modr:
          dataDesperdicioMes?.des_vacmod_dosapli ||
          prevData.row22.rep_inf_egr_apl_mes_modr,
        rep_inf_egr_per_vac_abi_modr:
          dataDesperdicioMes?.des_vacmod_pervacenfabi ||
          prevData.row22.rep_inf_egr_per_vac_abi_modr,
        rep_inf_egr_per_vac_noa_modr:
          dataDesperdicioMes?.des_vacmod_pervacfrasnoabi ||
          prevData.row22.rep_inf_egr_per_vac_noa_modr,
      },
      row23: {
        ...prevData.row23,
        rep_inf_egr_apl_mes_virsim:
          dataDesperdicioMes?.des_viru_dosapli ||
          prevData.row23.rep_inf_egr_apl_mes_virsim,
        rep_inf_egr_per_vac_abi_virsim:
          dataDesperdicioMes?.des_viru_pervacenfabi ||
          prevData.row23.rep_inf_egr_per_vac_abi_virsim,
        rep_inf_egr_per_vac_noa_virsim:
          dataDesperdicioMes?.des_viru_pervacfrasnoabi ||
          prevData.row23.rep_inf_egr_per_vac_noa_virsim,
      },
      row24: {
        ...prevData.row24,
        rep_inf_egr_apl_mes_vacvphcam:
          dataDesperdicioMes?.des_vacvphcam_dosapli ||
          prevData.row24.rep_inf_egr_apl_mes_vacvphcam,
        rep_inf_egr_per_vac_abi_vacvphcam:
          dataDesperdicioMes?.des_vacvphcam_pervacenfabi ||
          prevData.row24.rep_inf_egr_per_vac_abi_vacvphcam,
        rep_inf_egr_per_vac_noa_vacvphcam:
          dataDesperdicioMes?.des_vacvphcam_pervacfrasnoabi ||
          prevData.row24.rep_inf_egr_per_vac_noa_vacvphcam,
      },
      row25: {
        ...prevData.row25,
        rep_inf_egr_apl_mes_inm_anti:
          dataDesperdicioMes?.des_inmant_dosapli ||
          prevData.row25.rep_inf_egr_apl_mes_inm_anti,
        rep_inf_egr_per_vac_abi_inm_anti:
          dataDesperdicioMes?.des_inmant_pervacenfabi ||
          prevData.row25.rep_inf_egr_per_vac_abi_inm_anti,
        rep_inf_egr_per_vac_noa_inm_anti:
          dataDesperdicioMes?.des_inmant_pervacfrasnoabi ||
          prevData.row25.rep_inf_egr_per_vac_noa_inm_anti,
      },
      row26: {
        ...prevData.row26,
        rep_inf_egr_apl_mes_inm_ant_hep_b:
          dataDesperdicioMes?.des_inmanthepb_dosapli ||
          prevData.row26.rep_inf_egr_apl_mes_inm_ant_hep_b,
        rep_inf_egr_per_vac_abi_inm_ant_hep_b:
          dataDesperdicioMes?.des_inmanthepb_pervacenfabi ||
          prevData.row26.rep_inf_egr_per_vac_abi_inm_ant_hep_b,
        rep_inf_egr_per_vac_noa_inm_ant_hep_b:
          dataDesperdicioMes?.des_inmanthepb_pervacfrasnoabi ||
          prevData.row26.rep_inf_egr_per_vac_noa_inm_ant_hep_b,
      },
      row27: {
        ...prevData.row27,
        rep_inf_egr_apl_mes_inm_ant_rrab:
          dataDesperdicioMes?.des_inmantrra_dosapli ||
          prevData.row27.rep_inf_egr_apl_mes_inm_ant_rrab,
        rep_inf_egr_per_vac_abi_inm_ant_rrab:
          dataDesperdicioMes?.des_inmantrra_pervacenfabi ||
          prevData.row27.rep_inf_egr_per_vac_abi_inm_ant_rrab,
        rep_inf_egr_per_vac_noa_inm_ant_rrab:
          dataDesperdicioMes?.des_inmantrra_pervacfrasnoabi ||
          prevData.row27.rep_inf_egr_per_vac_noa_inm_ant_rrab,
      },
    }));
  };

  const limpiarVariables = () => {
    setFormData({
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
        rep_inf_sal_ant_anti: 0,
        rep_inf_ing_ban_vac_anti: 0,
        rep_inf_ing_con_fis_anti: 0,
        rep_inf_ing_rec_otr_anti: 0,
        rep_inf_ing_tot_ing_anti: 0,
        rep_inf_tot_dis_anti: 0,
        rep_inf_egr_apl_mes_anti: 0,
        rep_inf_egr_per_vac_abi_anti: 0,
        rep_inf_egr_per_vac_noa_anti: 0,
        rep_inf_egr_tra_otr_anti: 0,
        rep_inf_egr_dev_ban_anti: 0,
        rep_inf_egr_tot_dos_anti: 0,
        rep_inf_sal_mes_anti: 0,
        rep_sol_nec_mes_anti: 0,
        rep_sol_sol_mes_anti: 0,
        rep_con_lot_bio_anti: "",
        rep_con_fec_cad_anti: "",
      },
      row05: {
        rep_inf_sal_ant_fipv: 0,
        rep_inf_ing_ban_vac_fipv: 0,
        rep_inf_ing_con_fis_fipv: 0,
        rep_inf_ing_rec_otr_fipv: 0,
        rep_inf_ing_tot_ing_fipv: 0,
        rep_inf_tot_dis_fipv: 0,
        rep_inf_egr_apl_mes_fipv: 0,
        rep_inf_egr_per_vac_abi_fipv: 0,
        rep_inf_egr_per_vac_noa_fipv: 0,
        rep_inf_egr_tra_otr_fipv: 0,
        rep_inf_egr_dev_ban_fipv: 0,
        rep_inf_egr_tot_dos_fipv: 0,
        rep_inf_sal_mes_fipv: 0,
        rep_sol_nec_mes_fipv: 0,
        rep_sol_sol_mes_fipv: 0,
        rep_con_lot_bio_fipv: "",
        rep_con_fec_cad_fipv: "",
      },
      row06: {
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
      row07: {
        rep_inf_sal_ant_srp: 0,
        rep_inf_ing_ban_vac_srp: 0,
        rep_inf_ing_con_fis_srp: 0,
        rep_inf_ing_rec_otr_srp: 0,
        rep_inf_ing_tot_ing_srp: 0,
        rep_inf_tot_dis_srp: 0,
        rep_inf_egr_apl_mes_srp: 0,
        rep_inf_egr_per_vac_abi_srp: 0,
        rep_inf_egr_per_vac_noa_srp: 0,
        rep_inf_egr_tra_otr_srp: 0,
        rep_inf_egr_dev_ban_srp: 0,
        rep_inf_egr_tot_dos_srp: 0,
        rep_inf_sal_mes_srp: 0,
        rep_sol_nec_mes_srp: 0,
        rep_sol_sol_mes_srp: 0,
        rep_con_lot_bio_srp: "",
        rep_con_fec_cad_srp: "",
      },
      row08: {
        rep_inf_sal_ant_fieb: 0,
        rep_inf_ing_ban_vac_fieb: 0,
        rep_inf_ing_con_fis_fieb: 0,
        rep_inf_ing_rec_otr_fieb: 0,
        rep_inf_ing_tot_ing_fieb: 0,
        rep_inf_tot_dis_fieb: 0,
        rep_inf_egr_apl_mes_fieb: 0,
        rep_inf_egr_per_vac_abi_fieb: 0,
        rep_inf_egr_per_vac_noa_fieb: 0,
        rep_inf_egr_tra_otr_fieb: 0,
        rep_inf_egr_dev_ban_fieb: 0,
        rep_inf_egr_tot_dos_fieb: 0,
        rep_inf_sal_mes_fieb: 0,
        rep_sol_nec_mes_fieb: 0,
        rep_sol_sol_mes_fieb: 0,
        rep_con_lot_bio_fieb: "",
        rep_con_fec_cad_fieb: "",
      },
      row09: {
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
      row10: {
        rep_inf_sal_ant_sr: 0,
        rep_inf_ing_ban_vac_sr: 0,
        rep_inf_ing_con_fis_sr: 0,
        rep_inf_ing_rec_otr_sr: 0,
        rep_inf_ing_tot_ing_sr: 0,
        rep_inf_tot_dis_sr: 0,
        rep_inf_egr_apl_mes_sr: 0,
        rep_inf_egr_per_vac_abi_sr: 0,
        rep_inf_egr_per_vac_noa_sr: 0,
        rep_inf_egr_tra_otr_sr: 0,
        rep_inf_egr_dev_ban_sr: 0,
        rep_inf_egr_tot_dos_sr: 0,
        rep_inf_sal_mes_sr: 0,
        rep_sol_nec_mes_sr: 0,
        rep_sol_sol_mes_sr: 0,
        rep_con_lot_bio_sr: "",
        rep_con_fec_cad_sr: "",
      },
      row11: {
        rep_inf_sal_ant_dift: 0,
        rep_inf_ing_ban_vac_dift: 0,
        rep_inf_ing_con_fis_dift: 0,
        rep_inf_ing_rec_otr_dift: 0,
        rep_inf_ing_tot_ing_dift: 0,
        rep_inf_tot_dis_dift: 0,
        rep_inf_egr_apl_mes_dift: 0,
        rep_inf_egr_per_vac_abi_dift: 0,
        rep_inf_egr_per_vac_noa_dift: 0,
        rep_inf_egr_tra_otr_dift: 0,
        rep_inf_egr_dev_ban_dift: 0,
        rep_inf_egr_tot_dos_dift: 0,
        rep_inf_sal_mes_dift: 0,
        rep_sol_nec_mes_dift: 0,
        rep_sol_sol_mes_dift: 0,
        rep_con_lot_bio_dift: "",
        rep_con_fec_cad_dift: "",
      },
      row12: {
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
      row13: {
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
      row14: {
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
      row15: {
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
      row16: {
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
      row17: {
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
      row18: {
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
      row19: {
        rep_inf_sal_ant_sino: 0,
        rep_inf_ing_ban_vac_sino: 0,
        rep_inf_ing_con_fis_sino: 0,
        rep_inf_ing_rec_otr_sino: 0,
        rep_inf_ing_tot_ing_sino: 0,
        rep_inf_tot_dis_sino: 0,
        rep_inf_egr_apl_mes_sino: 0,
        rep_inf_egr_per_vac_abi_sino: 0,
        rep_inf_egr_per_vac_noa_sino: 0,
        rep_inf_egr_tra_otr_sino: 0,
        rep_inf_egr_dev_ban_sino: 0,
        rep_inf_egr_tot_dos_sino: 0,
        rep_inf_sal_mes_sino: 0,
        rep_sol_nec_mes_sino: 0,
        rep_sol_sol_mes_sino: 0,
        rep_con_lot_bio_sino: "",
        rep_con_fec_cad_sino: "",
      },
      row20: {
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
      row21: {
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
      row22: {
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
      row23: {
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
      row24: {
        rep_inf_sal_ant_vacvphcam: 0,
        rep_inf_ing_ban_vac_vacvphcam: 0,
        rep_inf_ing_con_fis_vacvphcam: 0,
        rep_inf_ing_rec_otr_vacvphcam: 0,
        rep_inf_ing_tot_ing_vacvphcam: 0,
        rep_inf_tot_dis_vacvphcam: 0,
        rep_inf_egr_apl_mes_vacvphcam: 0,
        rep_inf_egr_per_vac_abi_vacvphcam: 0,
        rep_inf_egr_per_vac_noa_vacvphcam: 0,
        rep_inf_egr_tra_otr_vacvphcam: 0,
        rep_inf_egr_dev_ban_vacvphcam: 0,
        rep_inf_egr_tot_dos_vacvphcam: 0,
        rep_inf_sal_mes_vacvphcam: 0,
        rep_sol_nec_mes_vacvphcam: 0,
        rep_sol_sol_mes_vacvphcam: 0,
        rep_con_lot_bio_vacvphcam: "",
        rep_con_fec_cad_vacvphcam: "",
      },
      row25: {
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
      row26: {
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
      row27: {
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
      row28: {
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
  };

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
                      onChange={dataDesperdicioMes}
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
                  <td>
                    <button
                      type="button"
                      id="btnLimpiar"
                      name="btnLimpiar"
                      className={buttonStyleSecundario}
                      onClick={limpiarVariables}
                    >
                      Limpiar
                    </button>
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
