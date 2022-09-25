<script setup lang="ts">
import { computed, ref } from "vue";
import katex from "katex";
import "katex/dist/katex.css";
import { create, all, re } from "mathjs";
import * as math from "mathjs";
import type { Matrix, Fraction } from "mathjs";
import Editor from "../components/Editor.vue";

const editor = ref<any>();

const mathjs = create(all);
mathjs.config({
  number: "Fraction",
});

function katex_render(src: string) {
  return katex.renderToString(src, {
    output: "html",
  });
}

function render_fraction(value: Fraction) {
  let sign: string = "";
  if (value.s === -1) {
    sign = "-";
  }
  if (value.d === 1) {
    return sign + value.n;
  }
  return sign + value.n + "/" + value.d;
}

function render_matrix(matrix: Matrix) {
  let result_string = "";
  result_string += "\\begin{bmatrix}";
  const size = matrix.size();
  for (let i = 0; i < size[0]; i++) {
    for (let j = 0; j < size[1]; j++) {
      const value = matrix.get([i, j]);
      if (mathjs.isFraction(value)) {
        result_string += render_fraction(value);
      } else {
        result_string += value;
      }
      if (j < size[1] - 1) {
        result_string += " & ";
      }
    }
    if (i < size[0] - 1) {
      result_string += "\\\\";
    }
  }
  result_string += "\\end{bmatrix}";
  return katex_render(result_string);
}

function matrix_row_foreach(
  fn: (value: math.MathType, index: number[]) => void,
  matrix: Matrix,
  col: number
) {
  const size = matrix.size();
  for (let r = 0; r < size[1]; r++) {
    const curr_value_index = [col, r];
    const value = matrix.get(curr_value_index);
    fn(value, curr_value_index);
  }
}

function matrix_row_map(
  fn: (value: math.MathType, index: number[]) => math.MathType,
  matrix: Matrix,
  col: number
) {
  const size = matrix.size();
  for (let row = 0; row < size[1]; row++) {
    const curr_value_index = [col, row];
    const value = matrix.get(curr_value_index);
    matrix.set(curr_value_index, fn(value, curr_value_index));
  }
}

function matrix_row_map_reverse(
  fn: (value: math.MathType, index: number[]) => math.MathType,
  matrix: Matrix,
  col: number
) {
  const size = matrix.size();
  for (let row = size[1] - 1; row >= 0; row++) {
    const curr_value_index = [col, row];
    const value = matrix.get(curr_value_index);
    matrix.set(curr_value_index, fn(value, curr_value_index));
  }
}

// const operaters = ["add", "subtract", "multiply", "divide"] as const;
// type KeyofArray<T> = T extends readonly (infer K)[] ? K : never;

type NoneOperationType = "none";
type ReplaceOperationType = "replace";
type RowColumnMultScalarOperationType = "RowColumnMultScalarOperation";
type TwoRowColumnAddOperationType = "TwoRowColumnAddOperation";
type OperationType =
  | NoneOperationType
  | ReplaceOperationType
  | RowColumnMultScalarOperationType
  | TwoRowColumnAddOperationType;

interface BaseOperation {
  type: OperationType;
}

interface NoneOperation extends BaseOperation {
  type: NoneOperationType;
}

interface RowColumn {
  row: boolean;
}

interface RowColumnTransformationOperation extends BaseOperation, RowColumn {
  index: number;
}

interface RowColumnMultScalarOperation
  extends RowColumnTransformationOperation {
  type: "RowColumnMultScalarOperation";
  scalar: math.MathNumericType;
}

/** 双行/列的变换操作 */
interface TwoRowColumnTransformationOperation extends BaseOperation, RowColumn {
  /** `true` 为行操作，`false` 为列操作。 */
  src: number;
  target: number;
}

interface ReplaceOperation extends TwoRowColumnTransformationOperation {
  type: ReplaceOperationType;
}

interface TwoRowColumnAddOperation extends TwoRowColumnTransformationOperation {
  type: TwoRowColumnAddOperationType;
  src_multiple: math.MathNumericType;
}

type Operation =
  | NoneOperation
  | ReplaceOperation
  | RowColumnMultScalarOperation
  | TwoRowColumnAddOperation;

function render_TwoRowColumnAddOperation(op: TwoRowColumnAddOperation) {
  let str = "\\xlongequal{R" + op.target;
  const sign = mathjs.sign(op.src_multiple as any);

  if (sign === 0) {
    return "\\xlongequal{}";
  }
  str += sign === 1 ? "+" : "-";

  const unsigned_multple = mathjs.abs(op.src_multiple as any)
  if (!mathjs.equal(unsigned_multple, 1)) {
    if (mathjs.isFraction(unsigned_multple)) {
      str += render_fraction(unsigned_multple);
    } else {
      str += unsigned_multple;
    }
  }
  str += "R" + op.src + "}";
  console.log(str);
  
  return katex_render(str);
}

