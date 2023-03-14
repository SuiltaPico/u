import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import mkcert from "vite-plugin-mkcert";
import crossOriginIsolation from "vite-plugin-cross-origin-isolation";
// import { viteStaticCopy } from 'vite-plugin-static-copy'


import { quasar, transformAssetUrls } from "@quasar/vite-plugin";

import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import tailwindcss_nesting from "tailwindcss/nesting/index.js";

// https://vitejs.dev/config/
export default defineConfig({
  // base: env.no_base ? "/" : "u/",
  base: "/",
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({
      sassVariables: "src/style/quasar-variables.sass",
    }),
    mkcert({
      force: true,
    }),
    crossOriginIsolation(),
    // viteStaticCopy({
    //   targets: [
    //     {
    //       src: "node_modules/libarchive.js/dist/wasm-gen/libarchive.wasm",
    //       dest: "assets/wasm-gen"
    //     }
    //   ]
    // })
  ],
  css: {
    postcss: {
      plugins: [tailwindcss_nesting, tailwindcss, autoprefixer],
    },
  },
  define: {
    // GLOBAL_env_no_base: !!env.no_base,
    GLOBAL_env_no_base: true
  },
});
