// src/api/usuario.api.js
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/v1";

export const getUser = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  return await axios.get(`${API_URL}/user/`, config);
};

export const logoutUser = async (accessToken, refreshToken) => {
  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
  return await axios.post(
    `${API_URL}/logout/`,
    { refresh: refreshToken },
    config
  );
};

export const registerUser = async (formData) => {
  const response = await axios.post(
    "http://localhost:8000/api/v1/register/",
    formData
  );
  return response.data;
};
