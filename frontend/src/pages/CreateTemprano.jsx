import React, { useState } from "react";
import { tempranoCreateApi } from "../api/temprano.api.js";
import { TempranoList } from "../components/TempranoList";
import { toast } from "react-hot-toast";

const CreateTemprano = () => {
  const [formData, setFormData] = useState({
    tem_fech: "",
    tem_intr: "",
    tem_extr_mies_cnh: "",
    tem_men1_dosi_bcgp: "",
    tem_men1_dosi_hbpr: "",
    tem_men1_dosi_bcgd: "",
    des_bcg_pervacenfabi: "",
    des_bcg_pervacfrasnoabi: "",
    eniUser: "",
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
      const response = await tempranoCreateApi(formData);
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
        <h1 className="text-2xl font-bold mb-5">Crear Temprano</h1>
        {error && <p className="text-red-500 mb-5">{error}</p>}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          {Object.keys(formData).map((key) => {
            let inputType = "text";
            if (key === "tem_fech") {
              inputType = "date";
            } else if (
              key === "tem_intr" ||
              key === "tem_extr_mies_cnh" ||
              key === "tem_men1_dosi_bcgp" ||
              key === "tem_men1_dosi_hbpr" ||
              key === "tem_men1_dosi_bcgd" ||
              key === "des_bcg_pervacenfabi" ||
              key === "des_bcg_pervacfrasnoabi" ||
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
        <TempranoList />
      </div>
    </div>
  );
};

export default CreateTemprano;
