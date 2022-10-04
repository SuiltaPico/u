<script setup lang="ts">
import { createFFmpeg } from "@ffmpeg/ffmpeg";
import { onMounted, ref, watch } from "vue";
import type { KeyOfArray } from "../lib/types";

const resampling_methods_options = [
  {
    label: "最近点插值",
    value: "point",
    desc: "质量最低，默认不使用LPF，速度最快。",
    LPF: false,
  },
  {
    label: "线性插值",
    value: "linear",
    desc: "质量较低，默认不使用LPF，速度较快。",
    LPF: false,
  },
  { label: "三次插值", value: "cubic", desc: "默认使用 LPF。", LPF: true },
  {
    label: "窗口化 sinc 插值",
    value: "sinc",
    desc: "默认使用 LPF，速度最慢。",
    LPF: false,
  },
] as const;
type ResamplingMethod = KeyOfArray<typeof resampling_methods_options>["value"];

const LPF_types_option = [
  {
    label: "IIR（无限脉冲响应）",
    value: "IIR",
    desc: "幅频特性精度高，相位非线性，应用于对相位信息不敏感的音频信号。",
  },
  {
    label: "FIR（有限脉冲响应）",
    value: "FIR",
    desc: "幅频特性精度比IIR数字滤波器低，但是相位是线性的，即不同频率成分的信号经过FIR滤波器后的时间差保持不变，应用与对相位精度要求高的信号。",
  },
] as const;

type LPFType = KeyOfArray<typeof LPF_types_option>["value"];

const loading = ref(false);

const ffmpeg = createFFmpeg({
  progress: ({ ratio }) => {
    console.log(ratio);
  },
});

const using_ffmpeg = ref(false);
watch(using_ffmpeg, () => {
  if (using_ffmpeg.value) {
    loading.value = true;
    ffmpeg.load().finally(() => {
      loading.value = false;
    });
  } else {
    ffmpeg.exit();
  }
});

const file = ref<File | undefined>();
function update_wav_file(file?: File) {}
function update_ffmpeg_file(file?: File) {}

const curr_sample_rate = ref<number | undefined>();

const target_sample_rate = ref(44100);
const target_resampling_methods = ref<ResamplingMethod>("cubic");
const target_using_LPF = ref(false);
const target_LPF_type = ref<LPFType>("FIR");
const target_LPF_order = ref();
const target_to_original_format = ref(true);
</script>

<template lang="pug">
q-page.flex.flex-col.px-4.py-8.gap-6.w-full.max-w-3xl
  .flex.flex-col.gap-4 输入
    div
      q-toggle(v-model="using_ffmpeg") 兼容其他格式 （.mp3 等）
        q-tooltip
          .text-sm 如果启用该选项，将在您的浏览器中加载 ffmpeg.wasm，大约消耗 8MB 的流量。
    div(v-if="!using_ffmpeg")
      q-file(:model-value="file" @update:model-value="update_wav_file" label=".wav 文件" outlined accept=".wav, */*")
        template(#prepend)
          q-icon(name="mdi-file")
  
    div(v-else)

  .flex.flex-col.gap-4 重采样选项
    .grid.flex-row.gap-x-4.grid-cols-2
      q-input(v-model="target_sample_rate" label="目标采样率" outlined)
        template(#hint v-if="curr_sample_rate !== undefined")
          div 当前采样率：{{ curr_sample_rate }}
      q-select(v-model="target_resampling_methods" label="重采样方法" :options="resampling_methods_options" outlined)
        template(v-slot:option="scope")
          q-item(v-bind="scope.itemProps" clickable="")
            q-item-section
              q-item-label {{ scope.opt.label }}
              q-item-label(caption) {{ scope.opt.desc }}
    .grid.grid-cols-3.gap-x-4
      q-toggle(v-model="target_using_LPF") 使用 LPF（低通滤波）
      q-select(v-model="target_LPF_type" label="LPF 类型" outlined :disable="!target_using_LPF")
      q-input(v-model="target_LPF_order" label="LPF 阶数" outlined :disable="!target_using_LPF")

  .flex.flex-col.gap-6 生成
    .flex.flex-row.gap-2.gap-y-4
      q-btn(label="生成" icon="mdi-swap-horizontal" color="primary" outline)
      q-toggle(v-model="target_to_original_format" label="转换为原格式")
        q-tooltip
          .text-sm 如果关闭，则生成 wav 格式。如果开启，根据原格式的不同可能会导致数据丢失。
      q-linear-progress
    .flex.flex-row.gap-3.items-center
      audio.grow.rounded(controls)
      q-btn(icon="mdi-download" flat padding=".8rem 1rem")
        q-tooltip 下载
    

  q-inner-loading(:showing="loading")
</template>
