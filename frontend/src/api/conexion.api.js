import axios from "axios";

const registroVacunadoApi = axios.create({
  baseURL: "http://localhost:8000/api/v1/registrovacunado",
});

export const getAllRegistroVacunado = (user_id, month, year) =>
  registroVacunadoApi.get(`/?user_id=${user_id}&month=${month}&year=${year}`);

export const registroVacunadoCreateApi = (formData) =>
  registroVacunadoApi.post("/", formData);
