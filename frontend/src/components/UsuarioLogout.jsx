// src/components/UsuarioLogout.jsx
import React, { useState, useEffect } from "react";
import { getUser } from "../api/usuario.api.js";

const UsuarioLogout = () => {
  const [fun_titu, setFun_titu] = useState("");
  const [first_name, setFirst_name] = useState("");
  const [last_name, setLast_name] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          const response = await getUser(token);
          setIsLoggedIn(true);
          setFun_titu(response.data.fun_titu);
          setFirst_name(response.data.first_name);
          setLast_name(response.data.last_name);
        } else {
          setIsLoggedIn(false);
          setFun_titu("");
          setFirst_name("");
          setLast_name("");
        }
      } catch (error) {
        setIsLoggedIn(false);
        setFun_titu("");
        setFirst_name("");
        setLast_name("");
      }
    };
    checkLoggedInUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setIsLoggedIn(false);
    setFun_titu("");
    setFirst_name("");
    setLast_name("");
  };

  return (
    <div>
      {isLoggedIn ? (
        <div style={{ display: "flex", alignItems: "center" }}>
          <p style={{ marginRight: "10px" }}>
            Bienvenido, {fun_titu}. {first_name} {last_name}!
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
