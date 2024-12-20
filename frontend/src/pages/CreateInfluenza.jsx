import React, { useState, useEffect } from "react";
import {
  registerInfluenza,
  updateInfluenza,
  deleteInfluenza,
} from "../api/conexion.api.js";
import { validarDato, validarRegistroInfluenza } from "../api/validadorUtil.js";
import {
  inputStyle,
  buttonStylePrimario,
  buttonStyleSecundario,
  buttonStyleEliminar,
} from "../components/EstilosCustom.jsx";
import TablaInfluenza from "../components/TablaInfluenza.jsx";
import { toast } from "react-hot-toast";

const getInputType = (key) => {
  if (key === "inf_fech") {
    return { inputType: "date" };
  } else {
    return { inputType: "number" };
  }
};

const CreateInfluenza = () => {
  const storedUserId = localStorage.getItem("userId") || "";
  const storedInputFech =
    localStorage.getItem("dateInputFech") ||
    new Date().toISOString().slice(0, 10);
  const [fechaInput, setFechaInput] = useState("");

  const [formData, setFormData] = useState({
    inf_fech: storedInputFech,
    inf_intr: 0,
    inf_extr_mies_cnh: 0,
    inf_extr_mies_cibv: 0,
    inf_extr_mine_egen: 0,
    inf_extr_mine_bach: 0,
    inf_extr_visi: 0,
    inf_extr_aten: 0,
    inf_otro: 0,
    inf_sexo_homb: 0,
    inf_sexo_muje: 0,
    inf_luga_pert: 0,
    inf_luga_nope: 0,
    inf_naci_ecua: 0,
    inf_naci_colo: 0,
    inf_naci_peru: 0,
    inf_naci_cuba: 0,
    inf_naci_vene: 0,
    inf_naci_otro: 0,
    inf_auto_indi: 0,
    inf_auto_afro: 0,
    inf_auto_negr: 0,
    inf_auto_mula: 0,
    inf_auto_mont: 0,
    inf_auto_mest: 0,
    inf_auto_blan: 0,
    inf_auto_otro: 0,
    inf_naci_achu: 0,
    inf_naci_ando: 0,
    inf_naci_awa: 0,
    inf_naci_chac: 0,
    inf_naci_cofa: 0,
    inf_naci_eper: 0,
    inf_naci_huan: 0,
    inf_naci_kich: 0,
    inf_naci_mant: 0,
    inf_naci_seco: 0,
    inf_naci_shiw: 0,
    inf_naci_shua: 0,
    inf_naci_sion: 0,
    inf_naci_tsac: 0,
    inf_naci_waor: 0,
    inf_naci_zapa: 0,
    inf_pueb_chib: 0,
    inf_pueb_kana: 0,
    inf_pueb_kara: 0,
    inf_pueb_kaya: 0,
    inf_pueb_kich: 0,
    inf_pueb_kisa: 0,
    inf_pueb_kitu: 0,
    inf_pueb_nata: 0,
    inf_pueb_otav: 0,
    inf_pueb_palt: 0,
    inf_pueb_panz: 0,
    inf_pueb_past: 0,
    inf_pueb_puru: 0,
    inf_pueb_sala: 0,
    inf_pueb_sara: 0,
    inf_pueb_toma: 0,
    inf_pueb_wara: 0,
    inf_6a11_prim: 0,
    inf_6a11_segu: 0,
    inf_1ano_dosi: 0,
    inf_2ano_dosi: 0,
    inf_3ano_dosi: 0,
    inf_4ano_dosi: 0,
    inf_5ano_dosi: 0,
    inf_6ano_dosi: 0,
    inf_7ano_dosi: 0,
    inf_65an_dosi: 0,
    inf_emba_dosi: 0,
    inf_8a64_dosi: 0,
    inf_puer_dosi: 0,
    inf_pers_salu_dosi: 0,
    inf_pers_disc_dosi: 0,
    inf_cuid_adul_dosi: 0,
    inf_pers_cuid_dosi: 0,
    inf_trab_avic_dosi: 0,
    inf_ppl_dosi: 0,
    inf_otro_ries_dosi: 0,
    inf_pobl_gene_dosi: 0,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resValidarRegistro = validarRegistroInfluenza(formData, setError);

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
          response = await updateInfluenza(isIdInf, {
            ...formData,
            eniUser: storedUserId,
          });
          setSuccessMessage(resValidarRegistro.message);
          const message = response.message || "Registro actualizado con éxito!";
          toast.success(message, {
            position: "bottom-right",
          });
        } else {
          await registerInfluenza({ ...formData, eniUser: storedUserId });
          setSuccessMessage(resValidarRegistro.message);
          toast.success(resValidarRegistro.message, {
            position: "bottom-right",
          });
        }
        window.location.reload("/create-influenza/");
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
      `¿Estás seguro de que deseas eliminar este registro?\n\nFecha: ${formData.inf_fech}`
    );
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      let inf_fech = formData.inf_fech;
      const [dia, mes, año] = inf_fech.split("/");
      if (dia && mes && año) {
        inf_fech = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
      }
      const dataToSend = {
        eniUser: storedUserId,
        inf_fech: inf_fech,
      };
      const response = await deleteInfluenza(isIdInf, dataToSend);
      setSuccessMessage("Registro eliminado con éxito!");
      const message = response.message || "Registro eliminado con éxito!";
      toast.success(message, {
        position: "bottom-right",
      });
      window.location.reload("/create-Influenza/");
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
    inf_fech: "Fecha",
    inf_intr: "Intramural",
    inf_extr_mies_cnh: "CNH",
    inf_extr_mies_cibv: "CIBV",
    inf_extr_mine_egen: "E. General Básica",
    inf_extr_mine_bach: "Bachillerato",
    inf_extr_visi: "VISITAS DOMICILIARIAS",
    inf_extr_aten: "ATENCIÓN COMUNITARIA",
    inf_otro: "OTROS",
    inf_sexo_homb: "Hombre",
    inf_sexo_muje: "Mujer",
    inf_luga_pert: "Pertenece al establecimiento de salud",
    inf_luga_nope: "No pertenece al establecimiento de salud",
    inf_naci_ecua: "Ecuatoriana",
    inf_naci_colo: "Colombiano",
    inf_naci_peru: "Peruano",
    inf_naci_cuba: "Cubano",
    inf_naci_vene: "Venezolano",
    inf_naci_otro: "Otros",
    inf_auto_indi: "Indigena",
    inf_auto_afro: "Afro ecuatoriano/ Afro descendiente",
    inf_auto_negr: "Negro/a",
    inf_auto_mula: "Mulato/a",
    inf_auto_mont: "Montubio/a",
    inf_auto_mest: "Mestizo/a",
    inf_auto_blan: "Blanco/a",
    inf_auto_otro: "Otro",
    inf_naci_achu: "Achuar",
    inf_naci_ando: "Andoa",
    inf_naci_awa: "Awa",
    inf_naci_chac: "Chachi",
    inf_naci_cofa: "Cofan",
    inf_naci_eper: "Epera",
    inf_naci_huan: "Huancavilca",
    inf_naci_kich: "Kichwa",
    inf_naci_mant: "Manta",
    inf_naci_seco: "Secoya",
    inf_naci_shiw: "Shiwiar",
    inf_naci_shua: "Shuar",
    inf_naci_sion: "Siona",
    inf_naci_tsac: "Tsáchila",
    inf_naci_waor: "Waorani",
    inf_naci_zapa: "Zapara",
    inf_pueb_chib: "Chibuleo",
    inf_pueb_kana: "Kañari",
    inf_pueb_kara: "Karanki",
    inf_pueb_kaya: "Kayambi",
    inf_pueb_kich: "Kichwa Amazónico",
    inf_pueb_kisa: "Kisapincha",
    inf_pueb_kitu: "Kitukara",
    inf_pueb_nata: "Natabuela",
    inf_pueb_otav: "Otavalo",
    inf_pueb_palt: "Paltas",
    inf_pueb_panz: "Panzaleo",
    inf_pueb_past: "Pastos",
    inf_pueb_puru: "Puruha",
    inf_pueb_sala: "Salasaka",
    inf_pueb_sara: "Saraguro",
    inf_pueb_toma: "Tomabela",
    inf_pueb_wara: "Waramka",
    inf_6a11_prim: "Primera dosis",
    inf_6a11_segu: "Segunda dosis ",
    inf_1ano_dosi: "Dosis Única",
    inf_2ano_dosi: "Dosis Única",
    inf_3ano_dosi: "Dosis Única",
    inf_4ano_dosi: "Dosis Única",
    inf_5ano_dosi: "Dosis Única",
    inf_6ano_dosi: "Dosis Única",
    inf_7ano_dosi: "Dosis Única",
    inf_65an_dosi: "Dosis Única",
    inf_emba_dosi: "Dosis Única",
    inf_8a64_dosi: "Dosis Única",
    inf_puer_dosi: "Dosis Única",
    inf_pers_salu_dosi: "Dosis Única",
    inf_pers_disc_dosi: "Dosis Única",
    inf_cuid_adul_dosi: "Dosis Única",
    inf_pers_cuid_dosi: "Dosis Única",
    inf_trab_avic_dosi: "Dosis Única",
    inf_ppl_dosi: "Dosis Única",
    inf_otro_ries_dosi: "Dosis Única",
    inf_pobl_gene_dosi: "Dosis Única",
  };

  const keys = Object.keys(formData);
  const [showAutoIndi, setShowAutoIndi] = useState(false);
  const [showNaciKich, setShowNaciKich] = useState(false);

  const handleChange = (e) => {
    validarDato(e, formData, setFormData);
    const { name, value } = e.target;
    if (value >= 0 || name === "inf_fech") {
      setFormData({
        ...formData,
        [name]: value,
      });
      if (name === "inf_fech") {
        setFechaInput(e.target.value);
      }
    }
    if (name === "inf_auto_indi") {
      setShowAutoIndi(value >= 1);
    }
    if (name === "inf_naci_kich") {
      setShowNaciKich(value >= 1);
    }
  };

  const limpiarVariables = () => {
    setFormData({
      inf_fech: storedInputFech,
      inf_intr: 0,
      inf_extr_mies_cnh: 0,
      inf_extr_mies_cibv: 0,
      inf_extr_mine_egen: 0,
      inf_extr_mine_bach: 0,
      inf_extr_visi: 0,
      inf_extr_aten: 0,
      inf_otro: 0,
      inf_sexo_homb: 0,
      inf_sexo_muje: 0,
      inf_luga_pert: 0,
      inf_luga_nope: 0,
      inf_naci_ecua: 0,
      inf_naci_colo: 0,
      inf_naci_peru: 0,
      inf_naci_cuba: 0,
      inf_naci_vene: 0,
      inf_naci_otro: 0,
      inf_auto_indi: 0,
      inf_auto_afro: 0,
      inf_auto_negr: 0,
      inf_auto_mula: 0,
      inf_auto_mont: 0,
      inf_auto_mest: 0,
      inf_auto_blan: 0,
      inf_auto_otro: 0,
      inf_naci_achu: 0,
      inf_naci_ando: 0,
      inf_naci_awa: 0,
      inf_naci_chac: 0,
      inf_naci_cofa: 0,
      inf_naci_eper: 0,
      inf_naci_huan: 0,
      inf_naci_kich: 0,
      inf_naci_mant: 0,
      inf_naci_seco: 0,
      inf_naci_shiw: 0,
      inf_naci_shua: 0,
      inf_naci_sion: 0,
      inf_naci_tsac: 0,
      inf_naci_waor: 0,
      inf_naci_zapa: 0,
      inf_pueb_chib: 0,
      inf_pueb_kana: 0,
      inf_pueb_kara: 0,
      inf_pueb_kaya: 0,
      inf_pueb_kich: 0,
      inf_pueb_kisa: 0,
      inf_pueb_kitu: 0,
      inf_pueb_nata: 0,
      inf_pueb_otav: 0,
      inf_pueb_palt: 0,
      inf_pueb_panz: 0,
      inf_pueb_past: 0,
      inf_pueb_puru: 0,
      inf_pueb_sala: 0,
      inf_pueb_sara: 0,
      inf_pueb_toma: 0,
      inf_pueb_wara: 0,
      inf_6a11_prim: 0,
      inf_6a11_segu: 0,
      inf_1ano_dosi: 0,
      inf_2ano_dosi: 0,
      inf_3ano_dosi: 0,
      inf_4ano_dosi: 0,
      inf_5ano_dosi: 0,
      inf_6ano_dosi: 0,
      inf_7ano_dosi: 0,
      inf_65an_dosi: 0,
      inf_emba_dosi: 0,
      inf_8a64_dosi: 0,
      inf_puer_dosi: 0,
      inf_pers_salu_dosi: 0,
      inf_pers_disc_dosi: 0,
      inf_cuid_adul_dosi: 0,
      inf_pers_cuid_dosi: 0,
      inf_trab_avic_dosi: 0,
      inf_ppl_dosi: 0,
      inf_otro_ries_dosi: 0,
      inf_pobl_gene_dosi: 0,
    });
    setError({});
    setSuccessMessage(null);
    setBotonEstado({
      btnBuscar: true,
      btnLimpiar: false,
      btnRegistrarInf: false,
    });
    setIsInputEstado({
      input: false,
    });
  };

  useEffect(() => {
    const resValidarRegistro = validarRegistroInfluenza(formData);
    setBotonEstado({
      btnRegistrarInf: !resValidarRegistro.success,
    });
  }, [formData]);

  const txtBtnRegAct = isInputEstado.input
    ? "Actualizar Registro"
    : "Registrar";

  return (
    <div className="container">
      <div className="max-w-max m-auto mt-5">
        <h1 className="text-center text-2xl font-bold mb-1">Crear Influenza</h1>
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
                    ].includes(key);
                    const isNaciKich = [
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
                    ].includes(key);
                    const isNaciKich = [
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
              id="btnRegistrarInf"
              name="btnRegistrarInf"
              className={`${buttonStylePrimario} ${
                botonEstado.btnRegistrarInf
                  ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
              }`}
              disabled={botonEstado.btnRegistrarInf}
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
        <TablaInfluenza
          setIsIdInf={setIsIdInf}
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

export default CreateInfluenza;
