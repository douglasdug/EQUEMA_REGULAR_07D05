import React, { useState } from "react";
import { registroVacunadoCreateApi } from "../api/conexion.api.js";
//import { getDescargarCsvRegistroVacunado } from "../api/conexion.api.js";
import { RegistroVacunadoList } from "../components/RegistroVacunadoList.jsx";
import { RegistroAdmision } from "../components/RegistroAdmision.jsx";
import { AllList } from "../components/listaAdmision.jsx";
import { toast } from "react-hot-toast";

const CreateRegistroVacunado = () => {
  const [formData, setFormData] = useState({
    vac_reg_ano_mes_dia_apli: "",
    vac_reg_punt_vacu: "",
    vac_reg_unic_esta: "",
    vac_reg_nomb_esta_salu: "",
    vac_reg_zona: "",
    vac_reg_dist: "",
    vac_reg_prov: "",
    vac_reg_cant: "",
    vac_reg_apel: "",
    vac_reg_nomb: "",
    vac_reg_tipo_iden: "",
    vac_reg_nume_iden: "",
    vac_reg_sexo: "",
    vac_reg_ano_mes_dia_naci: "",
    vac_reg_naci: "",
    vac_reg_etni: "",
    vac_reg_naci_etni: "",
    vac_reg_pueb: "",
    vac_reg_resi_prov: "",
    vac_reg_resi_cant: "",
    vac_reg_resi_parr: "",
    vac_reg_teld_cont: "",
    vac_reg_corr_elec: "",
    vac_reg_grup_ries: "",
    vac_reg_fase_vacu: 0,
    vac_reg_esta_vacu: "",
    vac_reg_tipo_esqu: "",
    vac_reg_vacu: "",
    vac_reg_lote_vacu: "",
    vac_reg_dosi_apli: 0,
    vac_reg_paci_agen: "",
    vac_reg_nomb_vacu: "",
    vac_reg_iden_vacu: "",
    vac_reg_nomb_prof_regi: "",
    vac_reg_reci_dosi_prev_exte: "",
    vac_reg_nomb_dosi_exte: "",
    vac_reg_fech_anio_mes_dia_dosi_exte: "",
    vac_reg_pais_dosi_exte: "",
    vac_reg_lote_dosi_exte: "",
    eniUser: 1,
  });
  const [error, setError] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const requiredFields = [
    "vac_reg_ano_mes_dia_apli",
    "vac_reg_punt_vacu",
    "vac_reg_unic_esta",
    "vac_reg_nomb_esta_salu",
    "vac_reg_zona",
    "vac_reg_dist",
    "vac_reg_prov",
    "vac_reg_cant",
    "vac_reg_apel",
    "vac_reg_nomb",
    "vac_reg_tipo_iden",
    "vac_reg_nume_iden",
    "vac_reg_sexo",
    "vac_reg_ano_mes_dia_naci",
    "vac_reg_naci",
    "vac_reg_etni",
    "vac_reg_naci_etni",
    "vac_reg_pueb",
    "vac_reg_resi_prov",
    "vac_reg_resi_cant",
    "vac_reg_resi_parr",
    "vac_reg_teld_cont",
    "vac_reg_corr_elec",
    "vac_reg_grup_ries",
    "vac_reg_esta_vacu",
    "vac_reg_tipo_esqu",
    "vac_reg_vacu",
    "vac_reg_lote_vacu",
    "vac_reg_dosi_apli",
    "vac_reg_nomb_vacu",
    "vac_reg_iden_vacu",
    "vac_reg_nomb_prof_regi",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    let isValid = true;
    let formattedValue = value;

    if (e.target.type === "text") {
      formattedValue = value.toUpperCase().replace(/\s{2,}/g, " ");
      isValid = true; // formattedValue.trim() !== ""; Allow empty values for text inputs
    } else if (e.target.type === "number") {
      isValid = value > 0;
    } else if (e.target.type === "date") {
      isValid = !isNaN(new Date(value).getTime());
    }

    if (isValid) {
      setFormData({
        ...formData,
        [name]: formattedValue,
      });
    }

    setIsButtonDisabled(
      !requiredFields.every((field) => {
        const val = field === name ? formattedValue : formData[field];
        if (typeof val === "string") {
          return val.trim() !== "";
        } else if (typeof val === "number") {
          return val > 0;
        } else if (val instanceof Date) {
          return !isNaN(val.getTime());
        }
        return true;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await registroVacunadoCreateApi(formData);
      console.log("Success:", response.data);
      const successMessage = response.data.message || "Operación exitosa";
      toast.success(successMessage, {
        position: "bottom-right",
      });
      window.location.href = "/createRegistroVacunado/";
    } catch (error) {
      let errorMessage = "Hubo un error en la operación";
      if (error.response) {
        if (error.response.data && error.response.data.error) {
          setError(error.response.data.error);
          errorMessage = error.response.data.error;
        } else if (error.response.data && error.response.data.message) {
          setError(error.response.data.message);
          errorMessage = error.response.data.message;
        } else {
          setError("Error del servidor");
        }
      } else if (error.request) {
        setError("No se recibió respuesta del servidor");
      } else {
        setError("Error desconocido");
      }
      toast.error(errorMessage, {
        position: "bottom-right",
      });
    }
  };

  // const fecha_inicio = "2024-09-01";
  // const fecha_fin = "2024-09-30";
  // const eniUser_id = 1;

  // const descargarCsvSubmit = async (e) => {
  //   e.preventDefault();
  //   console.log(fecha_inicio, fecha_fin, eniUser_id);
  //   try {
  //     const response = await getDescargarCsvRegistroVacunado(
  //       fecha_inicio,
  //       fecha_fin,
  //       eniUser_id
  //     );
  //     descargarCsvSuccess(response);
  //   } catch (error) {
  //     descargarCsvError(error);
  //   }
  // };

  // const descargarCsvSuccess = (response) => {
  //   const successMessage = response.data.message || "Operación exitosa";
  //   toast.success(successMessage, { position: "bottom-right" });
  //   // Uso de navigate en lugar de window.location.href
  //   navigate("/createRegistroVacunado/");
  // };

  // const descargarCsvError = (error) => {
  //   let errorMessage = "Hubo un error en la operación";

  //   if (error.response) {
  //     errorMessage =
  //       error.response.data?.error ||
  //       error.response.data?.message ||
  //       "Error del servidor";
  //     setError(errorMessage);
  //   } else if (error.request) {
  //     errorMessage = "No se recibió respuesta del servidor";
  //     setError(errorMessage);
  //   } else {
  //     errorMessage = "Error desconocido";
  //     setError(errorMessage);
  //   }

  //   toast.error(errorMessage, { position: "bottom-right" });
  // };

  const handleButtonClick = (e) => {
    if (isButtonDisabled) {
      e.preventDefault();
      console.log("Todos los campos con * en rojo tienen que estar llenos!");
      toast.error("Todos los campos con * en rojo tienen que estar llenos!", {
        position: "bottom-right",
      });
    }
  };

  const labelMap = {
    vac_reg_ano_mes_dia_apli: "Año/Mes/Día aplicación",
    vac_reg_punt_vacu: "Punto vacunacion",
    vac_reg_unic_esta: "Unicódigo establecimiento",
    vac_reg_nomb_esta_salu: "Nombre establecimiento de salud",
    vac_reg_zona: "Zona",
    vac_reg_dist: "Distrito",
    vac_reg_prov: "Provincia",
    vac_reg_cant: "Canton",
    vac_reg_apel: "Apellidos",
    vac_reg_nomb: "Nombres",
    vac_reg_tipo_iden: "Tipo identificación",
    vac_reg_nume_iden: "Número de identificación",
    vac_reg_sexo: "Sexo",
    vac_reg_ano_mes_dia_naci: "Año/Mes/Día nacimiento",
    vac_reg_naci: "Nacionalidad",
    vac_reg_etni: "Etnia",
    vac_reg_naci_etni: "Nacionalidad étnica",
    vac_reg_pueb: "Pueblo",
    vac_reg_resi_prov: "Residencia provincia",
    vac_reg_resi_cant: "Residencia cantón",
    vac_reg_resi_parr: "Residencia parroquia",
    vac_reg_teld_cont: "Tel. de contacto",
    vac_reg_corr_elec: "Correo electronico",
    vac_reg_grup_ries: "Grupo de riesgo",
    vac_reg_fase_vacu: "Fase vacuna",
    vac_reg_esta_vacu: "Estado vacunación",
    vac_reg_tipo_esqu: "Tipo esquema",
    vac_reg_vacu: "Vacuna",
    vac_reg_lote_vacu: "Lote vacuna",
    vac_reg_dosi_apli: "Dosis aplicada",
    vac_reg_paci_agen: "Paciente agendado",
    vac_reg_nomb_vacu: "Nombre vacunador",
    vac_reg_iden_vacu: "Identificación vacunador",
    vac_reg_nomb_prof_regi: "Nombre del profesional que registra",
    vac_reg_reci_dosi_prev_exte: "Recibió dosis previa exterior",
    vac_reg_nomb_dosi_exte: "Nombre dosis exterior",
    vac_reg_fech_anio_mes_dia_dosi_exte: "Fecha Año/Mes/Día dosis exterior",
    vac_reg_pais_dosi_exte: "Pais dosis exterior",
    vac_reg_lote_dosi_exte: "Lote dosis exterior",
  };

  const groupedFields = [];
  const keys = Object.keys(formData).filter((key) => key !== "eniUser");

  for (let i = 0; i < keys.length; i += 6) {
    groupedFields.push(keys.slice(i, i + 6));
  }

  const selectOptions = {
    vac_reg_punt_vacu: [
      "SAN VICENTE",
      "SAN ISIDRO URBANO",
      "CAÑAS",
      "LA CUCA",
      "CARCABON",
      "CHACRAS",
      "PALMALES",
      "MANABI DE EL ORO",
      "EL PARAISO",
      "LA LIBERTAD",
      "LAS LAJAS",
      "VALLE HERMOSO",
      "SAN ISIDRO RURAL",
      "18 DE NOVIEMBRE",
      "LA PAZ",
      "HUALTACO",
      "HOSPITAL BASICO DE ARENILLAS",
      "HOSPITAL BASICO DE HUAQUILLAS",
      "EL JOBO SAN VICENTE",
      "CENTRO DE SALUD HUAQUILLAS",
      "CENTRO DE SALUD ARENILLAS",
      "PUESTO DE VIGILANCIA HUAQUILLAS",
    ],
    vac_reg_unic_esta: [
      "000541",
      "000542",
      "000543",
      "000544",
      "000545",
      "000546",
      "000547",
      "000548",
      "000549",
      "000550",
      "000551",
      "000552",
      "000553",
      "000554",
      "000555",
      "000556",
      "000591",
      "000592",
      "002763",
      "002879",
      "002900",
      "050748",
    ],
    vac_reg_nomb_esta_salu: [
      "SAN VICENTE",
      "SAN ISIDRO URBANO",
      "CAÑAS",
      "LA CUCA",
      "CARCABON",
      "CHACRAS",
      "PALMALES",
      "MANABI DE EL ORO",
      "EL PARAISO",
      "LA LIBERTAD",
      "LAS LAJAS",
      "VALLE HERMOSO",
      "SAN ISIDRO RURAL",
      "18 DE NOVIEMBRE",
      "LA PAZ",
      "HUALTACO",
      "HOSPITAL BASICO DE ARENILLAS",
      "HOSPITAL BASICO DE HUAQUILLAS",
      "EL JOBO SAN VICENTE",
      "CENTRO DE SALUD HUAQUILLAS",
      "CENTRO DE SALUD ARENILLAS",
      "PUESTO DE VIGILANCIA HUAQUILLAS",
    ],
    vac_reg_zona: ["ZONA 7"],
    vac_reg_dist: ["07D05"],
    vac_reg_prov: ["EL ORO"],
    vac_reg_cant: ["ARENILLAS", "LAS LAJAS", "HUAQUILLAS"],
    vac_reg_tipo_iden: [
      "NO IDENTIFICADO",
      "CÉDULA DE IDENTIDAD",
      "PASAPORTE",
      "VISA",
      "CARNÉT DE REFUGIADO",
    ],
    vac_reg_sexo: ["MUJER", "HOMBRE"],
    vac_reg_naci: [
      "ALEMAN/NA",
      "GRIEGO/GA",
      "GUADALUPEÑO",
      "GUYANES/ESA",
      "HONDUREÑO/A",
      "HINDU; INDIO/DIA",
      "ISRAELI",
      "JAMAIQUINO/NA",
      "KENIANO/NA",
      "KIRQUIS",
      "LETON/NA",
      "LITUANO/NA",
      "MALAUI",
      "MALIENSE",
      "MALI",
      "MAURICIANO/NA",
      "MOLDAVO/VA",
      "MOZAMBIQUEÑO/ÑA",
      "NEERLANDES/SA",
      "NICARAGÜENSE",
      "DE LA ISLA NORFOLK",
      "PALAUANO/NA",
      "PARAGUAYO/A",
      "POLACO/CA",
      "DE SANTA ELENA",
      "A. Y T.",
      "VIETNAMITA",
      "ARGENTINO/NA",
      "BERMUDEÑO/ÑA",
      "BRUNEANO/NA",
      "CABOVERDIANO/NA",
      "CONGOLEÑO/ÑA",
      "ECUATOGUINEANO/NA",
      "POLINESIO",
      "GRANADINO/A",
      "ISLANDES/SA",
      "NORCOREANO/NA",
      "MALGACHE",
      "MONTENEGRINO/NA",
      "NIGERINO/NA",
      "PANAMEÑO/ÑA",
      "ECUATORIANO/A",
      "PUERTORRIQUEÑO",
      "SAHARAUI",
      "DOMINICANO/NA",
      "SAMOANO/NA",
      "DE SAMOA AMERICANA",
      "SANMARINENSE",
      "DE SAN PEDRO Y MIQUELON",
      "SEYCHELLENSE",
      "SIRIO/RIA",
      "CEILANES/SA; CEILANDES; ESRILANQUES/SA",
      "SUDANES/SA",
      "SUECO/CA",
      "SURINAMES/ESA",
      "TAIWANES/SA",
      "TAYIKO/KA",
      "DEL TERRITORIO BRITANICO DEL OCEANO INDICO",
      "TONGANO/NA",
      "TUNECINO/NA",
      "TURCOMANO/NA; TURKMENO/NA",
      "UGANDES/SA",
      "VANUATUENSE",
      "DE WALLIS Y FUTUNA",
      "AFGANO/NA",
      "ALBANES/SA",
      "ARGELINO/NA",
      "ANDORRANO/NA",
      "ANGOLEÑO/ÑA",
      "ANTIGUANO/NA",
      "AZERBAIYANO/NA",
      "AUSTRALIANO/NA",
      "AUSTRIACO/CA",
      "BAHAMEÑO/ÑA",
      "BAREINI",
      "BANGLADESI",
      "ARMENIO/NIA",
      "BARBADENSE",
      "BELGA",
      "BUTANES/SA",
      "BOLIVIANO/A",
      "BOSNIO/NIA",
      "BOTSUANO/NA",
      "DE LA ISLA BOUVET",
      "BRASILEÑO/A",
      "BELICEÑO/ÑA",
      "SALOMONENSE",
      "DE LAS ISLAS VIRGENES",
      "BULGARO/RA",
      "BIRMANO/NA",
      "BURUNDES/SA",
      "BIELORRUSO/SA",
      "CAMBOYANO/NA",
      "CAMERUNES/SA",
      "CANADIENSE",
      "CAIMANES",
      "CENTROAFRICANO/NA",
      "CHANDIANO/NA",
      "CHILENO/A",
      "CHINO/NA",
      "ND",
      "DE LAS ISLAS DE COCOS",
      "COLOMBIANO/A",
      "COMORENSE",
      "MAYOTENSE",
      "DE LAS ISLAS COOK",
      "COSTARRICENSE",
      "CROATA",
      "CUBANO/A",
      "CHIPRIOTA",
      "CHECO/CA",
      "BENINES/SA",
      "DANES/SA",
      "DOMINIQUES",
      "SALVADOREÑO/ÑA",
      "ETIOPE",
      "ERITREO/A",
      "ESTONIO/NIA",
      "FEROES",
      "MALVINENSE",
      "DE ISLAS GEORGIAS DEL SUR Y SANDWICH DEL SUR",
      "FIYANO/FIYANA",
      "FINLANDES/SA",
      "ÅLANDES",
      "FRANCES/SA",
      "GUAYANES",
      "DE LOS TERRITORIOS AUSTRALES FRANCESES",
      "YIBUTIANO/NA",
      "GABONES/SA",
      "GEORGIANO/NA",
      "GAMBIANO/NA",
      "PALESTINO/A",
      "GHANES/SA",
      "GILBRALTAREÑO/ÑA",
      "KIRIBATIANO/NA",
      "GROENLANDES/DESA",
      "GUAMES/SA",
      "GUATEMALTECO/A",
      "GUINEANO/NA",
      "HAITIANO/A",
      "VATICANO/NA",
      "HONGKONES/SA",
      "HUNGARO/RA",
      "INDONES/SA",
      "IRANI",
      "IRAQUI",
      "IRLANDES/SA",
      "ITALIANO/NA",
      "MARFILENO/ÑA",
      "JAPONES/SA",
      "KAZAJO/JA",
      "JORDANO/A",
      "SURCOREANO/NA",
      "KUEATI",
      "LAOSIANO/A",
      "LIBANES/SA",
      "LESOTENSE",
      "LIBERIANO/NA",
      "LIBIO/A",
      "LIECHTENSTEINIANO/NA",
      "LUXEMBURGUES/SA",
      "MACAENSE",
      "MALASIO/SIA",
      "MALDIVO/VA",
      "MALTES/SA",
      "MARTINIQUES",
      "MAURITANO/NA",
      "MEXICANO/A",
      "MONEGASCO/CA",
      "MONGOL/LA",
      "MONTSERRATENSE",
      "MARROQUI",
      "OMANI",
      "NAMIBIO/BIA",
      "NAURUANO/NA",
      "NEPALES/SA; NEPALI",
      "ANTILLANO/NA",
      "ARUBANO/A",
      "NEOCALEDONIO",
      "NEOZELANDES/SA",
      "NIGERIANO /NA",
      "NIUEÑO",
      "NORUEGO/A",
      "DE LAS ISLAS MARIANAS DEL NORTE",
      "MICRONESIO/SIA",
      "MARSHALES/SA",
      "PAKISTANI/PAQUISTANI",
      "PAPU",
      "PERUANO/A",
      "FILIPINO/NA",
      "DE LAS ISLAS PITCAIRN",
      "PORTUGUES/SA",
      "TIMORENSE",
      "CATARI",
      "REUNIONES",
      "RUMANO/NA",
      "RUSO/SA",
      "RUANDES/SA",
      "DE SAN BARTOLOME",
      "CRISTOBALEÑO/ÑA",
      "ANGUILENSE",
      "SANTALUCENSE",
      "SANMARTINENSE",
      "SANVICENTINO/NA",
      "SANTOTOMENSE",
      "SAUDI O SAUDITA",
      "SENEGALES/SA",
      "SERBIO/A",
      "SIERRALEONES/SA",
      "SINGAPURENSE",
      "ESLOVACO/CA",
      "ESLOVENO/NA",
      "SOMALI",
      "SUDAFRICANO/NA",
      "ZIMBABUENSE",
      "ESPAÑOL/LA",
      "SURSUDANES/SA",
      "SVALBARENSE",
      "SUAZI",
      "SUIZO/ZA",
      "TAILANDES/SA",
      "TOGOLES/SA",
      "TOKELAUENSE",
      "TRINITENSE",
      "EMIRATI",
      "TURCO/CA",
      "DE LAS ISLAS TURCAS Y CAICOS",
      "TUVALUANO/NA",
      "UCRANIANO/NA",
      "MACEDONIO/NIA",
      "EGIPCIO/CIA",
      "BRITANICO/CA",
      "GUERNESEYES/SA",
      "JERSEYES/SA",
      "DE LAS ISLAS DE MAN",
      "TANZANO/NA",
      "ESTADOUNIDENSE",
      "DE LAS ISLAS VIRGENES BRITANICAS",
      "BURKINES",
      "URUGUAYO/A",
      "UZBEKO/KA",
      "VENEZOLANO/A",
      "YEMENI",
      "ZAMBIANO/NA",
      "HOLANDES/SA",
      "OTRO",
      "NO DEFINIDO",
    ],
    vac_reg_etni: [
      "INDÍGENA",
      "AFROECUATORIANO/AFRODESCENDIENTE",
      "NEGRO/A",
      "MULATO/A",
      "MONTUBIO/A",
      "MESTIZO/A",
      "BLANCO/A",
      "OTRO/A",
      "NO SABE/NO RESPONDE",
      "NO APLICA",
    ],
    vac_reg_naci_etni: [
      "ACHUAR",
      "AWA",
      "COFAN",
      "CHACHI",
      "EPERA",
      "KICHWA",
      "SECOYA",
      "SHUAR",
      "SHIWIAR",
      "SIONA",
      "TSÁCHILA",
      "WAORANI",
      "ZAPARA",
      "NO SABEMOS/NO RESPONDE",
      "HUANCAVILCA",
      "MANTA",
      "ANDOA",
    ],
    vac_reg_pueb: [
      "CHIBULEO",
      "KARANKI",
      "KAÑARI",
      "KAYAMBI",
      "KISAPINCHA",
      "KITUKARA",
      "NATABUELA",
      "OTAVALO",
      "PALTAS",
      "PANZALEO",
      "PASTOS",
      "PURUHA",
      "SARAGURO",
      "TOMABELA",
      "WARAMKA",
      "NO SABEMOS/NO RESPONDE",
      "SALASAKA",
      "KICHWA AMAZÓNICO",
    ],
    vac_reg_resi_prov: ["EL ORO"],
    vac_reg_resi_cant: ["ARENILLAS", "LAS LAJAS", "HUAQUILLAS"],
    vac_reg_resi_parr: [
      "ARENILLAS",
      "CHACRAS",
      "PALMALES",
      "CARCABON",
      "LA CUCA",
      "ECUADOR",
      "EL PARAISO",
      "HUALTACO",
      "MILTON REYES",
      "UNION LOJANA",
      "HUAQUILLAS",
      "LA VICTORIA (URBANO)",
      "PLATANILLOS",
      "VALLE HERMOSO",
      "LA VICTORIA (RURAL)",
      "LA LIBERTAD",
      "EL PARAISO 2",
      "SAN ISIDRO",
    ],
    vac_reg_grup_ries: [
      "ADULTO MAYOR",
      "BOMBEROS",
      "EDADES EN RIESGO (1 - 17 AÑOS)",
      "GAD (PROVINCIAL",
      "MUNICIPAL",
      "CANTONAL)",
      "OTROS GRUPOS DE RIESGO",
      "PERSONAL DE EDUCACIÓN",
      "PERSONAS CON DISCAPACIDAD",
      "PERSONAS CON ENFERMEDADES CRONICAS",
      "PERSONAS CON TENDENCIA A FORMAR QUELOIDE",
      "PERSONAS PRIVADAS DE LA LIBERTAD",
      "POBLACIÓN GENERAL",
      "PUERPERAS",
      "SECTORES ESTRATÉGICOS",
      "VIAJEROS",
      "AGENTES DE TRÁNSITO",
      "CUIDADORES A PERSONAS VULNERABLES",
      "FUERZAS ARMADAS",
      "MUJERES EMBARAZADAS",
      "PERSONA DE APOYO A RESPUESTA DE PANDEMIA",
      "PERSONAL DE SALUD",
      "PERSONAS CON ENFERMEDADES CATASTRÓFICAS",
      "RARAS O HUÉRFANAS",
      "PERSONAS CON INMUNOSUPRESIÓN",
      "PERSONAS EN SITUACIÓN DE MOVILIDAD (MIGRANTES)",
      "PERSONAS VIVIENDO CON VIH",
      "POLICÍA NACIONAL",
      "RECOLECTORES DE BASURA",
      "TRABAJADORES/AS SEXUALES",
    ],
    vac_reg_esta_vacu: ["NUEVO", "ACTUALIZACION"],
    vac_reg_tipo_esqu: [
      "ESQUEMA CAPTACIÓN TEMPRANA",
      "ESQUEMA CAPTACIÓN TARDÍA",
      "ESQUEMA CAMPAÑA",
    ],
    vac_reg_vacu: [
      "INFLUENZA",
      "CANSINO",
      "BNT162B2 PFIZER",
      "FIPV",
      "BOPV",
      "BCG",
      "ROTAVIRUS",
      "PENTAVALENTE",
      "NEUMOCOCO",
      "IPV",
      "OPV",
      "VARICELA",
      "SRP",
      "VPH",
      "DPT",
      "DT PEDIÁTRICA",
      "DT ADULTO",
      "SR",
      "HB PEDIÁTRICA",
      "HB ADULTO",
      "HB CERO",
      "CORONAVAC SINOVAC",
      "ASTRAZENECA",
      "ABDALA CIGB66",
      "FIEBRE AMARILLA",
      "SOBERANA 02 PLUS",
      "SINOPHARM",
      "NOVAVAX",
      "SPUTNIK V",
      "SOBERANA 02",
      "JANSSEN",
      "MODERNA",
      "JYNNEOS",
      "DT EMBARAZADA",
      "VPH – HOMBRE",
      "VPH – MUJER",
      "SPIKEVAX con historial vacunal",
      "SPIKEVAX mayor de 5 años",
      "SPIKEVAX 6meses a 4años",
      "SPIKEVAX 6 meses con inmunosupresión",
    ],
    vac_reg_reci_dosi_prev_exte: ["SI", "NO"],
  };

  return (
    <div className="container">
      <div className="max-w-max m-auto mt-5">
        <h2 className="text-center text-2xl font-bold mb-5">
          Registrar Vacunado
        </h2>
        <form className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center" key="txtBuscarVacunado">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="txtBuscarVacunado"
              >
                Buscar vacunado:
              </label>
              <input
                type="text"
                id="txtBuscarVacunado"
                name="txtBuscarVacunado"
                //value=""
                onChange={handleChange}
                placeholder="Buscar por cédula"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <div></div>
            </div>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
              Buscar paciente
            </button>
          </div>
        </form>
      </div>
      <div className="mt-5">
        <h1>Provincias lista</h1>
        <AllList />
      </div>
      <div className="mt-5">
        <RegistroAdmision />
      </div>
      <div className="max-w-max m-auto mt-5">
        <h1 className="text-center text-2xl font-bold mb-5">
          Crear Registro de Vacunado
        </h1>
        {error && <p className="text-red-500 mb-5">{error}</p>}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          {groupedFields.map((group, groupIndex) => (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6"
              key={groupIndex}
            >
              {group.map((key) => {
                let inputType;
                if (selectOptions[key]) {
                  return (
                    <div className="mb-2" key={key}>
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor={key}
                      >
                        {labelMap[key]}
                        {requiredFields.includes(key) && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      <select
                        id={key}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      >
                        <option value="">Seleccione una opción</option>
                        {selectOptions[key].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                } else {
                  if (
                    key === "vac_reg_ano_mes_dia_apli" ||
                    key === "vac_reg_ano_mes_dia_naci" ||
                    key === "vac_reg_fech_anio_mes_dia_dosi_exte"
                  ) {
                    inputType = "date";
                  } else if (
                    key === "vac_reg_fase_vacu" ||
                    key === "vac_reg_dosi_apli"
                  ) {
                    inputType = "number";
                  } else if (key === "vac_reg_corr_elec") {
                    inputType = "email";
                  } else {
                    inputType = "text";
                  }
                  return (
                    <div className="mb-2" key={key}>
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor={key}
                      >
                        {labelMap[key]}
                        {requiredFields.includes(key) && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      <input
                        type={inputType}
                        id={key}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        placeholder="Información es requerida"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        min="0"
                      />
                    </div>
                  );
                }
              })}
            </div>
          ))}
          <div className="flex flex-col items-center">
            <button
              type="submit"
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isButtonDisabled}
              onClick={handleButtonClick}
            >
              Crear
            </button>
          </div>
        </form>
      </div>

      <div className="mt-5">
        <RegistroVacunadoList />
      </div>
    </div>
  );
};

export default CreateRegistroVacunado;
