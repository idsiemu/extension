import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"), // 기존 HTML 파일
        background: resolve(__dirname, "src/background.ts"), // background.ts 파일 추가
        contents: resolve(__dirname, "src/contents.ts"), // contents.ts 파일 추가
      },
      output: {
        entryFileNames: "[name].js", // 파일 이름 설정
      },
    },
  },
});
