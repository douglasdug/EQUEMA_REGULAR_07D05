// src/components/UsuarioLogout.jsx
import React, { useState, useEffect } from "react";
import { getUser } from "../api/usuario.api.js";

const UsuarioLogout = () => {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          const response = await getUser(token);
          setIsLoggedIn(true);
          setUsername(response.data.username);
        } else {
          setIsLoggedIn(false);
          setUsername("");
        }
      } catch (error) {
        setIsLoggedIn(false);
        setUsername("");
      }
    };
    checkLoggedInUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setIsLoggedIn(false);
    setUsername("");
  };

  return (
    <div>
      {isLoggedIn ? (
        <div style={{ display: "flex", alignItems: "center" }}>
          <p style={{ marginRight: "10px" }}>
            Bienvenido, {username}. Gracias por logearte!
          </p>
          <button
            onClick={handleLogout}
            className="inline-block rounded-lg bg-blue-500 px-5 py-3 text-sm font-medium text-white"
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={() => (window.location.href = "/login/")}
          className="inline-block rounded-lg bg-blue-500 px-5 py-3 text-sm font-medium text-white"
        >
          Login
        </button>
      )}
    </div>
  );
};

export default UsuarioLogout;
