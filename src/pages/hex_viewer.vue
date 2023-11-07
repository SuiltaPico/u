<!-- 
  名称：Hex 查看器。
  输入：
    * 本地文件
    * 
-->

<script setup lang="ts">
import { defineComponent } from "vue";
const btn = defineComponent((props: { content: string }) => {
  return `<button>{{ content }}</button>`;
});
</script>

<template>
  <q-page>
    <q-btn content="hello"></q-btn>
  </q-page>
</template>

<!-- <template lang="pug">
q-page
  btn(content="hello")
</template> -->
