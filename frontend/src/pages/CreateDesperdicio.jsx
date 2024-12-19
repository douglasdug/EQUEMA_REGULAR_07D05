import React, { useState, useEffect } from "react";
import {
  registerDesperdicio,
  updateDesperdicio,
  deleteDesperdicio,
} from "../api/conexion.api.js";
import {
  validarDato,
  validarRegistroDesperdicio,
} from "../api/validadorUtil.js";
import {
  inputStyle,
  buttonStylePrimario,
  buttonStyleSecundario,
  buttonStyleEliminar,
} from "../components/EstilosCustom.jsx";
import TablaDesperdicio from "../components/TablaDesperdicio.jsx";
import { toast } from "react-hot-toast";

const getInputType = (key) => {
  if (key === "des_fech") {
    return { inputType: "date" };
  } else {
    return { inputType: "number" };
  }
};

const CreateDesperdicio = () => {
  const storedUserId = localStorage.getItem("userId") || "";
  const storedInputFech =
    localStorage.getItem("dateInputFech") ||
    new Date().toISOString().slice(0, 10);
  const [fechaInput, setFechaInput] = useState("");

  const [formData, setFormData] = useState({
    des_fech: storedInputFech,
    des_bcg_dosapli: 0,
    des_bcg_pervacenfabi: 0,
    des_bcg_pervacfrasnoabi: 0,
    des_hbpe_dosapli: 0,
    des_hbpe_pervacenfabi: 0,
    des_hbpe_pervacfrasnoabi: 0,
    des_rota_dosapli: 0,
    des_rota_pervacenfabi: 0,
    des_rota_pervacfrasnoabi: 0,
    des_pent_dosapli: 0,
    des_pent_pervacenfabi: 0,
    des_pent_pervacfrasnoabi: 0,
    des_fipv_dosapli: 0,
    des_fipv_pervacenfabi: 0,
    des_fipv_pervacfrasnoabi: 0,
    des_anti_dosapli: 0,
    des_anti_pervacenfabi: 0,
    des_anti_pervacfrasnoabi: 0,
    des_neum_dosapli: 0,
    des_neum_pervacenfabi: 0,
    des_neum_pervacfrasnoabi: 0,
    des_sr_dosapli: 0,
    des_sr_pervacenfabi: 0,
    des_sr_pervacfrasnoabi: 0,
    des_srp_dosapli: 0,
    des_srp_pervacenfabi: 0,
    des_srp_pervacfrasnoabi: 0,
    des_vari_dosapli: 0,
    des_vari_pervacenfabi: 0,
    des_vari_pervacfrasnoabi: 0,
    des_fieb_dosapli: 0,
    des_fieb_pervacenfabi: 0,
    des_fieb_pervacfrasnoabi: 0,
    des_dift_dosapli: 0,
    des_dift_pervacenfabi: 0,
    des_dift_pervacfrasnoabi: 0,
    des_hpv_dosapli: 0,
    des_hpv_pervacenfabi: 0,
    des_hpv_pervacfrasnoabi: 0,
    des_dtad_dosapli: 0,
    des_dtad_pervacenfabi: 0,
    des_dtad_pervacfrasnoabi: 0,
    des_hepa_dosapli: 0,
    des_hepa_pervacenfabi: 0,
    des_hepa_pervacfrasnoabi: 0,
    des_inmant_dosapli: 0,
    des_inmant_pervacenfabi: 0,
    des_inmant_pervacfrasnoabi: 0,
    des_inmanthepb_dosapli: 0,
    des_inmanthepb_pervacenfabi: 0,
    des_inmanthepb_pervacfrasnoabi: 0,
    des_inmantrra_dosapli: 0,
    des_inmantrra_pervacenfabi: 0,
    des_inmantrra_pervacfrasnoabi: 0,
    des_infped_dosapli: 0,
    des_infped_pervacenfabi: 0,
    des_infped_pervacfrasnoabi: 0,
    des_infadu_dosapli: 0,
    des_infadu_pervacenfabi: 0,
    des_infadu_pervacfrasnoabi: 0,
    des_viru_dosapli: 0,
    des_viru_pervacenfabi: 0,
    des_viru_pervacfrasnoabi: 0,
    des_vacsin_dosapli: 0,
    des_vacsin_pervacenfabi: 0,
    des_vacsin_pervacfrasnoabi: 0,
    des_vacpfi_dosapli: 0,
    des_vacpfi_pervacenfabi: 0,
    des_vacpfi_pervacfrasnoabi: 0,
    des_vacmod_dosapli: 0,
    des_vacmod_pervacenfabi: 0,
    des_vacmod_pervacfrasnoabi: 0,
    des_vacvphcam_dosapli: 0,
    des_vacvphcam_pervacenfabi: 0,
    des_vacvphcam_pervacfrasnoabi: 0,
  });

  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isInputEstado, setIsInputEstado] = useState({
    input: false,
    des_fech: false,
    des_bcg_dosapli: true,
    des_hbpe_dosapli: true,
    des_rota_dosapli: true,
    des_pent_dosapli: true,
    des_fipv_dosapli: true,
    des_anti_dosapli: true,
    des_neum_dosapli: true,
    des_sr_dosapli: true,
    des_srp_dosapli: true,
    des_vari_dosapli: true,
    des_fieb_dosapli: true,
    des_dift_dosapli: true,
    des_hpv_dosapli: true,
    des_dtad_dosapli: true,
    des_hepa_dosapli: true,
    des_inmant_dosapli: true,
    des_inmanthepb_dosapli: true,
    des_inmantrra_dosapli: true,
    des_infped_dosapli: true,
    des_infadu_dosapli: true,
    des_viru_dosapli: true,
    des_vacsin_dosapli: true,
    des_vacpfi_dosapli: true,
    des_vacmod_dosapli: true,
    des_vacvphcam_dosapli: true,
  });

  const [botonEstado, setBotonEstado] = useState({
    btnBuscar: true,
    btnLimpiar: false,
    btnRegistrarDes: true,
  });
  const [isIdDes, setIsIdDes] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resValidarRegistro = validarRegistroDesperdicio(formData, setError);

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
          response = await updateDesperdicio(isIdDes, {
            ...formData,
            eniUser: storedUserId,
          });
          setSuccessMessage(resValidarRegistro.message);
          const message = response.message || "Registro actualizado con éxito!";
          toast.success(message, {
            position: "bottom-right",
          });
        } else {
          await registerDesperdicio({ ...formData, eniUser: storedUserId });
          setSuccessMessage(resValidarRegistro.message);
          toast.success(resValidarRegistro.message, {
            position: "bottom-right",
          });
        }
        window.location.reload("/create-desperdicio/");
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
      `¿Estás seguro de que deseas eliminar este registro?\n\nFecha: ${formData.des_fech}`
    );
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      let des_fech = formData.des_fech;
      const [dia, mes, año] = des_fech.split("/");
      if (dia && mes && año) {
        des_fech = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
      }
      const dataToSend = {
        eniUser: storedUserId,
        tem_fech: des_fech,
      };
      const response = await deleteDesperdicio(isIdDes, dataToSend);
      setSuccessMessage("Registro eliminado con éxito!");
      const message = response.message || "Registro eliminado con éxito!";
      toast.success(message, {
        position: "bottom-right",
      });
      window.location.reload("/create-desperdicio/");
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
    des_fech: "Fecha",
    des_bcg_dosapli: "Dosis aplicadas",
    des_bcg_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_bcg_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_hbpe_dosapli: "Dosis aplicadas",
    des_hbpe_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_hbpe_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_rota_dosapli: "Dosis aplicadas",
    des_rota_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_rota_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_pent_dosapli: "Dosis aplicadas",
    des_pent_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_pent_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_fipv_dosapli: "Dosis aplicadas",
    des_fipv_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_fipv_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_anti_dosapli: "Dosis aplicadas",
    des_anti_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_anti_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_neum_dosapli: "Dosis aplicadas",
    des_neum_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_neum_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_sr_dosapli: "Dosis aplicadas",
    des_sr_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_sr_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_srp_dosapli: "Dosis aplicadas",
    des_srp_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_srp_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_vari_dosapli: "Dosis aplicadas",
    des_vari_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_vari_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_fieb_dosapli: "Dosis aplicadas",
    des_fieb_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_fieb_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_dift_dosapli: "Dosis aplicadas",
    des_dift_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_dift_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_hpv_dosapli: "Dosis aplicadas",
    des_hpv_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_hpv_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_dtad_dosapli: "Dosis aplicadas",
    des_dtad_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_dtad_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_hepa_dosapli: "Dosis aplicadas",
    des_hepa_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_hepa_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_inmant_dosapli: "Dosis aplicadas",
    des_inmant_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_inmant_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_inmanthepb_dosapli: "Dosis aplicadas",
    des_inmanthepb_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_inmanthepb_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_inmantrra_dosapli: "Dosis aplicadas",
    des_inmantrra_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_inmantrra_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_infped_dosapli: "Dosis aplicadas",
    des_infped_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_infped_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_infadu_dosapli: "Dosis aplicadas",
    des_infadu_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_infadu_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_viru_dosapli: "Dosis aplicadas",
    des_viru_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_viru_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_vacsin_dosapli: "Dosis aplicadas",
    des_vacsin_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_vacsin_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_vacpfi_dosapli: "Dosis aplicadas",
    des_vacpfi_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_vacpfi_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_vacmod_dosapli: "Dosis aplicadas",
    des_vacmod_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_vacmod_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
    des_vacvphcam_dosapli: "Dosis aplicadas",
    des_vacvphcam_pervacenfabi: "Perdida de vacuna en frasco abierto",
    des_vacvphcam_pervacfrasnoabi: "Perdida de vacuna en frasco no abierto",
  };

  const keys = Object.keys(formData);

  const handleChange = (e) => {
    validarDato(e, formData, setFormData);
    const { name, value } = e.target;
    if (value >= 0 || name === "des_fech") {
      setFormData({
        ...formData,
        [name]: value,
      });
      if (name === "des_fech") {
        setFechaInput(e.target.value);
      }
    }
  };

  const limpiarVariables = () => {
    setFormData({
      des_fech: storedInputFech,
      des_bcg_dosapli: 0,
      des_bcg_pervacenfabi: 0,
      des_bcg_pervacfrasnoabi: 0,
      des_hbpe_dosapli: 0,
      des_hbpe_pervacenfabi: 0,
      des_hbpe_pervacfrasnoabi: 0,
      des_rota_dosapli: 0,
      des_rota_pervacenfabi: 0,
      des_rota_pervacfrasnoabi: 0,
      des_pent_dosapli: 0,
      des_pent_pervacenfabi: 0,
      des_pent_pervacfrasnoabi: 0,
      des_fipv_dosapli: 0,
      des_fipv_pervacenfabi: 0,
      des_fipv_pervacfrasnoabi: 0,
      des_anti_dosapli: 0,
      des_anti_pervacenfabi: 0,
      des_anti_pervacfrasnoabi: 0,
      des_neum_dosapli: 0,
      des_neum_pervacenfabi: 0,
      des_neum_pervacfrasnoabi: 0,
      des_sr_dosapli: 0,
      des_sr_pervacenfabi: 0,
      des_sr_pervacfrasnoabi: 0,
      des_srp_dosapli: 0,
      des_srp_pervacenfabi: 0,
      des_srp_pervacfrasnoabi: 0,
      des_vari_dosapli: 0,
      des_vari_pervacenfabi: 0,
      des_vari_pervacfrasnoabi: 0,
      des_fieb_dosapli: 0,
      des_fieb_pervacenfabi: 0,
      des_fieb_pervacfrasnoabi: 0,
      des_dift_dosapli: 0,
      des_dift_pervacenfabi: 0,
      des_dift_pervacfrasnoabi: 0,
      des_hpv_dosapli: 0,
      des_hpv_pervacenfabi: 0,
      des_hpv_pervacfrasnoabi: 0,
      des_dtad_dosapli: 0,
      des_dtad_pervacenfabi: 0,
      des_dtad_pervacfrasnoabi: 0,
      des_hepa_dosapli: 0,
      des_hepa_pervacenfabi: 0,
      des_hepa_pervacfrasnoabi: 0,
      des_inmant_dosapli: 0,
      des_inmant_pervacenfabi: 0,
      des_inmant_pervacfrasnoabi: 0,
      des_inmanthepb_dosapli: 0,
      des_inmanthepb_pervacenfabi: 0,
      des_inmanthepb_pervacfrasnoabi: 0,
      des_inmantrra_dosapli: 0,
      des_inmantrra_pervacenfabi: 0,
      des_inmantrra_pervacfrasnoabi: 0,
      des_infped_dosapli: 0,
      des_infped_pervacenfabi: 0,
      des_infped_pervacfrasnoabi: 0,
      des_infadu_dosapli: 0,
      des_infadu_pervacenfabi: 0,
      des_infadu_pervacfrasnoabi: 0,
      des_viru_dosapli: 0,
      des_viru_pervacenfabi: 0,
      des_viru_pervacfrasnoabi: 0,
      des_vacsin_dosapli: 0,
      des_vacsin_pervacenfabi: 0,
      des_vacsin_pervacfrasnoabi: 0,
      des_vacpfi_dosapli: 0,
      des_vacpfi_pervacenfabi: 0,
      des_vacpfi_pervacfrasnoabi: 0,
      des_vacmod_dosapli: 0,
      des_vacmod_pervacenfabi: 0,
      des_vacmod_pervacfrasnoabi: 0,
      des_vacvphcam_dosapli: 0,
      des_vacvphcam_pervacenfabi: 0,
      des_vacvphcam_pervacfrasnoabi: 0,
    });
    setError({});
    setSuccessMessage(null);
    setBotonEstado({
      btnBuscar: true,
      btnLimpiar: false,
      btnRegistrarDes: false,
    });
    setIsInputEstado({
      input: false,
      des_bcg_dosapli: true,
      des_hbpe_dosapli: true,
      des_rota_dosapli: true,
      des_pent_dosapli: true,
      des_fipv_dosapli: true,
      des_anti_dosapli: true,
      des_neum_dosapli: true,
      des_sr_dosapli: true,
      des_srp_dosapli: true,
      des_vari_dosapli: true,
      des_fieb_dosapli: true,
      des_dift_dosapli: true,
      des_hpv_dosapli: true,
      des_dtad_dosapli: true,
      des_hepa_dosapli: true,
      des_inmant_dosapli: true,
      des_inmanthepb_dosapli: true,
      des_inmantrra_dosapli: true,
      des_infped_dosapli: true,
      des_infadu_dosapli: true,
      des_viru_dosapli: true,
      des_vacsin_dosapli: true,
      des_vacpfi_dosapli: true,
      des_vacmod_dosapli: true,
      des_vacvphcam_dosapli: true,
    });
  };

  useEffect(() => {
    console.log("Fecha CreaDes input: ", fechaInput);
    const resValidarRegistro = validarRegistroDesperdicio(formData);
    setBotonEstado({
      btnRegistrarDes: !resValidarRegistro.success,
    });
  }, [formData]);

  const txtBtnRegAct = isInputEstado.input
    ? "Actualizar Registro"
    : "Registrar";

  return (
    <div className="container">
      <div className="max-w-max m-auto mt-5">
        <h1 className="text-center text-2xl font-bold mb-1">
          Crear Desperdicio
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
                  {keys.map((key, index) => {
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
              id="btnRegistrarDes"
              name="btnRegistrarDes"
              className={`${buttonStylePrimario} ${
                botonEstado.btnRegistrarDes
                  ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
              }`}
              disabled={botonEstado.btnRegistrarDes}
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
        <TablaDesperdicio
          setIsIdDes={setIsIdDes}
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

export default CreateDesperdicio;
