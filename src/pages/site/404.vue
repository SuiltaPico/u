<script setup lang="ts">
import { useRoute } from 'vue-router';
import use_main_store from '../../store/main_store';

const main_store = use_main_store()
main_store.set_title("404")

const full_path = location.toString()
</script>

<template lang="pug">
q-page.bg-white.flex.flex-col.gap-4.p-8.gap-8.min-w-100(
  class="md:min-w-75 xl:min-w-50"
  )
  .flex.flex-col.text-center
    .text-3xl.font-sans 404 - 错误的 URL

  ul.flex.flex-col.gap-2
    li(class="before:bg-blue-600")
      div 或许是你的 URL 地址输错了？检查你的地址拼写是否正确：
      .bg-zinc-100.p-2 {{ full_path }}
    li(class="before:bg-yellow-500")
      div 或许是当前页面仍然在施工中...
      .bg-zinc-100.p-2 前面的区域以后再来探索吧...
</template>

<style>
li {
  @apply before:block before:w-1 before:h-4 before:bg-slate-600 flex flex-row items-center text-base gap-2 rounded flex-wrap
}
</style>