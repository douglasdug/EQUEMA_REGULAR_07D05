import { useState } from "react";
import { firmarPdf } from "../api/conexion.api";

export default function CertificadoMedico() {
  const [pdfFile, setPdfFile] = useState(null);
  const [p12Password, setP12Password] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      alert("Debe seleccionar un archivo PDF.");
      return;
    }
    setLoading(true);
    try {
      const blob = await firmarPdf(pdfFile, p12Password);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdf_firmado.pdf";
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
      <h2 className="text-xl font-bold mb-4">Firmar PDF</h2>

      <input
        type="file"
        accept="application/pdf"
        className="border p-2 w-full mb-3"
        onChange={(e) => setPdfFile(e.target.files[0] || null)}
        required
      />

      <input
        type="password"
        className="border p-2 w-full mb-4"
        placeholder="Contraseña del certificado (P12)"
        value={p12Password}
        onChange={(e) => setP12Password(e.target.value)}
        required
      />

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Firmando..." : "Firmar PDF"}
      </button>
    </form>
  );
}
