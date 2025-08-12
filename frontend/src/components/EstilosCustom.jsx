import React, { useState } from "react";
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
  isMulti = false,
  isLargeList = false, // Nueva prop para indicar listas grandes
  placeholder = "Seleccione una opción",
  minSearchLength = 2, // Caracteres mínimos para búsqueda
  maxResults = 100, // Máximo de resultados a mostrar
  isClearable = true,
  onFocus,
  onBlur,
  title,
  tooltipContent,
  tooltipPosition = "bottom", // "top" | "bottom" | "left" | "right"
  tooltipTrigger = "both",
  tooltipMaxWidth = "28rem",
  tooltipAlign = "start", // "start" | "center" | "end"
  tooltipOffset = 8,
}) => {
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  // Para isMulti, value debe ser array de objetos; para simple, un objeto
  const selectedOption = isMulti
    ? value
    : options.find((opt) => opt.value === value) || null;

  // Si es lista grande, mostrar solo el elemento seleccionado inicialmente
  let optionsToShow;
  if (isLargeList) {
    if (filteredOptions.length > 0) {
      optionsToShow = filteredOptions;
    } else if (selectedOption) {
      optionsToShow = [selectedOption].filter(Boolean);
    } else {
      optionsToShow = [];
    }
  } else {
    optionsToShow = options;
  }

  // Handlers que también notifican al padre
  const handleFocus = (e) => {
    if (tooltipTrigger === "focus" || tooltipTrigger === "both") {
      setShowTooltip(true);
    }
    onFocus?.(e);
  };
  const handleBlur = (e) => {
    if (tooltipTrigger === "focus" || tooltipTrigger === "both") {
      setShowTooltip(false);
    }
    onBlur?.(e);
  };
  const handleMouseEnter = () => {
    if (tooltipTrigger === "hover" || tooltipTrigger === "both") {
      setShowTooltip(true);
    }
  };
  const handleMouseLeave = () => {
    if (tooltipTrigger === "hover" || tooltipTrigger === "both") {
      setShowTooltip(false);
    }
  };

  const posIsBottom = tooltipPosition === "bottom";

  const buildTooltipStyle = () => {
    const style = { maxWidth: tooltipMaxWidth, width: "max-content" };
    const offset =
      typeof tooltipOffset === "number" ? `${tooltipOffset}px` : tooltipOffset;

    switch (tooltipPosition) {
      case "bottom":
        style.top = "100%";
        style.marginTop = offset;
        if (tooltipAlign === "start") style.left = 0;
        else if (tooltipAlign === "center") {
          style.left = "50%";
          style.transform = "translateX(-50%)";
        } else if (tooltipAlign === "end") style.right = 0;
        break;
      case "top":
        style.bottom = "100%";
        style.marginBottom = offset;
        if (tooltipAlign === "start") style.left = 0;
        else if (tooltipAlign === "center") {
          style.left = "50%";
          style.transform = "translateX(-50%)";
        } else if (tooltipAlign === "end") style.right = 0;
        break;
      case "right":
        style.left = "100%";
        style.marginLeft = offset;
        if (tooltipAlign === "start") style.top = 0;
        else if (tooltipAlign === "center") {
          style.top = "50%";
          style.transform = "translateY(-50%)";
        } else if (tooltipAlign === "end") style.bottom = 0;
        break;
      case "left":
        style.right = "100%";
        style.marginRight = offset;
        if (tooltipAlign === "start") style.top = 0;
        else if (tooltipAlign === "center") {
          style.top = "50%";
          style.transform = "translateY(-50%)";
        } else if (tooltipAlign === "end") style.bottom = 0;
        break;
      default:
        break;
    }
    return style;
  };

  return (
    <div
      className={`relative w-full rounded ${className} ${
        disabled ? "cursor-not-allowed" : ""
      }`}
      style={disabled ? { cursor: "not-allowed" } : {}}
      title={title}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Select
        inputId={id}
        name={name}
        value={selectedOption}
        onChange={(selected) => {
          if (isMulti) {
            // selected es array de objetos
            onChange(selected || []);
          } else {
            // selected es objeto o null
            onChange({
              target: {
                name,
                value: selected ? selected.value : "",
              },
            });
          }
        }}
        options={optionsToShow}
        isDisabled={disabled}
        isMulti={isMulti}
        placeholder={
          isLargeList
            ? `Escriba para buscar (mínimo ${minSearchLength} caracteres)`
            : placeholder
        }
        styles={selectStyles}
        classNamePrefix="react-select"
        isClearable={isClearable}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMenuOpen={() => {
          if (tooltipTrigger !== "hover") setShowTooltip(true);
          onFocus?.();
        }}
        onMenuClose={() => {
          if (tooltipTrigger !== "hover") setShowTooltip(false);
          onBlur?.();
        }}
        // Propiedades adicionales para listas grandes
        onInputChange={
          isLargeList
            ? (text) => {
                setInputValue(text);
                if (text.length >= minSearchLength) {
                  const filtered = options
                    .filter(
                      (opt) =>
                        opt.value.toLowerCase().includes(text.toLowerCase()) ||
                        opt.label.toLowerCase().includes(text.toLowerCase())
                    )
                    .slice(0, maxResults)
                    // Cambia esta parte para evitar la duplicación:
                    .map((opt) => {
                      // Verificar si el label ya incluye el código
                      if (opt.label.startsWith(opt.value)) {
                        return opt; // Ya incluye el código, no modificar
                      } else {
                        return {
                          ...opt,
                          label: `${opt.value} - ${opt.label}`,
                        };
                      }
                    });
                  setFilteredOptions(filtered);
                } else {
                  setFilteredOptions([]);
                }
              }
            : undefined
        }
        noOptionsMessage={
          isLargeList
            ? () =>
                inputValue.length < minSearchLength
                  ? `Escriba al menos ${minSearchLength} caracteres para buscar`
                  : "No se encontraron resultados"
            : undefined
        }
        filterOption={isLargeList ? null : undefined} // Desactivar filtro interno para listas grandes
      />
      {tooltipContent && showTooltip && (
        <div
          className="absolute z-50 bg-yellow-50 border border-yellow-400 shadow-lg rounded p-3 text-xs text-gray-800"
          style={buildTooltipStyle()}
          role="tooltip"
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

CustomSelect.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
    PropTypes.array,
  ]),
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  isMulti: PropTypes.bool,
  isLargeList: PropTypes.bool,
  placeholder: PropTypes.string,
  minSearchLength: PropTypes.number,
  maxResults: PropTypes.number,
  isClearable: PropTypes.bool,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  title: PropTypes.string,
  tooltipContent: PropTypes.node,
  tooltipTrigger: PropTypes.oneOf(["focus", "hover", "both"]),
  tooltipMaxWidth: PropTypes.string,
  tooltipPosition: PropTypes.oneOf(["top", "bottom", "left", "right"]),
  tooltipAlign: PropTypes.oneOf(["start", "center", "end"]), // NUEVO
  tooltipOffset: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), // NUEVO
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
