import { createApp } from "vue";

import { Quasar } from "quasar";
import quasarLang from "quasar/lang/zh-CN";
import quasarIconSet from "quasar/icon-set/mdi-v6";
// 图标库
import "@quasar/extras/mdi-v6/mdi-v6.css";
// 导入 Quasar 样式
import "quasar/src/css/index.sass";

import router from "./router/router";

import { createPinia } from "pinia";

import "./style/main.css";
import App from "./App.vue";

const app = createApp(App);

app.use(router);
const pinia = createPinia();

app.use(pinia);

app.use(Quasar, {
  plugins: {},
  lang: quasarLang,
  iconSet: quasarIconSet,
});

const mounted_app = app.mount("#app");

export default mounted_app;
