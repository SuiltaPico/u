<script setup lang="ts">
import { computed, ref } from "vue";

import Editor from "../../components/Editor.vue";
import type { ItemsOfArray } from "../../lib/common/types_utils";
import homo_cjk from "../../lib/unicode/homo_cjk.txt?raw";

const mode_define = {
  looks_unchanged: "看起来没什么变化",
  little_change: "可以发现和原文有点不一样，但没什么变化",
  extreme: "极端地替换文本，会使文本失真",
};

// const looks_unchanged_replace_groups = [
//   [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "],
//   ["!", "ǃ"],
//   ["'", "ꞌ"],
//   [",", "‚"],
//   ["-", "˗", "‐", "‑"],
//   [".", "․"],
//   ["/", "∕"],
//   [":", "ː"],
//   [";", ";"],
//   ["=", "᐀"],
//   ["3", "З"],
//   ["A", "Α", "А"],
//   ["B", "Β", "В"],
//   ["C", "С"],
//   ["D", "Ꭰ", "ꓓ"],
//   ["E", "Ε", "Е"],
//   ["G", "Ԍ"],
//   ["H", "Η", "Н"],
//   ["J", "Ϳ", "Ј"],
//   ["K", "Κ", "К", "K"],
//   ["L", "Ꮮ", "Ⳑ", "ꓡ", "𐐛"],
//   ["M", "Μ", "М"],
//   ["N", "Ν"],
//   ["P", "Ρ", "Р"],
//   ["a", "а"],
//   ["b", "ᖯ", "𝖻"],
//   ["c", "с"],
//   ["d", "ԁ"],
//   ["e", "е"],
//   ["h", "һ"],
//   ["i", "і"],
//   ["j", "ј"],
//   ["l", "ӏ"],
//   ["n", "ո"],
//   ["o", "о", "ο", "ⲟ"],
//   ["p", "р"],
//   ["u", "ս"],
//   ["v", "ν"],
//   ["x", "х"],
//   ["y", "у"],
// ] as const;

console.time()
const looks_unchanged_replace_groups = homo_cjk.split("\n").map(l=>l.split(""))
console.timeEnd()


let looks_unchanged_replace_maps: any = {};
looks_unchanged_replace_groups
  .map((v) => build_map(v))
  .forEach((m) => {
    looks_unchanged_replace_maps = {
      ...looks_unchanged_replace_maps,
      ...m,
    };
  }),

console.log(looks_unchanged_replace_maps);

function build_map<T extends readonly string[]>(string_list: T) {
  return result_map;
}

const input_text = ref("")
const result_text = computed(()=>{
  let result = ""
  const ipv = input_text.value
  for (const ch of ipv) {
    result += (looks_unchanged_replace_maps[ch] ?? [0,ch])[1]
  }
  return result
})
</script>

<template lang="pug">
q-page.fcol.w-full.h-full
  Editor.grow(init_theme="vs" @update:content="input_text = $event")
  div(class="h-[50vh]") {{ result_text }}
</template>
