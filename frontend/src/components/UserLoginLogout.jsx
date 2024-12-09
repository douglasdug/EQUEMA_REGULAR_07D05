import React, { useContext } from "react";
import { AuthContext } from "../components/AuthContext.jsx";
import { buttonStylePrimario } from "./EstilosCustom.jsx";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../api/conexion.api.js";
import { listaTipoTitu } from "../components/AllList.jsx";

const UserLoginLogout = () => {
  const { authData, setAuthData } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      setAuthData({
        isLoggedIn: false,
        user: null,
      });
    } catch (error) {
      console.error(
        "Error al cerrar sesión:",
        error.response ? error.response.data : error.message
      );
    }
    window.location.replace("/login/");
  };

  const handleLogin = () => {
    navigate("/login/");
  };

  const getFunTituName = (fun_titu) => {
    const item = listaTipoTitu.find((tipo) => tipo.value === fun_titu);
    return item ? item.label : fun_titu; // Si no se encuentra, devuelve el valor original
  };

  if (authData.isLoggedIn && authData.user) {
    const { fun_titu, last_name, first_name } = authData.user;
    const funTituName = getFunTituName(fun_titu);
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <p style={{ marginRight: "10px" }}>
          Bienvenido, {funTituName}.{" "}
          <strong>
            {last_name} {first_name}!
          </strong>
        </p>
        <button
          onClick={handleLogout}
          className={`${buttonStylePrimario} bg-blue-500 hover:bg-blue-700 text-white cursor-pointer`}
        >
          Logout
        </button>
      </div>
    );
  } else {
    return (
      <button
        onClick={handleLogin}
        className={`${buttonStylePrimario} bg-blue-500 hover:bg-blue-700 text-white cursor-pointer`}
      >
        Login
      </button>
    );
  }
};

export default UserLoginLogout;
