<script lang="ts">
import { Archive } from 'libarchive.js';
import libarchive_worker from "libarchive.js/dist/worker-bundle.js?url";
import type { CompressedFile } from "libarchive.js/src/compressed-file";
import type { QInput } from "quasar";
import type { FilesObject } from "libarchive.js/src/libarchive";

Archive.init({
  workerUrl: libarchive_worker
})
</script>

<script setup lang="ts">
import type { ItemsOfArray } from "../../lib/common/types_utils";

import { ref } from 'vue';
import { defineStore } from 'pinia';

const store = defineStore("archive", {})

const app_mode_options = [{
  label: "压缩",
  value: "compress",
  disable: true
} as const,
{
  label: "解压缩",
  value: "decompress",
} as const,
]
const app_mode = ref<ItemsOfArray<typeof app_mode_options>["value"]>("decompress")

const engine_selection = ref()
const engine_selection_options = [{
  name: "uiyiu"
}]

const decompress_input_file_hint = ref<string>()
const decompress_input_file_hint_color = ref<string>("")

type HintLevel = "info" | "warning" | "error"
function set_hint(content: string, level: HintLevel = "info") {
  decompress_input_file_hint.value = content
  decompress_input_file_hint_color.value = (() => {
    if (level === "info") {
      return 'var(--q-dark)'
    } else if (level === "warning") {
      return "var(--q-warning)"
    } else {
      return "var(--q-negative)"
    }
  })()
}

const decompress_input_file_container = ref<File | null>()
const decompress_input_require_password = ref(false)
const decompress_input_password_ref = ref<QInput>()
const decompress_input_password = ref("")
const decompress_input_password_visibility = ref(false)

const decompress_input_run_btn_loading = ref(false)
function _decompress() {
  const file = decompress_input_file_container.value
  if (!file) return

  decompress_input_run_btn_loading.value = true

  Archive.open(file)
    .then(async (arch) => {
      const encrypted = await arch.hasEncryptedData()
      if (encrypted && !decompress_input_password.value) {
        set_hint("该压缩包存在加密数据，请输入密码。", "warning")
        decompress_input_require_password.value = true
        requestAnimationFrame(() => decompress_input_password_ref.value?.focus())
      }
      const files_obj = await arch.getFilesObject()
      decompress_view_file_obj.value = files_obj
    })
    .catch(e => console.error(e))
    .finally(() => {
      decompress_input_run_btn_loading.value = false
    })
}

const decompress_view_file_obj = ref<FilesObject>({})
const decompress_view_path = ref("")

interface Tree {
  type: "file"
}

function set_decompress_view_path(path: string) {
  decompress_view_path.value = path
}

</script>

<template lang="pug">
q-page.flex.flex-col.p-8.bg-white.max-w-3xl.w-full.items-start.gap-8
  .flex.flex-row.gap-4.items-end
    .flex.flex-col.gap-2
      .text-lg 模式
      q-btn-toggle(v-model="app_mode" :options="app_mode_options")
    .flex.flex-col.gap-2
      .text-lg 引擎
      q-select(label="引擎" v-model="engine_selection" :options="engine_selection_options")
  .flex.flex-col.gap-4
    .text-lg 输入
    .text-base(
      :style="{ 'color': decompress_input_file_hint_color}"
      ) {{ decompress_input_file_hint }}
    .flex.flex-row.gap-4.items-end
      q-file.grow(label="压缩包" v-model="decompress_input_file_container")
      q-input(
        v-show="decompress_input_require_password"
        label="密码（如果有）"
        :type="!decompress_input_password_visibility ? 'text' : 'password'"
        v-model="decompress_input_password"
        ref="decompress_input_password_ref"
        )
        template(v-slot:append)
          q-icon(
            :name="decompress_input_password_visibility ? 'mdi-eye-off' : 'mdi-eye'"
            class="cursor-pointer"
            @click="decompress_input_password_visibility = !decompress_input_password_visibility"
            )
      q-btn(color="primary" :loading="decompress_input_run_btn_loading"
        @click="_decompress") 解压
    .flex.flex-col.gap-4
      .text-lg 查看
      q-breadcrumbs
        q-breadcrumbs-el.cursor-pointer(label="(root)" @click="set_decompress_view_path('')")
        template(v-for="p in decompress_view_path.split('/')")
          q-breadcrumbs-el.cursor-pointer(:label="p")
      .flex.flex-row.gap-2
        .flex.flex-col.items-center.gap-2.rounded.p-4.selectable-block(
          class="min-w-[6rem] min-h-[3rem]"
          v-for="file_name in Object.keys(decompress_view_file_obj)"
          )
          q-icon(
            :name="decompress_view_file_obj[file_name].name ? 'mdi-file' : 'mdi-folder'"
            color="primary"
            size="2.6rem"
            )
          .text-base.select-none {{ file_name }}
  .flex.flex-col.gap-4

</template>