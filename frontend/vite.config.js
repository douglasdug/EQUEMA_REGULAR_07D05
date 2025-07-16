import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          api: ["./src/api/conexion.api.js"],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Ajusta el límite a 1000 kB
  },
}));
