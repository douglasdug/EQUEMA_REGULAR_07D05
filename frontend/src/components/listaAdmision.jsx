import React, { useState } from "react";
import Select from "react-select";
import { listaDinamicaAdmision } from "./AllList.jsx";

export function AllList() {
  const [selectedPais, setSelectedPais] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCanton, setSelectedCanton] = useState("");
  const [selectedParroquia, setSelectedParroquia] = useState("");
  const [provincias, setProvincias] = useState([]);
  const [cantons, setCantons] = useState([]);
  const [parroquias, setParroquias] = useState([]);

  const handlePaisChange = (selectedOption) => {
    const pais = selectedOption ? selectedOption.value : "";
    setSelectedPais(pais);
    setProvincias(listaDinamicaAdmision.adm_dato_naci_prov[pais] || []);
    setSelectedProvince("");
    setCantons([]);
    setSelectedCanton("");
    setParroquias([]);
    setSelectedParroquia("");
  };

  const handleProvinceChange = (event) => {
    const province = event.target.value;
    setSelectedProvince(province);
    setCantons(listaDinamicaAdmision.adm_dato_naci_cant[province] || []);
    setSelectedCanton("");
    setParroquias([]);
    setSelectedParroquia("");
  };

  const handleCantonChange = (event) => {
    const canton = event.target.value;
    setSelectedCanton(canton);
    setParroquias(listaDinamicaAdmision.adm_dato_naci_parr[canton] || []);
    setSelectedParroquia("");
  };

  const handleParroquiaChange = (event) => {
    setSelectedParroquia(event.target.value);
  };

  return (
    <div>
      <div>
        <label htmlFor="pais">País:</label>
        <Select
          id="pais"
          onChange={handlePaisChange}
          value={listaDinamicaAdmision.adm_dato_naci_pais.find(
            (option) => option.value === selectedPais
          )}
          options={listaDinamicaAdmision.adm_dato_naci_pais}
        />
      </div>
      <div>
        <label htmlFor="province">Provincia:</label>
        <select
          id="province"
          onChange={handleProvinceChange}
          value={selectedProvince}
          disabled={!selectedPais}
        >
          <option value="">Seleccione una provincia</option>
          {provincias.map((province) => (
            <option key={province.value} value={province.value}>
              {province.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="canton">Cantón:</label>
        <select
          id="canton"
          onChange={handleCantonChange}
          value={selectedCanton}
          disabled={!selectedProvince}
        >
          <option value="">Seleccione un cantón</option>
          {cantons.map((canton) => (
            <option key={canton.value} value={canton.value}>
              {canton.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="parroquia">Parroquia:</label>
        <select
          id="parroquia"
          onChange={handleParroquiaChange}
          value={selectedParroquia}
          disabled={!selectedCanton}
        >
          <option value="">Seleccione una parroquia</option>
          {parroquias.map((parroquia) => (
            <option key={parroquia.value} value={parroquia.value}>
              {parroquia.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default AllList;
