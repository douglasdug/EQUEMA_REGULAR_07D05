import React from "react";
import Select from "react-select";
import PropTypes from "prop-types";

export const CustomSelect = ({
  id,
  name,
  value,
  onChange,
  options,
  disabled,
  variableEstado,
}) => {
  return (
    <div className="relative inline-block w-full">
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`block appearance-none w-full border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline ${
          disabled
            ? "bg-gray-200 text-gray-700 cursor-no-drop"
            : "bg-white text-gray-700 cursor-pointer"
        }`}
      >
        <option value="" disabled>
          Seleccione una opción
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg
          className="fill-current h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <line x1="0" y1="0" x2="0" y2="20" stroke="gray" strokeWidth="2" />
          <path
            d="M5 8l5 6 5-6H5z"
            fill="gray"
            stroke="black"
            strokeWidth="0.5"
          />
        </svg>
      </div>
    </div>
  );
};

CustomSelect.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  variableEstado: PropTypes.object,
};

export const inputStyle =
  "shadow appearance-none border border-gray-500 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline";

export const selectStyles = {
  control: (provided) => ({
    ...provided,
    borderColor: "#A0AEC0",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#A0AEC0",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#262626",
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isDisabled ? "#A0AEC0" : "#000000", // Cambia el color de la flecha
    "&:hover": {
      color: state.isDisabled ? "#A0AEC0" : "#000000", // Cambia el color de la flecha al pasar el ratón
    },
  }),
  indicatorSeparator: (provided, state) => ({
    ...provided,
    backgroundColor: state.isDisabled ? "#A0AEC0" : "#000000", // Color de la raya vertical
    width: "1px", // Ancho de la raya vertical
    height: "70%", // Altura de la raya vertical
    margin: "auto", // Centrar verticalmente
  }),
};

export const buttonStylePrimario =
  "ml-2 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-black";

export const buttonStyleSecundario =
  "bg-blue-500 hover:bg-blue-700 text-white ml-2 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline";

export const buttonStyleEliminar =
  "bg-red-500 hover:bg-red-700 text-white ml-2 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer";
