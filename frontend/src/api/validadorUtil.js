import { toast } from "react-hot-toast";

export const validarDato = (e, formData, setFormData, error, setError) => {
  const { name, value } = e.target;
  let formattedValue = value;

  if (e.target.type === "text") {
    formattedValue = value.toUpperCase().replace(/\s{2,}/g, " ");
  } else if (e.target.type === "number") {
    formattedValue = value.replace(/[^0-9]/g, "");
  } else if (e.target.type === "date") {
    formattedValue = !isNaN(new Date(value).getTime());
  } else if (e.target.type === "password") {
    formattedValue = value.replace(/\s/g, "");
  } else if (e.target.type === "email") {
    formattedValue = value.toLowerCase();
  }

  setFormData({
    ...formData,
    [name]: formattedValue,
  });
};

export const validarEmail = (email, setError) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError((prevError) => ({
      ...prevError,
      email: "Correo electrónico no válido",
    }));
    toast.error("Correo electrónico no válido", {
      position: "bottom-right",
    });
  } else {
    setError((prevError) => {
      const { email, ...rest } = prevError;
      return rest;
    });
  }
};

const validarNoIdentificado = (username) => {
  if (username.length !== 17) {
    toast.error(
      "El campo 'NO IDENTIFICADO' debe tener exactamente 17 caracteres.",
      {
        position: "bottom-right",
      }
    );
    return false;
  }

  const letras = username.substring(0, 6);
  const codigoProvincia = parseInt(username.substring(6, 8), 10);
  const anio = parseInt(username.substring(8, 12), 10);
  const mes = parseInt(username.substring(12, 14), 10);
  const dia = parseInt(username.substring(14, 16), 10);
  const ultimoDigito = parseInt(username.charAt(16), 10);
  const digitoOnce = parseInt(username.charAt(10), 10);

  const letrasRegex = /^[A-Z]{6}$/;
  if (!letrasRegex.test(letras)) {
    toast.error(
      "Los primeros 6 caracteres deben ser letras mayúsculas sin tildes.",
      {
        position: "bottom-right",
      }
    );
    return false;
  }

  if (
    (codigoProvincia < 1 || codigoProvincia > 24) &&
    codigoProvincia !== 30 &&
    codigoProvincia !== 99
  ) {
    toast.error("El código de provincia o pais es inválido.", {
      position: "bottom-right",
    });
    return false;
  }

  if (anio < 1900 || anio > new Date().getFullYear()) {
    toast.error("El año es inválido.", {
      position: "bottom-right",
    });
    return false;
  }

  if (mes < 1 || mes > 12) {
    toast.error("El mes es inválido.", {
      position: "bottom-right",
    });
    return false;
  }

  if (dia < 1 || dia > 31) {
    toast.error("El día es inválido.", {
      position: "bottom-right",
    });
    return false;
  }

  if (ultimoDigito !== digitoOnce) {
    toast.error(
      "El No Identificador es Invalido revisar la decada de nacimiento!.",
      {
        position: "bottom-right",
      }
    );
    return false;
  }

  return true;
};

const validarCedula = (username) => {
  if (username.length !== 10) {
    toast.error("La cédula debe tener exactamente 10 dígitos.", {
      position: "bottom-right",
    });
    return false;
  }

  const provincia = parseInt(username.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    toast.error("El código de provincia es inválido.", {
      position: "bottom-right",
    });
    return false;
  }

  const digits = username.split("").map(Number);
  const verifier = digits.pop();

  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let value = digits[i];
    if (i % 2 === 0) {
      value *= 2;
      if (value >= 10) {
        value -= 9;
      }
    }
    sum += value;
  }

  const calculatedVerifier = (10 - (sum % 10)) % 10;
  if (calculatedVerifier !== verifier) {
    toast.error("El Identificador no corresponde a una Cedula Valida!", {
      position: "bottom-right",
    });
    return false;
  }

  return true;
};

