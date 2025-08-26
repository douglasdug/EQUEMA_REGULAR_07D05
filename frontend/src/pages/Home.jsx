import React, { useContext } from "react";
import { Link } from "react-router-dom";
import {
  FaUserPlus,
  FaEnvelopeOpenText,
  FaFileAlt,
  FaUsersCog,
  FaClipboardCheck,
  FaFirstAid,
} from "react-icons/fa";
import { AuthContext } from "../components/AuthContext.jsx";

const links = [
  {
    path: "/register-user/",
    titulo: "Registro de Usuario",
    desc: "Crear nuevos usuarios en el sistema.",
    Icon: FaUserPlus,
    color: "from-indigo-500 to-indigo-600",
    roles: ["public"],
  },
  {
    path: "/admin-user/",
    titulo: "Administración Usuarios",
    desc: "Gestión y privilegios de usuarios.",
    Icon: FaUsersCog,
    color: "from-amber-500 to-amber-600",
    roles: [1],
  },
  {
    path: "/admision/",
    titulo: "Admisión",
    desc: "Procesos de admisión y registro.",
    Icon: FaClipboardCheck,
    color: "from-fuchsia-500 to-fuchsia-600",
    roles: [3],
  },
  {
    path: "/form-008-emergencia/",
    titulo: "Form 008 Emergencia",
    desc: "Formulario de atenciones de emergencia.",
    Icon: FaFirstAid,
    color: "from-rose-500 to-rose-600",
    roles: [3],
  },
  {
    path: "/reporte-atenciones/",
    titulo: "Reporte de Atenciones",
    desc: "Consultar reportes y estadísticas.",
    Icon: FaFileAlt,
    color: "from-sky-500 to-sky-600",
    roles: [1, 2, 3],
  },
  {
    path: "/contacto/",
    titulo: "Contacto",
    desc: "Información y formulario de contacto.",
    Icon: FaEnvelopeOpenText,
    color: "from-emerald-500 to-emerald-600",
    roles: ["public"],
  },
];

const Home = () => {
  const { authData } = useContext(AuthContext);
  const roleRaw = authData?.user?.fun_admi_rol ?? authData?.fun_admi_rol;
  const role = roleRaw != null ? Number(roleRaw) : null;
  const isLoggedIn = !!authData?.user;

  const canSee = (rolesArr) =>
    rolesArr?.includes("public") || (role && rolesArr?.includes(role));

  const visibleLinks = links.filter(
    (l) => !(isLoggedIn && l.path === "/register-user/") && canSee(l.roles)
  );

  return (
    <div className="w-full px-2 py-4 mx-auto max-w-7xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 items-center text-center">
        Panel Principal
      </h1>
      <div className="overflow-x-auto rounded-lg ring-1 ring-gray-100 dark:ring-gray-800 bg-white dark:bg-blue-100">
        <table className="min-w-full border-collapse">
          <tbody>
            <tr className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleLinks.map(({ path, titulo, desc, Icon, color }) => (
                <td
                  key={path}
                  className="bg-gradient-to-br rounded-xl relative group shadow-sm hover:shadow-md transition-shadow border border-white/40 dark:border-white/10"
                >
                  <div className="flex flex-col items-center text-center h-full p-6 backdrop-blur-sm bg-white/70 dark:bg-gray-900/60 rounded-xl">
                    <div
                      className={`w-24 h-24 mb-4 rounded-full flex items-center justify-center text-white text-5xl font-light bg-gradient-to-br ${color} shadow-lg`}
                    >
                      <Icon aria-hidden="true" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      {titulo}
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-100 mt-2 mb-5">
                      {desc}
                    </p>
                    <Link
                      to={path}
                      className="mt-auto inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-800 dark:bg-blue-700 hover:bg-blue-900 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
                      aria-label={`Ir a ${titulo}`}
                    >
                      Ingresar a <span className="text-xs">&rarr;</span>
                    </Link>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Home;
