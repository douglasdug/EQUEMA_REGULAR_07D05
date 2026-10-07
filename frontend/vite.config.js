import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: mode === "development",
    chunkSizeWarningLimit: 1000, // Ajusta el límite a 1000 kB
  },
}));
