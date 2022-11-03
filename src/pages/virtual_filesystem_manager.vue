<script setup lang="ts">
import { computed, ref, watch } from "vue";
import use_main_store from "../store/main_store";
import { DirEntry, MetaType } from "../lib/virtual_fs/VirtualFileSystem";
import type { VirtualFileSystemMeta } from "../lib/virtual_fs/VirtualFileSystem";
import { useRoute, useRouter } from "vue-router";

const main_store = use_main_store();
const router = useRouter();
const route = useRoute();

const info_dialog_showing = ref(false);

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

function param_to_string(param: string | string[]) {
  if (Array.isArray(param)) {
    return param.join("/");
  }
  return param;
}

async function init() {
  /** @ts-ignore */
  window.fs = vfs;
  await vfs.ready;
  console.log("open", param_to_string(route.params.full_path));
  dir.value = await vfs.open_dir(
    param_to_string(route.params.full_path as string) ?? ""
  );
}

watch(
  () => route.params,
  async (to_params) => {
    console.log("open", param_to_string(route.params.full_path));
    dir.value = await vfs.open_dir(
      param_to_string(to_params.full_path as string) ?? ""
    );
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
  return result;
});

const multiple_choice = ref(false);

async function pack_selected() {
  const jszip = await import("jszip");
}

init();
</script>

<template lang="pug">
q-page.normal-page.py-2(
  class="md:min-w-75 md:max-w-75 xl:min-w-50 xl:max-w-50 xl:px-8"
  )
  .flex.flex-col.gap-2
    .flex.flex-row.gap-2.items-center
      q-btn(flat icon="mdi-information-outline" color="primary" @click="info_dialog_showing = true" round)
      q-breadcrumbs(v-if="dir_path")
        q-breadcrumbs-el.cursor-pointer(
          label="(root)" @click="open_dir('')"
        )
        q-breadcrumbs-el.cursor-pointer(
          v-for="dir_meta in dir_path"
          :label="dir_meta.name"
          @click="open_dir(dir_meta.full_path)"
          )

    .flex.flex-row.gap-2.items-center.select-none
      q-checkbox(v-model="multiple_choice") 多选
      q-btn(flat icon="mdi-plus" color="primary")
      q-btn(flat icon="mdi-folder-plus" color="primary")
      q-btn(flat icon="mdi-archive-arrow-down-outline" color="primary" @click="pack_selected")
      q-btn(flat icon="mdi-archive-arrow-up-outline" color="primary" @click="pack_selected")

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

  q-dialog(v-model="info_dialog_showing")
    q-card.text-zinc-800.p-3.px-4
      q-card-section.flex.flex-col.gap-4
        .text-lg.flex.flex-row.gap-2.items-center
          q-icon(name="mdi-information" size="1.4rem")
          div 注意事项
        .text-base.text-zinc-900 很抱歉，这个功能并非网盘
          q-icon(name="mdi-emoticon-neutral-outline" size="1.4rem")
          | ，该功能所有数据都存放在本地，准确来说是存放在浏览器的本地存储内，所以请注意以下事项：
        ol.text-base.text-zinc-900.flex.flex-col.gap-4
          li 1. 如果你直接清理了浏览器的本地存储，你的在这里储存的数据就会
            span.text-red-600 全部丢失
            |，如果这里存放着你的重要数据，请记住：
            div.m-2
            .font-bold.text-center 清理浏览器缓存之前记得来这里备份数据
              q-icon(name="mdi-archive-arrow-down-outline" size="1.4rem")
          li.flex.flex-col.gap-2
            p 2. 其他浏览器无法访问到当前浏览器的数据。如果你要迁移所有数据过去，请进行备份，然后将下载后的压缩包导入
              q-icon(name="mdi-archive-arrow-up-outline" size="1.4rem")
              | 到另一个浏览器内。
            p 如果你只需要迁移配置文件，那么只需把 /config 文件夹的数据进行迁移就可以了。
      q-card-actions(align="right")
        q-btn(color="primary") 确认
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
