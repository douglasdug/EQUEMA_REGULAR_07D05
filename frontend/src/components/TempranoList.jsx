import { useEffect, useState } from "react";
import { getAllTemprano } from "../api/temprano.api.js";
import { useNavigate } from "react-router-dom";

export function TempranoList({}) {
  const navigate = useNavigate();
  const [temprano, setTemprano] = useState([]);

  useEffect(() => {
    async function loadTemprano() {
      const res = await getAllTemprano(4, 9, 2024);
      setTemprano(res.data);
    }
    loadTemprano();
  }, []);

  const totaltem_intr = temprano.reduce((acc, curr) => acc + curr.tem_intr, 0);
  const totaltem_extr_mies_cnh = temprano.reduce(
    (acc, curr) => acc + curr.tem_extr_mies_cnh,
    0
  );
  const totaltem_extr_mies_cibv = temprano.reduce(
    (acc, curr) => acc + curr.tem_extr_mies_cibv,
    0
  );
  const totaltem_extr_mine_egen = temprano.reduce(
    (acc, curr) => acc + curr.tem_extr_mine_egen,
    0
  );
  const totaltem_extr_mine_bach = temprano.reduce(
    (acc, curr) => acc + curr.tem_extr_mine_bach,
    0
  );

  return (
    <div className="relative overflow-x-auto">
      <div className="grid grid-cols-[repeat(15,_minmax(0,_1fr))] border border-gray-400">
        {/* Encabezados */}
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          Fecha
        </div>
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          Intramural
        </div>
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          CNH
        </div>
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          CIBV
        </div>
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          E. General Básica
        </div>
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          Bachillerato
        </div>
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          VISITAS DOMICILIARIAS
        </div>
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          ATENCIÓN COMUNITARIA
        </div>
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          OTROS
        </div>
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          Hombre
        </div>
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          Mujer
        </div>
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          Pertenece al establecimiento de salud
        </div>
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          No pertenece al establecimiento de salud
        </div>
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          Si es Total
        </div>
        <div className="font-bold bg-gray-200 p-2 text-center border border-gray-400">
          Usuario
        </div>

        {/* Filas de datos */}
        {temprano.map((temprano) => (
          <div key={temprano.id} className="contents">
            <button
              className="border border-gray-300 p-1 text-center bg-slate-50 hover:bg-slate-100 hover:cursor-pointer"
              onClick={() => navigate(`/temprano/${temprano.id}`)}
            >
              {temprano.tem_fech}
            </button>
            <div className="border border-gray-300 p-1 text-center bg-slate-50">
              {temprano.tem_intr}
            </div>
            <div className="border border-gray-300 p-1 text-center bg-slate-50">
              {temprano.tem_extr_mies_cnh}
            </div>
            <div className="border border-gray-300 p-1 text-center bg-slate-50">
              {temprano.tem_extr_mies_cibv}
            </div>
            <div className="border border-gray-300 p-1 text-center bg-slate-50">
              {temprano.tem_extr_mine_egen}
            </div>
            <div className="border border-gray-300 p-1 text-center bg-slate-50">
              {temprano.tem_extr_mine_bach}
            </div>
            <div className="border border-gray-300 p-1 text-center bg-slate-50">
              {temprano.tem_extr_visi}
            </div>
            <div className="border border-gray-300 p-1 text-center bg-slate-50">
              {temprano.tem_extr_aten}
            </div>
            <div className="border border-gray-300 p-1 text-center bg-slate-50">
              {temprano.tem_otro}
            </div>
            <div className="border border-gray-300 p-1 text-center bg-slate-50">
              {temprano.tem_sexo_homb}
            </div>
            <div className="border border-gray-300 p-1 text-center bg-slate-50">
              {temprano.tem_sexo_muje}
            </div>
            <div className="border border-gray-300 p-1 text-center bg-slate-50">
              {temprano.tem_luga_pert}
            </div>
            <div className="border border-gray-300 p-1 text-center bg-slate-50">
              {temprano.tem_luga_nope}
            </div>
            <div className="border border-gray-300 p-1 text-center bg-slate-50">
              {temprano.tem_tota.toString()}
            </div>
            <div className="border border-gray-300 p-1 text-center bg-slate-50">
              {temprano.eniUser}
            </div>
          </div>
        ))}

        {/* Fila de Totales */}
        <div className="font-bold bg-gray-100 p-1 text-center border border-gray-400">
          Total:
        </div>
        <div className="font-bold bg-gray-100 p-1 text-center border border-gray-400">
          {totaltem_intr}
        </div>
        <div className="font-bold bg-gray-100 p-1 text-center border border-gray-400">
          {totaltem_extr_mies_cnh}
        </div>
        <div className="font-bold bg-gray-100 p-1 text-center border border-gray-400">
          {totaltem_extr_mies_cibv}
        </div>
        <div className="font-bold bg-gray-100 p-1 text-center border border-gray-400">
          {totaltem_extr_mine_egen}
        </div>
        <div className="font-bold bg-gray-100 p-1 text-center border border-gray-400">
          {totaltem_extr_mine_bach}
        </div>
        <div className="font-bold bg-gray-100 p-1 text-center border border-gray-400">
          {/* Espacio vacío o cualquier otro dato */}
        </div>
        <div className="font-bold bg-gray-100 p-1 text-center border border-gray-400">
          {/* Puedes sumar el total de todos los valores si lo necesitas */}
        </div>
        <div className="font-bold bg-gray-100 p-1 text-center border border-gray-400">
          {/* Espacio vacío o cualquier otro dato */}
        </div>
        <div className="font-bold bg-gray-100 p-1 text-center border border-gray-400">
          {/* Puedes sumar el total de todos los valores si lo necesitas */}
        </div>
        <div className="bg-gray-100 p-1 text-center border border-gray-400">
          {/* Espacio vacío o cualquier otro dato */}
        </div>
        <div className="font-bold bg-gray-100 p-1 text-center border border-gray-400">
          {/* Puedes sumar el total de todos los valores si lo necesitas */}
        </div>
        <div className="bg-gray-100 p-1 text-center border border-gray-400">
          {/* Espacio vacío o cualquier otro dato */}
        </div>
        <div className="font-bold bg-gray-100 p-1 text-center border border-gray-400">
          {/* Puedes sumar el total de todos los valores si lo necesitas */}
        </div>
        <div className="bg-gray-100 p-1 text-center border border-gray-400">
          {/* Espacio vacío o cualquier otro dato */}
        </div>
      </div>
    </div>
  );
}
