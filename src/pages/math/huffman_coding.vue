<script lang="ts">

</script>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import Editor from "../../components/Editor.vue";
import type { EditorCompoAPI } from "../../components/Editor.vue";
import type { ItemsOfArray } from "../../lib/common/types_utils";

import { PriorityQueue } from "../../lib/common/priority_queue";
import prettier from "prettier/standalone";
import prettier_babel from "prettier/parser-babel";
import { create_object_url, download_url } from "../../lib/utils";
import StorePropertyRef from "../../lib/store_property_ref";


import JSZip from "jszip";
import { defineStore } from "pinia";

const default_store_options = {
  app_mode: "encode" as ItemsOfArray<typeof app_mode_options>["value"]
}

const store = defineStore("huffman_coding", () => {
  const result = reactive({
    ...default_store_options,
  });
  return result;
})();

watch(store, () => {
  localStorage.setItem(
    store.$id,
    JSON.stringify(store, (key, value) => {
      return key.match(/^(\$|\_)/) ? undefined : value;
    })
  );
});

if (localStorage.getItem(store.$id)) {
  Object.entries(JSON.parse(localStorage.getItem(store.$id)!)).forEach(
    ([key, value]) => {
      /** @ts-ignore */
      store[key] = value;
    }
  );
}

const app_mode = new StorePropertyRef(store, "app_mode").ref()
const app_mode_options = [
  {
    label: "编码",
    value: "encode",
  } as const,
  {
    label: "解码",
    value: "decode",
  } as const,
];

watch(app_mode, () => {
  const editor = code_conversion_table_editor.value;

  if (!editor) return;
  editor.set_readonly(app_mode.value === "encode");
});

const state = ref("");

type InputMode = "text" | "file";
const encode_input_mode = ref<InputMode>("text");

const encode_input_text_content = ref("");
const encode_input_text_editor = ref<EditorCompoAPI>();
const encode_input_file_containner = ref();
const encode_input_file_read_as_text = ref(true);

const code_conversion_table_content = ref("");
const code_conversion_table_editor = ref<EditorCompoAPI>();

const encode_entropy = ref(0)
const download_file_url = ref("")
let download_file_revoke = () => { }
const encoded_file_size = ref(0)
const packed_file_size = ref(0)

const decode_input_containner = ref();
const decode_output_file_url = ref("")
let decode_output_file_revoke = () => { }


function set_download_file(options: ReturnType<typeof create_object_url>) {
  download_file_revoke()
  download_file_revoke = options.revoke
  download_file_url.value = options.url
}

function get_encode_input_size() {
  const mode = encode_input_mode.value
  if (mode === "text") {
    return encode_input_text_content.value.length * 16
  } else if (mode === "file") {
    const containner = encode_input_file_containner.value as
      | File
      | null
      | undefined;
    return (containner?.size ?? 0) * 8
  }

  return 0
}

async function get_encode_input() {
  const mode = encode_input_mode.value;
  if (mode === "text") {
    return {
      mode: "text",
      content: encode_input_text_content.value,
    } as const;
  } else if (mode === "file") {
    const read_as_text = encode_input_file_read_as_text.value;
    const containner = encode_input_file_containner.value as
      | File
      | null
      | undefined;

    if (!containner) {
      return {
        mode: "none",
      } as const;
    }

    if (read_as_text) {
      const content = await containner.text();
      return {
        mode: "text",
        content,
      } as const;
    } else {
      const content = await containner.arrayBuffer();
      return {
        mode: "bin",
        content,
      } as const;
    }
  }

  return {
    mode: "none",
  } as const;
}

type CodeItem = {
  tree?: Tree;
  code?: number;
  freq: number;
}

interface Tree {
  code?: number;
  left?: Tree;
  right?: Tree;
}

