<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Observable, debounceTime } from "rxjs";

import {
  search_pages,
  render_tag_tree,
  pages,
} from "../../core/pages_meta";
import { tag_icon_map } from "../../core/tag_icon_map";
import type { RenderTagTreeNode } from "../../core/pages_meta";
import type Page from "../../lib/page";
import type { ItemsOfArray } from "../../lib/common/types_utils";
import use_main_store from "../../store/main_store";
import IndexPagesTree from "../../components/index/IndexPagesTree.vue";
import IndexFullPageCard from "../../components/index/IndexFullPageCard.vue";
import { all } from "mathjs";

const router = useRouter();
const main_store = use_main_store();

const mode_list = ["tag_tree", "list"] as const;
type Mode = ItemsOfArray<typeof mode_list>;
const mode_index = ref(0);
const mode = computed(() => mode_list[mode_index.value]);
const mode_name_map = ref<Record<Mode, string>>({
  tag_tree: "标签树",
  list: "列表",
});

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
  const v = value?.toString() ?? "";
  search_text.value = v;
  search_text_observable_next(v);
}

main_store.set_title("");

type IndexOperator = "single" | "intersection" | "union";
const index_operator_options = [
  { icon: "mdi-numeric-1-box", value: "single", slot: "single", title: "单选" },
  {
    icon: "mdi-set-center",
    value: "intersection",
    slot: "intersection",
    title: "交集",
  },
  { icon: "mdi-set-all", value: "union", slot: "union", title: "并集" },
];

const index_enabled_tag = ref<RenderTagTreeNode>(
  render_tag_tree.node_children[0].node_children[0]
);
const index_enabled_tags = ref<string[]>([]);
const index_operator = ref<IndexOperator>("single");

const select_tag = (tag: RenderTagTreeNode) => {
  if (index_operator.value === "single") {
    index_enabled_tag.value = tag;
  }
};
</script>

<template lang="pug">
q-page.bg-white.flex.flex-row.gap-4(
  class="flex-wrap md:flex-nowrap xl:min-w-[70vw]"
  )

  .flex.flex-col.gap-4.shrink-0(
    class="grow-0 max-w-[32rem] lg:min-w-[26rem] lg:h-[calc(100vh-8rem)] overflow-y-auto flex-nowrap px-14"
    style="scrollbar-width:thin;"
  )
    .flex.flex-col.text-left.my-8.items-start
      .text-3xl.font-serif.text-neutral-900 Sutils 杂物箱
    .flex.flex-col.gap-2
      q-input.bg-neutral-125.text-base.grow.w-full(
        class="max-w-[700px]"
        :model-value="search_text"
        @update:model-value="update_search_text($event)" placeholder="搜索..." 
        filled)
        template(#prepend)
          q-icon(name="mdi-magnify")

    .flex.flex-col.gap-8
      .flex.flex-col.items-end
        q-btn-toggle.border-2.border-neutral-200(
          v-model="index_operator"
          toggle-color="primary"
          :options="index_operator_options"
          flat :ripple="false"
          padding=".6rem 1rem"
          )
      .flex.flex-col.gap-3(v-for="tag in render_tag_tree.node_children")
        .flex.flex-row.rounded-tr-2xl.pr-3.py-3.gap-2.items-center.w-fit.select-none.white-selectable-card(
          class="pl-[.4rem] pb-[.7rem] -ml-1.5 rounded-bl-md"
          :class="{'white-selectable-card-enabled': tag.name === index_enabled_tag.name}"
          @click="select_tag(tag)"
        )
          q-icon(
            :name="tag_icon_map[tag.name]?.name ?? 'mdi-hammer-wrench'"
            :size="1.3 * (tag_icon_map[tag.name]?.scaling ?? 1) + 'rem'"
            :style="{'margin-right': (1 - (tag_icon_map[tag.name]?.scaling ?? 1)) * 1.3 + 'rem'}"
            )
          div(class="text") {{tag.name}}
        .bg-neutral-200.dividing-line(class="h-[1px] mt-[-0.75rem]")
        .flex.flex-row.gap-4.items-start(v-if="tag.node_children.length > 0")
          .flex.flex-col.p-2.w-20.min-h-20.gap-2.items-center.justify-center.select-none.selectable-card(
            v-for="sub_tag in tag.node_children"
            :class="{'selectable-card-enabled': sub_tag.name === index_enabled_tag.name}"
            @click="select_tag(sub_tag)"
            )
            q-icon.mt-1(
              :name="tag_icon_map[sub_tag.name]?.name ?? 'mdi-hammer-wrench'"
              :size="1.6 * (tag_icon_map[sub_tag.name]?.scaling ?? 1) + 'rem'"
              :style="{'margin-bottom': (1 - (tag_icon_map[sub_tag.name]?.scaling ?? 1)) * 1.5 + 'rem'}"
              )
            .text-center(class="text") {{sub_tag.name}}
        .flex.flex-row.text-neutral-600(v-else) 无子标签。

  div(class="h-[calc(95vh-60px)] w-0.5 bg-neutral-200 self-center hidden md:block")

  .flex.flex-col.gap-10.grow.px-10.py-8.page_display.grow.shrink(
    class="lg:h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden"
    style="scrollbar-width:thin;"
    )
    .flex.flex-row.gap-4(v-if="search_text.length === 0")
      .card.select-none.rounded-lg.gap-1(
        v-for="page in index_enabled_tag.page_children"
        class="max-w-[18rem] min-h-[6rem]"
        tabindex="0"
        @click="router.push({name: page.name})"
        )
        .card-title(class="text-[16px]") {{ page.name }}
        div.text-sm.text-zinc-600 {{ page.description }}
        q-space
        .flex.flex-row.items-center(v-if="page.tags.length > 0")
          q-icon.mr-2.tag-icon(name="mdi-tag" size="1rem")
          q-chip.text-sm.tag(v-for="tag in page.tags" :ripple="false") {{ tag.name }}
      
    .flex.flex-col.gap-4(v-if="search_text.length !== 0")
      .text-lg.flex.flex-row.gap-2 搜索结果
      .flex.flex-row.gap-4
        TransitionGroup(name="index__search_result")
          IndexFullPageCard(v-for="p in search_result" :key="p.name" :page="p" class="basis-[calc(50%-1rem)]  sm:basis-auto")
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
.white-selectable-card-enabled + .dividing-line {
  @apply bg-blue-500;
}
</style>
