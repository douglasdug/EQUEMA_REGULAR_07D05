import axios from "axios";

const login = axios.create({
  baseURL: "http://localhost:8000/api/v1/login",
});

//export const datosLogin = (formData) => login.post("/", formData);
export const datosLogin = async (formData) => {
  const response = await login.post("/", formData);
  const { access, refresh } = response.data.tokens;
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
  return response.data;
};

const registroVacunadoApi = axios.create({
  baseURL: "http://localhost:8000/api/v1/registrovacunado",
});

// // Interceptor para añadir el token de autenticación a todas las solicitudes
// registroVacunadoApi.interceptors.request.use(
//   (config) => {
//     const token =
//       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzI3MTEwNTY1LCJpYXQiOjE3MjcxMTAyNjUsImp0aSI6ImYxNTdkMzBhZDdmZTQwZjBhNmU3MTcxZDZhOTIxNjdiIiwidXNlcl9pZCI6MX0.1QiZ8YPGefDXSnuHpDZ8Yfnz7NROftntY58YJB5gSBw"; // Reemplaza esto con la forma en que obtienes tu token
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

const user_id = 1;
//const month = 9;
//const year = 2024;

const eniUser_id = 1;

export const getAllRegistroVacunado = (month, year) =>
  registroVacunadoApi.get(`/?user_id=${user_id}&month=${month}&year=${year}`);

export const registroVacunadoCreateApi = (formData) =>
  registroVacunadoApi.post("/", formData);

export const getDescargarCsvRegistroVacunado = (fecha_inicio, fecha_fin) =>
  registroVacunadoApi.get(
    `/descargar_csv/?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}&eniUser_id=${eniUser_id}`
  );
