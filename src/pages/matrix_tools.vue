<script setup lang="ts">
import { computed, h, reactive, ref, render, watch } from "vue";
import katex from "katex";
import "katex/dist/katex.css";
import { create, all, re } from "mathjs";
import * as math from "mathjs";
import type { Matrix, Fraction } from "mathjs";
import Editor from "../components/Editor.vue";
import Parser from "../lib/matrix_tools/parser";
import { nanoid } from "nanoid";
import { QItem } from "quasar";

const editor = ref<any>();

const mathjs = create(all);
mathjs.config({
  number: "Fraction",
});

type ValueType = Exclude<math.MathType, math.Unit>;

function any(v: any) {
  return v;
}

function katex_render(src: string) {
  return katex.renderToString(src, {
    output: "html",
    trust: true,
  });
}

function render_ValueType(v: ValueType) {
  if (mathjs.isMatrix(v)) {
    return render_matrix(v);
  } else if (mathjs.isFraction(v)) {
    return render_fraction(v);
  } else {
    return v.toString();
  }
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

function render_num(value: math.MathNumericType) {
  if (mathjs.isFraction(value)) {
    return render_fraction(value);
  } else {
    return value.toString();
  }
}

function render_matrix(matrix: Matrix) {
  let result_string = "";
  result_string += "\\begin{bmatrix}";
  const size = matrix.size();
  for (let i = 0; i < size[0]; i++) {
    for (let j = 0; j < size[1]; j++) {
      const value = matrix.get([i, j]);
      result_string += render_num(value);
      if (j < size[1] - 1) {
        result_string += " & ";
      }
    }
    if (i < size[0] - 1) {
      result_string += "\\\\";
    }
  }
  result_string += "\\end{bmatrix}";
  return result_string;
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

type ValueMatrixOperationType = "value-matrix";
type RefRowOperationType = "ref-row";
type RefColOperationType = "ref-col";
type AddOperationType = "add";
type SubOperationType = "sub";
type MulOperationType = "mul";
type CompactMulOperationType = "compact-mul";
type DivOperationType = "div";
type SwapOperayionType = "swap";
type XEqualOperationType = "x-equal";
type OperationGroupType = "group";
type OperationType =
  | "string"
  | ValueMatrixOperationType
  | "value-number"
  | "value-fraction"
  | RefRowOperationType
  | RefColOperationType
  | AddOperationType
  | SubOperationType
  | MulOperationType
  | CompactMulOperationType
  | DivOperationType
  | SwapOperayionType
  | XEqualOperationType
  | OperationGroupType;

interface BaseOperation {
  type: OperationType;
}

interface ValueOperation<T> extends BaseOperation {
  value: T;
}
interface UnaryOperation extends BaseOperation {
  x: Operation | string;
}
interface BinaryOperation extends UnaryOperation {
  x: Operation | string;
  y: Operation | string;
}
interface ListOperation extends BaseOperation {
  operations: (Operation | string)[];
}

interface ValueMatrixOperation extends ValueOperation<Matrix> {
  type: ValueMatrixOperationType;
}
interface ValueNumberOperation extends ValueOperation<number> {
  type: "value-number";
}
interface ValueFractionOperation extends ValueOperation<Fraction> {
  type: "value-fraction";
}

interface RefRowOperation extends UnaryOperation {
  type: RefRowOperationType;
}
interface RefColOperation extends UnaryOperation {
  type: RefColOperationType;
}

interface AddOperation extends BinaryOperation {
  type: AddOperationType;
}
interface SubOperation extends BinaryOperation {
  type: SubOperationType;
}
interface MulOperation extends BinaryOperation {
  type: MulOperationType;
}
interface CompactMulOperation extends BinaryOperation {
  type: CompactMulOperationType;
}
interface DivOperation extends BinaryOperation {
  type: DivOperationType;
}

interface SwapOperayion extends BinaryOperation {
  type: SwapOperayionType;
}

interface XEqualOperation extends ListOperation {
  type: XEqualOperationType;
}
interface OperationGroup extends ListOperation {
  type: OperationGroupType;
}

interface StringOperation extends BaseOperation {
  type: "string";
  value: string;
}

type Operation =
  | ValueMatrixOperation
  | ValueNumberOperation
  | ValueFractionOperation
  | RefRowOperation
  | RefColOperation
  | AddOperation
  | SubOperation
  | MulOperation
  | CompactMulOperation
  | DivOperation
  | SwapOperayion
  | XEqualOperation
  | OperationGroup
  | StringOperation;

const matrix_map = new Map<string, Matrix>();

type RenderOperationResult = [
  result_str: string,
  post_process_task?: () => void
];

function ValueType_to_operation(value: ValueType): Operation {
  if (mathjs.isMatrix(value)) {
    return {
      type: "value-matrix",
      value,
    };
  } else if (mathjs.isFraction(value)) {
    return {
      type: "value-fraction",
      value,
    };
  } else if (mathjs.isNumber(value)) {
    return {
      type: "value-number",
      value,
    };
  } else {
    return {
      type: "string",
      value: value.toString(),
    };
  }
}

function render_operation(op: Operation): RenderOperationResult {
  const post_process_tasks: (() => void)[] = [];
  function render_branch(value: string | Operation): RenderOperationResult {
    return typeof value === "string" ? [value] : render_operation(value);
  }
  function _render_branch(value: string | Operation) {
    const branch = render_branch(value);
    if (branch[1]) post_process_tasks.push(branch[1]);
    return branch[0];
  }
  function binary_operation_temp(mid: string) {
    return function (op: Operation) {
      const x = _render_branch((op as BinaryOperation).x);
      const y = _render_branch((op as BinaryOperation).y);
      return x + mid + y;
    };
  }
  const map: Record<OperationType, (op: Operation) => string> = {
    string: (op) => (op as StringOperation).value,
    "value-matrix": (op) => {
      const _op = op as ValueMatrixOperation;
      const id = Date.now() + nanoid(8);
      matrix_map.set(id, _op.value);
      post_process_tasks.push(() => {
        const el = document.getElementById(id);
        if (el === null) return;
        const inner = el.innerHTML;
        const elp = el.parentElement!;
        render(
          h("span", {
            innerHTML: inner,
            class: "matrix",
            ondblclick: () => {
              matrix_raw.push(matrix_value_to_raw(matrix_map.get(id)!));
            },
          }),
          el
        );
        elp.replaceChild(el.children[1], el);
      });
      return "\\htmlId{" + id + "}{" + render_matrix(_op.value) + "}";
    },
    "value-number": (op) => (op as ValueNumberOperation).value.toString(),
    "value-fraction": (op) =>
      render_fraction((op as ValueFractionOperation).value),
    "ref-col": (op) => "C" + _render_branch((op as RefColOperation).x),
    "ref-row": (op) => "R" + _render_branch((op as RefColOperation).x),
    add: binary_operation_temp(" \\ + \\ "),
    sub: binary_operation_temp(" \\ - \\ "),
    mul: binary_operation_temp(" \\ * \\ "),
    "compact-mul": binary_operation_temp(""),
    div: binary_operation_temp(" \\ / \\ "),
    swap: binary_operation_temp(" \\ \\leftrightarrow \\ "),
    "x-equal": (op) => {
      const xop = op as XEqualOperation;
      return (
        "\\xlongequal{" +
        xop.operations.reduce((prev, curr) => prev + _render_branch(curr), "") +
        "}"
      );
    },
    group: (op) => {
      const _op = op as OperationGroup;
      return _op.operations.reduce(
        (prev, curr) => prev + _render_branch(curr),
        ""
      ) as string;
    },
  };
  const result = map[op.type](op);
  return [
    result,
    post_process_tasks.length === 0
      ? undefined
      : () => {
          post_process_tasks.forEach((v) => v());
        },
  ];
}

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
  const result_operations: Operation[] = [];

  function push<T extends Operation>(operations: T[]) {
    const ops: Operation = {
      type: "x-equal",
      operations,
    };
    result_operations.push({
      type: "group",
      operations: [
        ops,
        {
          type: "value-matrix",
          value: curr_matrix,
        },
      ],
    });
    curr_matrix = curr_matrix.clone();
  }

  function push_two_row_add_operation(
    src: number,
    target: number,
    scalar: ValueType
  ) {
    const src_ref: RefRowOperation = {
      type: "ref-row",
      x: src.toString(),
    };
    push([
      {
        type: mathjs.sign(scalar as number) === -1 ? "sub" : "add",
        x: {
          type: "ref-row",
          x: target.toString(),
        },
        y: mathjs.equal(mathjs.abs(scalar as number), 1)
          ? src_ref
          : {
              type: "compact-mul",
              x: render_num(mathjs.inv(scalar as number)),
              y: src_ref,
            },
      },
    ]);
  }

  let curr_matrix = matrix.clone();

  // 移动主元到 col 行
  const fix_result = fix_pivot(curr_matrix, 0);
  if (fix_result !== 0 && fix_result !== false) {
    push([
      {
        type: "swap",
        x: {
          type: "ref-row",
          x: "0",
        },
        y: {
          type: "ref-row",
          x: fix_result.toString(),
        },
      },
    ]);
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
      const x = mathjs.divide(under_pivot_value, pivot) as ValueType;
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
      push_two_row_add_operation(pivot_row, row, mathjs.inv(x as number));
    }
  }

  for (let row = size[0] - 1; row >= 0; row--) {
    const row_arr: math.MathType = mathjs.row(curr_matrix, row);
    if (!mathjs.isMatrix(row_arr) && row === 0 && !mathjs.equal(row_arr, 0)) {
      curr_matrix.set([0, 0], 1);
      push([
        {
          type: "compact-mul",
          x: render_num(mathjs.inv(row_arr)),
          y: {
            type: "ref-row",
            x: "0",
          },
        },
      ]);
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
      const x = mathjs.divide(upper_pivot_value, pivot) as any as ValueType;
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
      push_two_row_add_operation(row, r, x);
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
    push([
      {
        type: "compact-mul",
        x: render_num(mathjs.inv(pivot)),
        y: {
          type: "ref-row",
          x: row.toString(),
        },
      },
    ]);

    pivot_find_end_col--;
  }
  return result_operations;
}

function matrix_value_to_raw(matrix: Matrix) {
  let result = "";
  matrix.toArray().map((row_arr) => {
    (row_arr as math.MathNumericType[]).map((value) => {
      result += render_num(value) + " ";
    });
    result += "\n";
  });
  return result;
}

const matrix_raw = reactive<string[]>([""]);
const matrix_index = ref<number>(0);
const matrix_values = computed(() => {
  const raws = matrix_raw;
  const results: Matrix[] = Array(raws.length).fill(undefined, 0, raws.length);
  for (let ri = 0; ri < raws.length; ri++) {
    const raw = raws[ri].trim();
    const rows = raw.split("\n").map((v) => v.trim());
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

const curr_eliminated_result = ref<Operation[] | undefined>();

type ASTNodeType = "operator" | "ref" | "literal";
interface ASTNode {
  type: ASTNodeType;
}

interface ASTBinaryNode extends ASTNode {
  left: ASTNode;
  right: ASTNode;
}

type OperaterType = "add" | "sub" | "mul" | "div";
interface ASTOperator extends ASTBinaryNode {
  operator: OperaterType;
}

type ASTLiteralType = "fraction" | "float" | "integer";
interface ASTLiteral extends ASTNode {
  literal_type: ASTLiteralType;
}

interface ASTLiteralFraction extends ASTLiteral {
  literal_type: "fraction";
  d: number;
  n: number;
  s: number;
}

interface ASTLiteralNumber extends ASTLiteral {
  literal_type: "float" | "integer";
  value: number;
}

type ASTRefType = "matrix";
interface ASTRef extends ASTNode {
  ref_type: ASTRefType;
}

interface ASTRefMatrix extends ASTNode {
  ref_type: "matrix";
  id: number;
}

function process_ASTNode(ast_node: ASTNode, steps: Operation[]) {
  const map: Record<ASTNodeType, (ast_node: ASTNode) => ValueType> = {
    operator: (node) => {
      const n = node as ASTOperator;
      const op_push = (
        type: OperaterType,
        l: ValueType,
        r: ValueType,
        result: ValueType
      ) =>
        steps.push(
          {
            type,
            x: render_ValueType(l),
            y: render_ValueType(r),
          },
          {
            type: "x-equal",
            operations: [],
          },
          ValueType_to_operation(result),
          {
            type: "string",
            value: "\\qquad",
          }
        );
      const op_map: Record<
        OperaterType,
        (l: ValueType, r: ValueType) => ValueType
      > = {
        add: (l, r) => {
          const result = mathjs.add(l, r);
          op_push("add", l, r, result);
          return result;
        },
        sub: (l, r) => {
          const result = mathjs.subtract(l, r);
          op_push("sub", l, r, result);
          return result;
        },
        mul: (l, r) => {
          const result = mathjs.multiply(l, r) as ValueType;
          op_push("mul", l, r, result);
          return result;
        },
        div: (l, r) => {
          const result = mathjs.divide(l, r) as ValueType;
          op_push("div", l, r, result);
          return result;
        },
      };
      return op_map[n.operator](
        process_ASTNode(n.left, steps),
        process_ASTNode(n.right, steps)
      );
    },
    literal: (node) => {
      const n = node as ASTLiteral;
      const number_processor = (n: ASTLiteral) => {
        const ln = n as ASTLiteralNumber;
        return ln.value;
      };
      const li_map: Record<ASTLiteralType, (node: ASTLiteral) => ValueType> = {
        fraction: (n) => {
          const lf = n as ASTLiteralFraction;
          return mathjs.fraction({
            d: lf.d,
            n: lf.n,
            s: lf.s,
          });
        },
        float: number_processor,
        integer: number_processor,
      };
      return li_map[n.literal_type](n);
    },
    ref: (node) => {
      const n = node as ASTRef;
      const ref_map: Record<ASTRefType, (node: ASTRef) => ValueType> = {
        matrix: (n) => {
          const mn = n as ASTRefMatrix;
          return matrix_values.value[mn.id];
        },
      };
      return ref_map[n.ref_type](n);
    },
  };
  return map[ast_node.type](ast_node);
}

const exp_editor = ref<any | undefined>();
const exp_raw = ref("");
const exp_steps = computed(() => {
  try {
    const result: ASTNode = Parser.parse(exp_raw.value, {});
    const steps: Operation[] = [];
    result ? process_ASTNode(result, steps) : undefined;
    return steps;
  } catch (e) {
    console.log(e);
  }
});

// UI

watch(matrix_raw, () => {
  curr_eliminated_result.value = undefined;
});

function change_to_item(index: number) {
  matrix_index.value = index;
  editor.value.change_value(matrix_raw[index]);
  curr_eliminated_result.value = undefined;
}

function add_matrix() {
  matrix_raw.push("");
  change_to_item(matrix_raw.length - 1);
}

function delete_matrix(index: number) {
  const i = index - 1;
  change_to_item(i < 0 ? 0 : i);
  matrix_raw.splice(index, 1);
}

function delete_curr_matrix() {
  if (matrix_raw.length === 1) {
    return;
  }
  delete_matrix(matrix_index.value);
}

function render_operation_and_post_process(op: Operation) {
  const result = render_operation(op);
  requestAnimationFrame(() => {
    result[1] ? result[1]() : 0;
  });
  return result[0];
}
</script>

<template lang="pug">
q-page.p-4
  div.flex.flex-col.gap-y-8
    div.flex.flex-col.gap-y-2
      div.flex.flex-row.gap-4.items-center
        div.text-lg 矩阵
        div.flex.flex-row
          q-btn(icon="mdi-plus" flat @click="add_matrix")
          q-btn(icon="mdi-close" flat @click="delete_curr_matrix")
      q-list.flex.flex-row.gap-2
        q-item.flex.flex-col.justify-center.items-center.gap-y-2(v-for="m, index in matrix_values" 
          clickable @click="change_to_item(index)"
          :style="{'background-color': index === matrix_index ? '#00000010' : ''}")
          div(v-html="katex_render(render_matrix(m))" style="font-size: .8rem;")
          div.text-center(style="font-size: .8rem;" v-html="katex_render('M' + index)")
    div.flex.flex-row.gap-x-8
      div.flex.flex-col.gap-y-2
        div.text-lg 输入
        Editor(ref="editor" @update:content="matrix_raw[matrix_index] = $event" style="width: 24rem; height: 16rem;")
      
      div.flex.flex-col.gap-y-2(v-if="curr_matrix.size().reduce((prev, curr)=>prev === curr? prev : -1) !== -1")
        div.text-lg 行列式值
        div(v-html="katex_render(mathjs.det(curr_matrix) + '')")

      div.flex.flex-col.gap-y-2(v-if="inv_matrix !== false")
        div.text-lg 逆矩阵
        div(v-html="katex_render(render_operation_and_post_process({ type: 'value-matrix', value: inv_matrix }))")
    
      div.flex.flex-col.gap-y-2(style="width: 40vw;")
        div
          div.text-lg 矩阵消元
          q-btn(icon="mdi-play" @click="curr_eliminated_result = matrix_eliminate(curr_matrix)" flat v-if="!curr_eliminated_result")
        div.flex.flex-row.gap-2.items-center(v-if="curr_eliminated_result")
          div.matrix(v-html="katex_render(render_matrix(curr_matrix))")
          template(v-for="op in curr_eliminated_result")
            div(v-html="katex_render(render_operation_and_post_process(op))")

    div.flex.flex-row.gap-x-8
      div.flex.flex-col.gap-y-2
        div.text-lg 输入表达式
        Editor(ref="exp_editor" @update:content="exp_raw = $event" style="width: 24rem; height: 16rem;")
      div.flex.flex-col.gap-y-2
        div.text-lg 计算过程
        .flex.flex-row.gap-2.items-center
          template(v-for="op in exp_steps")
            div(v-html="katex_render(render_operation_and_post_process(op))")
</template>
<style>
.matrix {
  height: max-content;
  display: inline-block;
  @apply p-2 cursor-pointer transition-all;
}

.matrix:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.matrix:active {
  background-color: rgba(0, 0, 0, 0.2);
}
</style>
