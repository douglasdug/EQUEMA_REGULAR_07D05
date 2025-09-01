import React, { useState } from "react";

const initialState = {
  age_diag_imag_unid_salu: "",
  age_diag_imag_tipo_docu_iden: "",
  age_diag_imag_nume_iden: "",
  age_diag_imag_apel: "",
  age_diag_imag_nomb: "",
  age_diag_imag_sexo: "",
  age_diag_imag_fech_naci: "",
  age_diag_imag_tele: "",
  age_diag_imag_corr: "",
  age_diag_imag_dire: "",
  age_diag_imag_fech_cita: "",
  age_diag_imag_hora_cita: "",
  age_diag_imag_esta_cita: "PENDIENTE",
  age_diag_imag_tipo_serv: "",
  age_diag_imag_prof_agen_cita: "",
  age_diag_imag_obse: "",
};

const requiredFields = [
  "age_diag_imag_unid_salu",
  "age_diag_imag_tipo_docu_iden",
  "age_diag_imag_nume_iden",
  "age_diag_imag_apel",
  "age_diag_imag_nomb",
  "age_diag_imag_sexo",
  "age_diag_imag_fech_naci",
  "age_diag_imag_tele",
  "age_diag_imag_fech_cita",
  "age_diag_imag_hora_cita",
  "age_diag_imag_tipo_serv",
  "age_diag_imag_prof_agen_cita",
];

