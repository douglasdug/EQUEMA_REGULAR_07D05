import React from "react";
import axios from "axios";
import { Navigate, Outlet } from "react-router-dom";

// Helpers mínimos leyendo el access token (ya usas SimpleJWT)
const getAccessToken = () =>
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("accessToken") ||
  localStorage.getItem("access_token") ||
  sessionStorage.getItem("access_token") ||
  "";

axios.interceptors.request.use(
  (config) => {
    const tk = getAccessToken();
    if (tk) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${tk}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const decodeJwt = (token) => {
  try {
    const [, payload] = token.split(".");
    return payload ? JSON.parse(atob(payload)) : null;
  } catch {
    return null;
  }
};

const getCurrentRole = () => {
  const tk = getAccessToken();
  const decoded = decodeJwt(tk);
  return decoded?.fun_admi_rol ?? null;
};

const ProtectedRoute = ({ allowed = [] }) => {
  const tk = getAccessToken();
  if (!tk) return <Navigate to="/login/" replace />;
  const role = getCurrentRole();
  if (
    Array.isArray(allowed) &&
    allowed.length &&
    !allowed.includes(Number(role))
  ) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
