import axios from "axios";
//const API_URL = "http://localhost:8000/api/v1";
const API_URL = import.meta.env.VITE_API_URL;

// Funciones auxiliares para manejar tokens y almacenamiento local
export const getAccessToken = () => {
  try {
    return localStorage.getItem("accessToken"); // ajusta si usas otro storage/clave
  } catch {
    return null;
  }
};
const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};
const setTokens = (access, refresh) => {
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
};
const setInputFech = (dateActual = new Date().toISOString().slice(0, 10)) => {
  localStorage.setItem("dateInputFech", dateActual);
};
const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("dateInputFech");
  // limpiar caché en memoria
  cachedUserId = null;
};

// Función para obtener los encabezados de autenticación
export const getAuthHeaders = () => {
  const token = getAccessToken(); // usa el helper
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      "Content-Type": "application/json",
    },
  };
};

// Caché en memoria del id del usuario actual (no se persiste)
let cachedUserId = null;

// Utilidades para extraer el userId desde el JWT (sin exponerlo ni guardarlo)
const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const decodeJwt = (token) => {
  try {
    const [, payloadB64] = token.split(".");
    const json = JSON.parse(atob(payloadB64));
    return json || {};
  } catch {
    return {};
  }
};

export const getRoleFromToken = () => {
  const t = getAccessToken();
  if (!t) return null;
  const payload = decodeJwt(t);
  // Ajusta las claves según tu backend JWT
  return payload?.fun_admi_rol ?? payload?.role ?? null;
};

export const getUserIdFromToken = () => {
  const t = getAccessToken();
  if (!t) return null;
  const payload = decodeJwt(t);
  return payload?.user_id ?? payload?.sub ?? payload?.id ?? null;
};

// Si el rol no viene en el token, lo consulta al backend
export const getCurrentUserRole = async () => {
  const fromToken = getRoleFromToken();
  if (fromToken != null) return Number(fromToken);

  const userId = getUserIdFromToken();
  if (!userId) return null;

  try {
    const res = await axios.get(`${API_URL}/eni-user/${userId}/`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    return Number(res?.data?.fun_admi_rol ?? null);
  } catch {
    return null;
  }
};

// Helper: detectar endpoints de auth para no adjuntar Authorization y evitar loops
const isAuthEndpoint = (url = "") =>
  /\/login\/|\/token\/refresh\/|\/new-password\//.test(url);

// Single-flight del refresh para evitar múltiples llamadas concurrentes
let refreshPromise = null;

// Interceptor de request: evita enviar Authorization en endpoints de auth
axios.interceptors.request.use((config) => {
  const t = getAccessToken();
  const url = config?.url || "";
  if (t && !isAuthEndpoint(url)) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

// Interceptor de response: refresh en 401 y reintento (una vez)
axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    const url = original?.url || "";

    const isTokenErr =
      (status === 401 || code === "token_not_valid") && !isAuthEndpoint(url);

    if (isTokenErr && !original._retry) {
      original._retry = true;
      try {
        await refreshAccessToken(); // serializado
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${getAccessToken()}`;
        return axios(original);
      } catch (e) {
        console.error("Error al refrescar el token:", e);
        clearAuthData();
        window.location.href = "/login/";
      }
    }
    return Promise.reject(error);
  }
);

const getEniUserId = () => getUserIdFromToken();

// Obtiene el id del usuario actual sin exponerlo ni guardarlo en localStorage
export const ensureCurrentUserId = async () => {
  if (cachedUserId) return cachedUserId;

  const fromToken = getUserIdFromToken();
  if (fromToken) {
    cachedUserId = fromToken;
    return cachedUserId;
  }

  try {
    const me = await getUser();
    cachedUserId = me?.id ?? me?.user_id ?? me?.pk ?? null;
    return cachedUserId;
  } catch {
    return null;
  }
};

// Refrescar el token de acceso (maneja rotación + single-flight)
const refreshAccessToken = async () => {
  // Si ya hay un refresh en curso, reutilizarlo
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    const err = new Error("No refresh token available");
    console.error("Error al refrescar el token de acceso:", err.message);
    throw err;
  }

  refreshPromise = axios
    .post(`${API_URL}/token/refresh/`, { refresh: refreshToken })
    .then((response) => {
      const { access, refresh } = response.data || {};
      if (!access) {
        throw new Error("Respuesta de refresh sin access token");
      }
      // IMPORTANTE: guardar refresh si el backend rota y lo envía
      if (refresh) {
        setTokens(access, refresh);
      } else {
        localStorage.setItem("accessToken", access);
      }
      return access;
    })
    .catch((error) => {
      console.error(
        "Error al refrescar el token de acceso:",
        error?.response ? error.response.data : error.message
      );
      clearAuthData();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
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
    cachedUserId = id; // mantenerlo en memoria
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
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!accessToken || !refreshToken) {
      throw new Error("Se requieren tokens de acceso y refresco");
    }

    const config = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    await axios.post(`${API_URL}/logout/`, { refresh: refreshToken }, config);
    clearAuthData();
    // Notificar a otras pestañas
    try {
      localStorage.setItem("logout_broadcast", String(Date.now()));
    } catch {}
  } catch (error) {
    console.error(
      "Error al cerrar sesión:",
      error.response ? error.response.data : error.message
    );
    clearAuthData();
    try {
      localStorage.setItem("logout_broadcast", String(Date.now()));
    } catch {}
    throw error;
  }
};

// Escuchar logout en otras pestañas y limpiar credenciales
try {
  window.addEventListener("storage", (e) => {
    if (e.key === "logout_broadcast") {
      clearAuthData();
    }
  });
} catch {}

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
      `${API_URL}/eni-user/${formData.id_eniUser}/`,
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

export const olvidoClave = async ({ username }) => {
  try {
    const response = await axios.post(`${API_URL}/new-password/`, {
      username,
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

export const resetPasswordWithToken = async ({ uid, token, password }) => {
  try {
    const response = await axios.post(
      `${API_URL}/new-password/${uid}/${token}/`, // El backend debe tener esta ruta
      { new_password: password }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error resetting password with token:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const buscarUsuarioIdUnidadSalud = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/eni-user/buscar-usuario-id-unidad-salud/`
    );
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error fetching user unidad de salud data:",
        error.response ? error.response.data : error.message
      );
    }
    throw error;
  }
};

