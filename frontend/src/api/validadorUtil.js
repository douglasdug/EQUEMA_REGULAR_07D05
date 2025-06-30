export const validarDato = (
  e,
  formData,
  setFormData,
  error,
  setError,
  setBotonEstado
) => {
  const { name, value, type } = e.target;
  let formattedValue = value;

  if (type === "text") {
    formattedValue = value.toUpperCase().replace(/\s{2,}/g, " ");
  } else if (type === "number") {
    formattedValue = value.replace(/[^0-9]/g, "");
  } else if (type === "date") {
    formattedValue = !isNaN(new Date(value).getTime());
  } else if (type === "password") {
    formattedValue = value.replace(/\s/g, "");
  } else if (type === "email") {
    formattedValue = value.toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formattedValue) {
      setError("");
      setBotonEstado((prev) => ({ ...prev, btnRegistrar: true }));
    } else if (!emailRegex.test(formattedValue)) {
      setError("Correo electrónico no válido");
      setBotonEstado((prev) => ({ ...prev, btnRegistrar: true }));
      return;
    } else {
      setError("");
      setBotonEstado((prev) => ({ ...prev, btnRegistrar: false }));
    }
  } else if (type === "tel") {
    formattedValue = value.replace(/[^0-9]/g, ""); // Solo números
    if (name === "adm_dato_pers_tele") {
      // Teléfono convencional: 9 dígitos, empieza 02-07
      if (!formattedValue) {
        setError("");
        setBotonEstado((prev) => ({ ...prev, btnRegistrar: true }));
      } else if (!/^(0[2-7])[0-9]{7}$/.test(formattedValue)) {
        setError(
          "El teléfono debe tener 9 dígitos y comenzar con un código de área válido (02 a 07)"
        );
        setBotonEstado((prev) => ({ ...prev, btnRegistrar: true }));
      } else {
        setError("");
        setBotonEstado((prev) => ({ ...prev, btnRegistrar: false }));
      }
      setFormData({
        ...formData,
        [name]: formattedValue,
      });
      return;
    } else {
      // Celular: 10 dígitos, empieza 09
      if (!formattedValue) {
        setError("");
        setBotonEstado((prev) => ({ ...prev, btnRegistrar: true }));
      } else if (!/^09\d{8}$/.test(formattedValue)) {
        setError("El número de celular debe empezar con 09 y tener 10 dígitos");
        setBotonEstado((prev) => ({ ...prev, btnRegistrar: true }));
      } else {
        setError("");
        setBotonEstado((prev) => ({ ...prev, btnRegistrar: false }));
      }
      setFormData({
        ...formData,
        [name]: formattedValue,
      });
      return;
    }
  }

  setFormData({
    ...formData,
    [name]: formattedValue,
  });
};

const validarNoIdentificado = (username) => {
  if (username.length !== 17) {
    return {
      valido: false,
      mensaje:
        "El campo 'NO IDENTIFICADO' debe tener exactamente 17 caracteres.",
    };
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
    return {
      valido: false,
      mensaje:
        "Los primeros 6 caracteres deben ser letras mayúsculas sin tildes.",
    };
  }

  if (
    (codigoProvincia < 1 || codigoProvincia > 24) &&
    codigoProvincia !== 30 &&
    codigoProvincia !== 99
  ) {
    return {
      valido: false,
      mensaje: "El código de provincia o pais es inválido.",
    };
  }

  if (anio < 1900 || anio > new Date().getFullYear()) {
    return {
      valido: false,
      mensaje: "El año es inválido.",
    };
  }

  if (mes < 1 || mes > 12) {
    return {
      valido: false,
      mensaje: "El mes es inválido.",
    };
  }

  if (dia < 1 || dia > 31) {
    return {
      valido: false,
      mensaje: "El día es inválido.",
    };
  }

  if (ultimoDigito !== digitoOnce) {
    return {
      valido: false,
      mensaje:
        "El No Identificador es Invalido revisar la decada de nacimiento!.",
    };
  }

  return { valido: true };
};

const validarCedula = (username) => {
  if (username.length !== 10) {
    return {
      valido: false,
      mensaje: "La cédula debe tener exactamente 10 dígitos.",
    };
  }

  const provincia = parseInt(username.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return {
      valido: false,
      mensaje: "El código de provincia es inválido.",
    };
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
    return {
      valido: false,
      mensaje: "El Identificador no corresponde a una Cedula Valida!",
    };
  }

  return { valido: true };
};

const validarPasaporte = (username) => {
  if (username.length < 7 || username.length > 15) {
    return {
      valido: false,
      mensaje: "El pasaporte debe tener entre 7 y 15 caracteres.",
    };
  }

  const pasaporteRegex = /^[a-zA-Z0-9]+$/;
  if (!pasaporteRegex.test(username)) {
    return {
      valido: false,
      mensaje: "El pasaporte debe ser alfanumérico.",
    };
  }

  return { valido: true };
};

const validarVisa = (username) => {
  if (username.length < 7 || username.length > 20) {
    return {
      valido: false,
      mensaje: "La visa debe tener entre 7 y 20 caracteres.",
    };
  }

  const visaRegex = /^[a-zA-Z0-9]+$/;
  if (!visaRegex.test(username)) {
    return {
      valido: false,
      mensaje: "La visa debe ser alfanumérica.",
    };
  }

  const visaPrefixRegex = /^(V|VE)/;
  if (!visaPrefixRegex.test(username)) {
    return {
      valido: false,
      mensaje: "La visa debe comenzar con 'V' o 'VE'.",
    };
  }

  return { valido: true };
};

const validarCarnetRefugiado = (username) => {
  if (username.length < 8 || username.length > 12) {
    return {
      valido: false,
      mensaje: "El carné de refugiado debe tener entre 8 y 12 caracteres.",
    };
  }

  const carnetRefugiadoRegex = /^[a-zA-Z0-9]+$/;
  if (!carnetRefugiadoRegex.test(username)) {
    return {
      valido: false,
      mensaje: "El carné de refugiado debe ser alfanumérico.",
    };
  }

  const carnetRefugiadoPrefixRegex = /^(R|RF)/;
  if (!carnetRefugiadoPrefixRegex.test(username)) {
    return {
      valido: false,
      mensaje: "El carné de refugiado debe comenzar con 'R' o 'RF'.",
    };
  }

  return { valido: true };
};

