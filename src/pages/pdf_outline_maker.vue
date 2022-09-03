<script setup lang="ts">
import { onMounted, ref } from "vue";
import * as pdfLib from "pdf-lib";
import { outlinePdfFactory } from "@lillallol/outline-pdf";
import Editor from "../components/Editor.vue";

const file = ref<File | undefined>();

const editor = ref<
  | { change_value(value: string): void; change_lang(value: string): void }
  | undefined
>();
onMounted(() => {
  editor.value?.change_value(text.value);
  editor.value?.change_lang("");
});

const text = ref(`1||标题
2|-|标题
3|--|标题
4|---|标题
5|---|标题
7||标题`);

const iframe_url = ref("")
const loading = ref(false);

const outline_pdf = outlinePdfFactory(pdfLib);

async function file_selected(f: File | undefined){
  file.value = f
  if (f) {
    const url = URL.createObjectURL(new Blob([await f.arrayBuffer()]));
    iframe_url.value = url
  }
}

async function write() {
  if (!file.value) {
    return;
  }
  loading.value = true;

  const result = await outline_pdf({
    pdf: await file.value.arrayBuffer(),
    outline: text.value,
  });
  const url = URL.createObjectURL(new Blob([await result.save()]));
  loading.value = false;

  const a = document.createElement("a");
  a.href = url;
  a.download = "result.pdf";
  a.click();
}
</script>

<template lang="pug">
q-page.grid.grid-cols-2
  q-card
    q-card-section
      q-file(label="PDF文件" v-model="file" @update:model-value="file_selected" accept=".pdf, *")
    q-card-section
      | 格式：
      code 页码|层数|标题名
      Editor(ref="editor" style="min-height: 70vh;" @update:content="text = $event")
    q-card-actions(align="right")
      q-btn(label="写入" @click="write" color="primary")
  q-card
    q-card-section.w-full.h-full
      iframe.w-full.h-full(:src="iframe_url")
  q-inner-loading(:showing="loading")
</template>
