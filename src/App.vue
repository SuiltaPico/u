<script setup lang="ts">
import use_main_store from "./store/main_store";
import PageContainer from "./components/PageContainer.vue";
import Header from "./components/Header.vue";
import LeftBar from "./components/LeftBar.vue";
import { onMounted } from "vue";

const main_store = use_main_store();
</script>

<template lang="pug">
q-layout(view="hHh LpR fFf")
  Header
  
  PageContainer.px-4
</template>

<style scoped></style>
