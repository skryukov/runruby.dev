import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), mkcert({ hosts: ["local.runruby.dev"] })],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          dexie: ["dexie", "dexie-react-hooks"],
          jszip: ["jszip"],
          editor: ["@monaco-editor/react"],
          wasi: [
            "@bjorn3/browser_wasi_shim",
            "@ruby/wasm-wasi",
            "@ruby/3.3-wasm-wasi",
          ],
        },
      },
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
