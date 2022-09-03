<script setup lang="ts">
import use_main_store from '../store/main_store';

const main_store = use_main_store()
</script>

<template lang="pug">
q-header(elevated class="bg-primary text-white")
  q-toolbar
    q-btn(dense flat round icon="mdi-menu" @click="main_store.toggle_left_bar()")
</template>
