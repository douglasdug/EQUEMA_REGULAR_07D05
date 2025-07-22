import React, { useEffect, useState } from "react";

export default function AvisoUser() {
  const [userData, setUserData] = useState({});

  useEffect(() => {
    const data = localStorage.getItem("userData");
    if (data) {
      setUserData(JSON.parse(data));
    }
  }, []);

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
