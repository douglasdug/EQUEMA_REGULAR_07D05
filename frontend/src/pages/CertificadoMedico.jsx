import { useState } from "react";
import { firmarPdf } from "../api/conexion.api";

export default function CertificadoMedico() {
  // Estado para almacenar el texto del certificado
  const [certificadoTexto, setCertificadoTexto] = useState("");
  const [p12Password, setP12Password] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!certificadoTexto) {
      alert("Debe escribir el contenido del certificado.");
      return;
    }
    setLoading(true);
    try {
      // Enviar el texto y la contraseña al backend
      const blob = await firmarPdf(certificadoTexto, p12Password);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certificado_firmado.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Error al firmar el PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md p-4 mx-auto bg-white shadow rounded"
    >
      <h2 className="text-xl font-bold mb-4">Firmar Certificado</h2>

      {/* Textarea para que el usuario escriba el contenido del certificado */}
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="certificado-texto"
        >
          Contenido del Certificado
        </label>
        <textarea
          id="certificado-texto"
          className="border p-2 w-full"
          placeholder="Escribe aquí el texto que se convertirá en un certificado PDF."
          rows={10}
          value={certificadoTexto}
          onChange={(e) => setCertificadoTexto(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="p12-password"
        >
          Contraseña del certificado (P12)
        </label>
        <input
          id="p12-password"
          type="password"
          className="border p-2 w-full"
          placeholder="Contraseña del certificado (P12)"
          value={p12Password}
          onChange={(e) => setP12Password(e.target.value)}
          required
        />
      </div>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Firmando..." : "Firmar Certificado"}
      </button>
    </form>
  );
}