function build_huffman_tree(pq: PriorityQueue<CodeItem>) {
  while (pq.length > 1) {
    // pq.heap.forEach(i => console.log(i.freq))
    const i1 = pq.pop()!
    const i2 = pq.pop()!

    const combined: CodeItem = {
      tree: {
        left: i1.tree ?? {
          code: i1.code
        },
        right: i2.tree ?? {
          code: i2.code
        }
      },
      freq: i1.freq + i2.freq,
    }

    pq.push(combined)
    // console.log("----")
  }
}

interface CodeConversionTable {
  type: "char",
  /** Record<编码后, 编码前> */
  table: Record<string, number>
}

type CodeConversionReverseTable = Record<number, [code: number, len: number]>


function huffman_tree_to_code_conversion_table(huffman_tree: Readonly<Tree>) {
  const table: CodeConversionTable["table"] = {}
  const result: CodeConversionTable = {
    type: "char",
    table
  }

  function traverse_huffman_tree(node: Tree | undefined, perfix: string) {
    if (!node) return
    if (node.code !== undefined) {
      table[perfix] = node.code
      return
    }
    traverse_huffman_tree(node.left, perfix + "0")
    traverse_huffman_tree(node.right, perfix + "1")
  }

  traverse_huffman_tree(huffman_tree, "")

  return result
}

enum GenerateCodeConversionTableError {
  NullContent,
  ContentUnitLessThanTwo
}

async function generate() {
  const { mode, content } = await get_encode_input();
  if (mode === "none") return GenerateCodeConversionTableError.NullContent;
  else {
    const map = new Map<number, number>();
    let content_len = 0
    if (mode === "text") {
      if (content.length === 0) return GenerateCodeConversionTableError.ContentUnitLessThanTwo

      for (let i = 0; i < content.length; i++) {
        const code = content.charCodeAt(i);
        map.set(code, (map.get(code) ?? 0) + 1);
      }

      content_len = content.length
    } else if (mode === "bin") {
      if (content.byteLength === 0) return GenerateCodeConversionTableError.ContentUnitLessThanTwo
      const buff = new Uint16Array(content)

      for (let i = 0; i < buff.length; i++) {
        const code = buff[i];
        map.set(code, (map.get(code) ?? 0) + 1);
      }
      content_len = content.byteLength / 2
    }

    // 计算熵

    let entropy = 0
    for (const [_, freq] of map.entries()) {
      const f = freq / content_len
      entropy -= f * Math.log2(f)
    }

    encode_entropy.value = entropy


    // 生成哈夫曼树

    const pq = new PriorityQueue<CodeItem>((a, b) => a.freq - b.freq);

    for (const [code, freq] of map.entries()) {
      pq.push({
        code,
        freq,
      });
    }

    build_huffman_tree(pq)
    const table = huffman_tree_to_code_conversion_table(pq.pop()!.tree!)

    const table_str = prettier.format(
      JSON.stringify(table),
      { parser: "json", plugins: [prettier_babel] }
    )
    code_conversion_table_content.value = table_str
    code_conversion_table_editor
      .value
      ?.change_value(
        table_str
      )
  }
}

