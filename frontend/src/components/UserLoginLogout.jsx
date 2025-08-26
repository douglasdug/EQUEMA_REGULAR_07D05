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
    const initials =
      (first_name ? first_name[0] : "") + (last_name ? last_name[0] : "");

    const LogoutBtn = (
      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-xs md:text-sm font-medium px-3 py-1.5 md:px-4 md:py-2 shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition active:scale-[.97]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5 md:h-4 md:w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3"
          />
        </svg>
        Logout
      </button>
    );

    return (
      <>
        {/* Vista mobile: solo nombre y botón vertical */}
        <div className="flex md:hidden flex-col gap-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur px-2 py-2 rounded-xl shadow border border-slate-200 dark:border-slate-700 w-full max-w-xs">
          <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate max-w-[100px] block">
            {funTituName}{" "}
            <span className="font-semibold">
              {last_name} {first_name}
            </span>
          </p>
          {LogoutBtn}
        </div>

        {/* Vista escritorio: diseño original */}
        <div className="hidden md:flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur px-2 py-2 rounded-xl shadow border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-semibold shadow inner-border">
              {initials.toUpperCase()}
            </div>
            <div className="leading-tight">
              <p className="text-sm uppercase tracking-wide text-green-400 dark:text-green-600">
                Sesión activa
              </p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {funTituName}{" "}
                <span className="font-semibold">
                  {last_name} {first_name}
                </span>
              </p>
            </div>
          </div>
          {LogoutBtn}
        </div>
      </>
    );
  } else {
    return (
      <button
        onClick={handleLogin}
        className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium px-5 py-2.5 shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition active:scale-[.97]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 15V18.75A2.25 2.25 0 0113.5 21h-6A2.25 2.25 0 015.25 18.75v-13.5A2.25 2.25 0 017.5 3h6a2.25 2.25 0 012.25 2.25V9M9 12h12m0 0l-3-3m3 3l-3 3"
          />
        </svg>
        Login
      </button>
    );
  }
};

export default UserLoginLogout;