const NoneOperation: NoneOperation = { type: "none" };

type Step = {
  operation: Operation;
  matrix: Matrix;
};

function find_pivot_row_index(matrix: Matrix, col: number) {
  const col_matrix: math.MathType = mathjs.column(matrix, col);
  let max = 0;
  let max_index = -1;
  if (mathjs.isMatrix(col_matrix)) {
    col_matrix.forEach((v, i) => {
      if (mathjs.equal(math.compare(mathjs.abs(v), mathjs.abs(max)), 1)) {
        max = v;
        max_index = (i as any as number[])[0];
      }
    });
    if (mathjs.equal(max, 0)) return false;
    return max_index;
  }
  if (mathjs.equal(max, 0)) return false;
  return 0;
}

function fix_pivot(matrix: Matrix, col: number) {
  const pivot_row_index = find_pivot_row_index(matrix, col);
  // console.log("fix_pivot, index", pivot_row_index);
  if (pivot_row_index === false) return false;
  else if (pivot_row_index !== col) {
    matrix.swapRows(pivot_row_index, col);
  }
  return pivot_row_index;
}

function matrix_eliminate(matrix: Matrix) {
  const size = matrix.size();
  const steps: Step[] = [];

  function push<T extends Operation>(operation: T) {
    steps.push({
      matrix: curr_matrix,
      operation,
    });
    curr_matrix = curr_matrix.clone();
  }

  let curr_matrix = matrix.clone();

  // 移动主元到 col 行
  const fix_result = fix_pivot(curr_matrix, 0);
  if (fix_result !== 0 && fix_result !== false) {
    push({
      type: "replace",
      row: true,
      src: 0,
      target: fix_result,
    });
  }

  // 最靠右的主元位置
  let pivot_find_end_col = 0;

  // 逐列寻找主元和进行消除
  for (
    let col = 0, pivot_row = 0;
    col < size[1] && pivot_row < size[0];
    col++, pivot_row++
  ) {
    // console.log([pivot_row, col]);

    const pivot = curr_matrix.get([pivot_row, col]);
    if (mathjs.equal(pivot, 0)) {
      // 保持 pivot_col 的值
      pivot_row--;
      continue;
    }

    pivot_find_end_col = col;

    // 消除主元列其他元素为0
    for (let row = pivot_row + 1; row < size[0]; row++) {
      const under_pivot_value = curr_matrix.get([row, col]);
      if (mathjs.equal(under_pivot_value, 0)) continue;
      const x = mathjs.divide(under_pivot_value, pivot);
      matrix_row_map(
        (value, index) => {
          const pivot_line_value_index = [pivot_row, index[1]];
          // value - pivot_line_value * x
          return mathjs.subtract(
            value,
            mathjs.multiply(curr_matrix.get(pivot_line_value_index), x)
          );
        },
        curr_matrix,
        row
      );
      push({
        type: "TwoRowColumnAddOperation",
        row: true,
        src: pivot_row,
        target: row,
        src_multiple: mathjs.inv(x as number),
      });
    }
  }

  // console.log(pivot_find_end_col);

  for (let row = size[0] - 1; row >= 0; row--) {
    console.log(row);

    const row_arr: math.MathType = mathjs.row(curr_matrix, row);
    if (!mathjs.isMatrix(row_arr) && row === 0 && !mathjs.equal(row_arr, 0)) {
      curr_matrix.set([0, 0], 1);
    }

    let pivot = 0;
    for (let col = 0; col <= pivot_find_end_col; col++) {
      const value = curr_matrix.get([row, col]);
      if (!mathjs.equal(value, 0)) {
        pivot = value;
        pivot_find_end_col = col;
        break;
      }
    }

    if (mathjs.equal(pivot, 0)) {
      continue;
    }

    // 将主元上面的清理为 0
    for (let r = row - 1; r >= 0; r--) {
      const upper_pivot_value = curr_matrix.get([r, pivot_find_end_col]);
      if (mathjs.equal(upper_pivot_value, 0)) continue;
      const x = mathjs.divide(upper_pivot_value, pivot);
      for (let col = 0; col < size[1]; col++) {
        const pivot_line_value_index = [row, col];
        curr_matrix.set(
          [r, col],
          mathjs.subtract(
            curr_matrix.get([r, col]),
            mathjs.multiply(curr_matrix.get(pivot_line_value_index), x)
          )
        );
      }
    }

    if (mathjs.equal(pivot, 1)) {
      pivot_find_end_col--;
      continue;
    }

    for (let col = pivot_find_end_col; col < size[1]; col++) {
      curr_matrix.set(
        [row, col],
        mathjs.divide(curr_matrix.get([row, col]), pivot)
      );
    }

    push({
      type: "RowColumnMultScalarOperation",
      row: true,
      index: row,
      scalar: mathjs.inv(pivot),
    });

    pivot_find_end_col--;
  }

  console.log(steps);
  return steps;
}

