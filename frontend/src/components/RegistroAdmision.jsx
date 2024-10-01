import React, { useState } from "react";
import { listAdmision } from "./AllList.jsx";

export function RegistroAdmision() {
  const [formData, setFormData] = useState({
    adm_dato_pers_tipo_iden: "",
    adm_dato_pers_nume_iden: "",
    adm_dato_pers_apel: "",
    adm_dato_pers_nomb: "",
    adm_dato_pers_esta_civi: "",
    adm_dato_pers_sexo: "",
    adm_dato_pers_tele: "",
    adm_dato_pers_celu: "",
    adm_dato_pers_corr_elec: "",
    adm_dato_naci_pais: "",
    adm_dato_naci_naci: "",
    adm_dato_naci_luga_naci: "",
    adm_dato_naci_prov: "",
    adm_dato_naci_cant: "",
    adm_dato_naci_parr: "",
    adm_dato_naci_fech_naci: "",
    adm_dato_resi_pais_resi: "",
    adm_dato_resi_prov: "",
    adm_dato_resi_cant: "",
    adm_dato_resi_parr: "",
    adm_dato_resi_call_prin: "",
    adm_dato_resi_nume: "",
    adm_dato_resi_call_secu: "",
    adm_dato_resi_barr: "",
    adm_dato_resi_refe_resi: "",
    adm_dato_adic_auto_etni: "",
    adm_dato_adic_naci_etni: "",
    adm_dato_adic_pueb_kich: "",
    adm_dato_adic_nive_educ: "",
    adm_dato_adic_esta_nive_educ: "",
    adm_dato_adic_tipo_empr_trab: "",
    adm_dato_adic_ocup_prin: "",
    adm_dato_adic_segu_salu_prin: "",
    adm_dato_adic_segu_salu_secu: "",
    adm_dato_adic_tipo_bono_reci: "",
    adm_dato_adic_tien_disc: "",
    adm_dato_repr_tipo_iden: "",
    adm_dato_repr_nume_iden: "",
    adm_dato_repr_naci: "",
    adm_dato_repr_apel: "",
    adm_dato_repr_nomb: "",
    adm_dato_repr_reci_bono: "",
    adm_dato_repr_pare: "",
    adm_dato_repr_nume_tele: "",
    adm_dato_cont_enca_nece_llam: "",
    adm_dato_cont_pare: "",
    adm_dato_cont_tele: "",
    adm_dato_cont_dire: "",
    eniUser: 1,
  });
  const [error, setError] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const requiredFields = [
    "adm_dato_pers_tipo_iden",
    "adm_dato_pers_nume_iden",
    "adm_dato_pers_apel",
    "adm_dato_pers_nomb",
    "adm_dato_pers_esta_civi",
    "adm_dato_pers_sexo",
    "adm_dato_pers_celu",
    "adm_dato_pers_corr_elec",
    "adm_dato_naci_pais",
    "adm_dato_naci_naci",
    "adm_dato_naci_luga_naci",
    "adm_dato_naci_fech_naci",
    "adm_dato_resi_pais_resi",
    "adm_dato_resi_prov",
    "adm_dato_resi_cant",
    "adm_dato_resi_parr",
    "adm_dato_resi_call_prin",
    "adm_dato_resi_barr",
    "adm_dato_resi_refe_resi",
    "adm_dato_adic_auto_etni",
    "adm_dato_adic_nive_educ",
    "adm_dato_adic_esta_nive_educ",
    "adm_dato_adic_tipo_empr_trab",
    "adm_dato_adic_ocup_prin",
    "adm_dato_adic_segu_salu_prin",
    "adm_dato_adic_tipo_bono_reci",
    "adm_dato_adic_tien_disc",
    "adm_dato_repr_tipo_iden",
    "adm_dato_repr_nume_iden",
    "adm_dato_repr_naci",
    "adm_dato_repr_apel",
    "adm_dato_repr_nomb",
    "adm_dato_repr_reci_bono",
    "adm_dato_repr_pare",
    "adm_dato_repr_nume_tele",
    "adm_dato_cont_enca_nece_llam",
    "adm_dato_cont_pare",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    let isValid = true;
    let formattedValue = value;

    if (e.target.type === "text") {
      formattedValue = value.toUpperCase().replace(/\s{2,}/g, " ");
      isValid = true; // formattedValue.trim() !== ""; Allow empty values for text inputs
    } else if (e.target.type === "number") {
      isValid = value > 0;
    } else if (e.target.type === "date") {
      isValid = !isNaN(new Date(value).getTime());
    }

    if (isValid) {
      setFormData({
        ...formData,
        [name]: formattedValue,
      });
    }

    setIsButtonDisabled(
      !requiredFields.every((field) => {
        const val = field === name ? formattedValue : formData[field];
        if (typeof val === "string") {
          return val.trim() !== "";
        } else if (typeof val === "number") {
          return val > 0;
        } else if (val instanceof Date) {
          return !isNaN(val.getTime());
        }
        return true;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await registroVacunadoCreateApi(formData);
      console.log("Success:", response.data);
      const successMessage = response.data.message || "Operación exitosa";
      toast.success(successMessage, {
        position: "bottom-right",
      });
      window.location.href = "/createRegistroVacunado/";
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
      console.log("Todos los campos con * en rojo tienen que estar llenos!");
      toast.error("Todos los campos con * en rojo tienen que estar llenos!", {
        position: "bottom-right",
      });
    }
  };

  const labelMap = {
    adm_dato_pers_tipo_iden: "Tipo de Identificación",
    adm_dato_pers_nume_iden: "Número de Identificación",
    adm_dato_pers_apel: "Apellidos",
    adm_dato_pers_nomb: "Nombres",
    adm_dato_pers_esta_civi: "Estado Civil",
    adm_dato_pers_sexo: "Sexo",
    adm_dato_pers_tele: "Teléfono",
    adm_dato_pers_celu: "Celular",
    adm_dato_pers_corr_elec: "Correo electronico",
    adm_dato_naci_naci: "Nacionalidad",
    adm_dato_naci_luga_naci: "Lugar de Nacimiento",
    adm_dato_naci_prov: "Provincia",
    adm_dato_naci_cant: "Cantón",
    adm_dato_naci_parr: "Parroquia",
    adm_dato_naci_fech_naci: "Fecha de Nacimiento",
    adm_dato_naci_pais: "País",
    adm_dato_resi_pais_resi: "País de Residencia",
    adm_dato_resi_prov: "Provincia",
    adm_dato_resi_cant: "Cantón",
    adm_dato_resi_parr: "Parroquia",
    adm_dato_resi_call_prin: "Calle Principal",
    adm_dato_resi_nume: "Número",
    adm_dato_resi_call_secu: "Calle Secundaria",
    adm_dato_resi_barr: "Barrio",
    adm_dato_resi_refe_resi: "Referencia de Residencia",
    adm_dato_adic_auto_etni: "Autoidentificación Étnica",
    adm_dato_adic_naci_etni: "Nacionalidad Étnica/Pueblos",
    adm_dato_adic_pueb_kich: "Pueblos Kichwa",
    adm_dato_adic_nive_educ: "Nivel de Educación",
    adm_dato_adic_esta_nive_educ: "Estado de Nivel de Educación",
    adm_dato_adic_tipo_empr_trab: "Tipo de Empresa de Trabajo",
    adm_dato_adic_ocup_prin: "Ocupación/Profesión Principal",
    adm_dato_adic_segu_salu_prin: "Seguro de Salud Principal",
    adm_dato_adic_segu_salu_secu: "Seguro de Salud Secundario",
    adm_dato_adic_tipo_bono_reci: "Tipo de Bono que recibe",
    adm_dato_adic_tien_disc: "Tiene discapacidad?",
    adm_dato_repr_tipo_iden: "Tipo de Identificación",
    adm_dato_repr_nume_iden: "Número de Identificación",
    adm_dato_repr_naci: "Nacionalidad",
    adm_dato_repr_apel: "Apellidos",
    adm_dato_repr_nomb: "Nombres",
    adm_dato_repr_reci_bono: "Recibe Bono",
    adm_dato_repr_pare: "Parentesco",
    adm_dato_repr_nume_tele: "Número telefónico",
    adm_dato_cont_enca_nece_llam: "En caso necesario llamar a?",
    adm_dato_cont_pare: "Parentesco",
    adm_dato_cont_tele: "Teléfono",
    adm_dato_cont_dire: "Dirección",
  };

  const groupedFields = [];
  const keys = Object.keys(formData).filter((key) => key !== "eniUser");

  for (let i = 0; i < keys.length; i += 6) {
    groupedFields.push(keys.slice(i, i + 6));
  }

  return (
    <div className="container">
      <div className="max-w-max m-auto mt-5">
        <h1 className="text-center text-2xl font-bold mb-5">
          Admision de Registro de Vacunado
        </h1>
        {error && <p className="text-red-500 mb-5">{error}</p>}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          {groupedFields.map((group, groupIndex) => (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6"
              key={group.join("-")}
            >
              {group.map((key) => {
                let inputType;
                if (listAdmision[key]) {
                  return (
                    <div className="mb-2" key={key}>
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor={key}
                      >
                        {labelMap[key]}
                        {requiredFields.includes(key) && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      <select
                        id={key}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      >
                        <option value="">Seleccione una opción</option>
                        {listAdmision[key].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                } else {
                  if (key === "adm_dato_naci_fech_naci") {
                    inputType = "date";
                  } else if (key === "adm_dato_pers_corr_elec") {
                    inputType = "email";
                  } else {
                    inputType = "text";
                  }
                  return (
                    <div className="mb-2" key={key}>
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor={key}
                      >
                        {labelMap[key]}
                        {requiredFields.includes(key) && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      <input
                        type={inputType}
                        id={key}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        placeholder="Información es requerida"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        min="0"
                      />
                    </div>
                  );
                }
              })}
            </div>
          ))}
          <div className="flex flex-col items-center">
            <button
              type="submit"
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isButtonDisabled}
              onClick={handleButtonClick}
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