export const listarUsuariosApoyoAtencion = async () => {
  try {
    const response = await axios.get(`${API_URL}/eni-user/listar-filtrado/`);
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error fetching user unidad de salud data:",
        error.response ? error.response.data : error.message
      );
    }
    throw error;
  }
};

//Funciones para los registros de unidades de salud
export const updateUnidadSaludPrincipal = async (formData) => {
  try {
    const response = await axios.patch(
      `${API_URL}/unidad-salud/unidad-salud-principal/`,
      formData
    );
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error updating unidad de salud data:",
        error.response ? error.response.data : error.message
      );
    }
    throw error;
  }
};

//Funciones para los reportes de atenciones de Formulario 008 Emergencia
export const listarReportesAtenciones = async (form_008_year) => {
  try {
    const response = await axios.get(
      `${API_URL}/form-008-emergencia/reporte-mensual/`,
      {
        params: { form_008_year },
      }
    );
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error fetching reportes atenciones data:",
        error.response ? error.response.data : error.message
      );
    }
    throw error;
  }
};

export const listarReporteDiagnostico = async (form_008_year) => {
  try {
    const response = await axios.get(
      `${API_URL}/form-008-emergencia/reporte-diagnostico/`,
      {
        params: { form_008_year },
      }
    );
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error fetching reportes diagnostico data:",
        error.response ? error.response.data : error.message
      );
    }
    throw error;
  }
};

export const reporteDescargaAtencionesCsv = async (
  for_008_emer_fech_aten_min,
  for_008_emer_fech_aten_max
) => {
  try {
    const response = await axios.get(
      `${API_URL}/form-008-emergencia/reporte-atenciones-csv/`,
      {
        params: {
          for_008_emer_fech_aten_min,
          for_008_emer_fech_aten_max,
        },
        responseType: "blob",
      }
    );
    const cd = response.headers["content-disposition"] || "";
    const match = cd.match(/filename="?([^"]+)"?/i);
    const filename =
      match?.[1] ||
      `reporte_atenciones_${for_008_emer_fech_aten_min}_${for_008_emer_fech_aten_max}.csv`;
    return { blob: response.data, filename };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error fetching reportes atenciones en CSV data:",
        error.response ? error.response.data : error.message
      );
    }
    throw error;
  }
};

