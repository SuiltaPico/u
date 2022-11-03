import { Sliceable } from "./types";

/** 范围，表达在一个序列上从一个索引到另一个索引之间的所有对象 */
export default interface Range<T, U> {
  type: "range";
  range_type: string;
  start: T;
  end: U;
}

/** 索引范围 */
export interface IndexRange extends Range<number, number> {
  range_type: "index";
  /** 范围开始的索引，正整数 */
  start: number;
  /** 范围结束的索引，正整数 */
  end: number;
}

export function create_IndexRange(start: number, end: number): IndexRange {
  return {
    type: "range",
    range_type: "index",
    start,
    end,
  };
}

export function IndexRange_slice<T extends Sliceable>(
  index_range: IndexRange,
  sequence: T
) {
  return sequence.slice<T>(index_range.start, index_range.end);
}

/** 百分比范围 */
export interface PercentageRange extends Range<number, number> {
  range_type: "percentage";
  /** 范围开始的百分比，限定为 0~1 */
  start: number;
  /** 范围结束的百分比，限定为 0~1 */
  end: number;
}

export function create_PercentageRange(start: number, end: number): PercentageRange {
  return {
    type: "range",
    range_type: "percentage",
    start,
    end,
  };
}

export function PercentageRange_to_IndexRange(
  percentage_range: PercentageRange,
  index_range: IndexRange,
  /** 取整函数 */
  rounding_fn: (value: number) => number = Math.round
) {
  const start = index_range.start;
  const len = index_range.end - index_range.start;
  return create_IndexRange(
    rounding_fn(start + len * percentage_range.start),
    rounding_fn(start + len * percentage_range.end)
  );
}

export type BuiltinRange = IndexRange | PercentageRange