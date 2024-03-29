<script setup lang="ts">
import { createFFmpeg } from "@ffmpeg/ffmpeg";
import { onMounted, reactive, ref, toRef, watch } from "vue";
import type { Ref } from "vue";
import { WaveFile } from "wavefile";
import { defineStore } from "pinia";

import type { ItemsOfArray } from "../lib/common/types_utils";
import { create_object_url, download_url, as } from "../lib/utils";
import StorePropertyRef from "../lib/store_property_ref";
import Card from "../components/Card.vue";

const resampling_methods_options = [
  {
    label: "最近点插值",
    value: "point",
    desc: "质量最低，速度最快。",
    LPF: false,
  },
  {
    label: "线性插值",
    value: "linear",
    desc: "质量较低，速度较快。",
    LPF: false,
  },
  {
    label: "三次插值",
    value: "cubic",
    desc: "质量较高，速度较慢。",
    LPF: true,
  },
  {
    label: "带窗 sinc 插值",
    value: "sinc",
    desc: "质量较高，速度最慢。",
    LPF: false,
  },
] as const;
type ResamplingMethod = ItemsOfArray<typeof resampling_methods_options>;

const LPF_types_options = [
  {
    label: "IIR（无限脉冲响应）",
    value: "IIR",
    desc: "幅频特性精度高，相位非线性，应用于对相位信息不敏感的音频信号。",
  },
  {
    label: "FIR（有限脉冲响应）",
    value: "FIR",
    desc: "幅频特性精度比IIR低，相位线性，应用与对相位精度要求高的信号。",
  },
] as const;

type LPFType = ItemsOfArray<typeof LPF_types_options>;

const default_store_options = {
  using_ffmpeg: false,
  using_no_cdn_ffmpeg: false,
  target_sample_rate: 44100,
  target_resampling_methods: resampling_methods_options[2] as ResamplingMethod,
  target_using_LPF: false,
  target_LPF_type: LPF_types_options[1] as LPFType,
  target_LPF_order: 20,
  target_keep_original_format: true,
  target_convert_to_high_bit_depth: false,
  target_keep_high_bit_depth: false,
  original_file_perview: false,
};