const validarPasaporte = (username) => {
  if (username.length < 7 || username.length > 15) {
    toast.error("El pasaporte debe tener entre 7 y 15 caracteres.", {
      position: "bottom-right",
    });
    return false;
  }

  const pasaporteRegex = /^[a-zA-Z0-9]+$/;
  if (!pasaporteRegex.test(username)) {
    toast.error("El pasaporte debe ser alfanumérico.", {
      position: "bottom-right",
    });
    return false;
  }

  return true;
};

const validarVisa = (username) => {
  if (username.length < 7 || username.length > 20) {
    toast.error("La visa debe tener entre 7 y 20 caracteres.", {
      position: "bottom-right",
    });
    return false;
  }

  const visaRegex = /^[a-zA-Z0-9]+$/;
  if (!visaRegex.test(username)) {
    toast.error("La visa debe ser alfanumérica.", {
      position: "bottom-right",
    });
    return false;
  }

  const visaPrefixRegex = /^(V|VE)/;
  if (!visaPrefixRegex.test(username)) {
    toast.error("La visa debe comenzar con 'V' o 'VE'.", {
      position: "bottom-right",
    });
    return false;
  }

  return true;
};

const validarCarnetRefugiado = (username) => {
  if (username.length < 8 || username.length > 12) {
    toast.error("El carné de refugiado debe tener entre 8 y 12 caracteres.", {
      position: "bottom-right",
    });
    return false;
  }

  const carnetRefugiadoRegex = /^[a-zA-Z0-9]+$/;
  if (!carnetRefugiadoRegex.test(username)) {
    toast.error("El carné de refugiado debe ser alfanumérico.", {
      position: "bottom-right",
    });
    return false;
  }

  const carnetRefugiadoPrefixRegex = /^(R|RF)/;
  if (!carnetRefugiadoPrefixRegex.test(username)) {
    toast.error("El carné de refugiado debe comenzar con 'R' o 'RF'.", {
      position: "bottom-right",
    });
    return false;
  }

  return true;
};

export const validarIdentificacion = (fun_tipo_iden, username) => {
  switch (fun_tipo_iden) {
    case "NO IDENTIFICADO":
      return validarNoIdentificado(username);
    case "CÉDULA DE IDENTIDAD":
      return validarCedula(username);
    case "PASAPORTE":
      return validarPasaporte(username);
    case "VISA":
      return validarVisa(username);
    case "CARNÉT DE REFUGIADO":
      return validarCarnetRefugiado(username);
    default:
      return false;
  }
};

const sumarCampos = (formData, campos) =>
  campos.reduce((total, campo) => total + Number(formData[campo] || 0), 0);

const mensajesError = {
  errCero: "El registro diario no debe guardarse en cero!",
  errIntExtSexResNacEtn:
    "El registro de INTRA-EXTRA, SEXO, RESIDENCIA, NACIONALIDAD, ETNICA tienen que ser iguales!",
  errNacOtr:
    "Si lleno en nacionalidad a extranjeros tiene que ser igual a OTRO en autoidentificacion!",
  errInd:
    "Si lleno el campo de INDIGENA tiene que ser Igual a NACIONALIDAD ETNICA!",
  errKic: "Si lleno el campo de KICHWA tiene que ser Igual a PUEBLOS!",
  errVacApl:
    "El registro de Vacunado tiene que ser igual a las Vacunas aplicadas!",
  messRegVac: "Registro guardado con éxito!",
};

