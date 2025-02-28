import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@assets': resolve(__dirname, 'src/assets'), // alias 설정
      'src': resolve(__dirname, 'src') // src 경로 별칭 추가
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/main.html"), // 기존 HTML 파일
        background: resolve(__dirname, "src/background.ts"), // background.ts 파일 추가
        contents: resolve(__dirname, "src/contents.ts"), // contents.ts 파일 추가
        preview: resolve(__dirname, "src/preview.html"), // preview.html 파일 추가
      },
      output: {
        entryFileNames: "[name].js", // 파일 이름 설정
      },
    },
  },
  server: {
    port: 3000, // 개발 서버 포트 설정
  },
});
