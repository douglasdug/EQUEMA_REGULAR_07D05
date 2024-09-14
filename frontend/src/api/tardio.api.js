import axios from "axios";

const tardioApi = axios.create({
  baseURL: "http://localhost:8000/api/v1/tardio/",
});

export const getAllTardio = (user_id, month, year) =>
  tardioApi.get(`?user_id=${user_id}&month=${month}&year=${year}`);

export const tardioCreateApi = (tardio) =>
  axios.post("http://localhost:8000/api/v1/tardiocreate/", tardio);