const store = defineStore("change_sample_rate", () => {
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

function reset_all_options() {
  localStorage.removeItem(store.$id);
  Object.entries(default_store_options).forEach(([key, value]) => {
    /** @ts-ignore */
    store[key] = value;
  });
}

if (localStorage.getItem(store.$id)) {
  Object.entries(JSON.parse(localStorage.getItem(store.$id)!)).forEach(
    ([key, value]) => {
      /** @ts-ignore */
      store[key] = value;
    }
  );
}

const ffmpeg_logs = reactive<
  {
    type: string;
    message: string;
    date: number;
  }[]
>([]);
const ffmpeg_log_dialog_showing = ref(false);

const loading = ref(false);
const progress_value = ref(0);
const progress_task_name = ref("");
const progress_description = ref("");

const ffmpeg = createFFmpeg({
  progress: ({ ratio }) => {
    progress_value.value = ratio;
    console.log("ffmpeg progress", ratio);
  },
});

// @ts-ignore
window["ffmpeg"] = ffmpeg;
ffmpeg.setLogger((log) => {
  const format_match = /Input #0, ([^\,]+), from /;
  const match_result = log.message.match(format_match);
  ffmpeg_logs.push({
    ...log,
    date: Date.now(),
  });

  if (!match_result) return;

  if (match_result[1]) {
    original_format.value = match_result[1];
  } else {
    original_format.value = "";
  }
});
const loading_ffmpeg = ref(false);
const ffmpeg_loaded = ref(false);

const using_ffmpeg = new StorePropertyRef(store, "using_ffmpeg").ref();
change_using_ffmpeg(using_ffmpeg.value);
function change_using_ffmpeg(value: boolean) {
  using_ffmpeg.value = value;

  if (value) {
    loading_ffmpeg.value = true;
    ffmpeg
      .load()
      .then(() => {
        ffmpeg_loaded.value = true;
      })
      .catch((err) => {
        show_warning_dialog(
          "发生了错误",
          "可能是网络错误，或者是你的浏览器不支持 ffmpeg.wasm。具体报错信息如下：" +
            String(err)
        );
        using_ffmpeg.value = false;
      })
      .finally(() => {
        loading_ffmpeg.value = false;
      });
  } else {
    if (!ffmpeg_loaded.value) return;
    ffmpeg_loaded.value = false;
    try {
      ffmpeg.exit();
    } catch (e) {}
  }
}

const file = ref<File | undefined>();
async function update_wav_file(f?: File) {
  file.value = f;
  if (!f) return;
  progress_task_name.value = "读取 wav 文件";
  progress_value.value = 0;

  const new_wav_file = new WaveFile(new Uint8Array(await f.arrayBuffer()));
  curr_bit_depth.value = new_wav_file.bitDepth;

  if (target_convert_to_high_bit_depth.value) {
    new_wav_file.toBitDepth("32f");
  }

  curr_sample_rate.value = (new_wav_file.fmt as any).sampleRate;

  wav_file.value = new_wav_file;

  const { url, revoke } = create_object_url([new_wav_file.toBuffer()]);
  original_file_url.value = url;
  original_file_url_revoke.value ? original_file_url_revoke.value() : undefined;
  original_file_url_revoke.value = revoke;

  progress_task_name.value = "";
  progress_value.value = 1;
}
async function update_ffmpeg_file(f?: File) {
  file.value = f;
  if (!f) return;

  wav_file.value = undefined;

  ffmpeg.FS("writeFile", f.name, new Uint8Array(await f.arrayBuffer()));

  const result_name = "result.wav";
  await ffmpeg.run(
    "-i",
    f.name,
    //...(target_convert_to_high_bit_depth.value ? ["-sample_fmt", "fltp"] : [""]),
    result_name
  );

  try {
    const new_wav_file = new WaveFile(ffmpeg.FS("readFile", result_name));
    curr_bit_depth.value = new_wav_file.bitDepth;

    if (target_convert_to_high_bit_depth.value) {
      new_wav_file.toBitDepth("32f");
    }
    curr_sample_rate.value = (new_wav_file.fmt as any).sampleRate;
    wav_file.value = new_wav_file;
    const { url, revoke } = create_object_url([new_wav_file.toBuffer()]);
    original_file_url.value = url;
    original_file_url_revoke.value
      ? original_file_url_revoke.value()
      : undefined;
    original_file_url_revoke.value = revoke;
  } catch (err) {
    show_warning_dialog(
      "发生了错误",
      "在尝试将文件转换为WAV格式时发生了错误，可能是 ffmpeg.wasm 不支持该格式。详情请查看 ffmpeg 日志。"
    );
  }
}

const original_format = ref("wav");

const wav_file = ref<WaveFile | undefined>();

const curr_sample_rate = ref<number | undefined>();
const curr_bit_depth = ref<string>("");

const using_no_cdn_ffmpeg = toRef(store, "using_no_cdn_ffmpeg");

const target_sample_rate = toRef(store, "target_sample_rate");
const target_resampling_methods = toRef(store, "target_resampling_methods");
const target_using_LPF = toRef(store, "target_using_LPF");
const target_LPF_type = toRef(store, "target_LPF_type");
const target_LPF_order = toRef(store, "target_LPF_order");
const target_keep_original_format = toRef(store, "target_keep_original_format");

const target_convert_to_high_bit_depth = toRef(
  store,
  "target_convert_to_high_bit_depth"
);
const target_keep_high_bit_depth = toRef(
  store,
  "target_keep_high_bit_depth"
);

const result_url = ref("");
const result_url_revoke = ref<(() => void) | undefined>();
const original_file_perview = toRef(
  store,
  "original_file_perview"
);
const original_file_url = ref("");
const original_file_url_revoke = ref<(() => void) | undefined>();
function generate() {
  const wf = wav_file.value;
  if (!wf) return;

  loading.value = true;
  progress_description.value =
    "正在转换，请耐心等待。预估时间：" +
    (
      (wf.chunkSize / 300000000) *
      (target_using_LPF.value ? 2 : 1) *
      (target_resampling_methods.value.value === "sinc" ? 2 : 1) *
      Math.log(target_sample_rate.value / 10000 + Math.E)
    ).toFixed(2) +
    "分钟";

  if (result_url_revoke.value) {
    result_url_revoke.value();
  }

  setTimeout(() => {
    console.time("转换");
    const temp = new WaveFile();

    temp.fromBuffer(wf.toBuffer());
    temp.toSampleRate(target_sample_rate.value, {
      method: target_resampling_methods.value.value,
      LPF: target_using_LPF.value,
      LPFType: target_LPF_type.value.value,
      LPFOrder: target_LPF_order.value,
    });

    if (
      target_convert_to_high_bit_depth.value &&
      !target_keep_high_bit_depth.value
    ) {
      temp.toBitDepth(curr_bit_depth.value);
    }

    const { url, revoke } = create_object_url([temp.toBuffer()], {
      type: "audio/wav",
    });
    result_url.value = url;
    result_url_revoke.value = revoke;

    loading.value = false;
    progress_description.value = "";
    console.timeEnd("转换");
  }, 800);
}

async function download() {
  let file_name = "result";
  let url = result_url.value;

  if (!using_ffmpeg.value || !target_keep_original_format.value) {
    file_name += ".wav";
  } else {
    file_name += "." + original_format.value;
  }

  if (using_ffmpeg.value && target_keep_original_format.value) {
    const input_file_name = "input.wav";
    ffmpeg.FS(
      "writeFile",
      input_file_name,
      new Uint8Array(await (await fetch(result_url.value)).arrayBuffer())
    );
    location.hash = "progress-bar";
    try {
      await ffmpeg.run("-i", input_file_name, file_name);
    } catch (err) {
      show_warning_dialog(
        "发生了错误",
        "可能是 ffmpeg.wasm 不支持转换回该格式。具体报错信息如下：" +
          String(err)
      );
    }
    const result_buffer = ffmpeg.FS("readFile", file_name);
    const { url, revoke } = create_object_url([result_buffer]);
    download_url(url, file_name);
    revoke();
    return;
  }

  download_url(url, file_name);
}

const warning_dialog_showing = ref(false);
const warning_dialog_title = ref("");
const warning_dialog_content = ref("");

function show_warning_dialog(title: string, content: string) {
  warning_dialog_showing.value = true;
  warning_dialog_title.value = title;
  warning_dialog_content.value = content;
}
</script>

<template lang="pug">
q-page.flex.flex-col.gap-8.w-full.max-w-4xl.bg-neutral-100(
  class="px-2 py-4 md:px-4 md:py-8 lg:px-8 lg:py-8 page"
)
  .flex.flex-col.gap-4(v-if="ffmpeg_loaded")
    .text-lg#progress-bar.section-title 进度
    q-linear-progress(:value="progress_value" animation-speed="200")

  .flex.flex-col.gap-4
    .text-lg 输入
    .flex.flex-row.gap-4
      q-toggle(:model-value="using_ffmpeg" @update:model-value="change_using_ffmpeg($event)") 兼容其他格式 （.mp3 等）
        q-tooltip.text-sm(v-if="!using_ffmpeg" :hide-delay="650" max-width="20rem")
          q-icon.pr-2(name="mdi-alert")
          | 如果启用该选项，将在您的浏览器中加载 ffmpeg.wasm，大约消耗 
          span.text-blue-300 8~24MB
          |  的流量。
      .flex.flex-row.items-center.gap-2.flex-auto(v-if="loading_ffmpeg")
        q-spinner(color="primary")
        div 正在加载 ffmpeg.wasm ...
      q-space
      q-btn(icon="mdi-console" flat color="secondary"
        @click="ffmpeg_log_dialog_showing = true" v-if="using_ffmpeg"
        )
        q-tooltip(:hide-delay="650") ffmpeg.wasm 调试日志
    div(v-if="!using_ffmpeg")
      q-file(:model-value="file" @update:model-value="update_wav_file" label=".wav 文件" outlined accept=".wav, */*" autofocus)
        template(#prepend)
          q-icon(name="mdi-file")
    div(v-else)
      q-file(:model-value="file" @update:model-value="update_ffmpeg_file" label="文件" outlined accept="*/*" autofocus bottom-slots :error="!original_format" :disable="loading_ffmpeg")
        template(#prepend)
          q-icon(name="mdi-file")
        template(#hint)
          div 格式：{{ original_format ? original_format : "不支持的格式" }}
    .text-gray-500.text-xs 当前位深度：{{ curr_bit_depth ? curr_bit_depth : "未知" }}
  .flex.flex-col.gap-4
    .text-lg 重采样选项
    .flex.flex-row.gap-4.flex-wrap
      q-toggle.min-w-4(v-model="target_convert_to_high_bit_depth") 重采样时转换为高(32f)位深度
        q-tooltip.text-sm(max-width="20rem")
          div 在文件读取完成后会进行重采样，可能会发生卡顿。如果未开启“保留高位深度”选项，在下载之前也会发生卡顿现象。
      q-toggle.min-w-4(v-model="target_keep_high_bit_depth" :disable="!target_convert_to_high_bit_depth") 保留高位深度
        q-tooltip.text-sm
            div 关闭会阻止转换回原位深度，使结果生成地更快一些。
    .flex.flex-row.gap-4.flex-wrap
      q-input.flex-auto(v-model="target_sample_rate" label="目标采样率" outlined :bottom-slots="!!curr_sample_rate")
        template(#hint)
          div 当前采样率：{{ curr_sample_rate }}
      q-select.flex-auto(v-model="target_resampling_methods" label="重采样方法" :options="resampling_methods_options" outlined)
        template(v-slot:option="scope")
          q-item(v-bind="scope.itemProps" clickable)
            q-item-section
              q-item-label {{ scope.opt.label }}
              q-item-label(caption) {{ scope.opt.desc }}
    .flex.flex-row.gap-4.flex-wrap
      q-toggle.min-w-4(v-model="target_using_LPF") 使用 LPF（低通滤波）
      q-select.flex-auto.min-w-4(v-model="target_LPF_type" :options="LPF_types_options" label="LPF 类型" outlined :disable="!target_using_LPF")
        template(v-slot:option="scope")
          q-item.max-w-xl(v-bind="scope.itemProps" clickable)
            q-item-section
              q-item-label {{ scope.opt.label }}
              q-item-label(caption) {{ scope.opt.desc }}
      q-input.flex-auto.min-w-4(v-model="target_LPF_order" label="LPF 阶数" outlined :disable="!target_using_LPF")

  .flex.flex-col.gap-6
    .text-lg 生成
    .flex.flex-row.gap-2.gap-y-4
      q-btn(label="生成" icon="mdi-swap-horizontal" color="primary" outline @click="generate" :disable="!wav_file")
      q-toggle(v-model="target_keep_original_format" label="转换回原格式" v-if="using_ffmpeg")
        q-tooltip(:hide-delay="650" max-width="20rem")
          .text-sm 如果关闭，则生成 wav 格式。如果开启，根据原格式的不同可能会导致数据丢失。
      q-toggle(v-model="original_file_perview" label="原文件预览")
    .flex.flex-row.gap-3.items-center(v-if="target_convert_to_high_bit_depth && target_keep_high_bit_depth")
      q-icon(name="mdi-alert" size="1.2rem") 
      div 浏览器可能无法支持高精度的预览，如果播放器没有结果请直接下载。
    .flex.flex-row.gap-3.items-center(v-if="original_file_perview")
      div 原文件：
        q-tooltip(v-if="using_ffmpeg") 这里是原文件转换为wav后的文件
      audio.grow.rounded(controls :src="original_file_url")
    .flex.flex-row.gap-3.items-center
      q-btn(icon="mdi-download" flat padding=".8rem 1rem" @click="download" :disable="result_url.length === 0")
        q-tooltip 下载
      audio.grow.rounded(controls :src="result_url")
    
  q-inner-loading(:showing="loading")
    q-spinner(size="3rem" color="primary")
    div {{ progress_description }}

  q-dialog(v-model="ffmpeg_log_dialog_showing")
    q-card.overflow-hidden(style="min-width: 20rem; max-width: 80vw;")
      q-card-actions.p-4(align="left")
        q-btn(icon="mdi-broom" color="primary" round flat @click="ffmpeg_logs.splice(0, ffmpeg_logs.length)")
        //q-btn(icon="mdi-content-copy" round flat @click="")
        q-space
        q-btn(icon="mdi-close" round flat color="negative" @click="ffmpeg_log_dialog_showing = false")
      q-separator
      q-card-section.overflow-auto(style="max-width: 100%; max-height: 80vh;")
        #logs.flex.flex-row.items-center.gap-1.flex-nowrap(
          v-for="log in ffmpeg_logs"
          :class="{'text-blue-800': log.type === 'info', 'text-green-700': log.type === 'ffout'}"
        )
          .whitespace-nowrap(
            v-if="log.type !== 'fferr'"
          ) [ {{ log.type }} ] {{ new Date(log.date).toLocaleTimeString() }}
          pre.text-sm {{ log.message }}

  q-dialog(v-model="warning_dialog_showing")
    q-card(style="min-width: 20rem;")
      q-card-section.flex.flex-row.gap-2
        q-icon(name="mdi-alert" size="1.5rem")
        div {{ warning_dialog_title }}
      q-card-section
        | {{ warning_dialog_content }}
      q-card-actions(align="right")
        q-btn(color="primary" outline @click="warning_dialog_showing = false") 确认

  teleport(to="#left-bar-teleport-anchor")
    .flex.flex-col.px-4.mt-4
      Card(@click="reset_all_options()")
        .flex.flex-row.items-center.gap-2
          q-icon(name="mdi-restore" size="1.4rem")
          div 重置当前页面所有设置
</template>

<style>
audio:active,
audio:focus {
  outline: none;
  border: none;
}
</style>