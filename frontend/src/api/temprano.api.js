import axios from "axios";

const tempranoApi = axios.create({
  baseURL: "http://localhost:8000/api/v1/temprano/",
});

export const getAllTemprano = (user_id, month, year) =>
  tempranoApi.get(`?user_id=${user_id}&month=${month}&year=${year}`);

export const deleteTemprano = (id) => tempranoApi.delete(`/${id}/`);
export const updateTemprano = (id, temprano) =>
  tempranoApi.put(`/${id}/`, temprano);
export const getTemprano = (id) => tempranoApi.get(`/${id}/`);
