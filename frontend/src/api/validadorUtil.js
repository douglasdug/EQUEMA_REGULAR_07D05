import { toast } from "react-hot-toast";

export const validarDato = (e, formData, setFormData, error, setError) => {
  const { name, value } = e.target;
  let formattedValue = value;

  if (e.target.type === "text") {
    formattedValue = value.toUpperCase().replace(/\s{2,}/g, " ");
  } else if (e.target.type === "number") {
    formattedValue = value > 0;
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
