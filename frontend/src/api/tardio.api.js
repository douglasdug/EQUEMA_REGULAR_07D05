import axios from "axios";

export const tardioCreateApi = (tardio) =>
  axios.post("http://localhost:8000/api/v1/tardiocreate/", tardio);