export default function AgendaDiagnosticoImagen() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const validate = () => {
    const er = {};
    requiredFields.forEach((f) => {
      if (!form[f] || String(form[f]).trim() === "") er[f] = "Requerido";
    });
    if (
      form.age_diag_imag_corr &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.age_diag_imag_corr)
    )
      er.age_diag_imag_corr = "Correo inválido";
    if (
      form.age_diag_imag_tele &&
      !/^[0-9+\-()\s]{6,20}$/.test(form.age_diag_imag_tele)
    )
      er.age_diag_imag_tele = "Teléfono inválido";
    if (form.age_diag_imag_fech_naci && form.age_diag_imag_fech_cita) {
      if (form.age_diag_imag_fech_cita < form.age_diag_imag_fech_naci)
        er.age_diag_imag_fech_cita = "Fecha cita inválida";
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/agenda/diagnostico-imagen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setMsg("Cita guardada correctamente");
      setForm(initialState);
    } catch (err) {
      setMsg(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  // Componentes reutilizables (similar estructura tipo secciones como Form008Emergencia)
  const inputBase =
    "w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring";
  const inputCls = (name) =>
    `${inputBase} ${
      errors[name]
        ? "border-red-500 ring-red-300"
        : "border-gray-300 ring-indigo-200"
    }`;

  const Label = ({ htmlFor, children, required }) => (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold tracking-wide text-gray-700 mb-1"
    >
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );

  const ErrorMsg = ({ name }) =>
    errors[name] ? (
      <p className="text-[11px] mt-1 text-red-600">{errors[name]}</p>
    ) : null;

  const Field = ({
    label,
    name,
    required,
    type = "text",
    as = "input",
    options = [],
    ...rest
  }) => {
    const commonProps = {
      name,
      value: form[name],
      onChange: handleChange,
      className: inputCls(name),
      ...(type ? { type } : {}),
      ...rest,
    };
    return (
      <div className="space-y-0.5">
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
        {as === "select" ? (
          <select {...commonProps}>
            <option value="">Seleccione</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : as === "textarea" ? (
          <textarea {...commonProps} />
        ) : (
          <input {...commonProps} />
        )}
        <ErrorMsg name={name} />
      </div>
    );
  };

  const Section = ({ title, children }) => (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="px-4 py-2 border-b bg-gray-50 rounded-t-lg">
        <h3 className="text-sm font-semibold tracking-wide text-gray-700">
          {title}
        </h3>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-800">
          Agendar Diagnóstico por Imagen
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete la información requerida marcada con (*)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Datos Paciente */}
        <Section title="Datos del Paciente">
          <div className="grid gap-4 md:grid-cols-4">
            <Field
              label="Unidad de Salud"
              name="age_diag_imag_unid_salu"
              required
              placeholder="Centro Clínico A"
            />
            <Field
              label="Tipo Doc. Identidad"
              name="age_diag_imag_tipo_docu_iden"
              required
              as="select"
              options={[
                { value: "DNI", label: "DNI" },
                { value: "CI", label: "CI" },
                { value: "PAS", label: "Pasaporte" },
              ]}
            />
            <Field
              label="Número Identidad"
              name="age_diag_imag_nume_iden"
              required
              maxLength={25}
            />
            <Field
              label="Sexo"
              name="age_diag_imag_sexo"
              required
              as="select"
              options={[
                { value: "F", label: "Femenino" },
                { value: "M", label: "Masculino" },
                { value: "O", label: "Otro" },
              ]}
            />
            <Field label="Apellidos" name="age_diag_imag_apel" required />
            <Field label="Nombres" name="age_diag_imag_nomb" required />
            <Field
              label="Fecha Nacimiento"
              name="age_diag_imag_fech_naci"
              type="date"
              required
              max={new Date().toISOString().split("T")[0]}
            />
            <Field
              label="Teléfono"
              name="age_diag_imag_tele"
              required
              placeholder="+593..."
            />
            <Field
              label="Correo"
              name="age_diag_imag_corr"
              type="email"
              placeholder="correo@ejemplo.com"
            />
            <div className="md:col-span-3">
              <Field
                label="Dirección"
                name="age_diag_imag_dire"
                placeholder="Calle, número, ciudad"
              />
            </div>
          </div>
        </Section>

        {/* Información de la Cita */}
        <Section title="Información de la Cita">
          <div className="grid gap-4 md:grid-cols-4">
            <Field
              label="Fecha Cita"
              name="age_diag_imag_fech_cita"
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
            />
            <Field
              label="Hora Cita"
              name="age_diag_imag_hora_cita"
              type="time"
              required
            />
            <Field
              label="Estado Cita"
              name="age_diag_imag_esta_cita"
              as="select"
              options={[
                { value: "PENDIENTE", label: "Pendiente" },
                { value: "CONFIRMADA", label: "Confirmada" },
                { value: "CANCELADA", label: "Cancelada" },
                { value: "ATENDIDA", label: "Atendida" },
              ]}
            />
            <Field
              label="Tipo Servicio"
              name="age_diag_imag_tipo_serv"
              required
              as="select"
              options={[
                { value: "RX", label: "Radiografía" },
                { value: "US", label: "Ultrasonido" },
                { value: "TAC", label: "Tomografía" },
                { value: "RMN", label: "Resonancia" },
                { value: "MAMO", label: "Mamografía" },
              ]}
            />
            <Field
              label="Profesional que agenda"
              name="age_diag_imag_prof_agen_cita"
              required
              placeholder="Nombre del profesional"
            />
            <div className="md:col-span-4">
              <Field
                label="Observaciones"
                name="age_diag_imag_obse"
                as="textarea"
                rows={3}
                placeholder="Notas adicionales"
              />
            </div>
          </div>
        </Section>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-md shadow-sm transition"
          >
            {loading ? "Guardando..." : "Guardar Cita"}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(initialState);
              setErrors({});
              setMsg(null);
            }}
            className="text-sm font-medium px-6 py-2.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
          >
            Limpiar
          </button>
          {msg && (
            <span
              className={`text-sm font-medium ${
                msg.toLowerCase().includes("error")
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {msg}
            </span>
          )}
        </div>
      </form>

      {/* Vista previa */}
      <Section title="Vista Previa (JSON)">
        <pre className="text-[11px] bg-gray-900 text-green-200 p-3 rounded-md overflow-auto max-h-72 leading-snug">
          {JSON.stringify(form, null, 2)}
        </pre>
      </Section>
    </div>
  );
}
