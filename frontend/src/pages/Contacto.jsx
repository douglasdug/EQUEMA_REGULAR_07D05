import { useState } from "react";

export default function Contacto() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    asunto: "",
    mensaje: "",
    acepta: false,
  });
  const [estado, setEstado] = useState({
    enviando: false,
    exito: null,
    error: null,
  });

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const validar = () => {
    if (!form.nombre.trim()) return "El nombre es obligatorio";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Email inválido";
    if (!form.asunto.trim()) return "El asunto es obligatorio";
    if (form.mensaje.trim().length < 10)
      return "El mensaje debe tener al menos 10 caracteres";
    if (!form.acepta) return "Debes aceptar la política de privacidad";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const error = validar();
    if (error) {
      setEstado({ enviando: false, exito: null, error });
      return;
    }
    setEstado({ enviando: true, exito: null, error: null });
    try {
      // Simulación de envío
      await new Promise((r) => setTimeout(r, 1200));
      // Aquí puedes hacer un fetch a tu API: await fetch('/api/contacto', { method:'POST', body: JSON.stringify(form) })
      setEstado({
        enviando: false,
        exito: "Mensaje enviado correctamente. Te responderemos pronto.",
        error: null,
      });
      setForm({
        nombre: "",
        email: "",
        asunto: "",
        mensaje: "",
        acepta: false,
      });
    } catch (err) {
      setEstado({
        enviando: false,
        exito: null,
        error: "Ocurrió un error al enviar. Intenta nuevamente.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-indigo-600 text-white py-10">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-3xl font-bold">Contacto</h1>
          <p className="mt-2 text-indigo-100">
            ¿Tienes dudas, propuestas o necesitas soporte? Completa el
            formulario y nos pondremos en contacto.
          </p>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-6 grid gap-10 md:grid-cols-3">
          <section className="md:col-span-1 space-y-6">
            <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                Información
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                Puedes escribirnos para temas de soporte técnico, solicitudes
                comerciales, colaboración o feedback.
              </p>
              <ul className="mt-4 text-sm text-gray-700 space-y-2">
                <li>
                  <span className="font-medium">Email:</span>{" "}
                  soporte@07d05.mspz7.gob.ec
                </li>
                <li>
                  <span className="font-medium">Teléfono:</span> +593-7-2511-182
                </li>
                <li>
                  <span className="font-medium">Horario:</span> Lun - Vie /
                  08:00 - 17:00
                </li>
                <li>
                  <span className="font-medium">Dirección:</span> SUCRE ENTRE
                  COTOPAXI Y TUNGURAHUA
                </li>
              </ul>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
                Privacidad
              </h3>
              <p className="mt-2 text-xs text-indigo-800 leading-relaxed">
                Tus datos se usan únicamente para responder tu mensaje. No serán
                compartidos con terceros.
              </p>
            </div>
          </section>

          <form
            onSubmit={onSubmit}
            className="md:col-span-2 bg-white shadow rounded-lg p-8 border border-gray-100 space-y-6"
            noValidate
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre completo
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={onChange}
                  className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  placeholder="Ej: Ana Pérez"
                  autoComplete="name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  placeholder="tu@correo.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="asunto"
                className="block text-sm font-medium text-gray-700"
              >
                Asunto
              </label>
              <input
                id="asunto"
                name="asunto"
                type="text"
                value={form.asunto}
                onChange={onChange}
                className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                placeholder="Motivo del mensaje"
              />
            </div>

            <div>
              <label
                htmlFor="mensaje"
                className="block text-sm font-medium text-gray-700"
              >
                Mensaje
              </label>
              <textarea
                id="mensaje"
                name="mensaje"
                rows={6}
                value={form.mensaje}
                onChange={onChange}
                className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm resize-y"
                placeholder="Describe tu consulta con detalle..."
              />
              <p className="mt-1 text-xs text-gray-400">
                Mínimo 10 caracteres. Sé claro y específico para agilizar la
                respuesta.
              </p>
            </div>

            <div className="flex items-start">
              <input
                id="acepta"
                name="acepta"
                type="checkbox"
                checked={form.acepta}
                onChange={onChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="acepta" className="ml-2 text-xs text-gray-600">
                Acepto la política de privacidad y el tratamiento de mis datos.
              </label>
            </div>

            {estado.error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded">
                {estado.error}
              </div>
            )}
            {estado.exito && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded">
                {estado.exito}
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={estado.enviando}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {estado.enviando ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Enviando...
                  </span>
                ) : (
                  "Enviar mensaje"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm({
                    nombre: "",
                    email: "",
                    asunto: "",
                    mensaje: "",
                    acepta: false,
                  });
                  setEstado((s) => ({ ...s, error: null, exito: null }));
                }}
                disabled={estado.enviando}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
