<script setup lang="ts">
import { computed, ref } from "vue";

const input_value = ref("char * const (*X)();");

const regexps_arr = [
  [
    "const",
    (src: string) => {
      const const_regexp = /^\s*const\s+(?<inside>[^]+)$/;
      const result = src.match(const_regexp);
      if (!result) return null;

      return {
        groups: {
          inside: result.groups!.inside,
          const: true,
        },
      };
    },
  ],
  /** 令 `inside` 为 `type` 的指针。 `const` 必须伴随指针类型出现。测试案例：`int *a`, `*a` */
  ["ptr", /^\s*((?<type>[^\*\(]+))?\s*\*\s*(?<inside>[^]+$)/],

  [
    "function",
    (src: string) => {
      src = src.trim();
      if (src[src.length - 1] !== ")") return null;

      let level = 0;

      for (let index = src.length - 1; index >= 0; index--) {
        const char = src[index];
        if (char === "(") level += 1;
        if (char === ")") level -= 1;
        if (level === 0)
          return {
            groups: {
              inside: src.slice(0, index),
              params: src.slice(index + 1, src.length - 1),
            },
          };
      }

      return null;
    },
  ],
  /** 限定 `inside` 的类型或可变性。 */
  ["base", /^\s*(?<type>[^\*\(\)]*)\s+(?<inside>[^]+)$/],
  ["arr", /^\s*(?<inside>[^]+)\[(?<size>\d*)\]\s*$/],
] as const;

type Node =
  | PtrNode
  | ArrNode
  | FunctionNode
  | BaseNode
  | ConstNode
  | AtomicNode;

interface PtrNode {
  node_type: "ptr";
  type: string;
  inside: Node;
}

interface ArrNode {
  node_type: "arr";
  inside: Node;
  size: number;
}

interface FunctionNode {
  node_type: "function";
  inside: Node;
  params: Node[];
}

interface BaseNode {
  node_type: "base";
  type: string;
  inside: Node;
}

interface ConstNode {
  node_type: "const";
  inside: Node;
}

interface AtomicNode {
  node_type: "atomic";
  content: string;
}

const parsed_input = computed(() => {
  type Regexps = typeof regexps_arr;
  type RegexpsModes = Regexps[number][0];

  const src = input_value.value;
  if (!src)
    return {
      node_type: "atomic",
      content: "",
    } as AtomicNode;

  const cleaned_src = src.replace(/^\s*/, "").replace(/\s*\;+\s*$/, "");

  interface ParsedResult {
    const: boolean;
    type: string;
    inside: string;
    size: number;
    params: string;
  }

  /** 将正则表达式匹配的结果转换为统一的格式 */
  const parse_result = (result: { groups: any }): ParsedResult => ({
    const: !!result.groups.const,
    type: result.groups.type ?? "",
    inside: result.groups.inside ?? "",
    size: parseInt(result.groups.size),
    params: result.groups.params ?? "",
  });

  const delect_bracket = (src: string) => {
    src = src.trim();
    if (src.length <= 2 || src[0] !== "(" || src[src.length - 1] !== ")")
      return false;
    let level = 0;
    for (let index = 1; index < src.length - 1; index++) {
      if (src[index] === "(") level += 1;
      if (src[index] === ")") level -= 1;
      if (level < 0) return false;
    }
    return true;
  };

  const delect_mode = (src: string, start?: true) => {
    if (delect_bracket(src)) {
      src = src.trim();
      return {
        mode: "bracket",
        result: src.slice(1, src.length - 1),
      } as const;
    }

    const arr = start
      ? regexps_arr.filter(([mode]) => mode === "base" || mode === "ptr")
      : regexps_arr;
    for (const [mode, regexp_or_fn] of arr) {
      const match_result =
        typeof regexp_or_fn === "function"
          ? regexp_or_fn(src)
          : src.match(regexp_or_fn);
      if (match_result === null) {
        continue;
      }
      return {
        mode,
        result: parse_result(
          match_result as {
            groups: any;
          }
        ),
      };
    }
    return false;
  };

  const separate_function_param = (src: string) => {
    const state = {
      level: 0,
    };

    let buf = "";
    const result: string[] = [];

    for (let index = 0; index < src.length; index++) {
      const char = src[index];
      if (char === "(") {
        state.level += 1;
      }

      if (char === ")") {
        state.level -= 1;
      }

      if (char === ",") {
        if (!buf) continue;
        result.push(buf);
        buf = "";
        continue;
      }

      buf += char;
    }

    if (buf) {
      result.push(buf);
    }

    return result;
  };

  const parse_src = (src: string, start?: true): Node => {
    const delect_mode_result = delect_mode(src, start);

    console.log(src, delect_mode_result);

    if (delect_mode_result === false) {
      return {
        node_type: "atomic",
        content: src,
      };
    }

    const { mode: delected_mode, result } = delect_mode_result;
    if (delected_mode === "ptr") {
      return {
        node_type: "ptr",
        type: result.type,
        inside: parse_src(result.inside),
      };
    } else if (delected_mode === "arr") {
      return {
        node_type: "arr",
        size: result.size,
        inside: parse_src(result.inside),
      };
    } else if (delected_mode === "function") {
      console.log(result.params, separate_function_param(result.params));

      return {
        node_type: "function",
        inside: parse_src(result.inside),
        params: separate_function_param(result.params).map((p) =>
          parse_src(p, true)
        ),
      };
    } else if (delected_mode === "base") {
      return {
        node_type: "base",
        type: result.type,
        inside: parse_src(result.inside),
      };
    } else if (delected_mode === "const") {
      return {
        node_type: "const",
        inside: parse_src(result.inside),
      };
    } else if (delected_mode === "bracket") {
      return parse_src(result);
    }

    return {
      node_type: "atomic",
      content: "",
    };
  };

  return parse_src(cleaned_src, true);
});

const coverted_ts_type = computed(() => {
  const base_node = parsed_input.value;
  console.log(base_node);

  const compose_text = (node: Node, inside: string = ""): string => {
    if (node.node_type === "ptr") {
      const type = node.type.trim();

      if (type) {
        const left_const = /^\s*const\s+(?<inside>[^]+)$/;
        const right_const = /^\s*(?<inside>[^]+)\s+const$/;
        const result = type.match(left_const) || type.match(right_const);
        if (result)
          return compose_text(
            node.inside,
            `UnMutable<${result?.groups!.inside}>`
          );
      }

      return compose_text(node.inside, `Ptr<${type || inside}>`);
    } else if (node.node_type === "arr") {
      return compose_text(
        node.inside,
        `Array<${inside}${isNaN(node.size) ? "" : ", " + node.size}>`
      );
    } else if (node.node_type === "function") {
      return compose_text(
        node.inside,
        `(${node.params.map((n) => compose_text(n)).join(", ")}) => ${inside}`
      );
    } else if (node.node_type === "base") {
      const type = node.type.trim();

      if (type) {
        const left_const = /^\s*const\s+(?<inside>[^]+)$/;
        const right_const = /^\s*(?<inside>[^]+)\s+const$/;
        const result = type.match(left_const) || type.match(right_const);
        if (result)
          return compose_text(
            node.inside,
            `UnMutable<${result?.groups!.inside}>`
          );
      }

      return compose_text(node.inside, `${type || inside}`);
    } else if (node.node_type === "const") {
      return compose_text(node.inside, `UnMutable<${inside}>`);
    } else if (node.node_type === "atomic") {
      if (node.content === "") return "";
      if (inside === "") return node.content;
      return `${node.content}: ${inside}`;
    }
    return "";
  };

  return compose_text(base_node);
});

const coverted_ts_type_html = computed(() => {
  const text = coverted_ts_type.value;
  let lt_counter = 0;
  let gt_counter = 0;
  const result = text
    .replace(/\</g, "\\<")
    .replace(/(?<!=)\>/g, "\\>")
    .replace(
      /\\\</g,
      () =>
        `<span style="color: hsl(${lt_counter++ * 79}, 60%, 50%)">&lt;</span>`
    )
    .replace(
      /\\\>/g,
      () =>
        `<span style="color: hsl(${
          (lt_counter - 1 - gt_counter++) * 79
        }, 60%, 50%)">&gt;</span>`
    );
  return result;
});
</script>

<template lang="pug">
q-page.bg-white.w-full.max-w-6xl.fcol.items-center
  div(class="min-h-[64px] h-[12vh]")
  div.frow.font-code.text-3xl.items-center.select-none.text-neutral-500.flex-wrap.p-2(class="max-sm:text-2xl")
    span
      span.bg-orange-600.text-neutral-100.p-2 C
      span &nbsp;Decl&nbsp;
    span
      | ==>>&nbsp;
    span
      span.bg-sky-600.text-neutral-100.p-2 TS
      span &nbsp;Decl
  div(class="min-h-[64px] ")
  div.fcol.font-code.text-3xl.items-center.justify-center.select-none.w-full.gap-4.select-text
    q-input.text-xl.bg-neutral-150(
      class="w-[80%]"
      label="类C类型" filled
      v-model="input_value")
    div.text-xl(class="ts_type_result w-[80%] frow flex-wrap" v-html="coverted_ts_type_html")
</template>

<style>
.ts_type_result > div {
  display: inline;
}
</style>
