<script setup lang="ts">
import { ref } from "vue";

type F = File[] | undefined;

const file = ref<F>();
const content = ref();
const is_error = ref(false)

function file_update(f: F) {
  file.value = f;
  if (f === undefined) {
    return;
  }

  if (f.length > 1) {
    is_error.value = true
    return;
  }

  f[0].text().then((result) => {
    content.value = result;
  });
}
</script>

<template lang="pug">
q-page
  q-card
    q-card-section
      q-file(label="文件" :model-value="file" @update:model-value="file_update" :error="is_error" multiple)
        template(v-slot:prepend)
          q-icon(name="mdi-file-multiple")
    q-card-section
      code
        pre {{content}}
</template>
