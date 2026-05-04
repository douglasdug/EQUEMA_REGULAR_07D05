import React, { useEffect, useMemo, useState } from "react";
import { getDashboardData } from "../api/conexion.api.js";

const AGE_GROUPS = [
  "0-4",
  "5-9",
  "10-14",
  "15-19",
  "20-24",
  "25-29",
  "30-34",
  "35-39",
  "40-44",
  "45-49",
  "50-54",
  "55-59",
  "60-64",
  "65-69",
  "70-74",
  "75-79",
  "80+",
];

const thStyle = {
  textAlign: "left",
  padding: 10,
  borderBottom: "1px solid #e5e7eb",
  background: "#f9fafb",
};

const tdStyle = {
  padding: 10,
  borderBottom: "1px solid #f3f4f6",
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const parseAgeToGroup = (value) => {
  if (value === null || value === undefined || value === "") return "Sin dato";
  const text = String(value).trim();
  if (AGE_GROUPS.includes(text)) return text;

  const numeric = Number(text);
  if (Number.isFinite(numeric)) {
    if (numeric >= 80) return "80+";
    const start = Math.floor(numeric / 5) * 5;
    return `${start}-${start + 4}`;
  }

  const match = text.match(/(\d+)/);
  if (match) {
    const numericMatch = Number(match[1]);
    if (numericMatch >= 80) return "80+";
    const start = Math.floor(numericMatch / 5) * 5;
    return `${start}-${start + 4}`;
  }

  return text;
};

const parseSex = (row) => {
  const raw = row.sexo ?? row.sex ?? row.genero ?? row.gender ?? row.sx ?? "";
  const text = normalizeText(raw);
  if (["m", "masculino", "male", "h", "hombre"].includes(text))
    return "Masculino";
  if (["f", "femenino", "female", "mujer"].includes(text)) return "Femenino";
  return "Sin dato";
};

const getCount = (row) => {
  const candidates = [
    row.cantidad,
    row.total,
    row.count,
    row.valor,
    row.cant,
    row.personas,
    row.population,
    row.poblacion,
  ];
  const found = candidates.find(
    (value) => value !== undefined && value !== null && value !== "",
  );
  const num = Number(found);
  return Number.isFinite(num) ? num : 1;
};

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ can_descri: "", uni_codigo: "" });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await getDashboardData();
        const items = Array.isArray(response)
          ? response
          : (response?.data ?? response?.result ?? []);
        if (mounted) setData(Array.isArray(items) ? items : []);
      } catch (err) {
        if (mounted)
          setError("No se pudo cargar la información del dashboard.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const canDescri = normalizeText(row.can_descri);
      const uniCodigo = normalizeText(row.uni_codigo);
      const fCan = normalizeText(filters.can_descri);
      const fUni = normalizeText(filters.uni_codigo);
      return (
        (!fCan || canDescri.includes(fCan)) &&
        (!fUni || uniCodigo.includes(fUni))
      );
    });
  }, [data, filters]);

  const canOptions = useMemo(
    () =>
      [
        ...new Set(
          data
            .map((row) => String(row.can_descri ?? "").trim())
            .filter(Boolean),
        ),
      ].sort(),
    [data],
  );
  const uniOptions = useMemo(
    () =>
      [
        ...new Set(
          data
            .map((row) => String(row.uni_codigo ?? "").trim())
            .filter(Boolean),
        ),
      ].sort(),
    [data],
  );

  const pyramid = useMemo(() => {
    const map = AGE_GROUPS.reduce(
      (acc, group) => {
        acc[group] = { Masculino: 0, Femenino: 0, "Sin dato": 0 };
        return acc;
      },
      { "Sin dato": { Masculino: 0, Femenino: 0, "Sin dato": 0 } },
    );

    filteredData.forEach((row) => {
      const group = parseAgeToGroup(
        row.edad ?? row.age ?? row.rango_edad ?? row.grp_edad ?? row.grupo_edad,
      );
      const sex = parseSex(row);
      const count = getCount(row);
      if (!map[group])
        map[group] = { Masculino: 0, Femenino: 0, "Sin dato": 0 };
      map[group][sex] = (map[group][sex] ?? 0) + count;
    });

    const rows = [...AGE_GROUPS, "Sin dato"].map((group) => ({
      group,
      male: map[group]?.Masculino ?? 0,
      female: map[group]?.Femenino ?? 0,
    }));

    const maxValue = Math.max(
      1,
      ...rows.flatMap((row) => [row.male, row.female]),
    );
    return { rows, maxValue };
  }, [filteredData]);

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "Arial, sans-serif",
        color: "#1f2937",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>Dashboard poblacional</h1>
      <p style={{ marginTop: 0, color: "#6b7280" }}>
        Filtros por can_descri y uni_codigo con pirámide poblacional.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span>can_descri</span>
          <select
            value={filters.can_descri}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, can_descri: e.target.value }))
            }
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          >
            <option value="">Todos</option>
            {canOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>uni_codigo</span>
          <select
            value={filters.uni_codigo}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, uni_codigo: e.target.value }))
            }
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          >
            <option value="">Todos</option>
            {uniOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <div>Cargando datos...</div>}
      {error && <div style={{ color: "#b91c1c" }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: "grid", gap: 24 }}>
          <section
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Pirámide poblacional</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {pyramid.rows.map((row) => {
                const maleWidth = `${(row.male / pyramid.maxValue) * 100}%`;
                const femaleWidth = `${(row.female / pyramid.maxValue) * 100}%`;
                return (
                  <div
                    key={row.group}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "70px 1fr 70px 1fr",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div style={{ textAlign: "right", fontSize: 12 }}>
                      {row.group}
                    </div>
                    <div
                      style={{
                        background: "#e5e7eb",
                        height: 18,
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: maleWidth,
                          height: "100%",
                          background: "#2563eb",
                          marginLeft: "auto",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        background: "#e5e7eb",
                        height: 18,
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: femaleWidth,
                          height: "100%",
                          background: "#db2777",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 12 }}>{row.female}</div>
                  </div>
                );
              })}
            </div>
            <div
              style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12 }}
            >
              <span>
                <strong style={{ color: "#2563eb" }}>■</strong> Masculino
              </span>
              <span>
                <strong style={{ color: "#db2777" }}>■</strong> Femenino
              </span>
            </div>
          </section>

          <section
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Registros filtrados</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>can_descri</th>
                    <th style={thStyle}>uni_codigo</th>
                    <th style={thStyle}>sexo</th>
                    <th style={thStyle}>edad</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 20).map((row, index) => (
                    <tr key={index}>
                      <td style={tdStyle}>{row.can_descri ?? "-"}</td>
                      <td style={tdStyle}>{row.uni_codigo ?? "-"}</td>
                      <td style={tdStyle}>
                        {row.sexo ?? row.sex ?? row.genero ?? "-"}
                      </td>
                      <td style={tdStyle}>
                        {row.edad ?? row.age ?? row.rango_edad ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
