import React, { useState, useEffect } from "react";
import axios from "axios";

const CreateTemprano = () => {
  const [formData, setFormData] = useState({
    tem_fech: "",
    // Otras variables del modelo Temprano
  });
  const [eniUser, setEniUser] = useState(null);

  useEffect(() => {
    // Obtener el ID del usuario actualmente logueado
    axios.get("/api/current_user").then((response) => {
      setEniUser(response.data.id);
    });
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      tem_tota: false,
      eniUser: eniUser,
    };
    axios
      .post("/api/temprano", dataToSend)
      .then((response) => {
        console.log("Registro exitoso:", response.data);
      })
      .catch((error) => {
        console.error("Error al registrar:", error.response.data);
      });
  };

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fecha
          </label>
          <input
            type="date"
            name="tem_fech"
            value={formData.tem_fech}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        {/* Otros campos del formulario */}
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Registrar
        </button>
      </form>
    </div>
  );
};

export default CreateTemprano;