//Funciones para la Admisión de usuario
export const buscarUsuarioAdmision = async (tipo, identificacion) => {
  try {
    const response = await axios.get(
      `${API_URL}/admision-datos/buscar-admision/`,
      {
        params: { tipo, identificacion },
      }
    );
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error fetching user admission data:",
        error.response ? error.response.data : error.message
      );
    }
    throw error;
  }
};

export const busquedaAvanzadaAdmisionados = async (apellidos, nombres) => {
  try {
    const response = await axios.get(
      `${API_URL}/admision-datos/buscar-admisionados/`,
      {
        params: { apellidos, nombres },
      }
    );
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error fetching user admission data:",
        error.response ? error.response.data : error.message
      );
    }
    throw error;
  }
};

export const registerAdmision = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/admision-datos/`, formData);
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error registering admision data:",
        error.response ? error.response.data : error.message
      );
    }
    throw error;
  }
};

export const updateAdmision = async (formData) => {
  try {
    const response = await axios.patch(
      `${API_URL}/admision-datos/${formData.id_admision_datos}/`,
      formData
    );
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error updating admision data:",
        error.response ? error.response.data : error.message
      );
    }
    throw error;
  }
};

//Funciones para el Form008 de Emergencia
export const getAllForm008Emer = async () => {
  try {
    const response = await axios.get(`${API_URL}/form-008-emergencia/`);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching all form 008 emergency data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const listarForm008EmerAtenciones = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/form-008-emergencia/listar-atenciones-form-008/`
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching all form 008 emergency data:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const listarAtencionesPaciente = async (admision_datos) => {
  try {
    const response = await axios.get(
      `${API_URL}/form-008-emergencia/listar-atenciones-paciente/`,
      {
        params: { admision_datos },
      }
    );
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error fetching atencion form-008-emergencia data:",
        error.response ? error.response.data : error.message
      );
    }
    throw error;
  }
};

export const buscarUsuarioForm008Emer = async (tipo, identificacion) => {
  try {
    const response = await axios.get(
      `${API_URL}/form-008-emergencia/buscar-admision/`,
      {
        params: { tipo, identificacion },
      }
    );
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error fetching user admission data:",
        error.response ? error.response.data : error.message
      );
    }
    throw error;
  }
};

export const registerForm008Emer = async (formData) => {
  try {
    const response = await axios.post(
      `${API_URL}/form-008-emergencia/`,
      formData
    );
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error registering admision data:",
        error.response ? error.response.data : error.message
      );
    }
    throw error;
  }
};

export const updateForm008Emer = async (formData) => {
  try {
    const response = await axios.patch(
      `${API_URL}/form-008-emergencia/${formData.id_admision_datos}/`,
      formData
    );
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Error updating admision data:",
        error.response ? error.response.data : error.message
      );
    }
    throw error;
  }
};

//Funciones para los registros de vacunación

// export const getAllRegistroVacunado = (month, year) => {
//   const eniUserId = getEniUserId();
//   axios.get(
//     `${API_URL}/registro-vacunado/?user_id=${eniUserId}&month=${month}&year=${year}`,
//     getAuthHeaders()
//   );
// };

// export const registroVacunadoCreateApi = (formData) =>
//   axios.post(`${API_URL}/registro-vacunado/`, formData, getAuthHeaders());

// export const getDescargarCsvRegistroVacunado = (fecha_inicio, fecha_fin) => {
//   const eniUserId = getEniUserId();
//   axios.get(
//     `${API_URL}/registro-vacunado/descargar-csv/?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}&eniUser_id=${eniUserId}`,
//     getAuthHeaders()
//   );
// };