async function encode_and_pack() {
  function zero_or_greater(x: number) {
    return x > 0 ? x : 0
  }

  const table: CodeConversionTable = JSON.parse(code_conversion_table_content.value)
  const reverse_table = Object.keys(table.table).reduce((prev, curr) => {
    prev[table.table[curr]] = [parseInt(curr, 2), curr.length]
    return prev
  }, {} as CodeConversionReverseTable)
  if (table.type === "char") {
    const { mode, content } = await get_encode_input()
    if (mode === "none") return
    else {
      // 前8位记录末尾有效位。
      const buff = new Uint8Array(
        1 + Math.ceil(encode_entropy.value / 16
          * (mode === "text" ? content.length * 2 : content.byteLength) * 1.2
        )
      )
      let content_cursor = 0
      /** buff 的可写点指针 */
      let buff_bit_cursor = 8

      let bin_buff = (mode === "bin" ? new Uint16Array(content) : undefined)
      const content_len = (mode === "text" ? content.length : bin_buff!.length)

      for (; content_cursor < content_len ; content_cursor++) {
        const code = (mode === "text" ? content.charCodeAt(content_cursor) : bin_buff![content_cursor])
        const [c, len] = reverse_table[code]
        let written_count = 0
        /** buff_bit_cursor 要到达的目标，下一个可写位置 */
        const buff_bit_cursor_target = buff_bit_cursor + len
        while (buff_bit_cursor < buff_bit_cursor_target) {
          const offset = buff_bit_cursor % 8
          const buff_cell = Math.floor(buff_bit_cursor / 8)
          const buff_next_cell_start = Math.floor(buff_bit_cursor / 8 + 1) * 8
          // console.log(
          //   "offset:" + offset,
          //   "content_cursor:" + content_cursor,
          //   buff_bit_cursor, c.toString(2),
          //   (c
          //     // 删掉已经写完的部分
          //     & (2 ** (len - written_count) - 1)
          //   ).toString(2),
          //   ((c
          //     // 删掉已经写完的部分
          //     & (2 ** (len - written_count) - 1)
          //   )
          //     // 移除右边不要的部分
          //     >> zero_or_greater(len - written_count - (8 - offset))
          //     << (buff_bit_cursor_target <= buff_next_cell_start ? (buff_next_cell_start - buff_bit_cursor_target) : 0)
          //   ).toString(2),
          // )

          // 当目标不在当前 buff_cell
          buff[buff_cell] |= (
            (c
              // 删掉已经写完的部分
              & (2 ** (len - written_count) - 1)
            )
            // 移除右边不要的部分
            >> zero_or_greater(len - written_count - (8 - offset))
            << (buff_bit_cursor_target <= buff_next_cell_start ? (buff_next_cell_start - buff_bit_cursor_target) : 0)
          )

          const move = Math.min(8 - offset, len - written_count)

          // 跳到下一格
          buff_bit_cursor += move
          written_count += move
        }
      }

      console.log(buff.length * 8, buff_bit_cursor)

      // 记录最后一个有效位偏移
      const buff_bit_cursor_offset = buff_bit_cursor % 8
      buff[0] = buff_bit_cursor_offset


      const encoed = buff.slice(0, Math.ceil(buff_bit_cursor / 8));
      encoded_file_size.value = encoed.length * 8
      packed_file_size.value = 0

      const jszip = new JSZip()
      jszip.file("table.json", JSON.stringify(table))
      jszip.file("encoded.huff", encoed)


      const packed = await jszip.generateAsync({
        type: "arraybuffer",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      })

      packed_file_size.value = packed.byteLength * 8
      set_download_file(create_object_url([packed]))
    }
  }
}

enum LoadPackedFromFileError {
  ErrorReadingFile,
  UnpackingError,
  UnpackedFileMissing
}

async function load_packed_from_file(packed_file: File) {
  let packed_buff: ArrayBuffer
  try {
    packed_buff = await packed_file.arrayBuffer()
  } catch {
    return {
      status: "faild",
      error: LoadPackedFromFileError.ErrorReadingFile
    } as const
  }
  const jszip = new JSZip()

  let unpacked_buff: JSZip
  try {
    unpacked_buff = await jszip.loadAsync(packed_buff)
  } catch {
    return {
      status: "faild",
      error: LoadPackedFromFileError.UnpackingError
    } as const
  }

  const missing_file = (["table.json", "encoded.huff"] as const)
    .filter((n) => !Reflect.has(unpacked_buff.files, n))

  if (missing_file.length > 1) {
    return {
      status: "faild",
      error: LoadPackedFromFileError.UnpackedFileMissing,
      info: missing_file
    } as const
  }

  return {
    status: "succeeded",
    data: {
      encoded_buff: await unpacked_buff.files["encoded.huff"].async("uint8array"),
      table: await unpacked_buff.files["table.json"].async("string")
    }
  } as const
}

