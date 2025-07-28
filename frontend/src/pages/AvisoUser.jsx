import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AvisoUser() {
  const [userData, setUserData] = useState({});
  const [counter, setCounter] = useState(40); // Contador de 40 segundos
  const navigate = useNavigate();

  // Efecto para validar acceso y cargar datos
  useEffect(() => {
    const data = localStorage.getItem("userData");
    if (!data) {
      // Navegar después del render
      setTimeout(() => navigate("/home/"), 0);
      return;
    }
    setUserData(JSON.parse(data));
  }, [navigate]);

  // Efecto para el contador regresivo
  useEffect(() => {
    if (!userData || !userData.username) return; // Solo iniciar si hay datos
    const timer = setInterval(() => {
      setCounter((prevCounter) => {
        if (prevCounter <= 1) {
          localStorage.removeItem("userData");
          navigate("/home/");
          return 0;
        }
        return prevCounter - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate, userData]);

  return (
    <div className="w-auto h-auto flex items-stretch justify-stretch bg-gray-100">
      <div className="w-full h-full p-4 m-4 bg-white rounded-lg shadow-md mt-1">
        <div
          className="bg-yellow-200 border-l-8 border-yellow-700 text-black p-4"
          role="alert"
        >
          <div className="flex-initial">
            <svg
              className="h-12 w-12 text-yellow-900 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
              />
            </svg>
            <div>
              <p className="text-center font-bold text-3xl">
                Comunicado Importante.
              </p>
              <p className="text-justify font-normal text-xl">
                Estimado/a {userData.fun_titu}
                {". "}{" "}
                <span className="font-bold">
                  {" "}
                  {userData.last_name} {userData.first_name}.
                </span>
                <br />
                Le informamos que su cuenta ha sido creada exitosamente con el
                usuario&nbsp;
                <span className="font-bold">
                  {userData.username}.<br />
                </span>
                Para activar su acceso al sistema, el administrador debe validar
                su usuario. Una vez que el proceso de validación esté completo,
                recibirá un correo de confirmación en su correo institucional
                Zimbra, el cual contendrá la información necesaria para ingresar
                al sistema.
                <br />
                Agradecemos su paciencia y comprensión en este proceso.
              </p>
              {/* Contador regresivo */}
              <div className="mt-6 text-center">
                <p className="text-lg">
                  Será redireccionado a la página principal en{" "}
                  <span className="font-bold text-red-600 text-2xl">
                    {counter}
                  </span>{" "}
                  segundos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
