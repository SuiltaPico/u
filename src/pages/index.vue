<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Observable, debounceTime } from "rxjs";

import { search_pages, render_tag_tree, pages } from "../core/pages_meta";
import type Page from "../lib/page";
import type { KeyOfArray } from "../lib/types";
import use_main_store from "../store/main_store";
import IndexPagesTree from "../components/index/IndexPagesTree.vue";
import Card from "../components/Card.vue";
import IndexFullPageCard from "../components/index/IndexFullPageCard.vue";

const router = useRouter();
const main_store = use_main_store();

const mode_list = ["tag_tree", "list"] as const;
type Mode = KeyOfArray<typeof mode_list>;
const mode_index = ref(0);
const mode = computed(() => mode_list[mode_index.value]);
const mode_name_map = ref<Record<Mode, string>>({
  tag_tree: "标签树",
  list: "列表",
});

function switch_mode() {
  mode_index.value = (mode_index.value + 1) % mode_list.length;
}

const search_text = ref("");
let search_text_observable_next: (value: string) => void;
const search_text_observable = new Observable<string>((s) => {
  search_text_observable_next = s.next.bind(s);
});

const search_result = ref<Page[]>([]);

search_text_observable.pipe(debounceTime(100)).subscribe((value) => {
  search_result.value = search_pages(value);
});

function update_search_text(value: string | number | null) {
  const v = value?.toString() ?? ""
  search_text.value = v;
  search_text_observable_next(v);
}

main_store.set_title("");
</script>

<template lang="pug">
q-page.bg-white.flex.flex-col.gap-4.gap-10.min-w-100.max-w-100.px-2.py-8(
  class="md:min-w-75 md:max-w-75 xl:min-w-50 xl:max-w-50 xl:px-8"
  )
  .flex.flex-col.text-center
    .text-3xl.font-serif Sutils 杂物箱

  .flex.flex-col.items-center
    q-input.bg-zinc-100.text-base.grow.w-full(:model-value="search_text" @update:model-value="update_search_text($event)" placeholder="搜索..." 
      filled)
      template(#prepend)
        q-icon(name="mdi-magnify")

  .flex.flex-col.gap-4(v-show="search_text.length === 0")
    .text-lg.flex.flex-row.gap-2.items-center
      div {{ mode_name_map[mode] }}
      q-btn(rounded flat color="primary" icon="mdi-swap-horizontal" padding=".2rem .5rem" @click="switch_mode")
    div(v-show="mode === 'tag_tree'")
      IndexPagesTree(:wrap="true"
        :render_tag_tree="render_tag_tree" :children_only="true"
        )
    div(v-show="mode === 'list'")
      .flex.flex-row.gap-4
        template(v-for="p in pages")
          IndexFullPageCard(v-if="!p.hide" :page="p")


  .flex.flex-col.gap-4(v-if="search_text.length !== 0")
    .text-lg.flex.flex-row.gap-2 搜索结果
    .flex.flex-row.gap-4
      TransitionGroup(name="index__search_result")
        IndexFullPageCard(v-for="p in search_result" :key="p.name" :page="p")
  q-space
  div.text-center.text-zinc-50 by Suilta Pico
</template>

<style>
/*
.q-field__inner > .q-field__control > .q-field__prepend > .q-icon{
  @apply transition-colors;
  transition-duration: .36s;
}
.q-field > .q-field__inner > .q-field__control:hover > .q-field__prepend > .q-icon{
  @apply text-blue-500;
}
.q-field.q-field--highlighted > .q-field__inner > .q-field__control > .q-field__prepend > .q-icon{
  @apply text-inherit;
}
.q-btn.q-btn--outline::before {
  @apply border-zinc-400;
}*/
.index__search_result-move, /* 对移动中的元素应用的过渡 */
.index__search_result-enter-active,
.index__search_result-leave-active {
  transition: all 0.08s ease;
}

.index__search_result-enter-from,
.index__search_result-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

</style>
