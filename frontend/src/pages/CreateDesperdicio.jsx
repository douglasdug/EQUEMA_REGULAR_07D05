import React, { useState } from "react";
import { desperdicioCreateApi } from "../api/desperdicio.api.js";
import { DesperdicioList } from "../components/DesperdicioList.jsx";
import { toast } from "react-hot-toast";

const CreateDesperdicio = () => {
  const [formData, setFormData] = useState({
    des_fech: "",
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
    eniUser: 1,
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await desperdicioCreateApi(formData);
      console.log("Success:", response.data);
      // Si response.data es un objeto, convierte el mensaje en una cadena de texto
      const successMessage = response.data.message || "Operación exitosa";
      toast.success(successMessage, {
        position: "bottom-right",
      });
    } catch (error) {
      setError(error.response.data.error);
      toast.error("Hubo un error en la operación", {
        position: "bottom-right",
      });
    }
  };

  return (
    <div className="container">
      <div className="max-w-md mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-5">Crear Desperdicio</h1>
        {error && <p className="text-red-500 mb-5">{error}</p>}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          {Object.keys(formData).map((key) => {
            let inputType = "text";
            if (key === "des_fech") {
              inputType = "date";
            } else if (
              key === "des_bcg_dosapli" ||
              key === "des_bcg_pervacenfabi" ||
              key === "des_bcg_pervacfrasnoabi" ||
              key === "des_hbpe_dosapli" ||
              key === "des_hbpe_pervacenfabi" ||
              key === "des_hbpe_pervacfrasnoabi" ||
              key === "des_rota_dosapli" ||
              key === "des_rota_pervacenfabi" ||
              key === "des_rota_pervacfrasnoabi" ||
              key === "des_pent_dosapli" ||
              key === "des_pent_pervacenfabi" ||
              key === "des_pent_pervacfrasnoabi" ||
              key === "des_fipv_dosapli" ||
              key === "des_fipv_pervacenfabi" ||
              key === "des_fipv_pervacfrasnoabi" ||
              key === "des_anti_dosapli" ||
              key === "des_anti_pervacenfabi" ||
              key === "des_anti_pervacfrasnoabi" ||
              key === "des_neum_dosapli" ||
              key === "des_neum_pervacenfabi" ||
              key === "des_neum_pervacfrasnoabi" ||
              key === "des_sr_dosapli" ||
              key === "des_sr_pervacenfabi" ||
              key === "des_sr_pervacfrasnoabi" ||
              key === "des_srp_dosapli" ||
              key === "des_srp_pervacenfabi" ||
              key === "des_srp_pervacfrasnoabi" ||
              key === "des_vari_dosapli" ||
              key === "des_vari_pervacenfabi" ||
              key === "des_vari_pervacfrasnoabi" ||
              key === "des_fieb_dosapli" ||
              key === "des_fieb_pervacenfabi" ||
              key === "des_fieb_pervacfrasnoabi" ||
              key === "des_dift_dosapli" ||
              key === "des_dift_pervacenfabi" ||
              key === "des_dift_pervacfrasnoabi" ||
              key === "des_hpv_dosapli" ||
              key === "des_hpv_pervacenfabi" ||
              key === "des_hpv_pervacfrasnoabi" ||
              key === "des_dtad_dosapli" ||
              key === "des_dtad_pervacenfabi" ||
              key === "des_dtad_pervacfrasnoabi" ||
              key === "des_hepa_dosapli" ||
              key === "des_hepa_pervacenfabi" ||
              key === "des_hepa_pervacfrasnoabi" ||
              key === "des_inmant_dosapli" ||
              key === "des_inmant_pervacenfabi" ||
              key === "des_inmant_pervacfrasnoabi" ||
              key === "des_inmanthepb_dosapli" ||
              key === "des_inmanthepb_pervacenfabi" ||
              key === "des_inmanthepb_pervacfrasnoabi" ||
              key === "des_inmantrra_dosapli" ||
              key === "des_inmantrra_pervacenfabi" ||
              key === "des_inmantrra_pervacfrasnoabi" ||
              key === "des_infped_dosapli" ||
              key === "des_infped_pervacenfabi" ||
              key === "des_infped_pervacfrasnoabi" ||
              key === "des_infadu_dosapli" ||
              key === "des_infadu_pervacenfabi" ||
              key === "des_infadu_pervacfrasnoabi" ||
              key === "des_viru_dosapli" ||
              key === "des_viru_pervacenfabi" ||
              key === "des_viru_pervacfrasnoabi" ||
              key === "des_vacsin_dosapli" ||
              key === "des_vacsin_pervacenfabi" ||
              key === "des_vacsin_pervacfrasnoabi" ||
              key === "des_vacpfi_dosapli" ||
              key === "des_vacpfi_pervacenfabi" ||
              key === "des_vacpfi_pervacfrasnoabi" ||
              key === "des_vacmod_dosapli" ||
              key === "des_vacmod_pervacenfabi" ||
              key === "des_vacmod_pervacfrasnoabi" ||
              key === "des_vacvphcam_dosapli" ||
              key === "des_vacvphcam_pervacenfabi" ||
              key === "des_vacvphcam_pervacfrasnoabi" ||
              key === "eniUser"
            ) {
              inputType = "number";
            }
            return (
              <div className="mb-4" key={key}>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor={key}
                >
                  {key.replace(/_/g, " ")}
                </label>
                <input
                  type={inputType}
                  id={key}
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            );
          })}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Crear
          </button>
        </form>
      </div>
      <div className="mt-5">
        <DesperdicioList />
      </div>
    </div>
  );
};

export default CreateDesperdicio;
