import { useEffect, useState } from "react";
import { getAllDesperdicio } from "../api/desperdicio.api.js";
import { useNavigate } from "react-router-dom";

export function DesperdicioList({}) {
  const navigate = useNavigate();
  const [desperdicio, setDesperdicio] = useState([]);

  useEffect(() => {
    async function loadDesperdicio() {
      const res = await getAllDesperdicio(1, 9, 2024);
      setDesperdicio(res.data);
    }
    loadDesperdicio();
  }, []);

  return (
    <div className="relative overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Dosis aplicadas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco abierto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              Perdida de vacuna en frasco no abierto
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
          {desperdicio.map((desperdicio) => (
            <tr
              key={desperdicio.id}
              className={desperdicio.des_tota ? "font-bold" : ""}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button
                  className="hover:underline"
                  onClick={() => navigate(`/desperdicio/${desperdicio.id}`)}
                >
                  {desperdicio.des_tota ? "TOTAL" : desperdicio.des_fech}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_bcg_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_bcg_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_bcg_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_hbpe_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_hbpe_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_hbpe_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_rota_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_rota_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_rota_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_pent_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_pent_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_pent_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_fipv_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_fipv_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_fipv_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_anti_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_anti_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_anti_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_neum_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_neum_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_neum_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_sr_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_sr_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_sr_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_srp_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_srp_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_srp_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vari_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vari_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vari_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_fieb_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_fieb_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_fieb_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_dift_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_dift_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_dift_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_hpv_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_hpv_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_hpv_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_dtad_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_dtad_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_dtad_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_hepa_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_hepa_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_hepa_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_inmant_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_inmant_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_inmant_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_inmanthepb_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_inmanthepb_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_inmanthepb_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_inmantrra_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_inmantrra_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_inmantrra_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_infped_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_infped_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_infped_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_infadu_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_infadu_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_infadu_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_viru_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_viru_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_viru_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vacsin_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vacsin_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vacsin_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vacpfi_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vacpfi_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vacpfi_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vacmod_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vacmod_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vacmod_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vacvphcam_dosapli}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vacvphcam_pervacenfabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {" "}
                {desperdicio.des_vacvphcam_pervacfrasnoabi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {desperdicio.des_tota.toString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {desperdicio.eniUser}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
