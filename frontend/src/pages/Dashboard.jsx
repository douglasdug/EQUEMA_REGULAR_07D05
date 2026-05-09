import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  LabelList,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Tooltip as LeafletTooltip,
} from "react-leaflet";
import L from "leaflet";
import { getDashboardData } from "../api/conexion.api";

const AGE_GROUPS = [
  "0_edad",
  "1_A_4",
  "5_A_9",
  "10_A_14",
  "15_A_19",
  "20_A_24",
  "25_A_29",
  "30_A_34",
  "35_A_39",
  "40_A_44",
  "45_A_49",
  "50_A_54",
  "55_A_59",
  "60_A_64",
  "65_A_69",
  "70_A_74",
  "75_A_79",
  "80_A_MAS",
];

const AGE_LABELS = {
  "0_edad": "0",
  "1_A_4": "1-4",
  "5_A_9": "5-9",
  "10_A_14": "10-14",
  "15_A_19": "15-19",
  "20_A_24": "20-24",
  "25_A_29": "25-29",
  "30_A_34": "30-34",
  "35_A_39": "35-39",
  "40_A_44": "40-44",
  "45_A_49": "45-49",
  "50_A_54": "50-54",
  "55_A_59": "55-59",
  "60_A_64": "60-64",
  "65_A_69": "65-69",
  "70_A_74": "70-74",
  "75_A_79": "75-79",
  "80_A_MAS": "80+",
};

