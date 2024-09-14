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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PRIMERA FIPV
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PRIMERA HBHPE
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              SEGUNDA DPT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              SEGUNDA FIPV
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
                {tardio.tar_1ano_1rad_fipv}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tardio.tar_1ano_1rad_hbpe}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tardio.tar_1ano_1rad_dpt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tardio.tar_1ano_2dad_fipv}
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
