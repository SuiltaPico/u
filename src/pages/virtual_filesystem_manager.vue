<script setup lang="ts">
import { computed, ref, watch } from "vue";
import use_main_store from "../store/main_store";
import { DirEntry, MetaType } from "../lib/virtual_fs/VirtualFileSystem";
import type { VirtualFileSystemMeta } from "../lib/virtual_fs/VirtualFileSystem";
import { useRoute, useRouter } from "vue-router";

const main_store = use_main_store();
const router = useRouter();
const route = useRoute();

const vfs = main_store.virtual_filesystem;
const dir = ref<DirEntry>();
const files = ref<(VirtualFileSystemMeta | null)[] | undefined>();

watch(dir, async () => {
  if (dir.value === undefined) {
    files.value = [];
    return;
  }
  files.value = await Promise.all(dir.value.list().map((v) => vfs.entry(v)));
});

function param_to_string(param: string | string[]){
  if (Array.isArray(param)) {
    return param.join("/")
  }
  return param
}

async function init() {
  /** @ts-ignore */
  window.fs = vfs;
  await vfs.ready;
  console.log("open", param_to_string(route.params.full_path));
  dir.value = await vfs.open_dir(param_to_string(route.params.full_path as string) ?? "");
}

watch(
  () => route.params,
  async (to_params) => {
    console.log("open", param_to_string(route.params.full_path));
    dir.value = await vfs.open_dir(param_to_string(to_params.full_path as string) ?? "");
  }
);

async function open_dir(full_path: string) {
  router.push({
    name: "虚拟文件系统管理",
    params: {
      full_path,
    },
  });
}

const dir_path = computed(() => {
  if (!dir.value) {
    return;
  }
  let buf = "";
  const result = dir.value.full_path.split("/").map((v) => {
    buf += "/" + v;
    return {
      name: v,
      full_path: buf,
    };
  });
  return result
});

const multiple_choice = ref(false);

async function pack_selected() {
  const jszip = await import("jszip");
}

init();
</script>

<template lang="pug">
q-page.bg-white.flex.flex-col.gap-4.min-w-100.max-w-100.px-2.py-8(
  class="md:min-w-75 md:max-w-75 xl:min-w-50 xl:max-w-50 xl:px-8"
  )
  q-breadcrumbs(v-if="dir_path")
    q-breadcrumbs-el.cursor-pointer(
      label="(root)" @click="open_dir('')"
    )
    q-breadcrumbs-el.cursor-pointer(
      v-for="dir_meta in dir_path"
      :label="dir_meta.name"
      @click="open_dir(dir_meta.full_path)"
      )

  .flex.flex-row.gap-4.items-center.select-none
    q-checkbox(v-model="multiple_choice") 多选
    q-btn(flat @click="pack_selected") 打包目录

  .flex.flex-row.gap-4.items-center.file-list.select-none(v-if="files")
    template(v-for="item in files")
      .py-4.px-6.relative-position.cursor-pointer.rounded.border(v-if="item" @dblclick="open_dir((item.parent? item.parent + '/': '') + item.name)")
        q-icon(
          :name="item.type === MetaType.FileMeta ? 'mdi-file-document' : 'mdi-folder-outline'"
          size="4rem" color="primary"
          )
        .text-center
          .text-base {{ item.name }}
        q-menu.min-w-32.select-none(touch-position context-menu :transition-duration="100")
          q-list
            q-item.items-center(clickable v-close-popup)
              div 重命名
            q-item.items-center(clickable v-close-popup)
              div 复制
            q-item.items-center(clickable v-close-popup)
              div 删除

</template>
<style>
.file-list > div {
  @apply transition-colors;
}
.file-list > div:hover {
  @apply border-blue-300 bg-zinc-100;
}
.file-list > div:active {
  @apply border-blue-400 bg-zinc-200;
}
</style>
