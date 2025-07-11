import React, { useState } from "react";

const Form008Emergencia = () => {
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    // Lógica para buscar pacientes
    console.log("Buscando paciente:", search);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center space-x-2 max-w-md mx-auto mt-8"
    >
      <input
        type="text"
        placeholder="Buscar paciente"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Buscar
      </button>
    </form>
  );
};

export default Form008Emergencia;
