import { createRouter, RouteRecordRaw, createWebHistory } from "vue-router";
import { pages } from "../core/pages_meta";
import use_main_store from "../store/main_store";

const routes: RouteRecordRaw[] = pages.map((p) => ({
  name: p.name,
  component: () => import(`../pages/${p.compo_path}.vue`),
  alias: p.alias ?? [],
  path: p.path,
}));

const router = createRouter({
  routes,
  history: createWebHistory(GLOBAL_env_no_base ? undefined : "u/"),
});

router.beforeEach((to, from) => {
  const main_store = use_main_store();
  main_store.toggle_framwork_loading(true);
  main_store.set_title(to.name?.toString()?? "")
});

router.afterEach((to, from) => {
  const main_store = use_main_store();
  main_store.toggle_framwork_loading(false);
});

export default router;
