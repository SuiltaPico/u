export function create_setter_getter<Value>(initial_value: Value) {
  let _value: Value = initial_value;
  return {
    set(value: Value) {
      _value = value;
    },
    get() {
      return _value;
    },
  };
}