export const validarRegistroTemprano = (formData) => {
  const camposTotalIntExt = [
    "tem_intr",
    "tem_extr_mies_cnh",
    "tem_extr_mies_cibv",
    "tem_extr_mine_egen",
    "tem_extr_mine_bach",
    "tem_extr_visi",
    "tem_extr_aten",
    "tem_otro",
  ];

  const camposTotalSex = ["tem_sexo_homb", "tem_sexo_muje"];
  const camposTotalLugPer = ["tem_luga_pert", "tem_luga_nope"];
  const camposTotalNac = [
    "tem_naci_ecua",
    "tem_naci_colo",
    "tem_naci_peru",
    "tem_naci_cuba",
    "tem_naci_vene",
    "tem_naci_otro",
  ];
  const camposTotalNacOtr = [
    "tem_naci_colo",
    "tem_naci_peru",
    "tem_naci_cuba",
    "tem_naci_vene",
    "tem_naci_otro",
  ];
  const camposTotalAut = [
    "tem_auto_indi",
    "tem_auto_afro",
    "tem_auto_negr",
    "tem_auto_mula",
    "tem_auto_mont",
    "tem_auto_mest",
    "tem_auto_blan",
    "tem_auto_otro",
  ];
  const camposTotalNacIndi = [
    "tem_naci_achu",
    "tem_naci_ando",
    "tem_naci_awa",
    "tem_naci_chac",
    "tem_naci_cofa",
    "tem_naci_eper",
    "tem_naci_huan",
    "tem_naci_kich",
    "tem_naci_mant",
    "tem_naci_seco",
    "tem_naci_shiw",
    "tem_naci_shua",
    "tem_naci_sion",
    "tem_naci_tsac",
    "tem_naci_waor",
    "tem_naci_zapa",
  ];
  const camposTotalPue = [
    "tem_pueb_chib",
    "tem_pueb_kana",
    "tem_pueb_kara",
    "tem_pueb_kaya",
    "tem_pueb_kich",
    "tem_pueb_kisa",
    "tem_pueb_kitu",
    "tem_pueb_nata",
    "tem_pueb_otav",
    "tem_pueb_palt",
    "tem_pueb_panz",
    "tem_pueb_past",
    "tem_pueb_puru",
    "tem_pueb_sala",
    "tem_pueb_sara",
    "tem_pueb_toma",
    "tem_pueb_wara",
  ];
  const camposVacunas = [
    "tem_men1_dosi_bcgp",
    "tem_men1_dosi_bcgd",
    "tem_men1_dosi_hbpr",
    "tem_men1_1rad_rota",
    "tem_men1_2dad_rota",
    "tem_men1_1rad_fipv",
    "tem_men1_2dad_fipv",
    "tem_men1_1rad_neum",
    "tem_men1_2dad_neum",
    "tem_men1_3rad_neum",
    "tem_men1_1rad_pent",
    "tem_men1_2dad_pent",
    "tem_men1_3rad_pent",
    "tem_men1_3rad_bopv",
    "tem_12a23m_4tad_bopv",
    "tem_5ano_5tad_bopv",
    "tem_12a23m_1rad_srp",
    "tem_12a23m_2dad_srp",
    "tem_12a23m_dosi_fa",
    "tem_12a23m_dosi_vari",
    "tem_12a23m_4tad_dpt",
    "tem_5ano_5tad_dpt",
    "tem_9ano_1rad_hpv",
    "tem_9ano_2dad_hpv",
    "tem_10an_2dad_hpv",
    "tem_15an_terc_dtad",
  ];

  // Cálculo de totales
  const totalIntExt = sumarCampos(formData, camposTotalIntExt);
  const totalSex = sumarCampos(formData, camposTotalSex);
  const totalLugPer = sumarCampos(formData, camposTotalLugPer);
  const totalNac = sumarCampos(formData, camposTotalNac);
  const totalNacOtr = sumarCampos(formData, camposTotalNacOtr);
  const totalAut = sumarCampos(formData, camposTotalAut);
  const totalNacIndi = sumarCampos(formData, camposTotalNacIndi);
  const totalPue = sumarCampos(formData, camposTotalPue);
  const totalVacunas = sumarCampos(formData, camposVacunas);

  const totalPersonas =
    totalIntExt +
    totalSex +
    totalLugPer +
    totalNac +
    totalAut +
    totalNacIndi +
    totalPue;

  if (totalPersonas + totalVacunas < 1 || formData.tem_fech === "") {
    return { success: false, error: mensajesError.errCero };
  }

  if (
    !validarTotalesIguales([
      totalIntExt,
      totalSex,
      totalLugPer,
      totalNac,
      totalAut,
    ])
  ) {
    return { success: false, error: mensajesError.errIntExtSexResNacEtn };
  }

  if (totalNacOtr !== Number(formData.tem_auto_otro)) {
    return { success: false, error: mensajesError.errNacOtr };
  }

  if (Number(formData.tem_auto_indi) !== totalNacIndi) {
    return { success: false, error: mensajesError.errInd };
  }

  if (Number(formData.tem_naci_kich) !== totalPue) {
    return { success: false, error: mensajesError.errKic };
  }

  if (!validarVacunas(formData, totalSex, totalVacunas)) {
    return { success: false, error: mensajesError.errVacApl };
  }

  return { success: true, message: mensajesError.messRegVac };
};

