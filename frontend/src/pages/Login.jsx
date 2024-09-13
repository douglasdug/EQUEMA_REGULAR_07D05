import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8000/api/v1/login/",
        formData
      );
      console.log("Success!", response.data);
      setSuccessMessage("Login con exito!");
      localStorage.setItem("accessToken", response.data.tokens.access);
      localStorage.setItem("refreshToken", response.data.tokens.refresh);
      toast.success("Loguiado con exito!", {
        position: "bottom-right",
      });
      navigate("/home/");
    } catch (error) {
      console.log("Error durante el Login!", error.response?.data);
      if (error.response && error.response.data) {
        Object.keys(error.response.data).forEach((field) => {
          const errorMessage = error.response.data[field];
          if (errorMessage && errorMessage.length > 0) {
            setError(errorMessage[0]);
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {error && <p style={{ color: "red" }}>{error}</p>}
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
      <h2>Login:</h2>
      <form>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Correo electronico"
          className="bg-zinc-700 p-3 rounded-lg block w-full mb-3"
        />
        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Contraseña"
          className="bg-zinc-700 p-3 rounded-lg block w-full mb-3"
        />
        <button
          type="submit"
          disabled={isLoading}
          onClick={handleSubmit}
          className="bg-indigo-500 p-3 rounded-lg block w-full mt-3"
        >
          Login
        </button>
      </form>
    </div>
  );
}
