// src/components/CreateTemprano.jsx
import React, { useState } from "react";
import axios from "axios";

const CreateTemprano = () => {
  const [formData, setFormData] = useState({
    tem_fech: "",
    tem_intr: "",
    tem_extr_mies_cnh: "",
    tem_extr_mies_cibv: "",
    tem_extr_mine_egen: "",
    tem_extr_mine_bach: "",
    tem_extr_visi: "",
    tem_extr_aten: "",
    tem_otro: "",
    tem_sexo_homb: "",
    tem_sexo_muje: "",
    tem_luga_pert: "",
    tem_luga_nope: "",
    tem_naci_ecua: "",
    tem_naci_colo: "",
    tem_naci_peru: "",
    tem_naci_cuba: "",
    tem_naci_vene: "",
    tem_naci_otro: "",
    tem_tota: false,
    eniUser: null,
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/api/v1/temprano/", formData);
      alert("Formulario enviado con éxito");
    } catch (error) {
      console.error("Error al enviar el formulario", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto p-4 bg-white shadow-md rounded-lg"
    >
      <div className="mb-4">
        <label className="block text-gray-700">Fecha</label>
        <input
          type="date"
          name="tem_fech"
          value={formData.tem_fech}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded mt-1"
        />
      </div>
      {/* Repite el siguiente bloque para cada campo del formulario */}
      <div className="mb-4">
        <label className="block text-gray-700">Intervenciones</label>
        <input
          type="number"
          name="tem_intr"
          value={formData.tem_intr}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded mt-1"
        />
      </div>
      {/* Añade más campos aquí */}
      <button
        type="submit"
        className="bg-indigo-500 text-white p-2 rounded mt-4 w-full"
      >
        Enviar
      </button>
    </form>
  );
};

export default CreateTemprano;
