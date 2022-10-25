<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import Card from "../components/Card.vue";
import { pages_tree } from "../core/pages_meta";

const router = useRouter()

const input_text = ref("");
</script>

<template lang="pug">
q-page.bg-white.flex.flex-col.gap-4.p-8.gap-8(style="min-width: 50vw")
  .flex.flex-col.text-center
    .text-3xl.font-serif Sutils 杂物箱
  // q-input.bg-zinc-100.text-base(v-model="input_text" placeholder="搜索..." 
    filled)
    template(#prepend)
      q-icon(name="mdi-magnify")
  .flex.flex-col.gap-4
    div(v-for="b in pages_tree.children" :key="b.name")
      div.flex.flex-col.gap-4
        .text-lg.flex.flex-row.gap-2
          div.px-1 {{ b.name }}
        .flex.flex-row(v-for="p in b.children" :key="p.name")
          Card(v-if="!('type' in p)" @click="router.push(p.path)")
            div {{ p.name }}
            div.text-sm.text-zinc-600 {{ p.description }}
  q-space
  div.text-center.text-zinc-50 by Suilta Pico
</template>

<style>
/*
.q-field__inner > .q-field__control > .q-field__prepend > .q-icon{
  @apply transition-colors;
  transition-duration: .36s;
}
.q-field > .q-field__inner > .q-field__control:hover > .q-field__prepend > .q-icon{
  @apply text-blue-500;
}
.q-field.q-field--highlighted > .q-field__inner > .q-field__control > .q-field__prepend > .q-icon{
  @apply text-inherit;
}*/
.q-btn.q-btn--outline::before {
  @apply border-zinc-400;
}
</style>