const validarTotalesIguales = (totales) => {
  return totales.every((total) => total === totales[0]);
};

const validarVacunas = (formData, totalSex, totalVacunas) => {
  const vacunasIndividuales = [
    sumarCampos(formData, ["tem_men1_dosi_bcgp", "tem_men1_dosi_bcgd"]),
    Number(formData.tem_men1_dosi_hbpr),
    sumarCampos(formData, ["tem_men1_1rad_rota", "tem_men1_2dad_rota"]),
    sumarCampos(formData, ["tem_men1_1rad_fipv", "tem_men1_2dad_fipv"]),
    sumarCampos(formData, [
      "tem_men1_1rad_neum",
      "tem_men1_2dad_neum",
      "tem_men1_3rad_neum",
    ]),
    sumarCampos(formData, [
      "tem_men1_1rad_pent",
      "tem_men1_2dad_pent",
      "tem_men1_3rad_pent",
    ]),
    sumarCampos(formData, [
      "tem_men1_3rad_bopv",
      "tem_12a23m_4tad_bopv",
      "tem_5ano_5tad_bopv",
    ]),
    sumarCampos(formData, ["tem_12a23m_1rad_srp", "tem_12a23m_2dad_srp"]),
    Number(formData.tem_12a23m_dosi_fa),
    Number(formData.tem_12a23m_dosi_vari),
    sumarCampos(formData, ["tem_12a23m_4tad_dpt", "tem_5ano_5tad_dpt"]),
    sumarCampos(formData, [
      "tem_9ano_1rad_hpv",
      "tem_9ano_2dad_hpv",
      "tem_10an_2dad_hpv",
    ]),
    Number(formData.tem_15an_terc_dtad),
  ];

  if (totalSex > totalVacunas) {
    return false;
  }

  return vacunasIndividuales.every((vacuna) => totalSex >= vacuna);
};

