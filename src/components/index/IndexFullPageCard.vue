<script setup lang="ts">
import type Page from '../../lib/page';
import Card from '../Card.vue';

const props = defineProps<{
  page: Page
}>()
</script>

<template lang="pug">
Card(@click="$router.push(page.path)")
  div.text-base {{ page.name }}
  div.text-sm.text-zinc-600 {{ page.description }}
  .flex.flex-row.items-center
    q-icon.text-zinc-400.mr-1(name="mdi-tag" class="mobile-hide")
    q-chip.text-xs.py-1.px-2(v-for="tag in page.tags.slice(0, 2)" class="sm:py-3 sm:px-3") {{ tag.name }}
</template>
