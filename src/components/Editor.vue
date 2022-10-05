<script lang="ts">
import * as monaco from "monaco-editor";
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution";

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

/** @ts-ignore */
self.MonacoEnvironment = {
  getWorker: function (_: string, label: string) {
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
</script>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const emits = defineEmits<{
  (event: "update:content", value: string): void;
}>();

let editor_container_ref = ref(undefined as undefined | HTMLDivElement);
let editor: undefined | monaco.editor.IStandaloneCodeEditor;

onMounted(() => {
  editor = monaco.editor.create(editor_container_ref.value!, {
    language: "",
    theme: "vs-dark",
    automaticLayout: true,
  });
  editor.onDidChangeModelContent((e) => {
    emits("update:content", editor!.getModel()!.getValue());
  });
});

defineExpose({
  change_value(value: string) {
    const model = editor?.getModel();
    if (!model) {
      return false;
    }
    model.applyEdits([
      {
        range: model.getFullModelRange(),
        text: value,
      },
    ]);
  },
  change_lang(value: string) {
    const model = editor?.getModel();
    if (!model) {
      return false;
    }
    monaco.editor.setModelLanguage(model, value);
  },
});
</script>

<template lang="pug">
div(ref="editor_container_ref")
</template>
