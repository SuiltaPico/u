<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import * as echarts from "echarts";

import Card from "../components/Card.vue";
import type { BuiltinRange } from "../lib/sequence/Range";
import { not_null } from "../lib/utils";
import { randomInt, max } from "mathjs";

const file = ref<File | null | undefined>();

const file_range = ref({
  start: 0,
  length: 50,
});

function file_range_length_update(len: number) {
  const start_max =
    (file_data_buffer.value ?? { length: 1000 }).length -
    file_range.value.length ** 2;
  if (file_range.value.start > start_max) {
    file_range.value.start = start_max;
  }
}

const update_file = async (f: File | null | undefined) => {
  file.value = f;
  if (!f) return;

  generate_btn_loading.value = true;
  file_data_buffer.value = new Uint8Array(await f.arrayBuffer());
  generate_btn_loading.value = false;
};

const file_data_buffer = ref<Uint8Array>();
const generate_btn_disable = computed(() => !file.value);
const generate_btn_loading = ref(false);

function generate_charts_data(data: Uint8Array) {
  generate_btn_loading.value = true;

  const new_data = data.slice(
    file_range.value.start,
    file_range.value.start + file_range.value.length ** 2
  );

  console.log(new_data);

  function split(v: number, buffer_len: number) {
    const result = new Array(buffer_len).fill(0, 0, buffer_len);
    for (let i = 0; i < buffer_len; i++) {
      result[i] = v % 2;
      v >>= 1;
    }
    return result;
  }

  function byte_array_to_number(ba: number[]) {
    let result = 0;
    for (let i = 0; i < ba.length; i++) {
      result += ba[i] ? 2 ** i : 0;
    }
    return result;
  }

  function count(
    u8: number,
    // 2
    window_size: number,
    counter: number[],
    last?: number
  ) {
    if (last) {
      // u8 = [last: 8, u8: 8]
      u8 = last * 2 ** 8 + u8;
      // 从 last 末尾截取 window_size - 1 位
      for (let ci = 0; ci < 8; ci++)
        counter[(u8 >> ci) & (2 ** window_size - 1)]++;
    } else {
      for (let ci = 0; ci < 8 - window_size; ci++)
        counter[(u8 >> ci) & (2 ** window_size - 1)]++;
    }
  }

  function count_x(
    u8: number,
    window_size: number,
    counter: number[],
    u8_last: number[]
  ) {
    // u8 = [last: ..., u8: 8]
    u8 = u8_last.reduce((p, c) => p * 256 + c) * 256 + u8;
    // 从 last 末尾截取 window_size - 1 位
    for (let ci = 0; ci < 8; ci++)
      counter[(u8 >> ci) & (2 ** window_size - 1)]++;
  }

  const echarts_datas: { value: number; name: string }[][] = Array(
    _tasks.length
  );
  for (let i = 0; i < echarts_datas.length; i++) {
    echarts_datas[i] = [];
  }

  for (let ti = 0; ti < _tasks.length; ti++) {
    const t = _tasks[ti];

    console.time("task" + t.length);

    const len = 2 ** t.length;
    const counter: number[] = Array(len).fill(0, 0, len);

    if (t.length === 1) {
      let one_counter = 0;
      for (let di = 0; di < new_data.length; di++) {
        const a = data[di];
        const c = ((a >> 0) & 0b01_01_01_01) + ((a >> 1) & 0b01_01_01_01);
        const e = ((c >> 0) & 0b0011_0011) + ((c >> 2) & 0b0011_0011);
        one_counter += ((e >> 0) & 0b00001111) + ((e >> 4) & 0b00001111);
      }
      counter[0] = new_data.length * 8 - one_counter;
      counter[1] = one_counter;
    } else if (t.length <= 8) {
      for (let di = 0; di < new_data.length; di++) {
        count(new_data[di], t.length, counter, new_data[di - 1]);
      }
    } else {
      for (let di = 0; di < new_data.length; di++) {
        const arr = (() => {
          const x = Math.ceil(Math.log2(t.length)) - 2;
          const arr: number[] = Array(x).fill(0, 0, x);
          for (let i = 0; i < x; i++) {
            arr[x - i - 1] = new_data[di - i - 1] ?? 0;
          }
          return arr;
        })();
        if (di === 0 || di === 20) console.log(arr);

        count_x(new_data[di], t.length, counter, arr);
      }
    }
    // } else if (t.length === 2) {
    //   for (let di = 0; di < data.length; di++) {
    //     const buf = split(data[di], 8);
    //     for (let i = 0; i < 8 - 1; i++) {
    //       counter[byte_array_to_number(buf.slice(i, i + 2))]++;
    //     }
    //   }
    // }

    const ed = echarts_datas[ti];
    const ed_max: number = max(counter);
    const average = (new_data.length * 8) / counter.length;
    if (_tasks[ti].length > 8) {
      const cc = counter.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
      console.log(cc);
      cc.slice(0, 314)
        .sort((a, b) => b.i - a.i)
        .forEach((c) => {
          ed.push({
            name: c.i
              .toString(2)
              .split("")
              .toString()
              .padStart(t.length * 2 - 1, "0,"),
            value: c.v,
          });
        });
    } else {
      for (let i = 0; i < counter.length; i++) {
        const c = counter[i];
        ed.push({
          name: i
            .toString(2)
            .split("")
            .toString()
            .padStart(t.length * 2 - 1, "0,"),
          value: c,
        });
      }
    }

    (echarts_option.series as echarts.SeriesOption[])[0].data = ed;
    (
      (
        echarts_option.series as echarts.SeriesOption[]
      )[1] as echarts.PieSeriesOption
    ).radius = [
      40 + Math.floor((average / ed_max) * 30) + "%",
      40 + Math.floor((average / ed_max) * 30) + 0.5 + "%",
    ];
    // console.log(echarts_option, average, ed_max);

    charts[ti].setOption(echarts_option);

    console.timeEnd("task" + t.length);
  }
  generate_btn_loading.value = false;
}

