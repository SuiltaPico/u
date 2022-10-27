<script setup lang="ts">
import type Page from '../../lib/page';
import Card from '../Card.vue';

const props = defineProps<{
  page: Page
}>()
</script>

<template lang="pug">
Card(@click="$router.push(page.path)")
  div {{ page.name }}
  div.text-sm.text-zinc-600 {{ page.description }}
  .flex.flex-row.items-center.mt-1
    q-icon.text-zinc-400.pr-1(name="mdi-tag")
    q-chip.text-xs(v-for="tag in page.tags") {{ tag.name }}
</template>
