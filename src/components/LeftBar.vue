<script setup lang="ts">
import use_main_store from "../store/main_store";

const main_store = use_main_store();
</script>

<template lang="pug">
q-drawer(show-if-above
  :model-value="main_store.left_bar_showing" @update:model-value="main_store.toggle_left_bar($event)"
  v-show="main_store.left_bar_showing"
  side="left" bordered
  )
</template>
