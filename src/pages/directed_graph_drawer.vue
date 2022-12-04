<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";
import type { Ref } from "vue";
import katex from "katex";
import "katex/dist/katex.min.css";

import { incrementIDGeneratorFactory } from "../lib/common/id";
import RelationMap from "../lib/common/relation_map";
import { number } from "mathjs";

interface INode {
  id: number;
  name?: string;
}

interface IPositon {
  x: number;
  y: number;
}

interface ISelectable {
  selected: boolean;
  not_selectable: boolean;
}

function get_selectable_color(node: ISelectable) {
  if (node.not_selectable) {
    return "#71717a";
  } else if (node.selected) {
    return "#2563eb";
  } else {
    return "#18181b";
  }
}

interface IRenderNode extends INode, IPositon, ISelectable {}

interface IRelation {
  src: number;
  target: number;
}

const node_counter = ref(0);
const node_map: Ref<Record<number, IRenderNode>> = ref({});

function add_node(pos: IPositon) {
  const id = id_generator.next().value;
  const node: IRenderNode = {
    id,
    ...pos,
    selected: false,
    not_selectable: false,
  };
  node_map.value[id] = node;
  node_counter.value++;
}

function delete_node(node_id: number) {
  delete node_map.value[node_id];
  relation_map.delete_item(node_id);
  node_counter.value--;
}

const relation_map = reactive(new RelationMap<number>());
const relation_map_iter = relation_map[Symbol.iterator];

enum Reflexive {
  All,
  Anti,
  AllAndAnti,
  No,
}

const relation_map_reflexive_state = computed(() => {
  if (node_counter.value === 0) return Reflexive.AllAndAnti;

  let counter = 0;
  for (const [id, [_, as_target]] of relation_map.entries()) {
    counter += (as_target.has(id) ? 1 : 0);
  }

  if (counter === node_counter.value) return Reflexive.All;
  if (counter === 0) return Reflexive.Anti;
  return Reflexive.No;
});

const Symmetrical = Reflexive;

const relation_map_symmetrical_state = computed(() => {
  if (node_counter.value === 0) return Symmetrical.AllAndAnti;

  let all_symmetrical = true;
  let all_anti_symmetrical = true;
  for (const [src_node_id, [as_src, as_target]] of relation_map.entries()) {
    let node_all_symmetrical = true;
    let node_all_anti_symmetrical = true;
    for (const node of as_src) {
      if (node === src_node_id) continue;
      if (as_target.has(node)) node_all_anti_symmetrical = false;
      else node_all_symmetrical = false;
    }
    for (const node of as_target) {
      if (node === src_node_id) continue;
      if (as_src.has(node)) node_all_anti_symmetrical = false;
      else node_all_symmetrical = false;
    }
    if (!node_all_symmetrical) all_symmetrical = false;
    if (!node_all_anti_symmetrical) all_anti_symmetrical = false;
  }
  if (all_symmetrical) return Symmetrical.All;
  if (all_anti_symmetrical) return Symmetrical.Anti;
  return Symmetrical.No;
});

const Transitive = Reflexive;

const relation_map_transitive_state = computed(() => {
  if (node_counter.value === 0) return Transitive.AllAndAnti;

  let all_transitive = true;
  let all_anti_transitive = true;

  for (const [_, [as_src]] of relation_map.entries()) {
    let node_all_transitive = true;
    let node_all_anti_transitive = true;
    for (const mid_node of as_src) {
      for (const target_node of relation_map.get(mid_node)![0]) {
        if (as_src.has(target_node)) node_all_anti_transitive = false;
        else node_all_transitive = false;
      }
    }
    if (!node_all_transitive) all_transitive = false;
    if (!node_all_anti_transitive) all_anti_transitive = false;
  }

  if (all_transitive) return Transitive.All;
  if (all_anti_transitive) return Transitive.Anti;
  return Transitive.No;
});

function add_relation(relation: IRelation) {
  relation_map.set(relation.src, relation.target);
}