//Funciones de Temprano
// export const getMesTemprano = async (user_id, month, year) => {
//   try {
//     const response = await axios.get(`${API_URL}/temprano/`, {
//       params: { user_id, month, year },
//     });
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error fetching early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const registerTemprano = async (formData) => {
//   try {
//     const response = await axios.post(
//       `${API_URL}/temprano/crear-temprano/`,
//       formData
//     );
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error creating early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const updateTemprano = async (id, formData) => {
//   try {
//     const response = await axios.put(
//       `${API_URL}/temprano/${id}/actualizar-temprano/`,
//       formData
//     );
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error updating early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const deleteTemprano = async (id, formData) => {
//   try {
//     const response = await axios.delete(
//       `${API_URL}/temprano/${id}/eliminar-temprano/`,
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//         data: formData,
//       }
//     );
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error deleting early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const getTemprano = async (id) => {
//   try {
//     const response = await axios.get(`${API_URL}/temprano/${id}/`);
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error fetching early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// //Funciones de Tardio
// export const getMesTardio = async (user_id, month, year) => {
//   try {
//     const response = await axios.get(`${API_URL}/tardio/`, {
//       params: { user_id, month, year },
//     });
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error fetching early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const registerTardio = async (formData) => {
//   try {
//     const response = await axios.post(
//       `${API_URL}/tardio/crear-tardio/`,
//       formData
//     );
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error creating early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const updateTardio = async (id, formData) => {
//   try {
//     const response = await axios.put(
//       `${API_URL}/tardio/${id}/actualizar-tardio/`,
//       formData
//     );
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error updating early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const deleteTardio = async (id, formData) => {
//   try {
//     const response = await axios.delete(
//       `${API_URL}/tardio/${id}/eliminar-tardio/`,
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//         data: formData,
//       }
//     );
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error deleting early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const getTardio = async (id) => {
//   try {
//     const response = await axios.get(`${API_URL}/tardio/${id}/`);
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error fetching early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

//Funciones de Desperdicio
// export const getMesDesperdicio = async (user_id, month, year) => {
//   try {
//     const response = await axios.get(`${API_URL}/desperdicio/`, {
//       params: { user_id, month, year },
//     });
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error fetching early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const getTotalDesperdicio = async (user_id) => {
//   try {
//     const response = await axios.get(
//       `${API_URL}/desperdicio/total-desperdicio/`,
//       {
//         params: { user_id },
//       }
//     );
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error fetching early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const registerDesperdicio = async (formData) => {
//   try {
//     const response = await axios.post(
//       `${API_URL}/desperdicio/crear-desperdicio/`,
//       formData
//     );
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error creating early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const updateDesperdicio = async (id, formData) => {
//   try {
//     const response = await axios.put(
//       `${API_URL}/desperdicio/${id}/actualizar-desperdicio/`,
//       formData
//     );
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error updating early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const deleteDesperdicio = async (id, formData) => {
//   try {
//     const response = await axios.delete(
//       `${API_URL}/desperdicio/${id}/eliminar-desperdicio/`,
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//         data: formData,
//       }
//     );
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error deleting early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const getDesperdicio = async (id) => {
//   try {
//     const response = await axios.get(`${API_URL}/desperdicio/${id}/`);
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error fetching early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

//Funciones de Influenza
// export const getMesInfluenza = async (user_id, month, year) => {
//   try {
//     const response = await axios.get(`${API_URL}/influenza/`, {
//       params: { user_id, month, year },
//     });
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error fetching early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const registerInfluenza = async (formData) => {
//   try {
//     const response = await axios.post(
//       `${API_URL}/influenza/crear-influenza/`,
//       formData
//     );
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error creating early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const updateInfluenza = async (id, formData) => {
//   try {
//     const response = await axios.put(
//       `${API_URL}/influenza/${id}/actualizar-influenza/`,
//       formData
//     );
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error updating early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const deleteInfluenza = async (id, formData) => {
//   try {
//     const response = await axios.delete(
//       `${API_URL}/influenza/${id}/eliminar-influenza/`,
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//         data: formData,
//       }
//     );
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error deleting early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const getInfluenza = async (id) => {
//   try {
//     const response = await axios.get(`${API_URL}/influenza/${id}/`);
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error fetching early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

//Funciones de ReporteENI
// export const getMesReporteENI = async (user_id, month, year) => {
//   try {
//     const response = await axios.get(`${API_URL}/reporte-eni/`, {
//       params: { user_id, month, year },
//     });
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error fetching early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const registerReporteENI = async (formData) => {
//   try {
//     const response = await axios.post(`${API_URL}/reporte-eni/`, formData);
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error creating early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const updateReporteENI = async (id, formData) => {
//   try {
//     const response = await axios.put(`${API_URL}/reporte-eni/${id}/`, formData);
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error updating early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const deleteReporteENI = async (id, formData) => {
//   try {
//     const response = await axios.delete(`${API_URL}/reporte-eni/${id}/`, {
//       headers: {
//         "Content-Type": "application/json",
//       },
//       data: formData,
//     });
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error deleting early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

// export const getReporteENI = async (id) => {
//   try {
//     const response = await axios.get(`${API_URL}/reporte-eni/${id}/`);
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error fetching early data:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };
