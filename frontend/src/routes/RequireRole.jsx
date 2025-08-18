import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken, getCurrentUserRole } from "../api/conexion.api.js";
import PropTypes from "prop-types";

export default function RequireRole({ allowed = [] }) {
  const [authorized, setAuthorized] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const run = async () => {
      const token = getAccessToken();
      if (!token) return setAuthorized(false);
      const role = await getCurrentUserRole();
      setAuthorized(
        role != null && (allowed.length === 0 || allowed.includes(Number(role)))
      );
    };
    run();
  }, [allowed]);

  if (authorized === null) return null;
  return authorized ? (
    <Outlet />
  ) : (
    <Navigate to="/unauthorized" replace state={{ from: location }} />
  );
}

RequireRole.propTypes = {
  allowed: PropTypes.arrayOf(PropTypes.number),
};
