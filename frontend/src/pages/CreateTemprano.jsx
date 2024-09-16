import React, { useState } from "react";
import { tempranoCreateApi } from "../api/temprano.api.js";
import { TempranoList } from "../components/TempranoList";
import { toast } from "react-hot-toast";

const CreateTemprano = () => {
  const [formData, setFormData] = useState({
    tem_fech: "",
    tem_intr: 0,
    tem_extr_mies_cnh: 0,
    tem_extr_mies_cibv: 0,
    tem_extr_mine_egen: 0,
    tem_extr_mine_bach: 0,
    tem_extr_visi: 0,
    tem_extr_aten: 0,
    tem_otro: 0,
    tem_sexo_homb: 0,
    tem_sexo_muje: 0,
    tem_luga_pert: 0,
    tem_luga_nope: 0,
    tem_naci_ecua: 0,
    tem_naci_colo: 0,
    tem_naci_peru: 0,
    tem_naci_cuba: 0,
    tem_naci_vene: 0,
    tem_naci_otro: 0,
    tem_auto_indi: 0,
    tem_auto_afro: 0,
    tem_auto_negr: 0,
    tem_auto_mula: 0,
    tem_auto_mont: 0,
    tem_auto_mest: 0,
    tem_auto_blan: 0,
    tem_auto_otro: 0,
    tem_naci_achu: 0,
    tem_naci_ando: 0,
    tem_naci_awa: 0,
    tem_naci_chac: 0,
    tem_naci_cofa: 0,
    tem_naci_eper: 0,
    tem_naci_huan: 0,
    tem_naci_kich: 0,
    tem_naci_mant: 0,
    tem_naci_seco: 0,
    tem_naci_shiw: 0,
    tem_naci_shua: 0,
    tem_naci_sion: 0,
    tem_naci_tsac: 0,
    tem_naci_waor: 0,
    tem_naci_zapa: 0,
    tem_pueb_chib: 0,
    tem_pueb_kana: 0,
    tem_pueb_kara: 0,
    tem_pueb_kaya: 0,
    tem_pueb_kich: 0,
    tem_pueb_kisa: 0,
    tem_pueb_kitu: 0,
    tem_pueb_nata: 0,
    tem_pueb_otav: 0,
    tem_pueb_palt: 0,
    tem_pueb_panz: 0,
    tem_pueb_past: 0,
    tem_pueb_puru: 0,
    tem_pueb_sala: 0,
    tem_pueb_sara: 0,
    tem_pueb_toma: 0,
    tem_pueb_wara: 0,
    tem_men1_dosi_bcgp: 0,
    tem_men1_dosi_hbpr: 0,
    tem_men1_dosi_bcgd: 0,
    tem_men1_1rad_rota: 0,
    tem_men1_1rad_fipv: 0,
    tem_men1_1rad_neum: 0,
    tem_men1_1rad_pent: 0,
    tem_men1_2dad_rota: 0,
    tem_men1_2dad_fipv: 0,
    tem_men1_2dad_neum: 0,
    tem_men1_2dad_pent: 0,
    tem_men1_3rad_bopv: 0,
    tem_men1_3rad_neum: 0,
    tem_men1_3rad_pent: 0,
    tem_12a23m_1rad_srp: 0,
    tem_12a23m_dosi_fa: 0,
    tem_12a23m_dosi_vari: 0,
    tem_12a23m_2dad_srp: 0,
    tem_12a23m_4tad_bopv: 0,
    tem_12a23m_4tad_dpt: 0,
    tem_5ano_5tad_bopv: 0,
    tem_5ano_5tad_dpt: 0,
    tem_9ano_1rad_hpv: 0,
    tem_9ano_2dad_hpv: 0,
    tem_10an_2dad_hpv: 0,
    tem_15an_terc_dtad: 0,
    eniUser: 1,
  });
  const [error, setError] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (value >= 0 || name === "tem_fech") {
      setFormData({
        ...formData,
        [name]: value,
      });
      setIsButtonDisabled(
        !formData.tem_fech ||
          !Object.values({ ...formData, [name]: value }).some((val) => val > 0)
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await tempranoCreateApi(formData);
      console.log("Success:", response.data);
      const successMessage = response.data.message || "Operación exitosa";
      toast.success(successMessage, {
        position: "bottom-right",
      });
    } catch (error) {
      let errorMessage = "Hubo un error en la operación";

      if (error.response) {
        if (error.response.data && error.response.data.error) {
          setError(error.response.data.error);
          errorMessage = error.response.data.error;
        } else if (error.response.data && error.response.data.message) {
          setError(error.response.data.message);
          errorMessage = error.response.data.message;
        } else {
          setError("Error del servidor");
        }
      } else if (error.request) {
        setError("No se recibió respuesta del servidor");
      } else {
        setError("Error desconocido");
      }

      toast.error(errorMessage, {
        position: "bottom-right",
      });
    }
  };

  const handleButtonClick = (e) => {
    if (isButtonDisabled) {
      e.preventDefault();
      toast.error("Todos los campos tienen que estar llenos!", {
        position: "bottom-right",
      });
    }
  };

  return (
    <div className="container">
      <div className="max-w-md mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-5">Crear Temprano</h1>
        {error && <p className="text-red-500 mb-5">{error}</p>}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          {Object.keys(formData).map((key) => {
            if (key === "eniUser") return null; // Excluir el campo eniUser
            let inputType = "text";
            if (key === "tem_fech") {
              inputType = "date";
            } else {
              inputType = "number";
            }
            return (
              <div className="mb-4" key={key}>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor={key}
                >
                  {key.replace(/_/g, " ")}
                </label>
                <input
                  type={inputType}
                  id={key}
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  placeholder="Ingrese un número"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                />
              </div>
            );
          })}
          <button onClick={handleButtonClick}>
            <div
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={isButtonDisabled}
            >
              Crear
            </div>
          </button>
        </form>
      </div>
      <div className="mt-5">
        <TempranoList />
      </div>
    </div>
  );
};

export default CreateTemprano;
