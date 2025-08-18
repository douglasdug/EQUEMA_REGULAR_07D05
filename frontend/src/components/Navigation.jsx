import React, { useState, useContext } from "react";
import { NavLink } from "react-router-dom";
import UserLoginLogout from "./UserLoginLogout.jsx";
import { AuthContext } from "../components/AuthContext.jsx";

// Helper para obtener el rol (1=ADMIN, 3=MEDICO). Ajusta según tu almacenamiento.
function getUserRole() {
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const user = JSON.parse(rawUser);
      return user?.fun_admi_rol ?? null;
    }
    const access = localStorage.getItem("access");
    if (access) {
      const payload = JSON.parse(atob(access.split(".")[1]));
      return payload?.fun_admi_rol ?? payload?.role ?? null;
    }
  } catch (e) {
    // silencioso
  }
  return null;
}

export function Navigation() {
  const [state, setState] = useState({
    nav: false,
    isDropdownVisible: false,
  });

  const handleMouseEnter = () => {
    setState((prevState) => ({ ...prevState, isDropdownVisible: true }));
  };

  const handleMouseLeave = () => {
    setState((prevState) => ({ ...prevState, isDropdownVisible: false }));
  };

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

  const navLinks = [
    { to: "/", label: "Home", roles: ["public"] },
    { to: "/register-user/", label: "Registro", roles: ["public"] },
    { to: "/admision/", label: "Admision", roles: [3] },
    { to: "/form-008-emergencia/", label: "Formulario 008", roles: [3] },
    {
      to: "/reporte-atenciones/",
      label: "Reporte de Atenciones",
      roles: [3, 1],
    },
    { to: "/admin-user/", label: "Administrador", roles: [1] },
    { to: "/contact/", label: "Contact", roles: ["public"] },
  ];

  const dropdownLinks = [
    { to: "/create-temprano/", label: "Temprano" },
    { to: "/create-tardio/", label: "Tardio" },
    { to: "/create-desperdicio/", label: "Desperdicio" },
    { to: "/create-influenza/", label: "Influenza" },
    { to: "/create-reporte-eni/", label: "Reporte ENI" },
    { to: "/create-registro-vacunado/", label: "Registro Vacunado" },
  ];

  // Filtra según rol del contexto
  const filteredNavLinks = navLinks.filter((link) => {
    if (link.roles?.includes("public")) return true;
    if (!role) return false;
    return link.roles?.includes(role);
  });

  const mobileLinks = [...filteredNavLinks];

  return (
    <header className="bg-blue-100 p-4 mb-4 rounded-2xl fixed top-0 left-2 right-2 z-50">
      <div className="flex">
        <a
          href="/"
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          <h1 className="my-auto font-bold text-[22px] lg:text-3xl pr-2 mr-2 border-r-2 border-blue-600 lg:pr-5 lg:mr-5">
            SIRA-07D05
          </h1>
        </a>

        <button
          type="button"
          className="my-auto mr-2 lg:hidden rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          onClick={toggleNav}
          aria-controls="primary-navigation"
          aria-expanded={state.nav}
          aria-label={state.nav ? "Cerrar menú" : "Abrir menú"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-6 h-6"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
            />
          </svg>
        </button>

        <nav className="my-auto" aria-label="Navegación principal">
          <ul
            id="primary-navigation"
            className="hidden lg:flex uppercase font-bold"
          >
            {filteredNavLinks.map((link) => (
              <li key={link.to} className="mr-10">
                <NavLink
                  to={link.to}
                  style={linkStyle}
                  className="block p-1 border-2 border-transparent hover:text-black hover:border-blue-600 hover:bg-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  {link.label}
                </NavLink>
              </li>
            ))}

            {/* <li
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className="align-baseline mr-10 px-1 border-2 border-transparent hover:text-black hover:border-blue-600 hover:bg-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-haspopup="true"
                aria-expanded={state.isDropdownVisible}
                aria-controls="esquema-menu"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    isDropdownVisible: !prev.isDropdownVisible,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setState((prev) => ({ ...prev, isDropdownVisible: false }));
                  }
                }}
              >
                Esquema Regula
              </button>

              {state.isDropdownVisible && (
                <div
                  id="esquema-menu"
                  className="dropdown-menu absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10"
                >
                  <ul className="py-1">
                    {dropdownLinks.map((link) => (
                      <li key={link.to}>
                        <NavLink
                          to={link.to}
                          style={linkStyle}
                          className="block px-3 py-2 mr-1 border-2 border-transparent hover:text-black hover:border-blue-600 hover:bg-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              isDropdownVisible: false,
                            }))
                          }
                        >
                          {link.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li> */}
          </ul>
        </nav>

        <div className="ml-auto">
          <UserLoginLogout />
        </div>
      </div>

      {state.nav && (
        <div
          id="menu"
          className="menu mt-5 p-5 bg-white border-2 border-blue-600 rounded-2xl uppercase lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú móvil"
        >
          <ul className="font-bold">
            {mobileLinks.map((link) => (
              <li key={link.to} className="mb-2">
                <NavLink
                  to={link.to}
                  style={linkStyle}
                  className="block py-2 hover:text-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                  onClick={() => setState((prev) => ({ ...prev, nav: false }))}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}

            {/* <li className="relative">
              <button
                type="button"
                className="w-full text-left px-1 border-2 border-transparent hover:text-black hover:border-blue-600 hover:bg-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-haspopup="true"
                aria-expanded={state.isDropdownVisible}
                aria-controls="esquema-menu-mobile"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    isDropdownVisible: !prev.isDropdownVisible,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setState((prev) => ({ ...prev, isDropdownVisible: false }));
                  }
                }}
              >
                Esquema Regula
              </button>

              {state.isDropdownVisible && (
                <div
                  id="esquema-menu-mobile"
                  className="mt-2 w-full bg-white rounded-md shadow-lg"
                >
                  <ul className="py-1">
                    {dropdownLinks.map((link) => (
                      <li key={link.to}>
                        <NavLink
                          to={link.to}
                          style={linkStyle}
                          className="block px-3 py-2 hover:bg-blue-50 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              nav: false,
                              isDropdownVisible: false,
                            }))
                          }
                        >
                          {link.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li> */}
          </ul>
        </div>
      )}
    </header>
  );
}
