/** 关系表。理想空间复杂度：O(relation) */
export default class RelationMap<T> {
  map = new Map<T, [as_src: Set<T>, as_target: Set<T>]>();
  [Symbol.iterator]: () => Generator<readonly [src: T, target: T], void> =
    undefined as any;

  constructor() {
    const that = this;
    this[Symbol.iterator] = function* () {
      for (const [key, sets] of that.map) {
        const iter = sets[0][Symbol.iterator]();
        let done: boolean | undefined = false;
        let result = iter.next();
        done = result.done;
        while (!done) {
          yield [key, result.value as T] as const;
          result = iter.next();
          done = result.done;
        }
      }
    };
  }

  set(src: T, target: T) {
    let src_sets = this.map.get(src);
    if (src_sets === undefined) {
      src_sets = [new Set(), new Set()];
      this.map.set(src, src_sets);
    }
    let target_sets = this.map.get(target);
    if (target_sets === undefined) {
      target_sets = [new Set(), new Set()];
      this.map.set(target, target_sets);
    }

    src_sets[0].add(target);
    target_sets[1].add(src);
  }
  get(key: T) {
    return this.map.get(key);
  }
  has(src: T, target: T) {
    const src_sets = this.map.get(src);
    if (src_sets === undefined) return false;
    return src_sets[0].has(target);
  }
  clear() {
    this.map.clear();
  }
  delete(src: T, target: T){
    this.map.get(src)![0].delete(target);
    this.map.get(target)![1].delete(src);
  }
  /** 时间复杂度: O(被删除的节点的关系数) */
  delete_item(key: T) {
    const sets = this.map.get(key);
    if (sets === undefined) {
      return false;
    }
    sets.forEach((set) => {
      set.forEach((value) => {
        const another_sets = this.map.get(value)!;
        if (another_sets == sets) return;
        another_sets.forEach((another_set) => another_set.delete(key));
      });
      set.clear();
    });
    this.map.delete(key);
  }
  entries() {
    return this.map.entries();
  }
  keys() {
    return this.map.keys();
  }
}
