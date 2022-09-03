import { createRouter, RouteRecordRaw, createWebHistory } from "vue-router";
import { pages } from "../core/pages_meta";

const routes: RouteRecordRaw[] = pages.map((p)=>({
  name: p.name,
  component: ()=>import(`../pages/${p.compo_path}.vue`),
  alias: p.alias ?? [],
  path: p.path
}));

const router = createRouter({
  
  routes,
  history: createWebHistory("u/"),
});

export default router;