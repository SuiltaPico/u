<script setup lang="ts">
import { reactive, ref } from "vue";
import type { RenderTagTreeNode } from "../../core/pages_meta";
import Card from "../Card.vue";

const props = withDefaults(
  defineProps<{
    render_tag_tree: RenderTagTreeNode;
    children_only?: boolean;
    wrap: boolean;
  }>(),
  {
    children_only: false,
  }
);

const emits = defineEmits<{
  (event: "update:wrap", value: boolean): void;
  (event: "default_update:wrap", value: boolean): void;
}>();

const node_children_len = props.render_tag_tree.node_children.length;

const wrap_list = reactive(
  Array(node_children_len).fill(true, 0, node_children_len)
);

emits("default_update:wrap", !props.render_tag_tree.no_wrap);
</script>

<template lang="pug">
.flex.flex-col.gap-4
  div.flex.flex-col.gap-4
    .text-lg.flex.flex-row.gap-2.cursor-pointer.select-none.items-center(v-if="!children_only" @click="emits('update:wrap', !wrap)")
      q-icon(name="mdi-chevron-right" class="transition" :class="{'rotate-90': wrap}")
      div {{ render_tag_tree.name }}
    .flex.flex-row.px-6(v-if="wrap")
      Card(v-for="p in render_tag_tree.page_children" :key="p.name"
        @click="$router.push(p.path)" style="max-width: 14rem;")
        .flex.flex-row.gap-2.items-center
          div {{ p.name }}
        div.text-sm.text-zinc-600 {{ p.description }}
    .flex.flex-col.gap-4(:class="{'px-6': !children_only}" v-if="wrap")
      template(v-for="n,i in render_tag_tree.node_children")
        IndexPagesTree(v-if="node_children_len > 0"
          :render_tag_tree="n"
          :wrap="wrap_list[i]" @update:wrap="wrap_list[i] = $event" @default_update:wrap="wrap_list[i] = $event"
          )
</template>
