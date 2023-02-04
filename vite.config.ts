import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import mkcert from "vite-plugin-mkcert";
import crossOriginIsolation from "vite-plugin-cross-origin-isolation";

import { quasar, transformAssetUrls } from "@quasar/vite-plugin";

import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import tailwindcss_nesting from "tailwindcss/nesting/index.js";

import { env } from "node:process";

// https://vitejs.dev/config/
export default defineConfig({
  base: env.no_base ? undefined : "u/",
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({
      sassVariables: "src/style/quasar-variables.sass",
    }),
    mkcert({
      force: true,
    }),
    crossOriginIsolation(),
  ],
  css: {
    postcss: {
      plugins: [tailwindcss_nesting, tailwindcss, autoprefixer],
    },
  },
  define: {
    GLOBAL_env_no_base: !!env.no_base,
  },
});
