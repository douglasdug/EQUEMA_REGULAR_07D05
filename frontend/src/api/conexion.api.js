import axios from "axios";

const API_URL = "http://localhost:8000/api/v1";

// Función para obtener los encabezados de autenticación
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Funciones para los Usuarios
export const getUser = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/user/`, getAuthHeaders());
    return response.data;
  } catch (error) {
    if (error.response && error.response.data.code === "token_not_valid") {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        const newAccessToken = await refreshAccessToken(refreshToken);
        if (newAccessToken) {
          localStorage.setItem("accessToken", newAccessToken);
          const retryResponse = await axios.get(
            `${API_URL}/user/`,
            getAuthHeaders()
          );
          return retryResponse.data;
        }
      }
    }
    throw error;
  }
};

const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post(`${API_URL}/token/refresh/`, {
      refresh: refreshToken,
    });
    return response.data.access;
  } catch (error) {
    console.error(
      "Error refreshing access token:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
};

export const logoutUser = async (accessToken, refreshToken) => {
  if (!accessToken || !refreshToken) {
    throw new Error("Access token and refresh token are required");
  }

  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  try {
    const response = await axios.post(
      `${API_URL}/logout/`,
      { refresh: refreshToken },
      config
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error logging out user:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const registerUser = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/eni-user/`, formData);
    return response.data;
  } catch (error) {
    console.error(
      "Error registering user:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const updateUser = async (formData) => {
  try {
    const response = await axios.patch(
      `${API_URL}/eni-user/actualizar-usuario/`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating user:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const deleteUser = async (username) => {
  try {
    const response = await axios.delete(
      `${API_URL}/eni-user/eliminar-usuario/`,
      { data: { username } }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error deleting user:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const loginUser = async (formData) => {
  const response = await axios.post(`${API_URL}/login/`, formData);
  const { access, refresh } = response.data.tokens;
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
  return response.data;
};

export const buscarUsuarioEni = async (tipo, identificacion) => {
  try {
    const response = await axios.get(`${API_URL}/eni-user/buscar-usuario/`, {
      params: { tipo, identificacion },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching user admission data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

//Funciones para los registros de vacunación
const eniUser_id = 1;

export const getAllRegistroVacunado = (month, year) =>
  axios.get(
    `${API_URL}/registro-vacunado/?user_id=${eniUser_id}&month=${month}&year=${year}`,
    getAuthHeaders()
  );

export const registroVacunadoCreateApi = (formData) =>
  axios.post(`${API_URL}/registro-vacunado/`, formData, getAuthHeaders());

export const getDescargarCsvRegistroVacunado = (fecha_inicio, fecha_fin) =>
  axios.get(
    `${API_URL}/registro-vacunado/descargar-csv/?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}&eniUser_id=${eniUser_id}`,
    getAuthHeaders()
  );

export const getAllEniUsers = () => axios.get(`${API_URL}/eni-user/`);

//Funciones para la Admisión de usuario
export const buscarUsuarioAdmision = async (tipo, identificacion) => {
  try {
    const response = await axios.get(
      `${API_URL}/admision-datos/buscar-usuario/`,
      {
        params: { tipo, identificacion },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching user admission data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};
