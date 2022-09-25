<script setup lang="ts">
import { pages_tree } from "../core/pages_meta";
</script>

<template lang="pug">
q-page.flex.flex-col.gap-2
  q-card(v-for="b in pages_tree.children" :key="b.name")
    q-card-section.flex.flex-col.gap-2
      .text-lg {{ b.name }}
      div(v-for="p in b.children" :key="p.name")
        q-btn(flat v-if="!('type' in p)" :to="p.path") {{ p.name }}
</template>