export const validarRegistroTardio = (formData) => {
  const camposTotalIntExt = [
    "tar_intr",
    "tar_extr_mies_cnh",
    "tar_extr_mies_cibv",
    "tar_extr_mine_egen",
    "tar_extr_mine_bach",
    "tar_extr_visi",
    "tar_extr_aten",
    "tar_otro",
  ];

  const camposTotalSex = ["tar_sexo_homb", "tar_sexo_muje"];
  const camposTotalLugPer = ["tar_luga_pert", "tar_luga_nope"];
  const camposTotalNac = [
    "tar_naci_ecua",
    "tar_naci_colo",
    "tar_naci_peru",
    "tar_naci_cuba",
    "tar_naci_vene",
    "tar_naci_otro",
  ];
  const camposTotalNacOtr = [
    "tar_naci_colo",
    "tar_naci_peru",
    "tar_naci_cuba",
    "tar_naci_vene",
    "tar_naci_otro",
  ];
  const camposTotalAut = [
    "tar_auto_indi",
    "tar_auto_afro",
    "tar_auto_negr",
    "tar_auto_mula",
    "tar_auto_mont",
    "tar_auto_mest",
    "tar_auto_blan",
    "tar_auto_otro",
  ];
  const camposTotalNacIndi = [
    "tar_naci_achu",
    "tar_naci_ando",
    "tar_naci_awa",
    "tar_naci_chac",
    "tar_naci_cofa",
    "tar_naci_eper",
    "tar_naci_huan",
    "tar_naci_kich",
    "tar_naci_mant",
    "tar_naci_seco",
    "tar_naci_shiw",
    "tar_naci_shua",
    "tar_naci_sion",
    "tar_naci_tsac",
    "tar_naci_waor",
    "tar_naci_zapa",
  ];
  const camposTotalPue = [
    "tar_pueb_chib",
    "tar_pueb_kana",
    "tar_pueb_kara",
    "tar_pueb_kaya",
    "tar_pueb_kich",
    "tar_pueb_kisa",
    "tar_pueb_kitu",
    "tar_pueb_nata",
    "tar_pueb_otav",
    "tar_pueb_palt",
    "tar_pueb_panz",
    "tar_pueb_past",
    "tar_pueb_puru",
    "tar_pueb_sala",
    "tar_pueb_sara",
    "tar_pueb_toma",
    "tar_pueb_wara",
  ];
  const camposVacunas = [
    "tar_1ano_1rad_fipv",
    "tar_1ano_1rad_hbpe",
    "tar_1ano_1rad_dpt",
    "tar_1ano_2dad_fipv",
    "tar_1ano_2dad_hbpe",
    "tar_1ano_2dad_dpt",
    "tar_1ano_3rad_bopv",
    "tar_1ano_3rad_hbpe",
    "tar_1ano_3rad_dpt",
    "tar_2ano_1rad_fipv",
    "tar_2ano_1rad_srp",
    "tar_2ano_1rad_hbpe",
    "tar_2ano_1rad_dpt",
    "tar_2ano_2dad_fipv",
    "tar_2ano_2dad_srp",
    "tar_2ano_2dad_hbpe",
    "tar_2ano_2dad_dpt",
    "tar_2ano_3rad_bopv",
    "tar_2ano_3rad_hbpe",
    "tar_2ano_3rad_dpt",
    "tar_2ano_4tad_bopv",
    "tar_2ano_4tad_dpt",
    "tar_2ano_dosi_fa",
    "tar_3ano_1rad_fipv",
    "tar_3ano_1rad_srp",
    "tar_3ano_1rad_hbpe",
    "tar_3ano_1rad_dpt",
    "tar_3ano_2dad_fipv",
    "tar_3ano_2dad_srp",
    "tar_3ano_2dad_hbpe",
    "tar_3ano_2dad_dpt",
    "tar_3ano_3rad_bopv",
    "tar_3ano_3rad_hbpe",
    "tar_3ano_3rad_dpt",
    "tar_3ano_4tad_bopv",
    "tar_3ano_4tad_dpt",
    "tar_3ano_dosi_fa",
    "tar_4ano_1rad_fipv",
    "tar_4ano_1rad_srp",
    "tar_4ano_1rad_hbpe",
    "tar_4ano_1rad_dpt",
    "tar_4ano_2dad_fipv",
    "tar_4ano_2dad_srp",
    "tar_4ano_2dad_hbpe",
    "tar_4ano_2dad_dpt",
    "tar_4ano_3rad_bopv",
    "tar_4ano_3rad_hbpe",
    "tar_4ano_3rad_dpt",
    "tar_4ano_4tad_bopv",
    "tar_4ano_4tad_dpt",
    "tar_4ano_dosi_fa",
    "tar_5ano_1rad_ipv",
    "tar_5ano_1rad_srp",
    "tar_5ano_1rad_hbpe",
    "tar_5ano_1rad_dpt",
    "tar_5ano_2dad_fipv",
    "tar_5ano_2dad_srp",
    "tar_5ano_2dad_hbpe",
    "tar_5ano_2dad_dpt",
    "tar_5ano_3rad_bopv",
    "tar_5ano_3rad_hbpe",
    "tar_5ano_3rad_dpt",
    "tar_5ano_4tad_bopv",
    "tar_5ano_4tad_dpt",
    "tar_5ano_dosi_fa",
    "tar_6ano_1rad_srp",
    "tar_6ano_2dad_srp",
    "tar_6ano_dosi_fa",
    "tar_7ano_1rad_sr",
    "tar_7ano_2dad_sr",
    "tar_7ano_dosi_fa",
    "tar_8ano_dosi_fa",
    "tar_7a14_dosi_dtad",
    "tar_9a14_dosi_fa",
    "tar_15a19_dosi_fa",
    "tar_20a59_dosi_fa",
    "tar_8a14_1rad_sr",
    "tar_8a14_2dad_sr",
    "tar_15a29_1rad_sr",
    "tar_15a29_2dad_sr",
    "tar_30a50_1rad_sr",
    "tar_30a50_2dad_sr",
    "tar_16a49mefne_dtad_prim",
    "tar_16a49mefne_dtad_segu",
    "tar_16a49mefne_dtad_terc",
    "tar_16a49mefne_dtad_cuar",
    "tar_16a49mefne_dtad_quin",
    "tar_mefe_dtad_prim",
    "tar_mefe_dtad_segu",
    "tar_mefe_dtad_terc",
    "tar_mefe_dtad_cuar",
    "tar_mefe_dtad_quin",
    "tar_16a49_dtad_prim",
    "tar_16a49_dtad_segu",
    "tar_16a49_dtad_terc",
    "tar_16a49_dtad_cuar",
    "tar_16a49_dtad_quin",
    "tar_hepa_trasal_prim",
    "tar_hepa_trasal_segu",
    "tar_hepa_trasal_terc",
    "tar_hepa_estsal_prim",
    "tar_hepa_estsal_segu",
    "tar_hepa_estsal_terc",
    "tar_hepa_trasex_prim",
    "tar_hepa_trasex_segu",
    "tar_hepa_trasex_terc",
    "tar_hepa_pervih_prim",
    "tar_hepa_pervih_segu",
    "tar_hepa_pervih_terc",
    "tar_hepa_perppl_prim",
    "tar_hepa_perppl_segu",
    "tar_hepa_perppl_terc",
    "tar_hepa_otro_prim",
    "tar_hepa_otro_segu",
    "tar_hepa_otro_terc",
    "tar_inmant",
    "tar_inmanthep",
    "tar_inmantrra",
  ];

  // Cálculo de totales
  const totalIntExt = sumarCampos(formData, camposTotalIntExt);
  const totalSex = sumarCampos(formData, camposTotalSex);
  const totalLugPer = sumarCampos(formData, camposTotalLugPer);
  const totalNac = sumarCampos(formData, camposTotalNac);
  const totalNacOtr = sumarCampos(formData, camposTotalNacOtr);
  const totalAut = sumarCampos(formData, camposTotalAut);
  const totalNacIndi = sumarCampos(formData, camposTotalNacIndi);
  const totalPue = sumarCampos(formData, camposTotalPue);
  const totalVacunas = sumarCampos(formData, camposVacunas);

  const totalPersonas =
    totalIntExt +
    totalSex +
    totalLugPer +
    totalNac +
    totalAut +
    totalNacIndi +
    totalPue;

  if (totalPersonas + totalVacunas < 1 || formData.tar_fech === "") {
    return { success: false, error: mensajesError.errCero };
  }

  if (
    !validarTotalesIgualesTar([
      totalIntExt,
      totalSex,
      totalLugPer,
      totalNac,
      totalAut,
    ])
  ) {
    return { success: false, error: mensajesError.errIntExtSexResNacEtn };
  }

  if (totalNacOtr !== Number(formData.tar_auto_otro)) {
    return { success: false, error: mensajesError.errNacOtr };
  }

  if (Number(formData.tar_auto_indi) !== totalNacIndi) {
    return { success: false, error: mensajesError.errInd };
  }

  if (Number(formData.tar_naci_kich) !== totalPue) {
    return { success: false, error: mensajesError.errKic };
  }

  if (!validarVacunasTar(formData, totalSex, totalVacunas)) {
    return { success: false, error: mensajesError.errVacApl };
  }

  return { success: true, message: mensajesError.messRegVac };
};

