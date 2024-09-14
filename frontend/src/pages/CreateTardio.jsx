import React, { useState } from "react";
import { tardioCreateApi } from "../api/tardio.api.js";
import { toast } from "react-hot-toast";

const CreateTardio = () => {
  const [formData, setFormData] = useState({
    tar_fech: "",
    tar_intr: "",
    tar_extr_mies_cnh: "",
    tar_1ano_1rad_fipv: "",
    tar_1ano_1rad_hbpe: "",
    tar_1ano_1rad_dpt: "",
    tar_1ano_2dad_fipv: "",
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
      const response = await tardioCreateApi(formData);
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
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-5">Crear Tardio</h1>
      {error && <p className="text-red-500 mb-5">{error}</p>}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        {Object.keys(formData).map((key) => {
          let inputType = "text";
          if (key === "tar_fech") {
            inputType = "date";
          } else if (
            key === "tar_intr" ||
            key === "tar_extr_mies_cnh" ||
            key === "tar_1ano_1rad_fipv" ||
            key === "tar_1ano_1rad_hbpe" ||
            key === "tar_1ano_1rad_dpt" ||
            key === "tar_1ano_2dad_fipv" ||
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
  );
};

export default CreateTardio;
