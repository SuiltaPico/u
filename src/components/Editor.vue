<script lang="ts">
import * as monaco from "monaco-editor";
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution";

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

/** @ts-ignore */
self.MonacoEnvironment = {
  getWorker: async function (_: string, label: string) {
    if (label === "json") {
      return new (await import("monaco-editor/esm/vs/language/json/json.worker?worker")).default
    }
    if (label === "typescript" || label === "javascript") {
      return new (await import("monaco-editor/esm/vs/language/typescript/ts.worker?worker")).default
    }
    return new editorWorker();
  },
};

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

export interface EditorCompoAPI {
  change_value(value: string): false | undefined
  force_set_value(value: string): false | undefined
  change_lang(value: string): false | undefined
  set_readonly(readonly: boolean): false | undefined
}
</script>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const props = defineProps<{
  init_theme?: string,
  init_language?: string,
  init_readonly?: boolean,
}>()

const emits = defineEmits<{
  (event: "update:content", value: string): void;
  (event: "update:click", value: MouseEvent): void;
}>();

let editor_container_ref = ref(undefined as undefined | HTMLDivElement);
let editor: undefined | monaco.editor.IStandaloneCodeEditor;

onMounted(() => {
  editor = monaco.editor.create(editor_container_ref.value!, {
    language: props.init_language ?? "",
    theme: props.init_theme ?? "vs-dark",
    automaticLayout: true,
    readOnly: props.init_readonly ?? false
  });
  editor.onDidChangeModelContent((e) => {
    emits("update:content", editor!.getModel()!.getValue());
  });
});

defineExpose({
  change_value(value) {
    const model = editor?.getModel();
    if (!model) return false;

    model.applyEdits([
      {
        range: model.getFullModelRange(),
        text: value,
      },
    ]);
  },
  force_set_value(value){
    const model = editor?.getModel();
    if (!model) return false;

    model.setValue(value)
  },
  change_lang(language) {
    const model = editor?.getModel();
    if (!model) return false;

    monaco.editor.setModelLanguage(model, language);
  },
  set_readonly(readonly) {
    if (!editor) return false;

    editor.updateOptions({
      readOnly: readonly
    })
  }
} as EditorCompoAPI);
</script>

<template lang="pug">
div(ref="editor_container_ref" @click="$emit('update:click', $event)")
</template>
