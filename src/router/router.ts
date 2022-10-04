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
  history: createWebHistory("u/"),
});

router.beforeEach((to, from) => {
  const main_store = use_main_store();
  main_store.set_index_loading(true);
  document.title = to.name?.toString() ?? ""
});

router.afterEach((to, from) => {
  const main_store = use_main_store();
  main_store.set_index_loading(false);
});

export default router;