const nf = new Intl.NumberFormat("es-EC");

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const normalizeSex = (value) => {
  const text = normalizeText(value);

  if (["hombre", "masculino", "m", "h"].includes(text)) return "Hombre";
  if (["mujer", "femenino", "f", "fem"].includes(text)) return "Mujer";
  return "Sin dato";
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const createAgeAccumulator = () =>
  AGE_GROUPS.reduce((accumulator, group) => {
    accumulator[group] = 0;
    return accumulator;
  }, {});

const sumAgeGroups = (row, accumulator) => {
  AGE_GROUPS.forEach((group) => {
    accumulator[group] += toNumber(row[group]);
  });
};

export default function Dashboard() {
  const [allData, setAllData] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uniCodigo, setUniCodigo] = useState("");
  const [canDescri, setCanDescri] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        const res = await getDashboardData();
        const items = Array.isArray(res) ? res : (res?.results ?? []);

        if (!mounted) return;

        setAllData(items);
        setData(items);
        setError("");
      } catch {
        if (mounted) {
          setError("No se pudo cargar la información del dashboard.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!allData.length) return;

    if (!uniCodigo && !canDescri) {
      setData(allData);
      setError("");
      return;
    }

    // Filtrado local (Instantáneo y sin errores de API)
    const filtered = allData.filter((item) => {
      const matchUni =
        !uniCodigo || String(item.uni_codigo) === String(uniCodigo);
      const matchCan =
        !canDescri || String(item.can_descri) === String(canDescri);
      return matchUni && matchCan;
    });

    setData(filtered);

    if (filtered.length === 0) {
      setError("No se encontraron datos para los filtros seleccionados.");
    } else {
      setError("");
    }
  }, [uniCodigo, canDescri, allData]);

  const uniOptions = useMemo(() => {
    return [
      ...new Set(
        allData
          .map((item) => String(item.uni_codigo ?? "").trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => Number(a) - Number(b));
  }, [allData]);

  const canOptions = useMemo(() => {
    return [
      ...new Set(
        allData
          .map((item) => String(item.can_descri ?? "").trim())
          .filter(Boolean),
      ),
    ].sort();
  }, [allData]);

  const pyramidData = useMemo(() => {
    const maleTotals = createAgeAccumulator();
    const femaleTotals = createAgeAccumulator();

    data.forEach((row) => {
      const sex = normalizeSex(row.sexo);

      if (sex === "Hombre") {
        sumAgeGroups(row, maleTotals);
      } else if (sex === "Mujer") {
        sumAgeGroups(row, femaleTotals);
      }
    });

    return AGE_GROUPS.map((key) => ({
      age: AGE_LABELS[key] || key,
      Hombre: -maleTotals[key],
      Mujer: femaleTotals[key],
    }));
  }, [data]);

  const pyramidChartData = useMemo(() => {
    return [...pyramidData].reverse();
  }, [pyramidData]);

  const totalHombres = useMemo(() => {
    const maleTotals = createAgeAccumulator();

    data.forEach((row) => {
      if (normalizeSex(row.sexo) === "Hombre") {
        sumAgeGroups(row, maleTotals);
      }
    });

    return AGE_GROUPS.reduce((sum, key) => sum + maleTotals[key], 0);
  }, [data]);

  const totalMujeres = useMemo(() => {
    const femaleTotals = createAgeAccumulator();

    data.forEach((row) => {
      if (normalizeSex(row.sexo) === "Mujer") {
        sumAgeGroups(row, femaleTotals);
      }
    });

    return AGE_GROUPS.reduce((sum, key) => sum + femaleTotals[key], 0);
  }, [data]);

  const cantonSummary = useMemo(() => {
    const map = new Map();

    data.forEach((row) => {
      const canton = String(row.can_descri ?? "").trim();
      if (!canton) return;

      if (!map.has(canton)) {
        map.set(canton, {
          can_descri: canton,
          hombres: 0,
          mujeres: 0,
        });
      }

      const current = map.get(canton);
      const sex = normalizeSex(row.sexo);
      const rowTotal = AGE_GROUPS.reduce(
        (sum, group) => sum + toNumber(row[group]),
        0,
      );

      if (sex === "Hombre") {
        current.hombres += rowTotal;
      } else if (sex === "Mujer") {
        current.mujeres += rowTotal;
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.can_descri.localeCompare(b.can_descri),
    );
  }, [data]);

  const visibleCantonSummary = useMemo(() => {
    return cantonSummary;
  }, [cantonSummary]);

  const maxAbsValue = useMemo(() => {
    const values = pyramidChartData.flatMap((row) => [
      Math.abs(row.Hombre),
      Math.abs(row.Mujer),
    ]);
    return values.length > 0 ? Math.max(...values) : 100;
  }, [pyramidChartData]);

  // Icono por defecto para Leaflet (opcional, para evitar warnings)
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

  const unidadesConCoordenadas = useMemo(() => {
    return data
      .map((row) => {
        // latitud puede venir como "-3.560063,-80.061547" o "lat,lng"
        const latlng = String(row.latitud ?? "").split(",");
        if (latlng.length !== 2) return null;
        const lat = Number.parseFloat(latlng[0]);
        const lng = Number.parseFloat(latlng[1]);
        if (isNaN(lat) || isNaN(lng)) return null;
        const total = AGE_GROUPS.reduce(
          (sum, key) => sum + toNumber(row[key]),
          0,
        );
        return {
          uni_codigo: row.uni_codigo,
          uni_nombre: row.uni_nombre,
          can_descri: row.can_descri,
          parr_descr: row.parr_descr,
          lat,
          lng,
          total,
        };
      })
      .filter(Boolean);
  }, [data]);

  // Centro del mapa (puedes ajustar a tu zona)
  const center = unidadesConCoordenadas.length
    ? [unidadesConCoordenadas[0].lat, unidadesConCoordenadas[0].lng]
    : [-3.5, -80.1];

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">
            Dashboard poblacional
          </h2>
        </header>
        <p className="mt-0 text-gray-500">
          Pirámide por sexo con filtros por cantón y unidad.
        </p>
        <div className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            <span className="text-xs uppercase tracking-wide text-slate-500">
              uni_codigo
            </span>
            <select
              value={uniCodigo}
              onChange={(e) => setUniCodigo(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">Todas las uni_codigo</option>
              {uniOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            <span className="text-xs uppercase tracking-wide text-slate-500">
              can_descri
            </span>
            <select
              value={canDescri}
              onChange={(e) => setCanDescri(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">Todas las can_descri</option>
              {canOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Hombres
            </div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              {nf.format(totalHombres)}
            </div>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mujeres
            </div>
            <div className="mt-2 text-3xl font-bold text-pink-600">
              {nf.format(totalMujeres)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Registros
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-800">
              {nf.format(data.length)}
            </div>
          </div>
        </div>
        {loading && (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            Cargando...
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            {error}
          </p>
        )}
        {!loading && !error && (
          <div className="grid gap-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h3 className="text-lg font-semibold text-slate-800">
                  Pirámide poblacional 07OT05
                </h3>
                <p className="text-sm text-slate-500">
                  Distribución por sexo y grupos de edad
                </p>
              </div>
              <div className="h-[620px] w-full">
                <ResponsiveContainer>
                  <BarChart
                    data={pyramidChartData}
                    layout="vertical"
                    stackOffset="sign"
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    barCategoryGap={2}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      domain={[-maxAbsValue, maxAbsValue]}
                      tickFormatter={(value) => nf.format(Math.abs(value))}
                    />
                    <YAxis type="category" dataKey="age" width={70} />
                    <Tooltip
                      formatter={(value, name) => [
                        nf.format(Math.abs(Number(value) || 0)),
                        name,
                      ]}
                    />
                    <Legend />

                    <Bar
                      dataKey="Hombre"
                      stackId="pyramid"
                      fill="#2563eb"
                      radius={[10, 0, 0, 10]}
                    >
                      <LabelList
                        dataKey={(entry) => {
                          const total = Math.abs(entry.Hombre);
                          return total > 0 ? nf.format(total) : "";
                        }}
                        position="insideRight"
                        offset={10}
                        className="fill-white text-xs font-bold"
                      />
                    </Bar>
                    <Bar
                      dataKey="Mujer"
                      stackId="pyramid"
                      fill="#db2777"
                      radius={[0, 10, 10, 0]}
                    >
                      <LabelList
                        dataKey={(entry) => {
                          const total = Math.abs(entry.Mujer);
                          return total > 0 ? nf.format(total) : "";
                        }}
                        position="insideRight"
                        offset={10}
                        className="fill-white text-xs font-bold"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h3 className="text-lg font-semibold text-slate-800">
                  Totales por cantón
                </h3>
                <p className="text-sm text-slate-500">
                  Resumen de hombres, mujeres y total
                </p>
              </div>
              <div className="max-h-[500px] overflow-x-auto overflow-y-auto rounded-xl border border-slate-200">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">can_descri</th>
                      <th className="px-4 py-3">Hombres</th>
                      <th className="px-4 py-3">Mujeres</th>
                      <th className="px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCantonSummary.length > 0 ? (
                      visibleCantonSummary.map((row) => {
                        const total = row.hombres + row.mujeres;

                        return (
                          <tr
                            key={row.can_descri}
                            className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/60"
                          >
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {row.can_descri}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {nf.format(row.hombres)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {nf.format(row.mujeres)}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {nf.format(total)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-t border-slate-100">
                        <td className="px-4 py-4 text-slate-500" colSpan={4}>
                          No hay datos para los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h3 className="text-lg font-semibold text-slate-800">
                  Ubicación de unidades
                </h3>
                <p className="text-sm text-slate-500">
                  Mapa interactivo de registros con coordenadas
                </p>
              </div>
              <MapContainer
                center={center}
                zoom={10}
                className="h-[400px] w-full overflow-hidden rounded-xl"
              >
                <TileLayer
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {unidadesConCoordenadas.map((u, idx) => {
                  // Ajusta el factor para que el radio sea visualmente adecuado
                  const radio = Math.sqrt(u.total) * 5; // Puedes ajustar el multiplicador

                  return (
                    <React.Fragment key={u.uni_codigo + u.uni_nombre + idx}>
                      <Circle
                        center={[u.lat, u.lng]}
                        radius={radio}
                        pathOptions={{
                          color: "#2563eb",
                          fillColor: "#2563eb",
                          fillOpacity: 0.25,
                        }}
                      />
                      <Marker position={[u.lat, u.lng]}>
                        <Popup>
                          Unidad Salud: <strong>{u.uni_codigo}</strong>{" "}
                          <strong>{u.uni_nombre}</strong>
                          <br />
                          Cantón: {u.can_descri}
                          <br />
                          Parroquia: {u.parr_descr}
                          <br />
                          Población total: {nf.format(u.total)}
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}
              </MapContainer>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
