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
  className = "",
}) => {
  // Buscar el objeto seleccionado en options
  const selectedOption = options.find((opt) => opt.value === value) || null;

  return (
    <div
      className={`relative w-full ${className} ${
        disabled ? "cursor-not-allowed" : ""
      }`}
      style={disabled ? { cursor: "not-allowed" } : {}}
    >
      <Select
        inputId={id}
        name={name}
        value={selectedOption}
        onChange={(selected) =>
          onChange({
            target: {
              name,
              value: selected ? selected.value : "",
            },
          })
        }
        options={options}
        isDisabled={disabled}
        placeholder="Seleccione una opción"
        styles={selectStyles}
        classNamePrefix="react-select"
        isClearable
      />
    </div>
  );
};

CustomSelect.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export const inputStyle =
  "form-input shadow appearance-none border border-gray-500 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline";

export const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: "#A0AEC0",
    boxShadow: "none",
    backgroundColor: state.isDisabled ? "#E5E7EB" : "#FFFFFF",
    color: "#374151",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    "&:hover": {
      borderColor: "#A0AEC0",
    },
  }),
  singleValue: (provided, state) => ({
    ...provided,
    color: "#374151",
    cursor: state.isDisabled ? "not-allowed" : "inherit", // Agrega esta línea
  }),
  placeholder: (provided, state) => ({
    ...provided,
    color: "#262626",
    cursor: state.isDisabled ? "not-allowed" : "inherit", // Agrega esta línea
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isDisabled ? "#A0AEC0" : "#000000",
    cursor: state.isDisabled ? "not-allowed" : "pointer", // Agrega esta línea
    "&:hover": {
      color: state.isDisabled ? "#A0AEC0" : "#000000",
    },
  }),
  indicatorSeparator: (provided, state) => ({
    ...provided,
    backgroundColor: state.isDisabled ? "#A0AEC0" : "#000000",
    cursor: state.isDisabled ? "not-allowed" : "inherit", // Agrega esta línea
    width: "1px",
    height: "70%",
    margin: "auto",
  }),
  clearIndicator: (provided, state) => ({
    // Agrega este bloque
    ...provided,
    cursor: state.isDisabled ? "not-allowed" : "pointer",
  }),
};

export const buttonStylePrimario =
  "ml-2 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-black";

export const buttonStyleSecundario =
  "bg-blue-500 hover:bg-blue-700 text-white ml-2 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline";

export const buttonStyleEliminar =
  "bg-red-500 hover:bg-red-700 text-white ml-2 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer";

export function isFieldInvalid(
  field,
  requiredFields,
  formData,
  isFieldVisible
) {
  if (!requiredFields.includes(field)) return false;
  if (!isFieldVisible(field)) return false;
  const value = formData[field];
  if (Array.isArray(value)) return value.length === 0;
  return !value;
}
