// src/components/UsuarioLogout.jsx
import React, { useState, useEffect } from "react";
import { getUser } from "../api/usuario.api.js";

export default function UsuarioLogout() {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          const response = await getUser(token);
          setLoggedIn(true);
          setUsername(response.data.username);
        } else {
          setLoggedIn(false);
          setUsername("");
        }
      } catch (error) {
        setLoggedIn(false);
        setUsername("");
      }
    };
    checkLoggedInUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setLoggedIn(false);
    setUsername("");
  };

  return (
    <div>
      {isLoggedIn ? (
        <>
          <h2>Hola, {username}. Gracias por logearte!</h2>
          <button
            onClick={handleLogout}
            className="bg-indigo-500 p-3 rounded-lg block w-full mt-3"
          >
            Logout
          </button>
        </>
      ) : (
        <h2>Please Login</h2>
      )}
    </div>
  );
}