const matrix_raw = ref<string[]>([""]);
const matrix_index = ref<number>(0);
const matrix_values = computed(() => {
  const raws = matrix_raw.value;
  const results: Matrix[] = Array(raws.length).fill(undefined, 0, raws.length);
  for (let ri = 0; ri < raws.length; ri++) {
    const raw = raws[ri].trim();
    const rows = raw.split("\n");
    const matrix_arr: number[][] = Array(rows.length).fill(
      undefined,
      0,
      rows.length
    );
    let max_len = 0;

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].split(/ +/g);
      if (cells.length > max_len) {
        max_len = cells.length;
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].split(/ +/g);
      const row_arr = Array(max_len).fill(0, 0, max_len);
      for (let j = 0; j < max_len; j++) {
        try {
          row_arr[j] = mathjs.fraction(cells[j]);
        } catch (e) {
          try {
            row_arr[j] = mathjs.evaluate(cells[j]);
          } catch (e) {
            row_arr[j] = parseFloat(cells[j]);
          }
        }
        if (isNaN(row_arr[j])) {
          row_arr[j] = 0;
        }
      }
      matrix_arr[i] = row_arr;
    }
    results[ri] = mathjs.matrix(matrix_arr);
  }
  return results;
});

const curr_matrix = computed(() => {
  return matrix_values.value[matrix_index.value];
});

const inv_matrix = computed(() => {
  let result: Matrix;
  try {
    result = mathjs.inv(curr_matrix.value);
  } catch (e) {
    return false;
  }
  return result;
});

const curr_eliminated_result = ref<Step[] | undefined>();

// UI

function change_to_item(index: number) {
  matrix_index.value = index;
  editor.value.change_value(matrix_raw.value[index]);
  curr_eliminated_result.value = undefined;
}

function add_matrix() {
  matrix_raw.value.push("");
  change_to_item(matrix_raw.value.length - 1);
}

function delete_matrix(index: number) {
  change_to_item(0);
  matrix_raw.value.splice(index, 1);
}

function delete_curr_matrix() {
  if (matrix_raw.value.length === 1) {
    return;
  }
  delete_matrix(matrix_index.value);
}
</script>

<template lang="pug">
q-page.p-4
  div.flex.flex-col.gap-y-4
    div.flex.flex-col.gap-y-2
      div.flex.flex-row.gap-4.items-center
        div.text-lg 矩阵
        div.flex.flex-row
          q-btn(icon="mdi-plus" flat @click="add_matrix")
          q-btn(icon="mdi-close" flat @click="delete_curr_matrix")
      q-list.flex.flex-row.gap-2()
        q-item.flex.flex-col.justify-center(v-for="m, index in matrix_values" 
          clickable @click="change_to_item(index)"
          :style="{'background-color': index === matrix_index ? '#00000010' : ''}")
          div(v-html="render_matrix(m)" style="font-size: .8rem;")
          div.text-center(style="font-size: .8rem;") {{ index }}
    div.flex.flex-row.gap-x-8
      div.flex.flex-col.gap-y-2
        div.text-lg 输入
        Editor(ref="editor" @update:content="matrix_raw[matrix_index] = $event" style="width: 24rem; height: 16rem;")
      
      div.flex.flex-col.gap-y-2(v-if="curr_matrix.size().reduce((prev, curr)=>prev === curr? prev : -1) !== -1")
        div.text-lg 行列式值
        div(v-html="mathjs.det(curr_matrix)")

      div.flex.flex-col.gap-y-2(v-if="inv_matrix !== false")
        div.text-lg 逆矩阵
        div(v-html="render_matrix(inv_matrix)")
    
      div.flex.flex-col.gap-y-2(style="width: 60vw;")
        div
          div.text-lg 矩阵消元
          q-btn(icon="mdi-play" @click="curr_eliminated_result = matrix_eliminate(curr_matrix)" flat)
        div.flex.flex-row.gap-2.items-center(v-if="curr_eliminated_result")
          div(v-html="render_matrix(curr_matrix)")
          template(v-for="step in curr_eliminated_result")
            div(v-if="step.operation.type === 'replace'")
              div(v-html="katex_render(`\\\\xlongequal{R${step.operation.src} \\\\leftrightarrow R${step.operation.target}}`)")
            div(v-else-if="step.operation.type === 'RowColumnMultScalarOperation'")
              div(v-html="katex_render(`\\\\xlongequal{R${step.operation.index} * ${mathjs.isFraction(step.operation.scalar) ? render_fraction(step.operation.scalar) : step.operation.scalar}}`)")
            div(v-else-if="step.operation.type === 'TwoRowColumnAddOperation'")
              div(v-html="render_TwoRowColumnAddOperation(step.operation)")
            div(v-else)
              div(v-html="katex_render(`\\\\xlongequal{}`)")
            div(v-html="render_matrix(step.matrix)")
</template>
