export interface Option {
  type: "option";
  option_type: string;
}

export interface NumberOption extends Option {
  option_type: "number";
  value: number;
}
export interface LimitednItervalNumberOptions extends Option {
  option_type: "limited_range_number_options";
  value: number;
}