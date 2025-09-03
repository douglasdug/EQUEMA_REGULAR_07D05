import React, { useEffect, useCallback } from "react";
import PropTypes from "prop-types";

const sizeMap = {
  xs: "w-4 h-4 border-2",
  sm: "w-6 h-6 border-2",
  md: "w-10 h-10 border-4",
  lg: "w-14 h-14 border-4",
  xl: "w-20 h-20 border-4",
};

/**
 * Loader con opción modal
 * Props nuevas:
 *  - modal?: boolean        (muestra estilo ventana emergente)
 *  - isOpen?: boolean       (control externo del modal)
 *  - onClose?: () => void   (handler cerrar)
 *  - title?: string         (título en modo modal)
 *  - closeButton?: boolean  (muestra botón cerrar)
 */
const Loader = ({
  text = "Cargando...",
  variant = "spinner",
  size = "md",
  fullScreen = false,
  className = "",
  textClassName = "",
  showText = true,
  // Modal
  modal = false,
  isOpen = true,
  onClose,
  title = "Procesando",
  closeButton = true,
}) => {
  const sizeClasses = sizeMap[size] || sizeMap.md;

  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape" && modal && onClose) onClose();
    },
    [modal, onClose]
  );

  useEffect(() => {
    if (modal && isOpen) {
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [modal, isOpen, handleKey]);

  if (modal && !isOpen) return null;

  const animationNode =
    variant === "spinner" ? (
      <div
        className={`${sizeClasses} rounded-full border-current border-t-transparent text-indigo-500 animate-spin motion-reduce:animate-[spin_1.2s_linear_infinite]`}
      />
    ) : (
      <div className="w-52 max-w-full">
        <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-200/50 dark:bg-indigo-900/30 relative">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />
        </div>
      </div>
    );

  const body = (
    <div className="flex flex-col items-center gap-3">
      {animationNode}
      {showText && (
        <span
          className={`text-sm font-medium text-indigo-600 dark:text-indigo-300 ${textClassName}`}
        >
          {text}
        </span>
      )}
      <span className="sr-only" aria-live="polite">
        {text}
      </span>
    </div>
  );

  if (modal) {
    return (
      <>
        <dialog
          open
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 ${className}`}
          aria-label={title}
          aria-modal="true"
          onCancel={(e) => {
            e.preventDefault();
            if (onClose) onClose();
          }}
        >
          <div className="relative w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-indigo-200/40 dark:border-indigo-500/20 px-6 py-6 animate-[fadeIn_.18s_ease-out]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 tracking-wide">
                {title}
              </h2>
              {closeButton && onClose && (
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              )}
            </div>
            {body}
          </div>
        </dialog>
        <style>
          {`
                        @keyframes shimmer {
                            0% { transform: translateX(-100%); }
                            50% { transform: translateX(0%); }
                            100% { transform: translateX(100%); }
                        }
                        @keyframes fadeIn {
                            from { opacity:0; transform: translateY(4px) scale(.98); }
                            to { opacity:1; transform: translateY(0) scale(1); }
                        }
                    `}
        </style>
      </>
    );
  }

  // Modo existente (overlay o inline)
  const wrapper = (
    <output
      className={`flex flex-col items-center gap-3 p-4 ${
        fullScreen ? "" : "rounded-md"
      }`}
      aria-live="polite"
      aria-busy="true"
    >
      {animationNode}
      {showText && (
        <span
          className={`text-sm font-medium text-indigo-600 dark:text-indigo-300 ${textClassName}`}
        >
          {text}
        </span>
      )}
      <span className="sr-only">{text}</span>
    </output>
  );

  return (
    <>
      {fullScreen ? (
        <div
          className={`fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm ${className}`}
        >
          {wrapper}
        </div>
      ) : (
        <div className={className}>{wrapper}</div>
      )}
      <style>
        {`
                    @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        50% { transform: translateX(0%); }
                        100% { transform: translateX(100%); }
                    }
                `}
      </style>
    </>
  );
};

Loader.propTypes = {
  text: PropTypes.string,
  variant: PropTypes.oneOf(["spinner", "bar"]),
  size: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
  fullScreen: PropTypes.bool,
  className: PropTypes.string,
  textClassName: PropTypes.string,
  showText: PropTypes.bool,
  modal: PropTypes.bool,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  closeButton: PropTypes.bool,
};

export default Loader;
