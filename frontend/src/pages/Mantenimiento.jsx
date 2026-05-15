import React from "react";

export default function Mantenimiento() {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-white font-sans p-0 m-0 overflow-hidden relative">
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <div className="border-8 border-white rounded-2xl overflow-hidden shadow-2xl w-[90vw] h-[100vh] flex items-center justify-center">
          <img
            src="/Mantenimiento.png"
            alt="Sitio en mantenimiento"
            className="object-cover w-full h-full"
            style={{ minHeight: "100%", minWidth: "100%" }}
          />
        </div>
      </div>
      <div className="absolute z-10 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-40 w-full max-w-2xl px-4">
        <h1 className="text-center text-3xl md:text-4xl font-bold text-orange-600 drop-shadow mb-2">
          Estamos en mantenimiento
        </h1>
        <p className="text-base md:text-lg font-normal text-slate-700 bg-white/80 rounded-lg px-4 py-2 mx-auto max-w-xl shadow">
          En este momento estamos realizando mejoras y ajustes en la plataforma
          SIRA.
          <br />
          Te pedimos disculpas por las molestias. Por favor, vuelve a intentarlo
          más tarde.
        </p>
        <p className="text-sm md:text-sm font-normal text-slate-700 bg-white/80 rounded-lg px-4 py-2 mt-16 mx-auto max-w-xl shadow">
          <span className="font-semibold text-orange-600">
            Tiempo estimado de mantenimiento: 3 hora
          </span>
          <br />
          La página web no estará disponible el 15 de mayo de 2026, desde las
          00:00 hasta las 03:00, debido a trabajos de mantenimiento.
        </p>
      </div>
    </div>
  );
}
