import axios from "axios";
const API_URL = "http://localhost:8000/api/v1";

// Funciones auxiliares para manejar tokens y almacenamiento local
const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};
const setTokens = (access, refresh) => {
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
};
const setUserId = (userId) => {
  localStorage.setItem("userId", userId);
};
const setInputFech = (dateActual = new Date().toISOString().slice(0, 10)) => {
  localStorage.setItem("dateInputFech", dateActual);
};
const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("dateInputFech");
};

// Función para obtener los encabezados de autenticación
export const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// Refrescar el token de acceso
const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    const response = await axios.post(`${API_URL}/token/refresh/`, {
      refresh: refreshToken,
    });
    localStorage.setItem("accessToken", response.data.access);
  } catch (error) {
    console.error(
      "Error al refrescar el token de acceso:",
      error.response ? error.response.data : error.message
    );
    clearAuthData();
    throw error;
  }
};

// Obtener información del usuario
export const getUser = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/`, getAuthHeaders());
    return response.data; // Devuelve los datos del usuario
  } catch (error) {
    console.error("Error al obtener el usuario:");
    throw error;
  }
};

// Iniciar sesión del usuario
export const loginUser = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/login/`, formData);
    const { id } = response.data;
    const { access, refresh } = response.data.tokens;
    if (!access || !refresh || !id) {
      throw new Error("Datos de respuesta incompletos");
    }
    setTokens(access, refresh);
    setUserId(response.data.id);
    setInputFech();
    return response.data;
  } catch (error) {
    console.error(
      "Error al iniciar sesión:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

// Cerrar sesión del usuario
export const logoutUser = async () => {
  try {
    console.log("Iniciando logout");
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);

    if (!accessToken || !refreshToken) {
      throw new Error("Se requieren tokens de acceso y refresco");
    }

    const config = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    await axios.post(`${API_URL}/logout/`, { refresh: refreshToken }, config);
    console.log("Logout exitoso en el servidor");
    clearAuthData();
    console.log("Datos de autenticación eliminados");
  } catch (error) {
    console.error(
      "Error al cerrar sesión:",
      error.response ? error.response.data : error.message
    );
    clearAuthData();
    console.log("Datos de autenticación eliminados en catch");
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

export const olvidoClave = async (identificacion) => {
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

export const getAllEniUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/eni-user/`);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching all eni users:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

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

//Funciones de Temprano
export const getMesTemprano = async (user_id, month, year) => {
  try {
    const response = await axios.get(`${API_URL}/temprano/`, {
      params: { user_id, month, year },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const registerTemprano = async (formData) => {
  try {
    const response = await axios.post(
      `${API_URL}/temprano/crear-temprano/`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error creating early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const updateTemprano = async (id, formData) => {
  try {
    const response = await axios.put(
      `${API_URL}/temprano/${id}/actualizar-temprano/`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const deleteTemprano = async (id, formData) => {
  try {
    const response = await axios.delete(
      `${API_URL}/temprano/${id}/eliminar-temprano/`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: formData,
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error deleting early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const getTemprano = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/temprano/${id}/`);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

//Funciones de Tardio
export const getMesTardio = async (user_id, month, year) => {
  try {
    const response = await axios.get(`${API_URL}/tardio/`, {
      params: { user_id, month, year },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const registerTardio = async (formData) => {
  try {
    const response = await axios.post(
      `${API_URL}/tardio/crear-tardio/`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error creating early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const updateTardio = async (id, formData) => {
  try {
    const response = await axios.put(
      `${API_URL}/tardio/${id}/actualizar-tardio/`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const deleteTardio = async (id, formData) => {
  try {
    const response = await axios.delete(
      `${API_URL}/tardio/${id}/eliminar-tardio/`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: formData,
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error deleting early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const getTardio = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/tardio/${id}/`);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

//Funciones de Desperdicio
export const getMesDesperdicio = async (user_id, month, year) => {
  try {
    const response = await axios.get(`${API_URL}/desperdicio/`, {
      params: { user_id, month, year },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const getTotalDesperdicio = async (user_id) => {
  try {
    const response = await axios.get(
      `${API_URL}/desperdicio/total-desperdicio/`,
      {
        params: { user_id },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const registerDesperdicio = async (formData) => {
  try {
    const response = await axios.post(
      `${API_URL}/desperdicio/crear-desperdicio/`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error creating early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const updateDesperdicio = async (id, formData) => {
  try {
    const response = await axios.put(
      `${API_URL}/desperdicio/${id}/actualizar-desperdicio/`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const deleteDesperdicio = async (id, formData) => {
  try {
    const response = await axios.delete(
      `${API_URL}/desperdicio/${id}/eliminar-desperdicio/`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: formData,
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error deleting early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const getDesperdicio = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/desperdicio/${id}/`);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

//Funciones de Influenza
export const getMesInfluenza = async (user_id, month, year) => {
  try {
    const response = await axios.get(`${API_URL}/influenza/`, {
      params: { user_id, month, year },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const registerInfluenza = async (formData) => {
  try {
    const response = await axios.post(
      `${API_URL}/influenza/crear-influenza/`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error creating early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const updateInfluenza = async (id, formData) => {
  try {
    const response = await axios.put(
      `${API_URL}/influenza/${id}/actualizar-influenza/`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const deleteInfluenza = async (id, formData) => {
  try {
    const response = await axios.delete(
      `${API_URL}/influenza/${id}/eliminar-influenza/`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: formData,
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error deleting early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const getInfluenza = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/influenza/${id}/`);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

//Funciones de ReporteENI
export const getMesReporteENI = async (user_id, month, year) => {
  try {
    const response = await axios.get(`${API_URL}/reporte-eni/`, {
      params: { user_id, month, year },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const registerReporteENI = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/reporte-eni/`, formData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const updateReporteENI = async (id, formData) => {
  try {
    const response = await axios.put(`${API_URL}/reporte-eni/${id}/`, formData);
    return response.data;
  } catch (error) {
    console.error(
      "Error updating early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const deleteReporteENI = async (id, formData) => {
  try {
    const response = await axios.delete(`${API_URL}/reporte-eni/${id}/`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: formData,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error deleting early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const getReporteENI = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/reporte-eni/${id}/`);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching early data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};
