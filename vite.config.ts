import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        content: resolve(__dirname, "src/content.ts"),
        background: resolve(__dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "content" || chunkInfo.name === "background") {
            return "[name].js";
          }
          return "assets/[name].js";
        },
      },
    },
    minify: false, // 이 줄 추가
    sourcemap: true, // 디버깅을 위해 추가
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