export const validarNumeroIdentificacion = (fun_tipo_iden, username) => {
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
      return { valido: false };
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

export const validarRegistroInfluenza = (formData) => {
  const camposTotalIntExt = [
    "inf_intr",
    "inf_extr_mies_cnh",
    "inf_extr_mies_cibv",
    "inf_extr_mine_egen",
    "inf_extr_mine_bach",
    "inf_extr_visi",
    "inf_extr_aten",
    "inf_otro",
  ];

  const camposTotalSex = ["inf_sexo_homb", "inf_sexo_muje"];
  const camposTotalLugPer = ["inf_luga_pert", "inf_luga_nope"];
  const camposTotalNac = [
    "inf_naci_ecua",
    "inf_naci_colo",
    "inf_naci_peru",
    "inf_naci_cuba",
    "inf_naci_vene",
    "inf_naci_otro",
  ];
  const camposTotalNacOtr = [
    "inf_naci_colo",
    "inf_naci_peru",
    "inf_naci_cuba",
    "inf_naci_vene",
    "inf_naci_otro",
  ];
  const camposTotalAut = [
    "inf_auto_indi",
    "inf_auto_afro",
    "inf_auto_negr",
    "inf_auto_mula",
    "inf_auto_mont",
    "inf_auto_mest",
    "inf_auto_blan",
    "inf_auto_otro",
  ];
  const camposTotalNacIndi = [
    "inf_naci_achu",
    "inf_naci_ando",
    "inf_naci_awa",
    "inf_naci_chac",
    "inf_naci_cofa",
    "inf_naci_eper",
    "inf_naci_huan",
    "inf_naci_kich",
    "inf_naci_mant",
    "inf_naci_seco",
    "inf_naci_shiw",
    "inf_naci_shua",
    "inf_naci_sion",
    "inf_naci_tsac",
    "inf_naci_waor",
    "inf_naci_zapa",
  ];
  const camposTotalPue = [
    "inf_pueb_chib",
    "inf_pueb_kana",
    "inf_pueb_kara",
    "inf_pueb_kaya",
    "inf_pueb_kich",
    "inf_pueb_kisa",
    "inf_pueb_kitu",
    "inf_pueb_nata",
    "inf_pueb_otav",
    "inf_pueb_palt",
    "inf_pueb_panz",
    "inf_pueb_past",
    "inf_pueb_puru",
    "inf_pueb_sala",
    "inf_pueb_sara",
    "inf_pueb_toma",
    "inf_pueb_wara",
  ];
  const camposVacunas = [
    "inf_6a11_prim",
    "inf_6a11_segu",
    "inf_1ano_dosi",
    "inf_2ano_dosi",
    "inf_3ano_dosi",
    "inf_4ano_dosi",
    "inf_5ano_dosi",
    "inf_6ano_dosi",
    "inf_7ano_dosi",
    "inf_65an_dosi",
    "inf_emba_dosi",
    "inf_8a64_dosi",
    "inf_puer_dosi",
    "inf_pers_salu_dosi",
    "inf_pers_disc_dosi",
    "inf_cuid_adul_dosi",
    "inf_pers_cuid_dosi",
    "inf_trab_avic_dosi",
    "inf_ppl_dosi",
    "inf_otro_ries_dosi",
    "inf_pobl_gene_dosi",
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

  if (totalPersonas + totalVacunas < 1 || formData.inf_fech === "") {
    return { success: false, error: mensajesError.errCero };
  }

  if (
    !validarTotalesIgualesInf([
      totalIntExt,
      totalSex,
      totalLugPer,
      totalNac,
      totalAut,
    ])
  ) {
    return { success: false, error: mensajesError.errIntExtSexResNacEtn };
  }

  if (totalNacOtr !== Number(formData.inf_auto_otro)) {
    return { success: false, error: mensajesError.errNacOtr };
  }

  if (Number(formData.inf_auto_indi) !== totalNacIndi) {
    return { success: false, error: mensajesError.errInd };
  }

  if (Number(formData.inf_naci_kich) !== totalPue) {
    return { success: false, error: mensajesError.errKic };
  }

  if (!validarVacunasInf(formData, totalSex, totalVacunas)) {
    return { success: false, error: mensajesError.errVacApl };
  }

  return { success: true, message: mensajesError.messRegVac };
};

const validarTotalesIgualesInf = (totales) => {
  return totales.every((total) => total === totales[0]);
};

const validarVacunasInf = (formData, totalSex, totalVacunas) => {
  const vacunasIndividuales = [
    sumarCampos(formData, [
      "inf_6a11_prim",
      "inf_6a11_segu",
      "inf_1ano_dosi",
      "inf_2ano_dosi",
      "inf_3ano_dosi",
      "inf_4ano_dosi",
      "inf_5ano_dosi",
      "inf_6ano_dosi",
      "inf_7ano_dosi",
      "inf_65an_dosi",
      "inf_emba_dosi",
      "inf_8a64_dosi",
      "inf_puer_dosi",
      "inf_pers_salu_dosi",
      "inf_pers_disc_dosi",
      "inf_cuid_adul_dosi",
      "inf_pers_cuid_dosi",
      "inf_trab_avic_dosi",
      "inf_ppl_dosi",
      "inf_otro_ries_dosi",
      "inf_pobl_gene_dosi",
    ]),
  ];

  if (totalSex > totalVacunas) {
    return false;
  }

  return vacunasIndividuales.every((vacuna) => totalSex >= vacuna);
};

//Calcula la suma de los campos de un formulario Reporte ENI
export const calculateTotal = (updatedRow, prevData, row, fields) => {
  return fields.reduce((total, field) => {
    return total + (updatedRow[field] ?? prevData[row][field] ?? 0);
  }, 0);
};

export const calculateDifference = (
  updatedRow,
  prevData,
  row,
  minuendField,
  subtrahendField
) => {
  return (
    (updatedRow[minuendField] ?? prevData[row][minuendField] ?? 0) -
    (updatedRow[subtrahendField] ?? prevData[row][subtrahendField] ?? 0)
  );
};

export const fieldMappings = {
  rep_inf_ing_tot_ing_bcg: [
    "rep_inf_ing_ban_vac_bcg",
    "rep_inf_ing_con_fis_bcg",
    "rep_inf_ing_rec_otr_bcg",
  ],
  rep_inf_ing_tot_ing_pent: [
    "rep_inf_ing_ban_vac_pent",
    "rep_inf_ing_con_fis_pent",
    "rep_inf_ing_rec_otr_pent",
  ],
  rep_inf_ing_tot_ing_neum: [
    "rep_inf_ing_ban_vac_neum",
    "rep_inf_ing_con_fis_neum",
    "rep_inf_ing_rec_otr_neum",
  ],
  rep_inf_ing_tot_ing_anti: [
    "rep_inf_ing_ban_vac_anti",
    "rep_inf_ing_con_fis_anti",
    "rep_inf_ing_rec_otr_anti",
  ],
  rep_inf_ing_tot_ing_fipv: [
    "rep_inf_ing_ban_vac_fipv",
    "rep_inf_ing_con_fis_fipv",
    "rep_inf_ing_rec_otr_fipv",
  ],
  rep_inf_ing_tot_ing_rota: [
    "rep_inf_ing_ban_vac_rota",
    "rep_inf_ing_con_fis_rota",
    "rep_inf_ing_rec_otr_rota",
  ],
  rep_inf_ing_tot_ing_srp: [
    "rep_inf_ing_ban_vac_srp",
    "rep_inf_ing_con_fis_srp",
    "rep_inf_ing_rec_otr_srp",
  ],
  rep_inf_ing_tot_ing_fieb: [
    "rep_inf_ing_ban_vac_fieb",
    "rep_inf_ing_con_fis_fieb",
    "rep_inf_ing_rec_otr_fieb",
  ],
  rep_inf_ing_tot_ing_vari: [
    "rep_inf_ing_ban_vac_vari",
    "rep_inf_ing_con_fis_vari",
    "rep_inf_ing_rec_otr_vari",
  ],
  rep_inf_ing_tot_ing_sr: [
    "rep_inf_ing_ban_vac_sr",
    "rep_inf_ing_con_fis_sr",
    "rep_inf_ing_rec_otr_sr",
  ],
  rep_inf_ing_tot_ing_dift: [
    "rep_inf_ing_ban_vac_dift",
    "rep_inf_ing_con_fis_dift",
    "rep_inf_ing_rec_otr_dift",
  ],
  rep_inf_ing_tot_ing_dtad: [
    "rep_inf_ing_ban_vac_dtad",
    "rep_inf_ing_con_fis_dtad",
    "rep_inf_ing_rec_otr_dtad",
  ],
  rep_inf_ing_tot_ing_hpv: [
    "rep_inf_ing_ban_vac_hpv",
    "rep_inf_ing_con_fis_hpv",
    "rep_inf_ing_rec_otr_hpv",
  ],
  rep_inf_ing_tot_ing_hepa: [
    "rep_inf_ing_ban_vac_hepa",
    "rep_inf_ing_con_fis_hepa",
    "rep_inf_ing_rec_otr_hepa",
  ],
  rep_inf_ing_tot_ing_hbpe: [
    "rep_inf_ing_ban_vac_hbpe",
    "rep_inf_ing_con_fis_hbpe",
    "rep_inf_ing_rec_otr_hbpe",
  ],
  rep_inf_ing_tot_ing_infped: [
    "rep_inf_ing_ban_vac_infped",
    "rep_inf_ing_con_fis_infped",
    "rep_inf_ing_rec_otr_infped",
  ],
  rep_inf_ing_tot_ing_infadu: [
    "rep_inf_ing_ban_vac_infadu",
    "rep_inf_ing_con_fis_infadu",
    "rep_inf_ing_rec_otr_infadu",
  ],
  rep_inf_ing_tot_ing_pfiz: [
    "rep_inf_ing_ban_vac_pfiz",
    "rep_inf_ing_con_fis_pfiz",
    "rep_inf_ing_rec_otr_pfiz",
  ],
  rep_inf_ing_tot_ing_sino: [
    "rep_inf_ing_ban_vac_sino",
    "rep_inf_ing_con_fis_sino",
    "rep_inf_ing_rec_otr_sino",
  ],
  rep_inf_ing_tot_ing_cans: [
    "rep_inf_ing_ban_vac_cans",
    "rep_inf_ing_con_fis_cans",
    "rep_inf_ing_rec_otr_cans",
  ],
  rep_inf_ing_tot_ing_astr: [
    "rep_inf_ing_ban_vac_astr",
    "rep_inf_ing_con_fis_astr",
    "rep_inf_ing_rec_otr_astr",
  ],
  rep_inf_ing_tot_ing_modr: [
    "rep_inf_ing_ban_vac_modr",
    "rep_inf_ing_con_fis_modr",
    "rep_inf_ing_rec_otr_modr",
  ],
  rep_inf_ing_tot_ing_virsim: [
    "rep_inf_ing_ban_vac_virsim",
    "rep_inf_ing_con_fis_virsim",
    "rep_inf_ing_rec_otr_virsim",
  ],
  rep_inf_ing_tot_ing_vacvphcam: [
    "rep_inf_ing_ban_vac_vacvphcam",
    "rep_inf_ing_con_fis_vacvphcam",
    "rep_inf_ing_rec_otr_vacvphcam",
  ],
  rep_inf_ing_tot_ing_inm_anti: [
    "rep_inf_ing_ban_vac_inm_anti",
    "rep_inf_ing_con_fis_inm_anti",
    "rep_inf_ing_rec_otr_inm_anti",
  ],
  rep_inf_ing_tot_ing_inm_ant_hep_b: [
    "rep_inf_ing_ban_vac_inm_ant_hep_b",
    "rep_inf_ing_con_fis_inm_ant_hep_b",
    "rep_inf_ing_rec_otr_inm_ant_hep_b",
  ],
  rep_inf_ing_tot_ing_inm_ant_rrab: [
    "rep_inf_ing_ban_vac_inm_ant_rrab",
    "rep_inf_ing_con_fis_inm_ant_rrab",
    "rep_inf_ing_rec_otr_inm_ant_rrab",
  ],
  rep_inf_ing_tot_ing_caj_bios: [
    "rep_inf_ing_ban_vac_caj_bios",
    "rep_inf_ing_con_fis_caj_bios",
    "rep_inf_ing_rec_otr_caj_bios",
  ],

  rep_inf_egr_tot_dos_bcg: [
    "rep_inf_egr_apl_mes_bcg",
    "rep_inf_egr_per_vac_abi_bcg",
    "rep_inf_egr_per_vac_noa_bcg",
    "rep_inf_egr_tra_otr_bcg",
    "rep_inf_egr_dev_ban_bcg",
  ],
  rep_inf_egr_tot_dos_pent: [
    "rep_inf_egr_apl_mes_pent",
    "rep_inf_egr_per_vac_abi_pent",
    "rep_inf_egr_per_vac_noa_pent",
    "rep_inf_egr_tra_otr_pent",
    "rep_inf_egr_dev_ban_pent",
  ],
  rep_inf_egr_tot_dos_neum: [
    "rep_inf_egr_apl_mes_neum",
    "rep_inf_egr_per_vac_abi_neum",
    "rep_inf_egr_per_vac_noa_neum",
    "rep_inf_egr_tra_otr_neum",
    "rep_inf_egr_dev_ban_neum",
  ],
  rep_inf_egr_tot_dos_anti: [
    "rep_inf_egr_apl_mes_anti",
    "rep_inf_egr_per_vac_abi_anti",
    "rep_inf_egr_per_vac_noa_anti",
    "rep_inf_egr_tra_otr_anti",
    "rep_inf_egr_dev_ban_anti",
  ],
  rep_inf_egr_tot_dos_fipv: [
    "rep_inf_egr_apl_mes_fipv",
    "rep_inf_egr_per_vac_abi_fipv",
    "rep_inf_egr_per_vac_noa_fipv",
    "rep_inf_egr_tra_otr_fipv",
    "rep_inf_egr_dev_ban_fipv",
  ],
  rep_inf_egr_tot_dos_rota: [
    "rep_inf_egr_apl_mes_rota",
    "rep_inf_egr_per_vac_abi_rota",
    "rep_inf_egr_per_vac_noa_rota",
    "rep_inf_egr_tra_otr_rota",
    "rep_inf_egr_dev_ban_rota",
  ],
  rep_inf_egr_tot_dos_srp: [
    "rep_inf_egr_apl_mes_srp",
    "rep_inf_egr_per_vac_abi_srp",
    "rep_inf_egr_per_vac_noa_srp",
    "rep_inf_egr_tra_otr_srp",
    "rep_inf_egr_dev_ban_srp",
  ],
  rep_inf_egr_tot_dos_fieb: [
    "rep_inf_egr_apl_mes_fieb",
    "rep_inf_egr_per_vac_abi_fieb",
    "rep_inf_egr_per_vac_noa_fieb",
    "rep_inf_egr_tra_otr_fieb",
    "rep_inf_egr_dev_ban_fieb",
  ],
  rep_inf_egr_tot_dos_vari: [
    "rep_inf_egr_apl_mes_vari",
    "rep_inf_egr_per_vac_abi_vari",
    "rep_inf_egr_per_vac_noa_vari",
    "rep_inf_egr_tra_otr_vari",
    "rep_inf_egr_dev_ban_vari",
  ],
  rep_inf_egr_tot_dos_sr: [
    "rep_inf_egr_apl_mes_sr",
    "rep_inf_egr_per_vac_abi_sr",
    "rep_inf_egr_per_vac_noa_sr",
    "rep_inf_egr_tra_otr_sr",
    "rep_inf_egr_dev_ban_sr",
  ],
  rep_inf_egr_tot_dos_dift: [
    "rep_inf_egr_apl_mes_dift",
    "rep_inf_egr_per_vac_abi_dift",
    "rep_inf_egr_per_vac_noa_dift",
    "rep_inf_egr_tra_otr_dift",
    "rep_inf_egr_dev_ban_dift",
  ],
  rep_inf_egr_tot_dos_dtad: [
    "rep_inf_egr_apl_mes_dtad",
    "rep_inf_egr_per_vac_abi_dtad",
    "rep_inf_egr_per_vac_noa_dtad",
    "rep_inf_egr_tra_otr_dtad",
    "rep_inf_egr_dev_ban_dtad",
  ],
  rep_inf_egr_tot_dos_hpv: [
    "rep_inf_egr_apl_mes_hpv",
    "rep_inf_egr_per_vac_abi_hpv",
    "rep_inf_egr_per_vac_noa_hpv",
    "rep_inf_egr_tra_otr_hpv",
    "rep_inf_egr_dev_ban_hpv",
  ],
  rep_inf_egr_tot_dos_hepa: [
    "rep_inf_egr_apl_mes_hepa",
    "rep_inf_egr_per_vac_abi_hepa",
    "rep_inf_egr_per_vac_noa_hepa",
    "rep_inf_egr_tra_otr_hepa",
    "rep_inf_egr_dev_ban_hepa",
  ],
  rep_inf_egr_tot_dos_hbpe: [
    "rep_inf_egr_apl_mes_hbpe",
    "rep_inf_egr_per_vac_abi_hbpe",
    "rep_inf_egr_per_vac_noa_hbpe",
    "rep_inf_egr_tra_otr_hbpe",
    "rep_inf_egr_dev_ban_hbpe",
  ],
  rep_inf_egr_tot_dos_infped: [
    "rep_inf_egr_apl_mes_infped",
    "rep_inf_egr_per_vac_abi_infped",
    "rep_inf_egr_per_vac_noa_infped",
    "rep_inf_egr_tra_otr_infped",
    "rep_inf_egr_dev_ban_infped",
  ],
  rep_inf_egr_tot_dos_infadu: [
    "rep_inf_egr_apl_mes_infadu",
    "rep_inf_egr_per_vac_abi_infadu",
    "rep_inf_egr_per_vac_noa_infadu",
    "rep_inf_egr_tra_otr_infadu",
    "rep_inf_egr_dev_ban_infadu",
  ],
  rep_inf_egr_tot_dos_pfiz: [
    "rep_inf_egr_apl_mes_pfiz",
    "rep_inf_egr_per_vac_abi_pfiz",
    "rep_inf_egr_per_vac_noa_pfiz",
    "rep_inf_egr_tra_otr_pfiz",
    "rep_inf_egr_dev_ban_pfiz",
  ],
  rep_inf_egr_tot_dos_sino: [
    "rep_inf_egr_apl_mes_sino",
    "rep_inf_egr_per_vac_abi_sino",
    "rep_inf_egr_per_vac_noa_sino",
    "rep_inf_egr_tra_otr_sino",
    "rep_inf_egr_dev_ban_sino",
  ],
  rep_inf_egr_tot_dos_cans: [
    "rep_inf_egr_apl_mes_cans",
    "rep_inf_egr_per_vac_abi_cans",
    "rep_inf_egr_per_vac_noa_cans",
    "rep_inf_egr_tra_otr_cans",
    "rep_inf_egr_dev_ban_cans",
  ],
  rep_inf_egr_tot_dos_astr: [
    "rep_inf_egr_apl_mes_astr",
    "rep_inf_egr_per_vac_abi_astr",
    "rep_inf_egr_per_vac_noa_astr",
    "rep_inf_egr_tra_otr_astr",
    "rep_inf_egr_dev_ban_astr",
  ],
  rep_inf_egr_tot_dos_modr: [
    "rep_inf_egr_apl_mes_modr",
    "rep_inf_egr_per_vac_abi_modr",
    "rep_inf_egr_per_vac_noa_modr",
    "rep_inf_egr_tra_otr_modr",
    "rep_inf_egr_dev_ban_modr",
  ],
  rep_inf_egr_tot_dos_virsim: [
    "rep_inf_egr_apl_mes_virsim",
    "rep_inf_egr_per_vac_abi_virsim",
    "rep_inf_egr_per_vac_noa_virsim",
    "rep_inf_egr_tra_otr_virsim",
    "rep_inf_egr_dev_ban_virsim",
  ],
  rep_inf_egr_tot_dos_vacvphcam: [
    "rep_inf_egr_apl_mes_vacvphcam",
    "rep_inf_egr_per_vac_abi_vacvphcam",
    "rep_inf_egr_per_vac_noa_vacvphcam",
    "rep_inf_egr_tra_otr_vacvphcam",
    "rep_inf_egr_dev_ban_vacvphcam",
  ],
  rep_inf_egr_tot_dos_inm_anti: [
    "rep_inf_egr_apl_mes_inm_anti",
    "rep_inf_egr_per_vac_abi_inm_anti",
    "rep_inf_egr_per_vac_noa_inm_anti",
    "rep_inf_egr_tra_otr_inm_anti",
    "rep_inf_egr_dev_ban_inm_anti",
  ],
  rep_inf_egr_tot_dos_inm_ant_hep_b: [
    "rep_inf_egr_apl_mes_inm_ant_hep_b",
    "rep_inf_egr_per_vac_abi_inm_ant_hep_b",
    "rep_inf_egr_per_vac_noa_inm_ant_hep_b",
    "rep_inf_egr_tra_otr_inm_ant_hep_b",
    "rep_inf_egr_dev_ban_inm_ant_hep_b",
  ],
  rep_inf_egr_tot_dos_inm_ant_rrab: [
    "rep_inf_egr_apl_mes_inm_ant_rrab",
    "rep_inf_egr_per_vac_abi_inm_ant_rrab",
    "rep_inf_egr_per_vac_noa_inm_ant_rrab",
    "rep_inf_egr_tra_otr_inm_ant_rrab",
    "rep_inf_egr_dev_ban_inm_ant_rrab",
  ],
  rep_inf_egr_tot_dos_caj_bios: [
    "rep_inf_egr_apl_mes_caj_bios",
    "rep_inf_egr_per_vac_abi_caj_bios",
    "rep_inf_egr_per_vac_noa_caj_bios",
    "rep_inf_egr_tra_otr_caj_bios",
    "rep_inf_egr_dev_ban_caj_bios",
  ],
};

export const updateField = (
  updatedRow,
  prevData,
  row,
  input,
  fields,
  totalField
) => {
  if (fields.includes(input)) {
    updatedRow[totalField] = calculateTotal(updatedRow, prevData, row, fields);
  }
};

export const updateDependentFields = (updatedRow, prevData, row, input) => {
  const dependentFields_bcg = [
    "rep_inf_sal_ant_bcg",
    "rep_inf_ing_ban_vac_bcg",
    "rep_inf_ing_con_fis_bcg",
    "rep_inf_ing_rec_otr_bcg",
    "rep_inf_ing_tot_ing_bcg",
    "rep_inf_tot_dis_bcg",
    "rep_inf_egr_apl_mes_bcg",
    "rep_inf_egr_per_vac_abi_bcg",
    "rep_inf_egr_per_vac_noa_bcg",
    "rep_inf_egr_tra_otr_bcg",
    "rep_inf_egr_dev_ban_bcg",
    "rep_inf_egr_tot_dos_bcg",
    "rep_inf_sal_mes_bcg",
    "rep_sol_nec_mes_bcg",
  ];
  const dependentFields_pent = [
    "rep_inf_sal_ant_pent",
    "rep_inf_ing_ban_vac_pent",
    "rep_inf_ing_con_fis_pent",
    "rep_inf_ing_rec_otr_pent",
    "rep_inf_ing_tot_ing_pent",
    "rep_inf_tot_dis_pent",
    "rep_inf_egr_apl_mes_pent",
    "rep_inf_egr_per_vac_abi_pent",
    "rep_inf_egr_per_vac_noa_pent",
    "rep_inf_egr_tra_otr_pent",
    "rep_inf_egr_dev_ban_pent",
    "rep_inf_egr_tot_dos_pent",
    "rep_inf_sal_mes_pent",
    "rep_sol_nec_mes_pent",
  ];
  const dependentFields_neum = [
    "rep_inf_sal_ant_neum",
    "rep_inf_ing_ban_vac_neum",
    "rep_inf_ing_con_fis_neum",
    "rep_inf_ing_rec_otr_neum",
    "rep_inf_ing_tot_ing_neum",
    "rep_inf_tot_dis_neum",
    "rep_inf_egr_apl_mes_neum",
    "rep_inf_egr_per_vac_abi_neum",
    "rep_inf_egr_per_vac_noa_neum",
    "rep_inf_egr_tra_otr_neum",
    "rep_inf_egr_dev_ban_neum",
    "rep_inf_egr_tot_dos_neum",
    "rep_inf_sal_mes_neum",
    "rep_sol_nec_mes_neum",
  ];
  const dependentFields_anti = [
    "rep_inf_sal_ant_anti",
    "rep_inf_ing_ban_vac_anti",
    "rep_inf_ing_con_fis_anti",
    "rep_inf_ing_rec_otr_anti",
    "rep_inf_ing_tot_ing_anti",
    "rep_inf_tot_dis_anti",
    "rep_inf_egr_apl_mes_anti",
    "rep_inf_egr_per_vac_abi_anti",
    "rep_inf_egr_per_vac_noa_anti",
    "rep_inf_egr_tra_otr_anti",
    "rep_inf_egr_dev_ban_anti",
    "rep_inf_egr_tot_dos_anti",
    "rep_inf_sal_mes_anti",
    "rep_sol_nec_mes_anti",
  ];
  const dependentFields_fipv = [
    "rep_inf_sal_ant_fipv",
    "rep_inf_ing_ban_vac_fipv",
    "rep_inf_ing_con_fis_fipv",
    "rep_inf_ing_rec_otr_fipv",
    "rep_inf_ing_tot_ing_fipv",
    "rep_inf_tot_dis_fipv",
    "rep_inf_egr_apl_mes_fipv",
    "rep_inf_egr_per_vac_abi_fipv",
    "rep_inf_egr_per_vac_noa_fipv",
    "rep_inf_egr_tra_otr_fipv",
    "rep_inf_egr_dev_ban_fipv",
    "rep_inf_egr_tot_dos_fipv",
    "rep_inf_sal_mes_fipv",
    "rep_sol_nec_mes_fipv",
  ];
  const dependentFields_rota = [
    "rep_inf_sal_ant_rota",
    "rep_inf_ing_ban_vac_rota",
    "rep_inf_ing_con_fis_rota",
    "rep_inf_ing_rec_otr_rota",
    "rep_inf_ing_tot_ing_rota",
    "rep_inf_tot_dis_rota",
    "rep_inf_egr_apl_mes_rota",
    "rep_inf_egr_per_vac_abi_rota",
    "rep_inf_egr_per_vac_noa_rota",
    "rep_inf_egr_tra_otr_rota",
    "rep_inf_egr_dev_ban_rota",
    "rep_inf_egr_tot_dos_rota",
    "rep_inf_sal_mes_rota",
    "rep_sol_nec_mes_rota",
  ];
  const dependentFields_srp = [
    "rep_inf_sal_ant_srp",
    "rep_inf_ing_ban_vac_srp",
    "rep_inf_ing_con_fis_srp",
    "rep_inf_ing_rec_otr_srp",
    "rep_inf_ing_tot_ing_srp",
    "rep_inf_tot_dis_srp",
    "rep_inf_egr_apl_mes_srp",
    "rep_inf_egr_per_vac_abi_srp",
    "rep_inf_egr_per_vac_noa_srp",
    "rep_inf_egr_tra_otr_srp",
    "rep_inf_egr_dev_ban_srp",
    "rep_inf_egr_tot_dos_srp",
    "rep_inf_sal_mes_srp",
    "rep_sol_nec_mes_srp",
  ];
  const dependentFields_fieb = [
    "rep_inf_sal_ant_fieb",
    "rep_inf_ing_ban_vac_fieb",
    "rep_inf_ing_con_fis_fieb",
    "rep_inf_ing_rec_otr_fieb",
    "rep_inf_ing_tot_ing_fieb",
    "rep_inf_tot_dis_fieb",
    "rep_inf_egr_apl_mes_fieb",
    "rep_inf_egr_per_vac_abi_fieb",
    "rep_inf_egr_per_vac_noa_fieb",
    "rep_inf_egr_tra_otr_fieb",
    "rep_inf_egr_dev_ban_fieb",
    "rep_inf_egr_tot_dos_fieb",
    "rep_inf_sal_mes_fieb",
    "rep_sol_nec_mes_fieb",
  ];
  const dependentFields_vari = [
    "rep_inf_sal_ant_vari",
    "rep_inf_ing_ban_vac_vari",
    "rep_inf_ing_con_fis_vari",
    "rep_inf_ing_rec_otr_vari",
    "rep_inf_ing_tot_ing_vari",
    "rep_inf_tot_dis_vari",
    "rep_inf_egr_apl_mes_vari",
    "rep_inf_egr_per_vac_abi_vari",
    "rep_inf_egr_per_vac_noa_vari",
    "rep_inf_egr_tra_otr_vari",
    "rep_inf_egr_dev_ban_vari",
    "rep_inf_egr_tot_dos_vari",
    "rep_inf_sal_mes_vari",
    "rep_sol_nec_mes_vari",
  ];
  const dependentFields_sr = [
    "rep_inf_sal_ant_sr",
    "rep_inf_ing_ban_vac_sr",
    "rep_inf_ing_con_fis_sr",
    "rep_inf_ing_rec_otr_sr",
    "rep_inf_ing_tot_ing_sr",
    "rep_inf_tot_dis_sr",
    "rep_inf_egr_apl_mes_sr",
    "rep_inf_egr_per_vac_abi_sr",
    "rep_inf_egr_per_vac_noa_sr",
    "rep_inf_egr_tra_otr_sr",
    "rep_inf_egr_dev_ban_sr",
    "rep_inf_egr_tot_dos_sr",
    "rep_inf_sal_mes_sr",
    "rep_sol_nec_mes_sr",
  ];
  const dependentFields_dift = [
    "rep_inf_sal_ant_dift",
    "rep_inf_ing_ban_vac_dift",
    "rep_inf_ing_con_fis_dift",
    "rep_inf_ing_rec_otr_dift",
    "rep_inf_ing_tot_ing_dift",
    "rep_inf_tot_dis_dift",
    "rep_inf_egr_apl_mes_dift",
    "rep_inf_egr_per_vac_abi_dift",
    "rep_inf_egr_per_vac_noa_dift",
    "rep_inf_egr_tra_otr_dift",
    "rep_inf_egr_dev_ban_dift",
    "rep_inf_egr_tot_dos_dift",
    "rep_inf_sal_mes_dift",
    "rep_sol_nec_mes_dift",
  ];
  const dependentFields_dtad = [
    "rep_inf_sal_ant_dtad",
    "rep_inf_ing_ban_vac_dtad",
    "rep_inf_ing_con_fis_dtad",
    "rep_inf_ing_rec_otr_dtad",
    "rep_inf_ing_tot_ing_dtad",
    "rep_inf_tot_dis_dtad",
    "rep_inf_egr_apl_mes_dtad",
    "rep_inf_egr_per_vac_abi_dtad",
    "rep_inf_egr_per_vac_noa_dtad",
    "rep_inf_egr_tra_otr_dtad",
    "rep_inf_egr_dev_ban_dtad",
    "rep_inf_egr_tot_dos_dtad",
    "rep_inf_sal_mes_dtad",
    "rep_sol_nec_mes_dtad",
  ];
  const dependentFields_hpv = [
    "rep_inf_sal_ant_hpv",
    "rep_inf_ing_ban_vac_hpv",
    "rep_inf_ing_con_fis_hpv",
    "rep_inf_ing_rec_otr_hpv",
    "rep_inf_ing_tot_ing_hpv",
    "rep_inf_tot_dis_hpv",
    "rep_inf_egr_apl_mes_hpv",
    "rep_inf_egr_per_vac_abi_hpv",
    "rep_inf_egr_per_vac_noa_hpv",
    "rep_inf_egr_tra_otr_hpv",
    "rep_inf_egr_dev_ban_hpv",
    "rep_inf_egr_tot_dos_hpv",
    "rep_inf_sal_mes_hpv",
    "rep_sol_nec_mes_hpv",
  ];
  const dependentFields_hepa = [
    "rep_inf_sal_ant_hepa",
    "rep_inf_ing_ban_vac_hepa",
    "rep_inf_ing_con_fis_hepa",
    "rep_inf_ing_rec_otr_hepa",
    "rep_inf_ing_tot_ing_hepa",
    "rep_inf_tot_dis_hepa",
    "rep_inf_egr_apl_mes_hepa",
    "rep_inf_egr_per_vac_abi_hepa",
    "rep_inf_egr_per_vac_noa_hepa",
    "rep_inf_egr_tra_otr_hepa",
    "rep_inf_egr_dev_ban_hepa",
    "rep_inf_egr_tot_dos_hepa",
    "rep_inf_sal_mes_hepa",
    "rep_sol_nec_mes_hepa",
  ];
  const dependentFields_hbpe = [
    "rep_inf_sal_ant_hbpe",
    "rep_inf_ing_ban_vac_hbpe",
    "rep_inf_ing_con_fis_hbpe",
    "rep_inf_ing_rec_otr_hbpe",
    "rep_inf_ing_tot_ing_hbpe",
    "rep_inf_tot_dis_hbpe",
    "rep_inf_egr_apl_mes_hbpe",
    "rep_inf_egr_per_vac_abi_hbpe",
    "rep_inf_egr_per_vac_noa_hbpe",
    "rep_inf_egr_tra_otr_hbpe",
    "rep_inf_egr_dev_ban_hbpe",
    "rep_inf_egr_tot_dos_hbpe",
    "rep_inf_sal_mes_hbpe",
    "rep_sol_nec_mes_hbpe",
  ];
  const dependentFields_infped = [
    "rep_inf_sal_ant_infped",
    "rep_inf_ing_ban_vac_infped",
    "rep_inf_ing_con_fis_infped",
    "rep_inf_ing_rec_otr_infped",
    "rep_inf_ing_tot_ing_infped",
    "rep_inf_tot_dis_infped",
    "rep_inf_egr_apl_mes_infped",
    "rep_inf_egr_per_vac_abi_infped",
    "rep_inf_egr_per_vac_noa_infped",
    "rep_inf_egr_tra_otr_infped",
    "rep_inf_egr_dev_ban_infped",
    "rep_inf_egr_tot_dos_infped",
    "rep_inf_sal_mes_infped",
    "rep_sol_nec_mes_infped",
  ];
  const dependentFields_infadu = [
    "rep_inf_sal_ant_infadu",
    "rep_inf_ing_ban_vac_infadu",
    "rep_inf_ing_con_fis_infadu",
    "rep_inf_ing_rec_otr_infadu",
    "rep_inf_ing_tot_ing_infadu",
    "rep_inf_tot_dis_infadu",
    "rep_inf_egr_apl_mes_infadu",
    "rep_inf_egr_per_vac_abi_infadu",
    "rep_inf_egr_per_vac_noa_infadu",
    "rep_inf_egr_tra_otr_infadu",
    "rep_inf_egr_dev_ban_infadu",
    "rep_inf_egr_tot_dos_infadu",
    "rep_inf_sal_mes_infadu",
    "rep_sol_nec_mes_infadu",
  ];
  const dependentFields_pfiz = [
    "rep_inf_sal_ant_pfiz",
    "rep_inf_ing_ban_vac_pfiz",
    "rep_inf_ing_con_fis_pfiz",
    "rep_inf_ing_rec_otr_pfiz",
    "rep_inf_ing_tot_ing_pfiz",
    "rep_inf_tot_dis_pfiz",
    "rep_inf_egr_apl_mes_pfiz",
    "rep_inf_egr_per_vac_abi_pfiz",
    "rep_inf_egr_per_vac_noa_pfiz",
    "rep_inf_egr_tra_otr_pfiz",
    "rep_inf_egr_dev_ban_pfiz",
    "rep_inf_egr_tot_dos_pfiz",
    "rep_inf_sal_mes_pfiz",
    "rep_sol_nec_mes_pfiz",
  ];
  const dependentFields_sino = [
    "rep_inf_sal_ant_sino",
    "rep_inf_ing_ban_vac_sino",
    "rep_inf_ing_con_fis_sino",
    "rep_inf_ing_rec_otr_sino",
    "rep_inf_ing_tot_ing_sino",
    "rep_inf_tot_dis_sino",
    "rep_inf_egr_apl_mes_sino",
    "rep_inf_egr_per_vac_abi_sino",
    "rep_inf_egr_per_vac_noa_sino",
    "rep_inf_egr_tra_otr_sino",
    "rep_inf_egr_dev_ban_sino",
    "rep_inf_egr_tot_dos_sino",
    "rep_inf_sal_mes_sino",
    "rep_sol_nec_mes_sino",
  ];
  const dependentFields_cans = [
    "rep_inf_sal_ant_cans",
    "rep_inf_ing_ban_vac_cans",
    "rep_inf_ing_con_fis_cans",
    "rep_inf_ing_rec_otr_cans",
    "rep_inf_ing_tot_ing_cans",
    "rep_inf_tot_dis_cans",
    "rep_inf_egr_apl_mes_cans",
    "rep_inf_egr_per_vac_abi_cans",
    "rep_inf_egr_per_vac_noa_cans",
    "rep_inf_egr_tra_otr_cans",
    "rep_inf_egr_dev_ban_cans",
    "rep_inf_egr_tot_dos_cans",
    "rep_inf_sal_mes_cans",
    "rep_sol_nec_mes_cans",
  ];
  const dependentFields_astr = [
    "rep_inf_sal_ant_astr",
    "rep_inf_ing_ban_vac_astr",
    "rep_inf_ing_con_fis_astr",
    "rep_inf_ing_rec_otr_astr",
    "rep_inf_ing_tot_ing_astr",
    "rep_inf_tot_dis_astr",
    "rep_inf_egr_apl_mes_astr",
    "rep_inf_egr_per_vac_abi_astr",
    "rep_inf_egr_per_vac_noa_astr",
    "rep_inf_egr_tra_otr_astr",
    "rep_inf_egr_dev_ban_astr",
    "rep_inf_egr_tot_dos_astr",
    "rep_inf_sal_mes_astr",
    "rep_sol_nec_mes_astr",
  ];
  const dependentFields_modr = [
    "rep_inf_sal_ant_modr",
    "rep_inf_ing_ban_vac_modr",
    "rep_inf_ing_con_fis_modr",
    "rep_inf_ing_rec_otr_modr",
    "rep_inf_ing_tot_ing_modr",
    "rep_inf_tot_dis_modr",
    "rep_inf_egr_apl_mes_modr",
    "rep_inf_egr_per_vac_abi_modr",
    "rep_inf_egr_per_vac_noa_modr",
    "rep_inf_egr_tra_otr_modr",
    "rep_inf_egr_dev_ban_modr",
    "rep_inf_egr_tot_dos_modr",
    "rep_inf_sal_mes_modr",
    "rep_sol_nec_mes_modr",
  ];
  const dependentFields_virsim = [
    "rep_inf_sal_ant_virsim",
    "rep_inf_ing_ban_vac_virsim",
    "rep_inf_ing_con_fis_virsim",
    "rep_inf_ing_rec_otr_virsim",
    "rep_inf_ing_tot_ing_virsim",
    "rep_inf_tot_dis_virsim",
    "rep_inf_egr_apl_mes_virsim",
    "rep_inf_egr_per_vac_abi_virsim",
    "rep_inf_egr_per_vac_noa_virsim",
    "rep_inf_egr_tra_otr_virsim",
    "rep_inf_egr_dev_ban_virsim",
    "rep_inf_egr_tot_dos_virsim",
    "rep_inf_sal_mes_virsim",
    "rep_sol_nec_mes_virsim",
  ];
  const dependentFields_vacvphcam = [
    "rep_inf_sal_ant_vacvphcam",
    "rep_inf_ing_ban_vac_vacvphcam",
    "rep_inf_ing_con_fis_vacvphcam",
    "rep_inf_ing_rec_otr_vacvphcam",
    "rep_inf_ing_tot_ing_vacvphcam",
    "rep_inf_tot_dis_vacvphcam",
    "rep_inf_egr_apl_mes_vacvphcam",
    "rep_inf_egr_per_vac_abi_vacvphcam",
    "rep_inf_egr_per_vac_noa_vacvphcam",
    "rep_inf_egr_tra_otr_vacvphcam",
    "rep_inf_egr_dev_ban_vacvphcam",
    "rep_inf_egr_tot_dos_vacvphcam",
    "rep_inf_sal_mes_vacvphcam",
    "rep_sol_nec_mes_vacvphcam",
  ];
  const dependentFields_inm_anti = [
    "rep_inf_sal_ant_inm_anti",
    "rep_inf_ing_ban_vac_inm_anti",
    "rep_inf_ing_con_fis_inm_anti",
    "rep_inf_ing_rec_otr_inm_anti",
    "rep_inf_ing_tot_ing_inm_anti",
    "rep_inf_tot_dis_inm_anti",
    "rep_inf_egr_apl_mes_inm_anti",
    "rep_inf_egr_per_vac_abi_inm_anti",
    "rep_inf_egr_per_vac_noa_inm_anti",
    "rep_inf_egr_tra_otr_inm_anti",
    "rep_inf_egr_dev_ban_inm_anti",
    "rep_inf_egr_tot_dos_inm_anti",
    "rep_inf_sal_mes_inm_anti",
    "rep_sol_nec_mes_inm_anti",
  ];
  const dependentFields_inm_ant_hep_b = [
    "rep_inf_sal_ant_inm_ant_hep_b",
    "rep_inf_ing_ban_vac_inm_ant_hep_b",
    "rep_inf_ing_con_fis_inm_ant_hep_b",
    "rep_inf_ing_rec_otr_inm_ant_hep_b",
    "rep_inf_ing_tot_ing_inm_ant_hep_b",
    "rep_inf_tot_dis_inm_ant_hep_b",
    "rep_inf_egr_apl_mes_inm_ant_hep_b",
    "rep_inf_egr_per_vac_abi_inm_ant_hep_b",
    "rep_inf_egr_per_vac_noa_inm_ant_hep_b",
    "rep_inf_egr_tra_otr_inm_ant_hep_b",
    "rep_inf_egr_dev_ban_inm_ant_hep_b",
    "rep_inf_egr_tot_dos_inm_ant_hep_b",
    "rep_inf_sal_mes_inm_ant_hep_b",
    "rep_sol_nec_mes_inm_ant_hep_b",
  ];
  const dependentFields_inm_ant_rrab = [
    "rep_inf_sal_ant_inm_ant_rrab",
    "rep_inf_ing_ban_vac_inm_ant_rrab",
    "rep_inf_ing_con_fis_inm_ant_rrab",
    "rep_inf_ing_rec_otr_inm_ant_rrab",
    "rep_inf_ing_tot_ing_inm_ant_rrab",
    "rep_inf_tot_dis_inm_ant_rrab",
    "rep_inf_egr_apl_mes_inm_ant_rrab",
    "rep_inf_egr_per_vac_abi_inm_ant_rrab",
    "rep_inf_egr_per_vac_noa_inm_ant_rrab",
    "rep_inf_egr_tra_otr_inm_ant_rrab",
    "rep_inf_egr_dev_ban_inm_ant_rrab",
    "rep_inf_egr_tot_dos_inm_ant_rrab",
    "rep_inf_sal_mes_inm_ant_rrab",
    "rep_sol_nec_mes_inm_ant_rrab",
  ];
  const dependentFields_caj_bios = [
    "rep_inf_sal_ant_caj_bios",
    "rep_inf_ing_ban_vac_caj_bios",
    "rep_inf_ing_con_fis_caj_bios",
    "rep_inf_ing_rec_otr_caj_bios",
    "rep_inf_ing_tot_ing_caj_bios",
    "rep_inf_tot_dis_caj_bios",
    "rep_inf_egr_apl_mes_caj_bios",
    "rep_inf_egr_per_vac_abi_caj_bios",
    "rep_inf_egr_per_vac_noa_caj_bios",
    "rep_inf_egr_tra_otr_caj_bios",
    "rep_inf_egr_dev_ban_caj_bios",
    "rep_inf_egr_tot_dos_caj_bios",
    "rep_inf_sal_mes_caj_bios",
    "rep_sol_nec_mes_caj_bios",
  ];

  if (dependentFields_bcg.includes(input)) {
    updatedRow.rep_inf_tot_dis_bcg = calculateTotal(updatedRow, prevData, row, [
      "rep_inf_sal_ant_bcg",
      "rep_inf_ing_tot_ing_bcg",
    ]);
    updatedRow.rep_inf_sal_mes_bcg = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_bcg",
      "rep_inf_egr_tot_dos_bcg"
    );
    updatedRow.rep_sol_sol_mes_bcg = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_bcg",
      "rep_sol_nec_mes_bcg"
    );
  }
  if (dependentFields_pent.includes(input)) {
    updatedRow.rep_inf_tot_dis_pent = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_pent", "rep_inf_ing_tot_ing_pent"]
    );
    updatedRow.rep_inf_sal_mes_pent = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_pent",
      "rep_inf_egr_tot_dos_pent"
    );
    updatedRow.rep_sol_sol_mes_pent = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_pent",
      "rep_sol_nec_mes_pent"
    );
  }
  if (dependentFields_neum.includes(input)) {
    updatedRow.rep_inf_tot_dis_neum = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_neum", "rep_inf_ing_tot_ing_neum"]
    );
    updatedRow.rep_inf_sal_mes_neum = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_neum",
      "rep_inf_egr_tot_dos_neum"
    );
    updatedRow.rep_sol_sol_mes_neum = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_neum",
      "rep_sol_nec_mes_neum"
    );
  }
  if (dependentFields_anti.includes(input)) {
    updatedRow.rep_inf_tot_dis_anti = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_anti", "rep_inf_ing_tot_ing_anti"]
    );
    updatedRow.rep_inf_sal_mes_anti = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_anti",
      "rep_inf_egr_tot_dos_anti"
    );
    updatedRow.rep_sol_sol_mes_anti = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_anti",
      "rep_sol_nec_mes_anti"
    );
  }
  if (dependentFields_fipv.includes(input)) {
    updatedRow.rep_inf_tot_dis_fipv = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_fipv", "rep_inf_ing_tot_ing_fipv"]
    );
    updatedRow.rep_inf_sal_mes_fipv = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_fipv",
      "rep_inf_egr_tot_dos_fipv"
    );
    updatedRow.rep_sol_sol_mes_fipv = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_fipv",
      "rep_sol_nec_mes_fipv"
    );
  }
  if (dependentFields_rota.includes(input)) {
    updatedRow.rep_inf_tot_dis_rota = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_rota", "rep_inf_ing_tot_ing_rota"]
    );
    updatedRow.rep_inf_sal_mes_rota = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_rota",
      "rep_inf_egr_tot_dos_rota"
    );
    updatedRow.rep_sol_sol_mes_rota = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_rota",
      "rep_sol_nec_mes_rota"
    );
  }
  if (dependentFields_srp.includes(input)) {
    updatedRow.rep_inf_tot_dis_srp = calculateTotal(updatedRow, prevData, row, [
      "rep_inf_sal_ant_srp",
      "rep_inf_ing_tot_ing_srp",
    ]);
    updatedRow.rep_inf_sal_mes_srp = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_srp",
      "rep_inf_egr_tot_dos_srp"
    );
    updatedRow.rep_sol_sol_mes_srp = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_srp",
      "rep_sol_nec_mes_srp"
    );
  }
  if (dependentFields_fieb.includes(input)) {
    updatedRow.rep_inf_tot_dis_fieb = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_fieb", "rep_inf_ing_tot_ing_fieb"]
    );
    updatedRow.rep_inf_sal_mes_fieb = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_fieb",
      "rep_inf_egr_tot_dos_fieb"
    );
    updatedRow.rep_sol_sol_mes_fieb = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_fieb",
      "rep_sol_nec_mes_fieb"
    );
  }
  if (dependentFields_vari.includes(input)) {
    updatedRow.rep_inf_tot_dis_vari = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_vari", "rep_inf_ing_tot_ing_vari"]
    );
    updatedRow.rep_inf_sal_mes_vari = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_vari",
      "rep_inf_egr_tot_dos_vari"
    );
    updatedRow.rep_sol_sol_mes_vari = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_vari",
      "rep_sol_nec_mes_vari"
    );
  }
  if (dependentFields_sr.includes(input)) {
    updatedRow.rep_inf_tot_dis_sr = calculateTotal(updatedRow, prevData, row, [
      "rep_inf_sal_ant_sr",
      "rep_inf_ing_tot_ing_sr",
    ]);
    updatedRow.rep_inf_sal_mes_sr = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_sr",
      "rep_inf_egr_tot_dos_sr"
    );
    updatedRow.rep_sol_sol_mes_sr = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_sr",
      "rep_sol_nec_mes_sr"
    );
  }
  if (dependentFields_dift.includes(input)) {
    updatedRow.rep_inf_tot_dis_dift = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_dift", "rep_inf_ing_tot_ing_dift"]
    );
    updatedRow.rep_inf_sal_mes_dift = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_dift",
      "rep_inf_egr_tot_dos_dift"
    );
    updatedRow.rep_sol_sol_mes_dift = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_dift",
      "rep_sol_nec_mes_dift"
    );
  }
  if (dependentFields_dtad.includes(input)) {
    updatedRow.rep_inf_tot_dis_dtad = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_dtad", "rep_inf_ing_tot_ing_dtad"]
    );
    updatedRow.rep_inf_sal_mes_dtad = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_dtad",
      "rep_inf_egr_tot_dos_dtad"
    );
    updatedRow.rep_sol_sol_mes_dtad = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_dtad",
      "rep_sol_nec_mes_dtad"
    );
  }
  if (dependentFields_hpv.includes(input)) {
    updatedRow.rep_inf_tot_dis_hpv = calculateTotal(updatedRow, prevData, row, [
      "rep_inf_sal_ant_hpv",
      "rep_inf_ing_tot_ing_hpv",
    ]);
    updatedRow.rep_inf_sal_mes_hpv = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_hpv",
      "rep_inf_egr_tot_dos_hpv"
    );
    updatedRow.rep_sol_sol_mes_hpv = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_hpv",
      "rep_sol_nec_mes_hpv"
    );
  }
  if (dependentFields_hepa.includes(input)) {
    updatedRow.rep_inf_tot_dis_hepa = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_hepa", "rep_inf_ing_tot_ing_hepa"]
    );
    updatedRow.rep_inf_sal_mes_hepa = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_hepa",
      "rep_inf_egr_tot_dos_hepa"
    );
    updatedRow.rep_sol_sol_mes_hepa = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_hepa",
      "rep_sol_nec_mes_hepa"
    );
  }
  if (dependentFields_hbpe.includes(input)) {
    updatedRow.rep_inf_tot_dis_hbpe = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_hbpe", "rep_inf_ing_tot_ing_hbpe"]
    );
    updatedRow.rep_inf_sal_mes_hbpe = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_hbpe",
      "rep_inf_egr_tot_dos_hbpe"
    );
    updatedRow.rep_sol_sol_mes_hbpe = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_hbpe",
      "rep_sol_nec_mes_hbpe"
    );
  }
  if (dependentFields_infped.includes(input)) {
    updatedRow.rep_inf_tot_dis_infped = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_infped", "rep_inf_ing_tot_ing_infped"]
    );
    updatedRow.rep_inf_sal_mes_infped = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_infped",
      "rep_inf_egr_tot_dos_infped"
    );
    updatedRow.rep_sol_sol_mes_infped = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_infped",
      "rep_sol_nec_mes_infped"
    );
  }
  if (dependentFields_infadu.includes(input)) {
    updatedRow.rep_inf_tot_dis_infadu = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_infadu", "rep_inf_ing_tot_ing_infadu"]
    );
    updatedRow.rep_inf_sal_mes_infadu = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_infadu",
      "rep_inf_egr_tot_dos_infadu"
    );
    updatedRow.rep_sol_sol_mes_infadu = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_infadu",
      "rep_sol_nec_mes_infadu"
    );
  }
  if (dependentFields_pfiz.includes(input)) {
    updatedRow.rep_inf_tot_dis_pfiz = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_pfiz", "rep_inf_ing_tot_ing_pfiz"]
    );
    updatedRow.rep_inf_sal_mes_pfiz = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_pfiz",
      "rep_inf_egr_tot_dos_pfiz"
    );
    updatedRow.rep_sol_sol_mes_pfiz = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_pfiz",
      "rep_sol_nec_mes_pfiz"
    );
  }
  if (dependentFields_sino.includes(input)) {
    updatedRow.rep_inf_tot_dis_sino = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_sino", "rep_inf_ing_tot_ing_sino"]
    );
    updatedRow.rep_inf_sal_mes_sino = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_sino",
      "rep_inf_egr_tot_dos_sino"
    );
    updatedRow.rep_sol_sol_mes_sino = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_sino",
      "rep_sol_nec_mes_sino"
    );
  }
  if (dependentFields_cans.includes(input)) {
    updatedRow.rep_inf_tot_dis_cans = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_cans", "rep_inf_ing_tot_ing_cans"]
    );
    updatedRow.rep_inf_sal_mes_cans = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_cans",
      "rep_inf_egr_tot_dos_cans"
    );
    updatedRow.rep_sol_sol_mes_cans = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_cans",
      "rep_sol_nec_mes_cans"
    );
  }
  if (dependentFields_astr.includes(input)) {
    updatedRow.rep_inf_tot_dis_astr = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_astr", "rep_inf_ing_tot_ing_astr"]
    );
    updatedRow.rep_inf_sal_mes_astr = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_astr",
      "rep_inf_egr_tot_dos_astr"
    );
    updatedRow.rep_sol_sol_mes_astr = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_astr",
      "rep_sol_nec_mes_astr"
    );
  }
  if (dependentFields_modr.includes(input)) {
    updatedRow.rep_inf_tot_dis_modr = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_modr", "rep_inf_ing_tot_ing_modr"]
    );
    updatedRow.rep_inf_sal_mes_modr = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_modr",
      "rep_inf_egr_tot_dos_modr"
    );
    updatedRow.rep_sol_sol_mes_modr = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_modr",
      "rep_sol_nec_mes_modr"
    );
  }
  if (dependentFields_virsim.includes(input)) {
    updatedRow.rep_inf_tot_dis_virsim = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_virsim", "rep_inf_ing_tot_ing_virsim"]
    );
    updatedRow.rep_inf_sal_mes_virsim = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_virsim",
      "rep_inf_egr_tot_dos_virsim"
    );
    updatedRow.rep_sol_sol_mes_virsim = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_virsim",
      "rep_sol_nec_mes_virsim"
    );
  }
  if (dependentFields_vacvphcam.includes(input)) {
    updatedRow.rep_inf_tot_dis_vacvphcam = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_vacvphcam", "rep_inf_ing_tot_ing_vacvphcam"]
    );
    updatedRow.rep_inf_sal_mes_vacvphcam = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_vacvphcam",
      "rep_inf_egr_tot_dos_vacvphcam"
    );
    updatedRow.rep_sol_sol_mes_vacvphcam = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_vacvphcam",
      "rep_sol_nec_mes_vacvphcam"
    );
  }
  if (dependentFields_inm_anti.includes(input)) {
    updatedRow.rep_inf_tot_dis_inm_anti = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_inm_anti", "rep_inf_ing_tot_ing_inm_anti"]
    );
    updatedRow.rep_inf_sal_mes_inm_anti = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_inm_anti",
      "rep_inf_egr_tot_dos_inm_anti"
    );
    updatedRow.rep_sol_sol_mes_inm_anti = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_inm_anti",
      "rep_sol_nec_mes_inm_anti"
    );
  }
  if (dependentFields_inm_ant_hep_b.includes(input)) {
    updatedRow.rep_inf_tot_dis_inm_ant_hep_b = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_inm_ant_hep_b", "rep_inf_ing_tot_ing_inm_ant_hep_b"]
    );
    updatedRow.rep_inf_sal_mes_inm_ant_hep_b = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_inm_ant_hep_b",
      "rep_inf_egr_tot_dos_inm_ant_hep_b"
    );
    updatedRow.rep_sol_sol_mes_inm_ant_hep_b = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_inm_ant_hep_b",
      "rep_sol_nec_mes_inm_ant_hep_b"
    );
  }
  if (dependentFields_inm_ant_rrab.includes(input)) {
    updatedRow.rep_inf_tot_dis_inm_ant_rrab = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_inm_ant_rrab", "rep_inf_ing_tot_ing_inm_ant_rrab"]
    );
    updatedRow.rep_inf_sal_mes_inm_ant_rrab = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_inm_ant_rrab",
      "rep_inf_egr_tot_dos_inm_ant_rrab"
    );
    updatedRow.rep_sol_sol_mes_inm_ant_rrab = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_inm_ant_rrab",
      "rep_sol_nec_mes_inm_ant_rrab"
    );
  }
  if (dependentFields_caj_bios.includes(input)) {
    updatedRow.rep_inf_tot_dis_caj_bios = calculateTotal(
      updatedRow,
      prevData,
      row,
      ["rep_inf_sal_ant_caj_bios", "rep_inf_ing_tot_ing_caj_bios"]
    );
    updatedRow.rep_inf_sal_mes_caj_bios = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_tot_dis_caj_bios",
      "rep_inf_egr_tot_dos_caj_bios"
    );
    updatedRow.rep_sol_sol_mes_caj_bios = calculateDifference(
      updatedRow,
      prevData,
      row,
      "rep_inf_sal_mes_caj_bios",
      "rep_sol_nec_mes_caj_bios"
    );
  }
};
