import React, { useState } from "react";
import { Link } from "react-router-dom";
import { datosLogin } from "../api/conexion.api.js";
import { toast } from "react-hot-toast";

export default function Login() {
  const [formData, setFormData] = useState({
    fun_email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await datosLogin(formData);
      console.log("Success!", response.data);
      setSuccessMessage("Login con exito!");
      toast.success("Login con exito!", {
        position: "bottom-right",
      });
      window.location.href = "/home/";
    } catch (error) {
      console.log("Error durante el Login!", error.response?.data);
      let errorMessage = "Error durante el Login!";
      if (error.response && error.response.data) {
        Object.keys(error.response.data).forEach((field) => {
          const fieldErrorMessage = error.response.data[field];
          if (fieldErrorMessage && fieldErrorMessage.length > 0) {
            errorMessage = fieldErrorMessage[0];
          }
        });
      }
      toast.error(errorMessage, { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-screen-xl px-4 py-1 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg text-center">
        {error && <p style={{ color: "red" }}>{error}</p>}
        {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
        <h1 className="text-2xl font-bold sm:text-3xl">Login</h1>
        <p className="mt-4 text-gray-700">
          ¡La contraseña debe tener de 8 a 15 caracteres y tener una combinación
          entre Mayúsculas, Minúsculas y números!
        </p>
        <div className="md:w-8/12 lg:ml-6 lg:w-5/12">
          <form action="/" className="mx-auto mb-0 mt-8 max-w-md space-y-4">
            <div>
              <label
                htmlFor="fun_email"
                className="mb-2 block font-medium text-gray-900 text-left"
              >
                Email:
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="fun_email"
                  value={formData.fun_email}
                  onChange={handleChange}
                  placeholder="Correo electronico"
                  className="w-full rounded-lg border-gray-200 p-4 pe-12 text-sm shadow-sm"
                />
                <span className="absolute inset-y-0 end-0 grid place-content-center px-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </span>
              </div>
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-medium text-gray-900 text-left"
              >
                Password:
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Contraseña"
                  className="w-full rounded-lg border-gray-200 p-4 pe-12 text-sm shadow-sm"
                />
                <span className="absolute inset-y-0 end-0 grid place-content-center px-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                No tienes cuenta?
                <Link to="/register/" className="underline ml-1">
                  Regístrese
                </Link>
              </p>
              <button
                type="submit"
                disabled={isLoading}
                onClick={handleSubmit}
                className="inline-block rounded-lg bg-blue-500 px-5 py-3 text-sm font-medium text-white"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
