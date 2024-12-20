import React, { useState, useEffect } from "react";
import {
  registerTemprano,
  updateTemprano,
  deleteTemprano,
} from "../api/conexion.api.js";
import { validarDato, validarRegistroTemprano } from "../api/validadorUtil.js";
import {
  inputStyle,
  buttonStylePrimario,
  buttonStyleSecundario,
  buttonStyleEliminar,
} from "../components/EstilosCustom.jsx";
import TablaTemprano from "../components/TablaTemprano.jsx";
import { toast } from "react-hot-toast";

const getInputType = (key) => {
  if (key === "tem_fech") {
    return { inputType: "date" };
  } else {
    return { inputType: "number" };
  }
};

const CreateTemprano = () => {
  const storedUserId = localStorage.getItem("userId") || "";
  const storedInputFech =
    localStorage.getItem("dateInputFech") ||
    new Date().toISOString().slice(0, 10);
  const [fechaInput, setFechaInput] = useState("");

  const [formData, setFormData] = useState({
    tem_fech: storedInputFech,
    tem_intr: 0,
    tem_extr_mies_cnh: 0,
    tem_extr_mies_cibv: 0,
    tem_extr_mine_egen: 0,
    tem_extr_mine_bach: 0,
    tem_extr_visi: 0,
    tem_extr_aten: 0,
    tem_otro: 0,
    tem_sexo_homb: 0,
    tem_sexo_muje: 0,
    tem_luga_pert: 0,
    tem_luga_nope: 0,
    tem_naci_ecua: 0,
    tem_naci_colo: 0,
    tem_naci_peru: 0,
    tem_naci_cuba: 0,
    tem_naci_vene: 0,
    tem_naci_otro: 0,
    tem_auto_indi: 0,
    tem_auto_afro: 0,
    tem_auto_negr: 0,
    tem_auto_mula: 0,
    tem_auto_mont: 0,
    tem_auto_mest: 0,
    tem_auto_blan: 0,
    tem_auto_otro: 0,
    tem_naci_achu: 0,
    tem_naci_ando: 0,
    tem_naci_awa: 0,
    tem_naci_chac: 0,
    tem_naci_cofa: 0,
    tem_naci_eper: 0,
    tem_naci_huan: 0,
    tem_naci_kich: 0,
    tem_naci_mant: 0,
    tem_naci_seco: 0,
    tem_naci_shiw: 0,
    tem_naci_shua: 0,
    tem_naci_sion: 0,
    tem_naci_tsac: 0,
    tem_naci_waor: 0,
    tem_naci_zapa: 0,
    tem_pueb_chib: 0,
    tem_pueb_kana: 0,
    tem_pueb_kara: 0,
    tem_pueb_kaya: 0,
    tem_pueb_kich: 0,
    tem_pueb_kisa: 0,
    tem_pueb_kitu: 0,
    tem_pueb_nata: 0,
    tem_pueb_otav: 0,
    tem_pueb_palt: 0,
    tem_pueb_panz: 0,
    tem_pueb_past: 0,
    tem_pueb_puru: 0,
    tem_pueb_sala: 0,
    tem_pueb_sara: 0,
    tem_pueb_toma: 0,
    tem_pueb_wara: 0,
    tem_men1_dosi_bcgp: 0,
    tem_men1_dosi_hbpr: 0,
    tem_men1_dosi_bcgd: 0,
    tem_men1_1rad_rota: 0,
    tem_men1_1rad_fipv: 0,
    tem_men1_1rad_neum: 0,
    tem_men1_1rad_pent: 0,
    tem_men1_2dad_rota: 0,
    tem_men1_2dad_fipv: 0,
    tem_men1_2dad_neum: 0,
    tem_men1_2dad_pent: 0,
    tem_men1_3rad_bopv: 0,
    tem_men1_3rad_neum: 0,
    tem_men1_3rad_pent: 0,
    tem_12a23m_1rad_srp: 0,
    tem_12a23m_dosi_fa: 0,
    tem_12a23m_dosi_vari: 0,
    tem_12a23m_2dad_srp: 0,
    tem_12a23m_4tad_bopv: 0,
    tem_12a23m_4tad_dpt: 0,
    tem_5ano_5tad_bopv: 0,
    tem_5ano_5tad_dpt: 0,
    tem_9ano_1rad_hpv: 0,
    tem_9ano_2dad_hpv: 0,
    tem_10an_2dad_hpv: 0,
    tem_15an_terc_dtad: 0,
  });

  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isInputEstado, setIsInputEstado] = useState({
    input: false,
    tem_fech: false,
  });

  const [botonEstado, setBotonEstado] = useState({
    btnBuscar: true,
    btnLimpiar: false,
    btnRegistrarTem: true,
  });
  const [isIdTem, setIsIdTem] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resValidarRegistro = validarRegistroTemprano(formData, setError);

    if (isLoading) return;
    setIsLoading(true);
    setError({});
    let errorMessage = "Hubo un error en la operación";
    if (!storedUserId) {
      setError({ eniUser: "El usuario no está autenticado." });
      return;
    }

    // Lógica para enviar los datos al servidor
    try {
      let response;
      if (resValidarRegistro.success) {
        if (isInputEstado.input) {
          response = await updateTemprano(isIdTem, {
            ...formData,
            eniUser: storedUserId,
          });
          setSuccessMessage(resValidarRegistro.message);
          const message = response.message || "Registro actualizado con éxito!";
          toast.success(message, {
            position: "bottom-right",
          });
        } else {
          await registerTemprano({ ...formData, eniUser: storedUserId });
          setSuccessMessage(resValidarRegistro.message);
          toast.success(resValidarRegistro.message, {
            position: "bottom-right",
          });
        }
        window.location.reload("/create-temprano/");
      } else {
        // Hubo un error en la validación
        setError(resValidarRegistro.error);
        toast.error(resValidarRegistro.error, {
          position: "bottom-right",
        });
      }
    } catch (error) {
      const getErrorMessage = (error) => {
        if (error.response?.data) {
          const data = error.response.data;
          if (typeof data === "object") {
            const firstKey = Object.keys(data)[0];
            const firstError = data[firstKey];
            if (Array.isArray(firstError) && firstError.length > 0) {
              return firstError[0];
            } else if (typeof firstError === "string") {
              return firstError;
            } else if (data.message) {
              return data.message;
            } else if (data.error) {
              return data.error;
            }
          } else if (typeof data === "string") {
            return data;
          }
        } else if (error.request) {
          return "No se recibió respuesta del servidor";
        } else if (error.message) {
          return error.message;
        }
        return "Error desconocido";
      };
      errorMessage = getErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage, { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar este registro?\n\nFecha: ${formData.tem_fech}`
    );
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      let tem_fech = formData.tem_fech;
      const [dia, mes, año] = tem_fech.split("/");
      if (dia && mes && año) {
        tem_fech = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
      }
      const dataToSend = {
        eniUser: storedUserId,
        tem_fech: tem_fech,
      };
      const response = await deleteTemprano(isIdTem, dataToSend);
      setSuccessMessage("Registro eliminado con éxito!");
      const message = response.message || "Registro eliminado con éxito!";
      toast.success(message, {
        position: "bottom-right",
      });
      window.location.reload("/create-temprano/");
    } catch (error) {
      let errorMessage = "Hubo un error en la operación";
      if (error.response) {
        if (error.response?.data?.error) {
          setError(error.response.data.error);
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
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
      toast.error(errorMessage, { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const labelMap = {
    tem_fech: "Fecha",
    tem_intr: "Intramural",
    tem_extr_mies_cnh: "CNH",
    tem_extr_mies_cibv: "CIBV",
    tem_extr_mine_egen: "E. General Básica",
    tem_extr_mine_bach: "Bachillerato",
    tem_extr_visi: "VISITAS DOMICILIARIAS",
    tem_extr_aten: "ATENCIÓN COMUNITARIA",
    tem_otro: "OTROS",
    tem_sexo_homb: "Hombre",
    tem_sexo_muje: "Mujer",
    tem_luga_pert: "Pertenece al establecimiento de salud",
    tem_luga_nope: "No pertenece al establecimiento de salud",
    tem_naci_ecua: "Ecuatoriana",
    tem_naci_colo: "Colombiano",
    tem_naci_peru: "Peruano",
    tem_naci_cuba: "Cubano",
    tem_naci_vene: "Venezolano",
    tem_naci_otro: "Otros",
    tem_auto_indi: "Indigena",
    tem_auto_afro: "Afro ecuatoriano/ Afro descendiente",
    tem_auto_negr: "Negro/a",
    tem_auto_mula: "Mulato/a",
    tem_auto_mont: "Montubio/a",
    tem_auto_mest: "Mestizo/a",
    tem_auto_blan: "Blanco/a",
    tem_auto_otro: "Otro",
    tem_naci_achu: "Achuar",
    tem_naci_ando: "Andoa",
    tem_naci_awa: "Awa",
    tem_naci_chac: "Chachi",
    tem_naci_cofa: "Cofan",
    tem_naci_eper: "Epera",
    tem_naci_huan: "Huancavilca",
    tem_naci_kich: "Kichwa",
    tem_naci_mant: "Manta",
    tem_naci_seco: "Secoya",
    tem_naci_shiw: "Shiwiar",
    tem_naci_shua: "Shuar",
    tem_naci_sion: "Siona",
    tem_naci_tsac: "Tsáchila",
    tem_naci_waor: "Waorani",
    tem_naci_zapa: "Zapara",
    tem_pueb_chib: "Chibuleo",
    tem_pueb_kana: "Kañari",
    tem_pueb_kara: "Karanki",
    tem_pueb_kaya: "Kayambi",
    tem_pueb_kich: "Kichwa Amazónico",
    tem_pueb_kisa: "Kisapincha",
    tem_pueb_kitu: "Kitukara",
    tem_pueb_nata: "Natabuela",
    tem_pueb_otav: "Otavalo",
    tem_pueb_palt: "Paltas",
    tem_pueb_panz: "Panzaleo",
    tem_pueb_past: "Pastos",
    tem_pueb_puru: "Puruha",
    tem_pueb_sala: "Salasaka",
    tem_pueb_sara: "Saraguro",
    tem_pueb_toma: "Tomabela",
    tem_pueb_wara: "Waramka",
    tem_men1_dosi_bcgp: "BCG primeras 24 horas de nacido",
    tem_men1_dosi_hbpr: "HB primeras 24 horas de nacido",
    tem_men1_dosi_bcgd:
      "*BCG desde el 2do  día de nacido hasta los 364 días (Tardía)",
    tem_men1_1rad_rota: "Rotavirus",
    tem_men1_1rad_fipv: "fIPV",
    tem_men1_1rad_neum: "Neumococo",
    tem_men1_1rad_pent: "Pentavalente",
    tem_men1_2dad_rota: "Rotavirus",
    tem_men1_2dad_fipv: "fIPV",
    tem_men1_2dad_neum: "Neumococo",
    tem_men1_2dad_pent: "Pentavalente",
    tem_men1_3rad_bopv: "bOPV",
    tem_men1_3rad_neum: "Neumococo",
    tem_men1_3rad_pent: "Pentavalente",
    tem_12a23m_1rad_srp: "SRP",
    tem_12a23m_dosi_fa: "FA",
    tem_12a23m_dosi_vari: "Varicela",
    tem_12a23m_2dad_srp: "SRP",
    tem_12a23m_4tad_bopv: "bOPV",
    tem_12a23m_4tad_dpt: "DPT",
    tem_5ano_5tad_bopv: "bOPV",
    tem_5ano_5tad_dpt: "DPT",
    tem_9ano_1rad_hpv: "HPV",
    tem_9ano_2dad_hpv: "HPV",
    tem_10an_2dad_hpv: "HPV",
    tem_15an_terc_dtad: "dT adulto",
  };

  const keys = Object.keys(formData);
  const [showAutoIndi, setShowAutoIndi] = useState(false);
  const [showNaciKich, setShowNaciKich] = useState(false);

  const handleChange = (e) => {
    validarDato(e, formData, setFormData);
    const { name, value } = e.target;
    if (value >= 0 || name === "tem_fech") {
      setFormData({
        ...formData,
        [name]: value,
      });
      if (name === "tem_fech") {
        setFechaInput(e.target.value);
      }
    }
    if (name === "tem_auto_indi") {
      setShowAutoIndi(value >= 1);
    }
    if (name === "tem_naci_kich") {
      setShowNaciKich(value >= 1);
    }
  };

  const limpiarVariables = () => {
    setFormData({
      tem_fech: storedInputFech,
      tem_intr: 0,
      tem_extr_mies_cnh: 0,
      tem_extr_mies_cibv: 0,
      tem_extr_mine_egen: 0,
      tem_extr_mine_bach: 0,
      tem_extr_visi: 0,
      tem_extr_aten: 0,
      tem_otro: 0,
      tem_sexo_homb: 0,
      tem_sexo_muje: 0,
      tem_luga_pert: 0,
      tem_luga_nope: 0,
      tem_naci_ecua: 0,
      tem_naci_colo: 0,
      tem_naci_peru: 0,
      tem_naci_cuba: 0,
      tem_naci_vene: 0,
      tem_naci_otro: 0,
      tem_auto_indi: 0,
      tem_auto_afro: 0,
      tem_auto_negr: 0,
      tem_auto_mula: 0,
      tem_auto_mont: 0,
      tem_auto_mest: 0,
      tem_auto_blan: 0,
      tem_auto_otro: 0,
      tem_naci_achu: 0,
      tem_naci_ando: 0,
      tem_naci_awa: 0,
      tem_naci_chac: 0,
      tem_naci_cofa: 0,
      tem_naci_eper: 0,
      tem_naci_huan: 0,
      tem_naci_kich: 0,
      tem_naci_mant: 0,
      tem_naci_seco: 0,
      tem_naci_shiw: 0,
      tem_naci_shua: 0,
      tem_naci_sion: 0,
      tem_naci_tsac: 0,
      tem_naci_waor: 0,
      tem_naci_zapa: 0,
      tem_pueb_chib: 0,
      tem_pueb_kana: 0,
      tem_pueb_kara: 0,
      tem_pueb_kaya: 0,
      tem_pueb_kich: 0,
      tem_pueb_kisa: 0,
      tem_pueb_kitu: 0,
      tem_pueb_nata: 0,
      tem_pueb_otav: 0,
      tem_pueb_palt: 0,
      tem_pueb_panz: 0,
      tem_pueb_past: 0,
      tem_pueb_puru: 0,
      tem_pueb_sala: 0,
      tem_pueb_sara: 0,
      tem_pueb_toma: 0,
      tem_pueb_wara: 0,
      tem_men1_dosi_bcgp: 0,
      tem_men1_dosi_hbpr: 0,
      tem_men1_dosi_bcgd: 0,
      tem_men1_1rad_rota: 0,
      tem_men1_1rad_fipv: 0,
      tem_men1_1rad_neum: 0,
      tem_men1_1rad_pent: 0,
      tem_men1_2dad_rota: 0,
      tem_men1_2dad_fipv: 0,
      tem_men1_2dad_neum: 0,
      tem_men1_2dad_pent: 0,
      tem_men1_3rad_bopv: 0,
      tem_men1_3rad_neum: 0,
      tem_men1_3rad_pent: 0,
      tem_12a23m_1rad_srp: 0,
      tem_12a23m_dosi_fa: 0,
      tem_12a23m_dosi_vari: 0,
      tem_12a23m_2dad_srp: 0,
      tem_12a23m_4tad_bopv: 0,
      tem_12a23m_4tad_dpt: 0,
      tem_5ano_5tad_bopv: 0,
      tem_5ano_5tad_dpt: 0,
      tem_9ano_1rad_hpv: 0,
      tem_9ano_2dad_hpv: 0,
      tem_10an_2dad_hpv: 0,
      tem_15an_terc_dtad: 0,
    });
    setError({});
    setSuccessMessage(null);
    setBotonEstado({
      btnBuscar: true,
      btnLimpiar: false,
      btnRegistrarTem: false,
    });
    setIsInputEstado({
      input: false,
    });
  };

  useEffect(() => {
    const resValidarRegistro = validarRegistroTemprano(formData);
    setBotonEstado({
      btnRegistrarTem: !resValidarRegistro.success,
    });
  }, [formData]);

  const txtBtnRegAct = isInputEstado.input
    ? "Actualizar Registro"
    : "Registrar";

  return (
    <div className="container">
      <div className="max-w-max m-auto mt-5">
        <h1 className="text-center text-2xl font-bold mb-1">Crear Temprano</h1>
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
                  {keys.map((key, index) => {
                    const isAutoIndi = [
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
                    ].includes(key);
                    const isNaciKich = [
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
                    ].includes(key);
                    if (isAutoIndi && !showAutoIndi) {
                      return null; // No renderizar este th si no debe ser visible
                    }
                    if (isNaciKich && !showNaciKich) {
                      return null; // No renderizar este th si no debe ser visible
                    }
                    return (
                      <th
                        key={key}
                        className={`border ${
                          index === 0 ? "w-36 px-8 py-2" : "w-20 px-0 py-2"
                        }`}
                      >
                        <div className="transform -rotate-90 h-24 flex justify-start items-center">
                          {labelMap[key]}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {keys.map((key) => {
                    const { inputType } = getInputType(key);
                    const isAutoIndi = [
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
                    ].includes(key);
                    const isNaciKich = [
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
                    ].includes(key);
                    if (isAutoIndi && !showAutoIndi) {
                      return null; // No renderizar este input si no debe ser visible
                    }
                    if (isNaciKich && !showNaciKich) {
                      return null; // No renderizar este th si no debe ser visible
                    }
                    return (
                      <td key={key} className="border px-0 py-0">
                        <input
                          type={inputType}
                          id={key}
                          name={key}
                          value={formData[key]}
                          onChange={handleChange}
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
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center mt-4">
            <button
              type="submit"
              id="btnRegistrarTem"
              name="btnRegistrarTem"
              className={`${buttonStylePrimario} ${
                botonEstado.btnRegistrarTem
                  ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
              }`}
              disabled={botonEstado.btnRegistrarTem}
              onClick={handleSubmit}
            >
              {txtBtnRegAct}
            </button>
            <button
              type="button"
              id="btnLimpiar"
              name="btnLimpiar"
              className={buttonStyleSecundario}
              onClick={limpiarVariables}
            >
              Limpiar
            </button>
            {isInputEstado.input && (
              <button
                type="button"
                id="btnEliminar"
                name="btnEliminar"
                className={buttonStyleEliminar}
                onClick={handleDelete}
              >
                Eliminar registro
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="mt-5">
        <TablaTemprano
          setIsIdTem={setIsIdTem}
          setFormData={setFormData}
          storedUserId={parseInt(storedUserId)}
          fechaInput={fechaInput}
          setBotonEstado={setBotonEstado}
          setIsInputEstado={setIsInputEstado}
          setIsLoading={setIsLoading}
          setSuccessMessage={setSuccessMessage}
          setError={setError}
        />
      </div>
    </div>
  );
};

export default CreateTemprano;