const validarTotalesIgualesTar = (totales) => {
  return totales.every((total) => total === totales[0]);
};

const validarVacunasTar = (formData, totalSex, totalVacunas) => {
  const vacunasIndividuales = [
    sumarCampos(formData, [
      "tar_1ano_1rad_hbpe",
      "tar_1ano_2dad_hbpe",
      "tar_1ano_3rad_hbpe",
      "tar_2ano_1rad_hbpe",
      "tar_2ano_2dad_hbpe",
      "tar_2ano_3rad_hbpe",
      "tar_3ano_1rad_hbpe",
      "tar_3ano_2dad_hbpe",
      "tar_3ano_3rad_hbpe",
      "tar_4ano_1rad_hbpe",
      "tar_4ano_2dad_hbpe",
      "tar_4ano_3rad_hbpe",
      "tar_5ano_1rad_hbpe",
      "tar_5ano_2dad_hbpe",
      "tar_5ano_3rad_hbpe",
    ]),
    sumarCampos(formData, [
      "tar_1ano_1rad_fipv",
      "tar_1ano_2dad_fipv",
      "tar_2ano_1rad_fipv",
      "tar_2ano_2dad_fipv",
      "tar_3ano_1rad_fipv",
      "tar_3ano_2dad_fipv",
      "tar_4ano_1rad_fipv",
      "tar_4ano_2dad_fipv",
      "tar_5ano_1rad_ipv",
      "tar_5ano_2dad_fipv",
    ]),
    sumarCampos(formData, [
      "tar_1ano_3rad_bopv",
      "tar_2ano_3rad_bopv",
      "tar_2ano_4tad_bopv",
      "tar_3ano_3rad_bopv",
      "tar_3ano_4tad_bopv",
      "tar_4ano_3rad_bopv",
      "tar_4ano_4tad_bopv",
      "tar_5ano_3rad_bopv",
      "tar_5ano_4tad_bopv",
    ]),
    sumarCampos(formData, [
      "tar_7ano_1rad_sr",
      "tar_7ano_2dad_sr",
      "tar_8a14_1rad_sr",
      "tar_8a14_2dad_sr",
      "tar_15a29_1rad_sr",
      "tar_15a29_2dad_sr",
      "tar_30a50_1rad_sr",
      "tar_30a50_2dad_sr",
    ]),
    sumarCampos(formData, [
      "tar_2ano_1rad_srp",
      "tar_2ano_2dad_srp",
      "tar_3ano_1rad_srp",
      "tar_3ano_2dad_srp",
      "tar_4ano_1rad_srp",
      "tar_4ano_2dad_srp",
      "tar_5ano_1rad_srp",
      "tar_5ano_2dad_srp",
      "tar_6ano_1rad_srp",
      "tar_6ano_2dad_srp",
    ]),
    sumarCampos(formData, [
      "tar_2ano_dosi_fa",
      "tar_3ano_dosi_fa",
      "tar_4ano_dosi_fa",
      "tar_5ano_dosi_fa",
      "tar_6ano_dosi_fa",
      "tar_7ano_dosi_fa",
      "tar_8ano_dosi_fa",
      "tar_9a14_dosi_fa",
      "tar_15a19_dosi_fa",
      "tar_20a59_dosi_fa",
    ]),
    sumarCampos(formData, [
      "tar_1ano_1rad_dpt",
      "tar_1ano_2dad_dpt",
      "tar_1ano_3rad_dpt",
      "tar_2ano_1rad_dpt",
      "tar_2ano_2dad_dpt",
      "tar_2ano_3rad_dpt",
      "tar_2ano_4tad_dpt",
      "tar_3ano_1rad_dpt",
      "tar_3ano_2dad_dpt",
      "tar_3ano_3rad_dpt",
      "tar_3ano_4tad_dpt",
      "tar_4ano_1rad_dpt",
      "tar_4ano_2dad_dpt",
      "tar_4ano_3rad_dpt",
      "tar_4ano_4tad_dpt",
      "tar_5ano_1rad_dpt",
      "tar_5ano_2dad_dpt",
      "tar_5ano_3rad_dpt",
      "tar_5ano_4tad_dpt",
    ]),
    sumarCampos(formData, [
      "tar_7a14_dosi_dtad",
      "tar_16a49mefne_dtad_prim",
      "tar_16a49mefne_dtad_segu",
      "tar_16a49mefne_dtad_terc",
      "tar_16a49mefne_dtad_cuar",
      "tar_16a49mefne_dtad_quin",
      "tar_mefe_dtad_prim",
      "tar_mefe_dtad_segu",
      "tar_mefe_dtad_terc",
      "tar_mefe_dtad_cuar",
      "tar_mefe_dtad_quin",
      "tar_16a49_dtad_prim",
      "tar_16a49_dtad_segu",
      "tar_16a49_dtad_terc",
      "tar_16a49_dtad_cuar",
      "tar_16a49_dtad_quin",
    ]),
    sumarCampos(formData, [
      "tar_hepa_trasal_prim",
      "tar_hepa_trasal_segu",
      "tar_hepa_trasal_terc",
      "tar_hepa_estsal_prim",
      "tar_hepa_estsal_segu",
      "tar_hepa_estsal_terc",
      "tar_hepa_trasex_prim",
      "tar_hepa_trasex_segu",
      "tar_hepa_trasex_terc",
      "tar_hepa_pervih_prim",
      "tar_hepa_pervih_segu",
      "tar_hepa_pervih_terc",
      "tar_hepa_perppl_prim",
      "tar_hepa_perppl_segu",
      "tar_hepa_perppl_terc",
      "tar_hepa_otro_prim",
      "tar_hepa_otro_segu",
      "tar_hepa_otro_terc",
    ]),
    Number(formData.tar_inmant),
    Number(formData.tar_inmanthep),
    Number(formData.tar_inmantrra),
  ];

  if (totalSex > totalVacunas) {
    return false;
  }

  return vacunasIndividuales.every((vacuna) => totalSex >= vacuna);
};

