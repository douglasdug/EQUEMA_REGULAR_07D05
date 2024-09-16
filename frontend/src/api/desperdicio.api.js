import axios from "axios";

const desperdicioApi = axios.create({
  baseURL: "http://localhost:8000/api/v1/desperdicio/",
});

export const getAllDesperdicio = (user_id, month, year) =>
  desperdicioApi.get(`?user_id=${user_id}&month=${month}&year=${year}`);

export const desperdicioCreateApi = (desperdicio) =>
  axios.post("http://localhost:8000/api/v1/desperdiciocreate/", desperdicio);
