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
              DOSIS BCGP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DOSIS HBPR
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
              DOSIS BCGD
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
                {temprano.tem_extr_mies_cnh}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {temprano.tem_men1_dosi_bcgp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {temprano.tem_men1_dosi_hbpr}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {temprano.tem_men1_dosi_bcgd}
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
