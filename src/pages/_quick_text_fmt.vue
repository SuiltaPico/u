<script setup lang="ts">
import { ref, computed } from "vue";
import { parse_to_capture_groups } from "../lib/regex/capture-group-parse";

const regex_input = ref("");
const regex_input_error = ref("");
const regex_flag = ref([]);

const regex_capture_groups = computed(() => {
  try {
    return parse_to_capture_groups(regex_input.value);
  } catch (e) {
    regex_input_error.value = String(e)
    return []
  }
});

const replacer = [];
const input = ref("");
const output = ref();
</script>

<template lang="pug">
q-page.normal_mage(class="xl:min-w-[900px]")
  div.flex.flex-col
    q-input.code-font.bg-zinc-100(
      label="正则表达式" v-model="regex_input" filled 
      :error="!!regex_input_error" :error-message="regex_input_error")
    div {{ regex_capture_groups }}
  div
  div
    q-input(v-model="input" class="" autogrow outlined)
  div {{  }}
</template>

<style>
.code-font .q-field__native.q-placeholder {
  font-family: Consolas, ui-monospace, SFMono-Regular, Menlo, Monaco,
    "Liberation Mono", "Courier New", monospace;
}
</style>
