/** 区间 */
export interface Interval<L extends boolean, R extends boolean> {
  type: "interval";
  start: number;
  end: number;
  left_open: L;
  right_open: R;
}

export type AnyTypeInterval =
  | Interval<true, true>
  | Interval<false, true>
  | Interval<true, false>
  | Interval<false, false>;

/** 创建一个区间，默认是左右关闭区间。 */
export function create_Interval<
  L extends boolean = false,
  R extends boolean = false
>(start: number, end: number, left_open?: L, right_open?: R): Interval<L, R> {
  return {
    type: "interval",
    start,
    end,
    // @ts-ignore
    left_open: left_open ?? false,
    // @ts-ignore
    right_open: right_open ?? false,
  };
}

/** 判断 `interval` 是否包含 `number` */
export function interval_contains<I extends AnyTypeInterval>(
  number: number,
  interval: I
): boolean {
  if (
    number < interval.start ||
    number > interval.end ||
    (number === interval.start && interval.left_open) ||
    (number === interval.end && interval.right_open)
  )
    return false;
  return true;
}
