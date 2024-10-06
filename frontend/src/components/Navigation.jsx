import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import UsuarioLogout from "../components/UsuarioLogout.jsx";

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
    color: isActive ? "rgb(107, 33, 168)" : "#000",
    textDecoration: "none",
  });

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/Register/", label: "Register" },
    { to: "/createUsuario/", label: "Administrar Usuario" },
  ];

  const dropdownLinks = [
    { to: "/createtemprano/", label: "Temprano" },
    { to: "/createtardio/", label: "Tardio" },
    { to: "/createdesperdicio/", label: "Desperdicio" },
    { to: "/createRegistroVacunado/", label: "Registro Vacunado" },
  ];

  const mobileLinks = [
    ...navLinks,
    { to: "/login/", label: "Login" },
    { to: "/feedback/", label: "Feedback" },
    { to: "/contact/", label: "Contact" },
  ];

  return (
    <div className="container">
      <header className="bg-gray-300 p-5 mb-4 rounded-2xl fixed top-0 w-full z-50">
        <div className="flex">
          <a href="/">
            <h1 className="my-auto font-bold text-[22px] lg:text-3xl pr-2 mr-2 border-r-2 border-purple-500 lg:pr-5 lg:mr-5">
              ENIapp
            </h1>
          </a>
          <button className="my-auto mr-2 lg:hidden" onClick={toggleNav}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
              />
            </svg>
          </button>
          <div className="my-auto">
            <ul className="hidden lg:flex uppercase font-bold">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} style={linkStyle}>
                  <li className="mr-10 p-1 border-2 border-transparent hover:text-black hover:border-purple-500 hover:bg-white rounded">
                    {link.label}
                  </li>
                </NavLink>
              ))}
              <div
                className="menu relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <ul>
                  <NavLink>
                    <li className="align-baseline mr-10 px-1 border-2 border-transparent hover:text-black hover:border-purple-500 hover:bg-white rounded focus:outline-none">
                      Esquema Regula
                    </li>
                  </NavLink>
                </ul>
                {state.isDropdownVisible && (
                  <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                    <ul>
                      {dropdownLinks.map((link) => (
                        <NavLink key={link.to} to={link.to} style={linkStyle}>
                          <li className="mr-1 p-1 border-2 border-transparent hover:text-black hover:border-purple-500 hover:bg-white rounded">
                            {link.label}
                          </li>
                        </NavLink>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ul>
          </div>
          <div className="ml-auto">
            <UsuarioLogout />
          </div>
        </div>
        {state.nav && (
          <div
            id="menu"
            className="menu mt-5 p-5 bg-white border-2 border-purple-500 rounded-2xl uppercase"
            onClick={toggleNav}
          >
            <ul className="font-bold">
              {mobileLinks.map((link) => (
                <NavLink key={link.to} to={link.to} style={linkStyle}>
                  <li className="mb-2 hover:text-purple-500">{link.label}</li>
                </NavLink>
              ))}
            </ul>
          </div>
        )}
      </header>
    </div>
  );
}
