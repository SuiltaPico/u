<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import use_main_store from "../store/main_store";

const main_store = use_main_store();
const router = useRouter()
const route = useRoute()
</script>

<template lang="pug">
q-drawer.cursor-default(
  :model-value="main_store.left_bar_showing" @update:model-value="main_store.toggle_left_bar($event)"
  v-show="main_store.left_bar_showing"
  side="left" bordered
)
  div.flex.flex-row.py-4.px-4.gap-2
    q-btn.bg-blue-50.rounded.py-2.grow(color="primary" unelevated icon="mdi-home" to="/" v-if="route.name !== '首页'")
    q-btn.bg-blue-50.rounded.py-2(color="secondary" unelevated icon="mdi-cog" to="/" v-if="route.name !== '设置'"
    )

  .flex.flex-row.justify-center.px-4.mt-2.items-center.gap-2(v-if="route.name !== '首页'")
    .bg-zinc-300.grow(style="height: 1px;")
    .text-zinc-400 当前应用功能
    .bg-zinc-300.grow(style="height: 1px;")

  #left-bar-teleport-anchor
</template>
