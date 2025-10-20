import React, { useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";

const sizeMap = {
  xs: "w-4 h-4 border-2",
  sm: "w-6 h-6 border-2",
  md: "w-10 h-10 border-4",
  lg: "w-14 h-14 border-4",
  xl: "w-20 h-20 border-4",
};

const Loader = ({
  text = "Cargando...",
  variant = "spinner",
  size = "md",
  fullScreen = false,
  className = "",
  textClassName = "",
  showText = true,
  modal = false,
  isOpen = true,
  onClose,
  title = "Procesando",
  closeButton = true,
  overlayClosable = true,
  portal = true,
}) => {
  const sizeClasses = sizeMap[size] || sizeMap.md;

  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape" && modal && onClose) onClose();
    },
    [modal, onClose]
  );

  // Bloquea scroll del body cuando el modal está abierto
  useEffect(() => {
    if (modal && isOpen && typeof document !== "undefined") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      globalThis.addEventListener("keydown", handleKey);
      return () => {
        document.body.style.overflow = prev;
        globalThis.removeEventListener("keydown", handleKey);
      };
    }
  }, [modal, isOpen, handleKey]);

  if (modal && !isOpen) return null;

  const titleId = "loader-title";
  const descId = "loader-desc";

  const animationNode =
    variant === "spinner" ? (
      <div
        className={`${sizeClasses} rounded-full border-current border-t-transparent text-indigo-500 animate-spin motion-reduce:animate-[spin_1.2s_linear_infinite]`}
        aria-hidden="true"
      />
    ) : (
      <div className="w-52 max-w-full" aria-hidden="true">
        <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-200/50 dark:bg-indigo-900/30 relative">
          {/* Tailwind v4: usa keyframes definidos en index.css */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />
        </div>
      </div>
    );

  const body = (
    <output
      className="flex flex-col items-center gap-3"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {animationNode}
      {showText && (
        <span
          id={descId}
          className={`text-sm font-medium text-indigo-600 dark:text-indigo-300 ${textClassName}`}
        >
          {text}
        </span>
      )}
      <span className="sr-only">{text}</span>
    </output>
  );

  // Modal con portal
  if (modal) {
    const content = (
      <div
        data-testid="loader-overlay"
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 ${className}`}
        onMouseDown={(e) => {
          // Cierra al hacer clic fuera del panel
          if (
            overlayClosable &&
            onClose &&
            e.target instanceof HTMLElement &&
            e.target.dataset?.role === "overlay"
          ) {
            onClose();
          }
        }}
        // Marca de overlay para distinguir del panel
        data-role="overlay"
        onKeyDown={handleKey}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="relative w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-indigo-200/40 dark:border-indigo-500/20 px-6 py-6 animate-[fadeIn_.18s_ease-out]"
          // Evita que el mouseDown del panel burbujee al overlay
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2
              id={titleId}
              className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 tracking-wide"
            >
              {title}
            </h2>
            {closeButton && onClose && (
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                aria-label="Cerrar"
                type="button"
              >
                ✕
              </button>
            )}
          </div>
          {body}
        </div>
      </div>
    );

    // Evita acceder a document en SSR
    if (portal && typeof document !== "undefined") {
      return createPortal(content, document.body);
    }
    return content;
  }

  // Overlay o inline
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

  return fullScreen ? (
    <div
      data-testid="loader-fullscreen"
      className={`fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm ${className}`}
    >
      {wrapper}
    </div>
  ) : (
    <div className={className}>{wrapper}</div>
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
  overlayClosable: PropTypes.bool,
  portal: PropTypes.bool,
};

export default Loader;
