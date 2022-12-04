export default class BiMap<Key, Value> {
  map = new Map();
  reverse = new Map();

  set(key: Key, value: Value) {
    this.map.set(key, value)
    this.reverse.set(value, key)
  }
  get_by_key(key: Key) {
    return this.map.get(key)
  }
  get_by_value(value: Value) {
    return this.reverse.get(value)
  }
  clear() {
    this.map.clear()
    this.reverse.clear()
  }
  delete_by_key(key: Key) {
    this.reverse.delete(this.map.get(key))
    this.map.delete(key)
  }
  delete_by_value(value: Value) {
    this.map.delete(this.reverse.get(value))
    this.reverse.delete(value)
  }
  entries() {
    return this.map.entries()
  }
  reverse_entries() {
    return this.reverse.entries()
  }
  iter(){
    return this.map[Symbol.iterator]
  }
  reverse_iter(){
    return this.reverse[Symbol.iterator]
  }
}
