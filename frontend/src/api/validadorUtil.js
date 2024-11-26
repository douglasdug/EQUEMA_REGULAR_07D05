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

export const validarRegistro = (formData) => {
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

  if (totalPersonas + totalVacunas >= 1 && formData.tem_fech !== "") {
    if (
      totalIntExt === totalSex &&
      totalSex === totalLugPer &&
      totalLugPer === totalNac &&
      totalNac === totalAut
    ) {
      if (totalNacOtr === Number(formData.tem_auto_otro)) {
        if (Number(formData.tem_auto_indi) === totalNacIndi) {
          if (Number(formData.tem_naci_kich) === totalPue) {
            const vacunasArray = [
              totalSex,
              totalVacunas,
              sumarCampos(formData, [
                "tem_men1_dosi_bcgp",
                "tem_men1_dosi_bcgd",
              ]),
              Number(formData.tem_men1_dosi_hbpr),
              sumarCampos(formData, [
                "tem_men1_1rad_rota",
                "tem_men1_2dad_rota",
              ]),
              sumarCampos(formData, [
                "tem_men1_1rad_fipv",
                "tem_men1_2dad_fipv",
              ]),
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
              sumarCampos(formData, [
                "tem_12a23m_1rad_srp",
                "tem_12a23m_2dad_srp",
              ]),
              Number(formData.tem_12a23m_dosi_fa),
              Number(formData.tem_12a23m_dosi_vari),
              sumarCampos(formData, [
                "tem_12a23m_4tad_dpt",
                "tem_5ano_5tad_dpt",
              ]),
              sumarCampos(formData, [
                "tem_9ano_1rad_hpv",
                "tem_9ano_2dad_hpv",
                "tem_10an_2dad_hpv",
              ]),
              Number(formData.tem_15an_terc_dtad),
            ];
            console.log(vacunasArray);
            if (
              vacunasArray[0] <= vacunasArray[1] &&
              vacunasArray[0] >= vacunasArray[2] &&
              vacunasArray[0] >= vacunasArray[3] &&
              vacunasArray[0] >= vacunasArray[4] &&
              vacunasArray[0] >= vacunasArray[5] &&
              vacunasArray[0] >= vacunasArray[6] &&
              vacunasArray[0] >= vacunasArray[7] &&
              vacunasArray[0] >= vacunasArray[8] &&
              vacunasArray[0] >= vacunasArray[9] &&
              vacunasArray[0] >= vacunasArray[10] &&
              vacunasArray[0] >= vacunasArray[11] &&
              vacunasArray[0] >= vacunasArray[12] &&
              vacunasArray[0] >= vacunasArray[13] &&
              vacunasArray[0] >= vacunasArray[14]
            ) {
              // Registro válido
              return { success: true, message: mensajesError.messRegVac };
            } else {
              // Error en vacunas aplicadas
              return { success: false, error: mensajesError.errVacApl };
            }
          } else {
            // Error en KICHWA y PUEBLOS
            return { success: false, error: mensajesError.errKic };
          }
        } else {
          // Error en INDÍGENA y NACIONALIDAD ÉTNICA
          return { success: false, error: mensajesError.errInd };
        }
      } else {
        // Error en NACIONALIDAD OTRO y AUTOIDENTIFICACIÓN OTRO
        return { success: false, error: mensajesError.errNacOtr };
      }
    } else {
      // Error en INTRA-EXTRA, SEXO, RESIDENCIA, NACIONALIDAD, ÉTNICA
      return { success: false, error: mensajesError.errIntExtSexResNacEtn };
    }
  } else {
    // Error en registro en cero
    return { success: false, error: mensajesError.errCero };
  }
};
