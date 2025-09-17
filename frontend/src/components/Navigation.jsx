import React, { useState, useContext } from "react";
import { NavLink } from "react-router-dom";
import UserLoginLogout from "./UserLoginLogout.jsx";
import { AuthContext } from "../components/AuthContext.jsx";

export function Navigation() {
  const [state, setState] = useState({
    nav: false,
    isDropdownVisible: false,
  });

  const toggleNav = () => {
    setState((prevState) => ({ ...prevState, nav: !prevState.nav }));
  };

  const linkStyle = ({ isActive }) => ({
    color: isActive ? "rgb(0, 128, 0)" : "#000",
    textDecoration: "none",
  });

  // Obtener rol desde el AuthContext
  const { authData } = useContext(AuthContext);
  const roleRaw = authData?.user?.fun_admi_rol ?? authData?.fun_admi_rol;
  const role = roleRaw != null ? Number(roleRaw) : null;
  const isLoggedIn = !!authData?.user;

  const navLinks = [
    { to: "/", label: "Home", roles: ["public"] },
    { to: "/register-user/", label: "Registro", roles: ["public"] },
    { to: "/admision/", label: "Admision", roles: [3, 4] },
    { to: "/form-008-emergencia/", label: "Formulario-008", roles: [3] },
    {
      to: "/reporte-atenciones/",
      label: "Reporte de Atenciones",
      roles: [1, 2, 3, 4],
    },
    { to: "/admin-user/", label: "Administrador", roles: [1] },
    { to: "/contacto/", label: "Contact", roles: ["public"] },
  ];

  const canSee = (rolesArr) =>
    rolesArr?.includes("public") || (role && rolesArr?.includes(role));
  const filteredNavLinks = navLinks.filter(
    (l) => !(isLoggedIn && l.to === "/register-user/") && canSee(l.roles)
  );

  const mainLinks = filteredNavLinks.filter((l) => l.group !== "esquema");

  const mobileLinks = [...mainLinks];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 shadow-lg bg-gradient-to-r from-blue-100 via-sky-100 to-blue-50/90 backdrop-blur supports-[backdrop-filter]:bg-blue-100/70 border-b border-blue-200 sm:left-2 sm:right-2 sm:rounded-2xl sm:border sm:border-blue-200">
      <div className="flex items-stretch px-2 sm:px-3 py-2 gap-2 min-h-[60px]">
        <a
          href="/"
          className="group flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          <h1 className="font-extrabold tracking-tight text-[1.25rem] leading-6 sm:text-3xl pr-3 sm:pr-2 mr-3 sm:mr-1 sm:border-r border-blue-300 text-blue-900 group-hover:text-blue-700 transition-colors">
            SIRA-07D05
          </h1>
        </a>

        <nav
          className="hidden lg:flex items-center"
          aria-label="Navegación principal"
        >
          <ul className="flex gap-1 uppercase font-semibold text-sm">
            {mainLinks.map((link) => (
              <li key={link.to} className="relative">
                <NavLink
                  to={link.to}
                  style={linkStyle}
                  className={({ isActive }) =>
                    [
                      "px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                      "hover:bg-white/70 hover:text-blue-800",
                      isActive
                        ? "bg-white text-green-700 shadow-sm ring-1 ring-green-500"
                        : "text-gray-700",
                    ].join(" ")
                  }
                >
                  <span className="relative">
                    {link.label}
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-green-600 transition-all duration-300 group-hover:w-full" />
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="lg:hidden ml-1 inline-flex items-center justify-center rounded-lg p-2 w-12 h-12 text-blue-800 hover:bg-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition"
          onClick={toggleNav}
          aria-controls="primary-navigation"
          aria-expanded={state.nav}
          aria-label={state.nav ? "Cerrar menú" : "Abrir menú"}
        >
          {state.nav ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-10.5 5.25h10.5"
              />
            </svg>
          )}
        </button>

        <div className="ml-auto flex items-center">
          <UserLoginLogout />
        </div>
      </div>

      {state.nav && (
        <dialog
          id="menu"
          className="fixed top-[60px] sm:top-[72px] left-0 right-0 bottom-0 m-0 px-1 pt-1 pb-1 w-full bg-white/95 border-t border-blue-300 lg:hidden open:animate-[fadeIn_.25s_ease] backdrop:backdrop-blur overflow-y-auto"
          open
          aria-label="Menú móvil"
        >
          <ul className="font-semibold text-base tracking-wide space-y-1">
            {mobileLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  style={linkStyle}
                  className={({ isActive }) =>
                    [
                      "block w-full rounded-xl px-5 py-4 transition-all duration-200",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                      "hover:bg-blue-50 hover:text-blue-800",
                      "border border-transparent hover:border-blue-200",
                      isActive
                        ? "bg-blue-100 text-green-700 font-bold border-blue-300"
                        : "text-gray-800",
                    ].join(" ")
                  }
                  onClick={() => setState((prev) => ({ ...prev, nav: false }))}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-3">
              <button
                onClick={() => setState((p) => ({ ...p, nav: false }))}
                className="w-full text-center text-sm text-blue-700 hover:text-blue-900 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
              >
                Cerrar
              </button>
            </li>
          </ul>
        </dialog>
      )}
    </header>
  );
}