enum DecodeError {
  CodeDoesNotExistInTheCodeTable
}

function decode(encoded_buff: Uint8Array, table: CodeConversionTable) {
  console.log(table)

  const decoed_buff = []
  const buff_bits = 8
  const max_temp = Math.max(...Object.keys(table.table).map((i) => i.length))
  console.log(max_temp);


  let temp = ""
  let cell_index = 1

  let accessible_last_index = encoded_buff[0]

  for (; cell_index < (encoded_buff.length - 1); cell_index++) {
    const cell_temp = encoded_buff[cell_index].toString(2)
      .padStart(buff_bits, "0")

    for (let c = 0; c < buff_bits; c++) {
      temp += cell_temp[c]
      const code = table.table[temp]
      if (code === undefined) {
        continue
      } else {
        decoed_buff.push(code)
        // console.log(String.fromCharCode(code))
        temp = ""
      }
    }

    if (temp.length > max_temp) {
      console.log(temp);
      return {
        status: "faild",
        error: DecodeError.CodeDoesNotExistInTheCodeTable,
        info: {
          bit_start: (cell_index + 1) * 8 - temp.length
        }
      } as const
    }
  }

  console.log(cell_index, encoded_buff[cell_index].toString(2)
    .padStart(buff_bits, "0")
    .slice(0, accessible_last_index))

  // 进行最后几位的解码
  const cell_temp = encoded_buff[cell_index].toString(2)
    .padStart(buff_bits, "0")
    .slice(0, accessible_last_index)

  for (let c = 0; c < accessible_last_index; c++) {
    temp += cell_temp[c]
    const code = table.table[temp]
    if (code === undefined) {
      continue
    } else {
      decoed_buff.push(code)
      // console.log(String.fromCharCode(code))
      temp = ""
    }
  }

  if (temp.length > 0) {
    console.log(temp, cell_temp, encoded_buff.length, cell_index);
    return {
      status: "faild",
      error: DecodeError.CodeDoesNotExistInTheCodeTable,
      info: {
        bit_start: (cell_index + 1) * 8 - temp.length
      }
    } as const
  }

  const raw_data = new Uint16Array(decoed_buff)
  return {
    status: "succeeded",
    data: raw_data
  } as const
}

async function unpack_and_decode() {
  const containner = decode_input_containner.value as File
  state.value = "正在尝试加载文件…"

  const {
    status: loaded_status,
    error: loaded_error,
    info: loaded_error_info,
    data: loaded_data
  } = await load_packed_from_file(containner)

  if (loaded_status === "faild") {
    if (loaded_error === LoadPackedFromFileError.ErrorReadingFile) {
      state.value = "文件读取出错。"
    } else if (loaded_error === LoadPackedFromFileError.UnpackingError) {
      state.value = "解包读取出错。"
    } else if (loaded_error === LoadPackedFromFileError.UnpackedFileMissing) {
      state.value = "解包后文件缺失。缺失以下文件\n\t" + loaded_error_info.join(", ")
    }
    return
  }

  const { encoded_buff, table: table_str } = loaded_data
  const table = JSON.parse(table_str)

  state.value = "解码中"

  const {
    status: decode_status,
    error: decode_error,
    info: decode_info,
    data: decode_data
  } = decode(encoded_buff, table)
  if (decode_status === "faild") {
    if (decode_error === DecodeError.CodeDoesNotExistInTheCodeTable) {
      return state.value = "解码出错。解码过程中出现了不存在于转换表上的编码，起始于：" + decode_info.bit_start
    }
    return
  }

  state.value = "解码完成"

  set_decode_output_file(create_object_url([decode_data]))
}

function set_decode_output_file(options: ReturnType<typeof create_object_url>) {
  decode_output_file_revoke()
  decode_output_file_revoke = options.revoke
  decode_output_file_url.value = options.url
}
</script>
 
