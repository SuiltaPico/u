<script setup lang="ts">
import use_main_store from '../store/main_store';

const main_store = use_main_store()
</script>

<template lang="pug">
q-header(class="bg-zinc-100 text-zinc-700")
  q-toolbar.flex.flex-row.gap-4.items-center
    q-btn(dense flat round icon="mdi-menu" @click="main_store.toggle_left_bar()")
    .text-base.text-zinc-600.cursor-default.grow.text-center(class="md:text-left") {{ main_store.title }}
    q-btn(dense flat round)
</template>
