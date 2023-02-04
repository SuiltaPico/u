<script lang="ts">
import { IAudioNodeGraph } from "../../interface";
export interface NodeGraphVueExpose {
  install_node_graph(node_graph: IAudioNodeGraph): void;
}
</script>

<script setup lang="ts">
import { BrowserAudioNodeGraphRunner_impl } from "../browser/runner";

const runner = BrowserAudioNodeGraphRunner_impl()

defineExpose({
  install_node_graph(node_graph: IAudioNodeGraph){
    runner.install_node_graph(node_graph)
  }
} satisfies NodeGraphVueExpose)
</script>

<template lang="pug">
svg
  g

</template>