const _tasks = reactive([
  {
    length: 1,
  },
  {
    length: 2,
  },
  {
    length: 3,
  },
  {
    length: 4,
  },
  {
    length: 5,
  },
  {
    length: 6,
  },
  {
    length: 7,
  },
  {
    length: 8,
  },
  {
    length: 12,
  },
]);

const echarts_option: echarts.EChartsOption = {
  tooltip: {
    trigger: "item",
  },
  // legend: {
  //   top: "0%",
  //   left: "center",
  // },
  series: [
    {
      name: "Access From",
      type: "pie",
      radius: ["40%", "70%"],
      avoidLabelOverlap: false,
      roseType: "radius",
      tooltip: {
        trigger: "item",
        formatter: "{b} {d}%",
      },
      itemStyle: {
        borderRadius: 10,
        borderColor: "#fff",
        borderWidth: 2,
      },
      label: {
        show: false,
        position: "center",
      },
      emphasis: {
        label: {
          show: true,
          fontSize: "26",
          fontWeight: "bold",
        },
      },
      labelLine: {
        show: false,
      },
      data: [],
    },
    {
      name: "line",
      type: "pie",
      radius: ["40%", "41%"],
      data: [{ value: 1, name: " " }],
      tooltip: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      //color: ["#888"]
    },
  ],
};

const charts: echarts.ECharts[] = [];

onMounted(() => {
  for (const t of _tasks) {
    const chart = echarts.init(
      document.getElementById("slide_window_" + t.length)!
    );
    chart.setOption(echarts_option);
    charts.push(chart);
  }
});
</script>

<template lang="pug">
q-page.normal_mage(class="md:min-w-[70%] md:max-w-[70%]")
  .flex.flex-col.gap-2
    .flex.flex-row.gap-4.items-center
      q-file.grow(outlined :model-value="file" @update:model-value="update_file" label="文件" bottom-slots)
        template(#prepend)
          q-icon(name="mdi-file")
        template(#hint)
          div 文件大小： {{ file_data_buffer?.length }}
      //- q-input.w-36(label="字节/采样" outlined :model-value="byte_per_sample" @update:model-value="byte_per_sample = Number($event)")
      q-slider(v-model="file_range.start" :min="0" :max="(file_data_buffer ?? {length: 1000}).length - file_range.length ** 2")
      q-slider(v-model="file_range.length" @update:model-value="file_range_length_update" :min="0" :max="Math.sqrt((file_data_buffer ?? {length: 1000}).length)")
      q-btn(icon="mdi-poll" color="primary" round padding=".8rem"
        :disable="generate_btn_disable" :loading="generate_btn_loading"
        @click="generate_charts_data(not_null(file_data_buffer))")

    .flex.flex-row.gap-2
      .text-sm 起始点：第 {{ file_range.start }} 字节
      .text-sm 待处理数据大小：{{ file_range.length ** 2 }} 字节

  .flex.flex-col.gap-4
    .text-base 分析任务
    //.flex.flex-row.gap-4
      q-btn(icon="mdi-plus")
      q-btn(icon="mdi-delete")
    //.flex.flex-row.gap-2
      .flex.flex-col.gap-4.overflow-y-auto(class="max-h-[50vh]")
        Card(v-for="task in tasks")
    
    .flex.flex-row.gap-2.justify-center
      .flex.flex-col.gap-2(v-for="t in _tasks")
        .text-base 滑动窗口 {{ t.length }} {{ t.length > 8 ? "（前314个）": "" }}
        div.w-96.h-96(:id="'slide_window_' + t.length" :class="{'min-w-[50vw]': t.length >= 7, 'min-h-[50vw]': t.length >= 7}")

  .flex.flex-row.gap-2
    div 灵感来自：
    a(href="https://calmcode.io/blog/inverse-turing-test.html") https://calmcode.io/blog/inverse-turing-test.html
</template>