export const validarRegistroDesperdicio = (formData) => {
  const camposVacunas = [
    "des_bcg_pervacenfabi",
    "des_bcg_pervacfrasnoabi",
    "des_hbpe_pervacenfabi",
    "des_hbpe_pervacfrasnoabi",
    "des_rota_pervacenfabi",
    "des_rota_pervacfrasnoabi",
    "des_pent_pervacenfabi",
    "des_pent_pervacfrasnoabi",
    "des_fipv_pervacenfabi",
    "des_fipv_pervacfrasnoabi",
    "des_anti_pervacenfabi",
    "des_anti_pervacfrasnoabi",
    "des_neum_pervacenfabi",
    "des_neum_pervacfrasnoabi",
    "des_sr_pervacenfabi",
    "des_sr_pervacfrasnoabi",
    "des_srp_pervacenfabi",
    "des_srp_pervacfrasnoabi",
    "des_vari_pervacenfabi",
    "des_vari_pervacfrasnoabi",
    "des_fieb_pervacenfabi",
    "des_fieb_pervacfrasnoabi",
    "des_dift_pervacenfabi",
    "des_dift_pervacfrasnoabi",
    "des_hpv_pervacenfabi",
    "des_hpv_pervacfrasnoabi",
    "des_dtad_pervacenfabi",
    "des_dtad_pervacfrasnoabi",
    "des_hepa_pervacenfabi",
    "des_hepa_pervacfrasnoabi",
    "des_inmant_pervacenfabi",
    "des_inmant_pervacfrasnoabi",
    "des_inmanthepb_pervacenfabi",
    "des_inmanthepb_pervacfrasnoabi",
    "des_inmantrra_pervacenfabi",
    "des_inmantrra_pervacfrasnoabi",
    "des_infped_pervacenfabi",
    "des_infped_pervacfrasnoabi",
    "des_infadu_pervacenfabi",
    "des_infadu_pervacfrasnoabi",
    "des_viru_pervacenfabi",
    "des_viru_pervacfrasnoabi",
    "des_vacsin_pervacenfabi",
    "des_vacsin_pervacfrasnoabi",
    "des_vacpfi_pervacenfabi",
    "des_vacpfi_pervacfrasnoabi",
    "des_vacmod_pervacenfabi",
    "des_vacmod_pervacfrasnoabi",
    "des_vacvphcam_pervacenfabi",
    "des_vacvphcam_pervacfrasnoabi",
  ];

  const totalVacunas = sumarCampos(formData, camposVacunas);

  if (totalVacunas < 1 || formData.des_fech === "") {
    return { success: false, error: mensajesError.errCero };
  }
  return { success: true, message: mensajesError.messRegVac };
};