const id_generator = incrementIDGeneratorFactory();

const canvas_container = ref<HTMLElement>();
const canvas_toolbar = ref<HTMLElement>();
const canvas = ref<HTMLElement>();
const canvas_rect = ref<DOMRect>();
onMounted(() => {
  const canvas_container_rect = canvas_container.value!.getBoundingClientRect();
  const canvas_toolbar_rect = canvas_toolbar.value!.getBoundingClientRect();
  canvas.value!.setAttribute("width", canvas_container_rect.width + "");
  canvas.value!.setAttribute(
    "height",
    canvas_container_rect.height - canvas_toolbar_rect.height - 20 + ""
  );
  canvas_rect.value = canvas.value!.getBoundingClientRect();
});

function clear_canvas() {
  relation_map.clear();
  node_map.value = {};
  node_counter.value = 0
}

const stop_canvas_click_counter = ref(0);
function canvas_click(e: MouseEvent) {
  if (stop_canvas_click_counter.value > 0) {
    stop_canvas_click_counter.value--;
    return;
  }

  add_node({
    x: e.clientX - canvas_rect.value!.left,
    y: e.clientY - canvas_rect.value!.top,
  });
}

const mouse_pos = ref<IPositon>({
  x: 0,
  y: 0,
});

function canvas_mouse_move(e: MouseEvent) {
  const rect = canvas_rect.value!;
  mouse_pos.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

const select_mouse_down_pos = ref<{ x: number; y: number }>();

function canvas_mouse_down(e: MouseEvent) {
  const rect = canvas_rect.value!;
  if (e.buttons === 2) {
    select_mouse_down_pos.value = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
}

function canvas_mouse_up(e: MouseEvent) {
  if (select_mouse_down_pos.value !== undefined) {
    Object.values(node_map.value).forEach((node) => {
      node.selected = false;
    });
    Object.values(node_map.value)
      .filter(
        (node) =>
          node.x >
            Math.min(select_mouse_down_pos.value!.x, mouse_pos.value.x) &&
          node.x <
            Math.max(select_mouse_down_pos.value!.x, mouse_pos.value.x) &&
          node.y >
            Math.min(select_mouse_down_pos.value!.y, mouse_pos.value.y) &&
          node.y < Math.max(select_mouse_down_pos.value!.y, mouse_pos.value.y)
      )
      .forEach((node) => {
        node.selected = true;
      });
    select_mouse_down_pos.value = undefined;
  }

  mouse_down_node_id.value = undefined;
  mouse_down_and_leave.value = false;
  is_mouse_down_on_node.value = false;
}

function canvas_context_menu(e: MouseEvent) {
  e.preventDefault();
  // for (const node of Object.values(node_map.value)) {
  //   node.selected = false;
  // }
}

function node_click(node_id: number) {
  node_map.value[node_id].selected = !node_map.value[node_id].selected;
}

function node_dbl_click(node_id: number) {
  const node = node_map.value[node_id];
  if (node.selected) {
    for (const node of Object.values(node_map.value)) {
      if (node.selected) delete_node(node.id);
    }
  } else {
    delete_node(node_id);
  }
}

const is_mouse_down_on_node = ref(false);
const mouse_down_node_id = ref<number>();
// 鼠标按下且离开过节点，才开启连接模式
const mouse_down_and_leave = ref(false);
const mouse_down_node = computed(() =>
  mouse_down_node_id.value === undefined
    ? undefined
    : node_map.value[mouse_down_node_id.value]
);

function node_mouse_down(node_id: number, e: MouseEvent) {
  if (e.buttons === 1) {
    is_mouse_down_on_node.value = true;
    mouse_down_node_id.value = node_id;
  }
}
function node_mouse_up(node_id: number) {
  if (mouse_down_node.value && mouse_down_and_leave.value) {
    const has_relation = relation_map.has(mouse_down_node_id.value!, node_id);
    if (has_relation) {
      relation_map.delete(mouse_down_node_id.value!, node_id);
    } else {
      add_relation({
        src: mouse_down_node_id.value!,
        target: node_id,
      });
    }
  }
}
function node_mouse_leave(node_id: number) {
  // 如果鼠标按下时离开了所按节点，阻止 canvas_click 的触发在不应该的地方创建新节点。
  if (mouse_down_node_id.value == node_id) {
    stop_canvas_click_counter.value++;
    mouse_down_and_leave.value = true;
  }
}
function node_mouse_enter(node_id: number, event: MouseEvent) {
  if (mouse_down_node_id.value == node_id) {
    stop_canvas_click_counter.value--;
  }
  if (mouse_down_node_id.value === undefined && event.buttons === 1) {
    stop_canvas_click_counter.value++;
  }
}


function build_total_order_relation() {
  for (const a of Object.values(node_map.value)) {
    for (const b of Object.values(node_map.value)) {
      add_relation({src: a.id, target: b.id})
    }
  }
}

const relation_distance = 4;
let relation_angle = 0;
</script>

<template lang="pug">
q-page.flex.flex-col.gap-4.p-2.w-full(ref="page")
  .flex.flex-row.h-full.flex-nowrap
    .flex.flex-col.gap-2(style="min-width: 260px;max-width: 260px;")
      div(
        v-html="katex.renderToString(('R=\\\\\{'+[...relation_map_iter()].map(([src, target]) => '\\\\\{'+src+', '+target+'\\\\\}').join(', ')  + ' \\\\\}').replace('\\\\\{ \\\\\}', '\\\\varnothing'), {output: 'html'})"
      )
      .flex.flex-row.gap-1
        div 信息：
        div {{{[Reflexive.All]: "自反", [Reflexive.Anti]: "反自反", [Reflexive.AllAndAnti]: "自反且反自反", [Reflexive.No]: ""}[relation_map_reflexive_state]}}
        div {{{[Symmetrical.All]: "对称", [Symmetrical.Anti]: "反对称", [Symmetrical.AllAndAnti]: "对称且反对称", [Symmetrical.No]: ""}[relation_map_symmetrical_state]}}
        div {{{[Transitive.All]: "传递", [Transitive.Anti]: "反传递", [Transitive.AllAndAnti]: "传递且反传递", [Transitive.No]: ""}[relation_map_transitive_state]}}
      .flex.flex-row.gap-1
        div 可以是：
        div {{ relation_map_reflexive_state % 2 === 0 && relation_map_transitive_state % 2 === 0 ? "预序关系 " : "" }}
        div {{ relation_map_reflexive_state % 2 === 0 && relation_map_symmetrical_state % 3 > 0 && relation_map_transitive_state % 2 === 0 ? "非严格偏序 " : "" }}
        div {{ relation_map_reflexive_state % 3 > 0 && relation_map_symmetrical_state % 3 > 0 && relation_map_transitive_state % 2 === 0 ? "严格偏序 " : "" }}
        div {{ relation_map_reflexive_state % 2 === 0 && relation_map_symmetrical_state  % 2 === 0 && relation_map_transitive_state % 2 === 0 ? "等价关系 " : "" }}
        // div {{ relation_map_reflexive_state % 2 === 0 && relation_map_symmetrical_state  % 2 === 0 && relation_map_transitive_state % 2 === 0 ? "全序关系 " : "" }}
      q-space
      .flex.flex-row(class="gap-0.5")
        div 创建节点：单击空白部分
        div 删除节点：双击节点
        div 连接节点：按住节点并移到目标节点上
        div 选择/取消选择单个节点：单击节点
        div 框选节点：右键在空白部分移动
      div 注：当删除被选择的节点时，其他被选择的节点也会被删除。
    .flex.flex-col.grow.gap-2(ref="canvas_container")
      .flex.flex-row.gap-4.items-center(ref="canvas_toolbar")
        q-btn(outline @click="clear_canvas") 清除画布
        .flex.flex-row.gap-1
          q-input(label="新名称" outlined dense)
          q-btn(outline @click="clear_canvas") 改名
        .flex.flex-row.gap-1
          q-btn(outline @click="build_total_order_relation") 构建全序关系
      svg(ref="canvas" version="1.1" xmlns="http://www.w3.org/2000/svg"
        @click="canvas_click"
        @mousemove="canvas_mouse_move"
        @mousedown="canvas_mouse_down" @mouseup="canvas_mouse_up"
        @contextmenu.stop="canvas_context_menu"
        class="border-zinc-500 border"
        )
        defs
          marker(id="arrowhead-mouse" markerWidth="10" markerHeight="8" refX="6" refY="4" orient="auto" class="fill-teal-500")
            polygon(points="0 0, 7 4, 0 4")
          template(v-for="i in Array(360).keys()")
            marker(:id="'arrowhead-' + i" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto" :style="{'fill': `hsl(${i}, 70%, 50%)`}")
              polygon(points="0 0, 7 4, 0 4")
        g()
          rect(
            v-if="select_mouse_down_pos !== undefined"
            :x="Math.min(select_mouse_down_pos.x, mouse_pos.x)"
            :y="Math.min(select_mouse_down_pos.y, mouse_pos.y)"
            :width="Math.abs(mouse_pos.x - select_mouse_down_pos.x)"
            :height="Math.abs(mouse_pos.y - select_mouse_down_pos.y)"
            class="fill-blue-200 opacity-50 stroke-1 stroke-blue-800"
          )
        // 线
        g()
          line(
            class="stroke-teal-500"
            v-if="mouse_down_node !== undefined && mouse_down_and_leave"
            :x1="mouse_down_node.x" :y1="mouse_down_node.y"
            :x2="mouse_pos.x" :y2="mouse_pos.y"
            :marker-end="`url(#arrowhead-${(((mouse_down_node_id ?? 0)) * 59 + 90) % 360})`"
            style="stroke-width: 4px;"
            :style="{'stroke': `hsl(${(((mouse_down_node_id ?? 0)) * 59 + 90) % 360}, 80%, 80%)`}"
            )
          g(v-for="relation in relation_map" :calc="relation_angle = Math.atan2(node_map[relation[1]].x - node_map[relation[0]].x, node_map[relation[1]].y - node_map[relation[0]].y)")
            line(
              :x1="node_map[relation[0]].x + Math.cos(relation_angle) * relation_distance" :y1="node_map[relation[0]].y - Math.sin(relation_angle) * relation_distance"
              :x2="node_map[relation[1]].x  + Math.cos(relation_angle) * relation_distance" :y2="node_map[relation[1]].y - Math.sin(relation_angle) * relation_distance"
              :marker-end="`url(#arrowhead-${(relation[0] * 59 + 90) % 360})`"
              style="stroke-width: 4px;" stroke="crimson"
              :style="{'stroke': `hsl(${(relation[0] * 59 + 90) % 360}, 80%, 80%)`}"
            )
        // 节点
        g()
          g(v-for="node in node_map" @click.stop="" @contextmenu="$event.preventDefault()")
            circle(:cx="node.x" :cy="node.y" r="50" class="fill-transparent")
            g(
              @click="node_click(node.id)" @dblclick="node_dbl_click(node.id)"
              @mousedown.stop="node_mouse_down(node.id, $event)"
              @mouseup="node_mouse_up(node.id)"
              @mouseleave="node_mouse_leave(node.id)"
              @mouseenter="node_mouse_enter(node.id, $event)"
              class="node"
            )
              circle(:cx="node.x" :cy="node.y" r="30" class="fill-zinc-200 stroke-1 opacity-0 hint transition-all"
                :class="{'fill-blue-200': node.selected, 'stroke-blue-400': node.selected}"
              )
              circle(:cx="node.x" :cy="node.y" r="10" class="stroke-0" :style="{fill: get_selectable_color(node)}")
</template>

<style>
.node:hover > .hint {
  opacity: 0.5;
}
.katex .base {
  width: fit-content;
  white-space: break-spaces;
}
</style>
