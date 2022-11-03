export enum UnitSystem {
  Percentage,
  Number,
}

export function percentage_to_number(
  percentage: number,
  start: number,
  length: number
) {
  return start + percentage * length;
}