<template lang="pug">
q-page.normal-page.w-full.flex.flex-col.gap-8.py-8.px-8.bg-neutral-100.cursor-default
  .flex.flex-col.gap-4.items-start
    .text-lg 模式
    q-btn-toggle(v-model="app_mode" :options="app_mode_options")
  .flex.flex-col.gap-4
    .text-lg 输入
    .flex.flex-col.gap-4(v-show="app_mode === 'encode'")
      .flex.flex-row.gap-2
        q-radio(v-model="encode_input_mode" val="text")
        Editor(
          class="min-h-[140px] min-w-[240px] h-[30vh] w-[75vw]"
          ref="encode_input_text_editor"
          init_theme="vs"
          @update:content="encode_input_text_content = $event"
          @update:click="encode_input_mode = 'text'"
        )
      .flex.flex-row.gap-2
        q-radio(v-model="encode_input_mode" val="file")
        q-file(v-model="encode_input_file_containner" label="源文件"
          @update:model-value="encode_input_mode = 'file'"
        )
        q-toggle(v-model="encode_input_file_read_as_text") 以文本（UTF-16）进行读取
      div.text-neutral-600 输入大小（文本视为UTF-16）：{{ get_encode_input_size() }} bit
    .flex.flex-col.gap-4.items-start(v-show="app_mode === 'decode'")
      q-file.w-64(v-model="decode_input_containner" label="压缩后文件" accept=".zip, *")
  .flex.flex-col.gap-4.items-start
    .text-lg 控制台
    .text-sm.text-neutral-600(v-show="state") 状态：{{ state }}
    .flex.flex-row.gap-4(v-show="app_mode === 'encode'")
      q-btn(icon="mdi-play" color="primary"
        @click="generate") 生成
      q-btn(icon="mdi-zip-box"
        @click="encode_and_pack") 压缩并打包

    .flex.flex-row.gap-4(v-show="app_mode === 'decode'")
      q-btn(icon="mdi-backburger" color="primary"
        :disable="!decode_input_containner"
        @click="unpack_and_decode") 解压
  .flex.flex-col.gap-4
    .text-lg 输出
    .flex.flex-row.gap-4(v-show="app_mode === 'encode'")
      .flex.flex-col.gap-4
        .flex.flex-col
          .text-base.text-neutral-600 编码转换表
          .text-sm.text-neutral-600 未压缩大小（UTF-16）：{{ code_conversion_table_content.length * 16 }} bit
          .text-sm.text-neutral-600 
        Editor(
          class="min-h-[140px] min-w-[240px] h-[30vh] w-[60vw]"
          ref="code_conversion_table_editor"
          init_theme="vs" init_language="json" :init_readonly="true"
          @update:content="code_conversion_table_content = $event"
          )
      .flex.flex-col.gap-8
        .flex.flex-col.gap-4
          .text-base.text-neutral-600 信息
          div 熵：{{ encode_entropy.toFixed(6) }} bit
          div 理论压缩比：{{ (encode_entropy / 16 * 100).toFixed(6) }} %
        .flex.flex-col.gap-4
          .text-base.text-neutral-600 压缩后文件
          div 压缩比：{{ ((encoded_file_size / get_encode_input_size()) * 100).toFixed(6) }} %
          div 打包后压缩比：{{ ((packed_file_size / get_encode_input_size()) * 100).toFixed(6) }} %
          q-btn(icon="mdi-download-box-outline" color="primary"
            @click="download_url(download_file_url, (encode_input_mode === 'text' ? Date.now() + '.txt' : encode_input_file_containner.name) + '.zip')")
    .flex.flex-row.gap-4(v-show="app_mode === 'decode'")
      q-btn(icon="mdi-download-box-outline" color="primary" @click="download_url(decode_output_file_url, decode_input_containner.name.replace(/\..*$/, ''))")
</template>

<style>

</style>