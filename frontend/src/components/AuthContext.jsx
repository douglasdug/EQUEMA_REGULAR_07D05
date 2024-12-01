import React, { createContext, useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { getUser } from "../api/conexion.api.js";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState({
    isLoggedIn: false,
    user: null,
  });
  const navigate = useNavigate();

  const checkLoggedInUser = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      setAuthData({
        isLoggedIn: false,
        user: null,
      });
      return;
    }

    try {
      // Hacer la solicitud al servidor para obtener los datos del usuario
      const response = await getUser();
      setAuthData({
        isLoggedIn: true,
        user: response, // Almacenar los datos del usuario
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Error de autenticación
        console.error("Usuario no autenticado:");
        setAuthData({
          isLoggedIn: false,
          user: null,
        });
        navigate("/login"); // Redirigir al inicio de sesión
        return;
      } else {
        // Otros errores
        console.error("Error al obtener el usuario:");
        setAuthData({
          isLoggedIn: false,
          user: null,
        });
      }
    }
  };

  useEffect(() => {
    checkLoggedInUser();
  }, []);

  const value = useMemo(() => ({ authData, setAuthData }), [authData]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
