import { useEffect, useState } from "react";
import { getAllTemprano } from "../api/temprano.api.js";
import { useNavigate } from "react-router-dom";

export function TempranoList({}) {
  const navigate = useNavigate();
  const [temprano, setTemprano] = useState([]);

  useEffect(() => {
    async function loadTemprano() {
      const res = await getAllTemprano(1, 9, 2024);
      setTemprano(res.data);
    }
    loadTemprano();
  }, []);

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left rtl:text-right text-gray-100 dark:text-gray-100">
        <thead className="text-xs text-gray-100 uppercase bg-gray-50 dark:bg-gray-100 dark:text-gray-100">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider"
            >
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Intramural
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
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
              BCG primeras 24 horas de nacido
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HB primeras 24 horas de nacido
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              *BCG desde el 2do día de nacido hasta los 364 días (Tardía)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Rotavirus
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              fIPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Neumococo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Pentavalente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Rotavirus
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              fIPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Neumococo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Pentavalente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              bOPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Neumococo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Pentavalente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SRP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              FA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Varicela
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              SRP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              bOPV
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
              HPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              HPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              dT adulto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              TOTAL
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Usuario
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {temprano.map((temprano) => (
            <tr
              key={temprano.id}
              className={
                temprano.tem_tota
                  ? "bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                  : ""
              }
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button
                  className="hover:underline"
                  onClick={() => navigate(`/temprano/${temprano.id}`)}
                >
                  {temprano.tem_tota ? "TOTAL" : temprano.tem_fech}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {temprano.tem_intr}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_extr_mies_cnh}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_extr_mies_cibv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_extr_mine_egen}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_extr_mine_bach}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_extr_visi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_extr_aten}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_otro}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_sexo_homb}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_sexo_muje}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_luga_pert}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_luga_nope}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_ecua}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_colo}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_peru}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_cuba}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_vene}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_otro}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_auto_indi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_auto_afro}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_auto_negr}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_auto_mula}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_auto_mont}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_auto_mest}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_auto_blan}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_auto_otro}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_achu}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_ando}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_awa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_chac}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_cofa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_eper}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_huan}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_kich}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_mant}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_seco}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_shiw}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_shua}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_sion}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_tsac}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_waor}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_naci_zapa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_chib}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_kana}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_kara}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_kaya}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_kich}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_kisa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_kitu}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_nata}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_otav}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_palt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_panz}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_past}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_puru}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_sala}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_sara}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_toma}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_pueb_wara}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_men1_dosi_bcgp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_men1_dosi_hbpr}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_men1_dosi_bcgd}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_men1_1rad_rota}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_men1_1rad_fipv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_men1_1rad_neum}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_men1_1rad_pent}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_men1_2dad_rota}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_men1_2dad_fipv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_men1_2dad_neum}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_men1_2dad_pent}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_men1_3rad_bopv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_men1_3rad_neum}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_men1_3rad_pent}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_12a23m_1rad_srp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_12a23m_dosi_fa}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_12a23m_dosi_vari}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_12a23m_2dad_srp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_12a23m_4tad_bopv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_12a23m_4tad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_5ano_5tad_bopv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_5ano_5tad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_9ano_1rad_hpv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_9ano_2dad_hpv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_10an_2dad_hpv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {temprano.tem_15an_terc_dtad}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {temprano.tem_tota.toString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {temprano.eniUser}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
