import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import UsuarioLogout from "../components/UsuarioLogout.jsx";

export function Navigation() {
  const [nav, setNav] = useState(false);
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const handleMouseEnter = () => {
    setDropdownVisible(true);
  };

  const handleMouseLeave = () => {
    setDropdownVisible(false);
  };

  return (
    <div className="container">
      <header className="bg-gray-300 p-5 mb-4 rounded-2xl sticky top-0">
        <div className="flex">
          <a href="/">
            <h1 className="my-auto font-bold text-[22px] lg:text-3xl pr-2 mr-2 border-r-2 border-purple-500 lg:pr-5 lg:mr-5">
              ENIapp
            </h1>
          </a>
          <button
            className="my-auto mr-2 lg:hidden"
            onClick={() => setNav(!nav)}
          >
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
              <NavLink
                to="/"
                style={({ isActive }) => ({
                  color: isActive ? "rgb(107, 33, 168)" : "#000",
                  textDecoration: "none",
                })}
              >
                <li className="mr-10 p-1 border-2 border-transparent hover:text-black hover:border-purple-500 hover:bg-white rounded">
                  Home
                </li>
              </NavLink>
              <NavLink
                to="/Register/"
                style={({ isActive }) => ({
                  color: isActive ? "rgb(107, 33, 168)" : "#000",
                  textDecoration: "none",
                })}
              >
                <li className="mr-10 p-1 border-2 border-transparent hover:text-black hover:border-purple-500 hover:bg-white rounded">
                  Register
                </li>
              </NavLink>
              {/* Botón del menú desplegable */}
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
                {/* <DropdownMenu /> */}
                {isDropdownVisible && (
                  <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                    <ul>
                      <NavLink
                        to="/createtemprano/"
                        style={({ isActive }) => ({
                          color: isActive ? "rgb(107, 33, 168)" : "#000",
                          textDecoration: "none",
                        })}
                      >
                        <li className="mr-10 p-1 border-2 border-transparent hover:text-black hover:border-purple-500 hover:bg-white rounded">
                          Temprano
                        </li>
                      </NavLink>
                      <NavLink
                        to="/createtardio/"
                        style={({ isActive }) => ({
                          color: isActive ? "rgb(107, 33, 168)" : "#000",
                          textDecoration: "none",
                        })}
                      >
                        <li className="mr-10 p-1 border-2 border-transparent hover:text-black hover:border-purple-500 hover:bg-white rounded">
                          Tardio
                        </li>
                      </NavLink>
                      <NavLink
                        to="/createdesperdicio/"
                        style={({ isActive }) => ({
                          color: isActive ? "rgb(107, 33, 168)" : "#000",
                          textDecoration: "none",
                        })}
                      >
                        <li className="mr-10 p-1 border-2 border-transparent hover:text-black hover:border-purple-500 hover:bg-white rounded">
                          Desperdicio
                        </li>
                      </NavLink>
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
        {/* Menu desplegable en móviles */}
        {nav && (
          <div
            id="menu"
            className="menu mt-5 p-5 bg-white border-2 border-purple-500 rounded-2xl uppercase"
            onClick={() => setNav(!nav)}
          >
            <ul className="font-bold ">
              <NavLink
                to="/"
                style={({ isActive }) => ({
                  color: isActive ? "rgb(107, 33, 168)" : "#000",
                  textDecoration: "none",
                })}
              >
                <li className="mb-2 hover:text-purple-500">Home</li>
              </NavLink>
              <NavLink
                to="/login/"
                style={({ isActive }) => ({
                  color: isActive ? "rgb(107, 33, 168)" : "#000",
                  textDecoration: "none",
                })}
              >
                <li className="mb-2 hover:text-purple-500">Login</li>
              </NavLink>
              <NavLink
                to="/register/"
                style={({ isActive }) => ({
                  color: isActive ? "rgb(107, 33, 168)" : "#000",
                  textDecoration: "none",
                })}
              >
                <li className="mb-2 hover:text-purple-500">Register</li>
              </NavLink>
              <NavLink
                to="/feedback/"
                style={({ isActive }) => ({
                  color: isActive ? "rgb(107, 33, 168)" : "#000",
                  textDecoration: "none",
                })}
              >
                <li className="mb-2 hover:text-purple-500">Feedback</li>
              </NavLink>
              <NavLink
                to="/contact/"
                style={({ isActive }) => ({
                  color: isActive ? "rgb(107, 33, 168)" : "#000",
                  textDecoration: "none",
                })}
              >
                <li className="hover:text-purple-500">Contact</li>
              </NavLink>
            </ul>
          </div>
        )}
        <div className="flex">
          <button
            className="my-auto mr-2 lg:hidden"
            onClick={() => setNav(!nav)}
          ></button>
        </div>
      </header>
    </div>
  );
}
