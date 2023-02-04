<script setup lang="ts">
// import { INodeGraphRunner_browser_impl } from "../../lib/dsp-lab/impl/browser/runner";
// const runner = INodeGraphRunner_browser_impl()
</script>

<template lang="pug">
q-page.normal_page.flex-col.bg-white(
  class="!min-w-[100%]"
)
  svg.node-canvas(@contextmenu="")
</template>