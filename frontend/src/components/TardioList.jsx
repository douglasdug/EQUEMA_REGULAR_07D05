import { useEffect, useState } from "react";
import { getAllTardio } from "../api/tardio.api.js";
import { useNavigate } from "react-router-dom";

export function TardioList({}) {
  const navigate = useNavigate();
  const [tardio, setTardio] = useState([]);

  useEffect(() => {
    async function loadTardio() {
      const res = await getAllTardio(1, 9, 2024);
      setTardio(res.data);
    }
    loadTardio();
  }, []);

  return (
    <div className="relative overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Intramural
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              CNH
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              CIBV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              E. General Básica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Bachillerato
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              VISITAS DOMICILIARIAS
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              ATENCIÓN COMUNITARIA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              OTROS
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Hombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Mujer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Pertenece al establecimiento de salud
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              No pertenece al establecimiento de salud
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Ecuatoriana
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Colombiano
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Peruano
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Cubano
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Venezolano
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Otros
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Indigena
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Afro ecuatoriano/ Afro descendiente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Negro/a
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Mulato/a
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Montubio/a
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Mestizo/a
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Blanco/a
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Otro
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Achuar
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Andoa
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Awa
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Chachi
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Cofan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Epera
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Huancavilca
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Kichwa
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Manta
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Secoya
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Shiwiar
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Shuar
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Siona
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Tsáchila
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Waorani
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Zapara
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Chibuleo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Kañari
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Karanki
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Kayambi
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Kichwa Amazónico
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Kisapincha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Kitukara
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Natabuela
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Otavalo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Paltas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Panzaleo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Pastos
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Puruha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Salasaka
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Saraguro
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Tomabela
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Waramka
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              fIPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              fIPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              bOPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              fIPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SRP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              fIPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SRP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              bOPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              bOPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              FA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              fIPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SRP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              fIPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SRP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Bopv
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              bOPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              FA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              fIPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SRP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              fIPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SRP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              bOPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              bOPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              FA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              IPV (Solo en el caso que no tenga historial vacunal de
              poliomielitis)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SRP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              fIPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SRP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              bOPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB pediatrica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              bOPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              FA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SRP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SRP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              FA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SR
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SR
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              FA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              FA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              dT adulto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              FA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              FA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              FA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SR
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SR
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SR
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SR
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SR
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SR
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Primera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Segunda Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Tercera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Cuarta Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Quinta Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Primera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Segunda Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Tercera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Cuarta Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Quinta Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Primera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Segunda Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Tercera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Cuarta Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Quinta Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Primera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Segunda Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Tercera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Primera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Segunda Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Tercera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Primera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Segunda Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Tercera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Primera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Segunda Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Tercera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Primera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Segunda Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Tercera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Primera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Segunda Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Tercera Dosis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Inmunoglobulina_Antitetánica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Inmunoglobulina_Anti Hepatitis B
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Inmunoglobulina_Antirrábica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              TOTAL
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Usuario
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tardio.map((tardio) => (
            <tr key={tardio.id} className={tardio.tar_tota ? "font-bold" : ""}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button
                  className="hover:underline"
                  onClick={() => navigate(`/tardio/${tardio.id}`)}
                >
                  {tardio.tar_tota ? "TOTAL" : tardio.tar_fech}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tardio.tar_intr}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tardio.tar_extr_mies_cnh}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_extr_mies_cibv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_extr_mine_egen}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_extr_mine_bach}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_extr_visi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_extr_aten}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_otro}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_sexo_homb}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_sexo_muje}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_luga_pert}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_luga_nope}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_ecua}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_colo}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_peru}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_cuba}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_vene}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_otro}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_auto_indi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_auto_afro}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_auto_negr}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_auto_mula}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_auto_mont}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_auto_mest}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_auto_blan}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_auto_otro}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_achu}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_ando}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_awa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_chac}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_cofa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_eper}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_huan}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_kich}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_mant}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_seco}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_shiw}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_shua}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_sion}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_tsac}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_waor}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_naci_zapa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_chib}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_kana}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_kara}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_kaya}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_kich}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_kisa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_kitu}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_nata}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_otav}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_palt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_panz}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_past}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_puru}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_sala}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_sara}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_toma}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_pueb_wara}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_1ano_1rad_fipv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_1ano_1rad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_1ano_1rad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_1ano_2dad_fipv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_1ano_2dad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_1ano_2dad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_1ano_3rad_bopv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_1ano_3rad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_1ano_3rad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_2ano_1rad_fipv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_2ano_1rad_srp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_2ano_1rad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_2ano_1rad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_2ano_2dad_fipv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_2ano_2dad_srp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_2ano_2dad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_2ano_2dad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_2ano_3rad_bopv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_2ano_3rad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_2ano_3rad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_2ano_4tad_bopv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_2ano_4tad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_2ano_dosi_fa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_3ano_1rad_fipv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_3ano_1rad_srp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_3ano_1rad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_3ano_1rad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_3ano_2dad_fipv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_3ano_2dad_srp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_3ano_2dad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_3ano_2dad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_3ano_3rad_bopv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_3ano_3rad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_3ano_3rad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_3ano_4tad_bopv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_3ano_4tad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_3ano_dosi_fa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_4ano_1rad_fipv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_4ano_1rad_srp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_4ano_1rad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_4ano_1rad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_4ano_2dad_fipv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_4ano_2dad_srp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_4ano_2dad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_4ano_2dad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_4ano_3rad_bopv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_4ano_3rad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_4ano_3rad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_4ano_4tad_bopv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_4ano_4tad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_4ano_dosi_fa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_5ano_1rad_ipv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_5ano_1rad_srp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_5ano_1rad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_5ano_1rad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_5ano_2dad_fipv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_5ano_2dad_srp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_5ano_2dad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_5ano_2dad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_5ano_3rad_bopv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_5ano_3rad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_5ano_3rad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_5ano_4tad_bopv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_5ano_4tad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_5ano_dosi_fa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_6ano_1rad_srp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_6ano_2dad_srp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_6ano_dosi_fa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_7ano_1rad_sr}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_7ano_2dad_sr}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_7ano_dosi_fa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_8ano_dosi_fa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_7a14_dosi_dtad}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_9a14_dosi_fa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_15a19_dosi_fa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_20a59_dosi_fa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_8a14_1rad_sr}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_8a14_2dad_sr}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_15a29_1rad_sr}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_15a29_2dad_sr}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_30a50_1rad_sr}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_30a50_2dad_sr}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_16a49mefne_dtad_prim}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_16a49mefne_dtad_segu}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_16a49mefne_dtad_terc}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_16a49mefne_dtad_cuar}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_16a49mefne_dtad_quin}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_mefe_dtad_prim}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_mefe_dtad_segu}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_mefe_dtad_terc}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_mefe_dtad_cuar}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_mefe_dtad_quin}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_16a49_dtad_prim}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_16a49_dtad_segu}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_16a49_dtad_terc}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_16a49_dtad_cuar}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_16a49_dtad_quin}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_trasal_prim}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_trasal_segu}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_trasal_terc}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_estsal_prim}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_estsal_segu}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_estsal_terc}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_trasex_prim}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_trasex_segu}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_trasex_terc}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_pervih_prim}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_pervih_segu}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_pervih_terc}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_perppl_prim}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_perppl_segu}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_perppl_terc}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_otro_prim}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_otro_segu}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_hepa_otro_terc}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_inmant}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_inmanthep}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {tardio.tar_inmantrra}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tardio.tar_tota.toString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tardio.eniUser}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
