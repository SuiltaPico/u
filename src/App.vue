<script setup lang="ts">
import use_main_store from "./store/main_store";
import PageContainer from "./components/PageContainer.vue";
import Header from "./components/Header.vue";
import LeftBar from "./components/LeftBar.vue";
import { onMounted, ref, watch } from "vue";

const main_store = use_main_store();
</script>

<template lang="pug">
q-layout(view="hHh lpR fFf")
  Header

  LeftBar
  
  PageContainer.bg-neutral-400.flex.justify-center(
    class="xl:px-16"
    )

  q-inner-loading(
    :showing="main_store.framwork_loading"
    color="primary"
    label="正在载入资源……"
  )

</template>

<style>
html, body, #app {
  width: 100%;
}

#app {
  @apply bg-zinc-150;
}

.q-focus-helper{
  outline: none !important;
}
</style>
