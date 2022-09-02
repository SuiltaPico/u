import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import { quasar, transformAssetUrls } from "@quasar/vite-plugin";

import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({
      sassVariables: "src/quasar-variables.sass",
    }),
  ],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
});
