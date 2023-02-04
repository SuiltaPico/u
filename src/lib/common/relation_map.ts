import { ICloneable } from "./clone";
import { IMetaRelation, IRelation } from "./relation";
import { ISerializable } from "./serialize";

/** 关系表。每个键储存两个集合，分别是关系中作为源和目标的集合，也就是“我连接了谁”和“谁连接了我”。理想空间复杂度：O(relation) */
export default class RelationMap<T> implements ISerializable<IRelationMapSerialized<T>>, ICloneable {
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
  has_item(src: T) {
    return this.map.has(src)
  }
  clear() {
    this.map.clear();
  }
  delete(src: T, target: T) {
    this.map.get(src)![0].delete(target);
    this.map.get(target)![1].delete(src);
  }
  /** 时间复杂度: O(被删除的节点的关系数) */
  delete_item(key: T) {
    const sets = this.map.get(key);
    if (sets === undefined) {
      return false;
    }
    // 遍历每一个集合

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

  toJSON(): IRelationMapSerialized<T> {
    return {
      relations: [...this[Symbol.iterator]()].map(([src, target]) => ({
        src,
        target,
      })),
    };
  }

  clone(): RelationMap<T> {
    const result = new RelationMap<T>()
    for (const [src, target] of this) {
      result.set(src, target)
    }
    return result
  }
}

export type IRelationMapSerialized<T> = {
  relations: IRelation<T>[];
};

/** 连接带有信息的关系表。每个键储存两个集合，分别是关系中作为源和目标的集合，也就是“我连接了谁”和“谁连接了我”。理想空间复杂度：O(relation)
 *
 * @template Meta 连接元信息类型
 */
export class MetaRelationMap<T, Meta> implements ISerializable<IRelationMapSerialized<T>>, ICloneable  {
  map = new Map<
    T,
    [as_src: Set<T>, as_target: Set<T>, as_src_meta_map: Map<T, Meta>]
  >();
  [Symbol.iterator]: () => Generator<
    readonly [src: T, target: T, meta: Meta],
    void
  > = undefined as any;

  constructor() {
    const that = this;
    this[Symbol.iterator] = function* () {
      for (const [key, sets_and_map] of that.map) {
        const iter = sets_and_map[0][Symbol.iterator]();
        let done: boolean | undefined = false;
        let result = iter.next();
        done = result.done;
        while (!done) {
          yield [
            key,
            result.value as T,
            sets_and_map[2].get(result.value)!,
          ] as const;
          result = iter.next();
          done = result.done;
        }
      }
    };
  }

  set(src: T, target: T, meta: Meta) {
    let src_sets = this.map.get(src);
    if (src_sets === undefined) {
      src_sets = [new Set(), new Set(), new Map()];
      this.map.set(src, src_sets);
    }
    let target_sets = this.map.get(target);
    if (target_sets === undefined) {
      target_sets = [new Set(), new Set(), new Map()];
      this.map.set(target, target_sets);
    }

    src_sets[0].add(target);
    src_sets[2].set(target, meta);
    target_sets[1].add(src);
  }
  get(key: T) {
    return this.map.get(key);
  }
  get_relation_meta(src: T, target: T) {
    return this.map.get(src)?.[2].get(target);
  }
  has(src: T, target: T) {
    const src_sets = this.map.get(src);
    if (src_sets === undefined) return false;
    return src_sets[0].has(target);
  }
  has_item(src: T) {
    return this.map.has(src)
  }
  clear() {
    this.map.clear();
  }
  delete(src: T, target: T) {
    this.map.get(src)![0].delete(target);
    this.map.get(src)![2].delete(target);
    this.map.get(target)![1].delete(src);
  }
  /** 时间复杂度: O(被删除的节点的关系数) */
  delete_item(key: T) {
    const set_or_map = this.map.get(key);
    if (set_or_map === undefined) {
      return false;
    }
    // 遍历每一个集合

    for (let i = 0; i < 2; i++) {
      const set = set_or_map[i];
      set.forEach((value) => {
        const another_sets = this.map.get(value as T)!;
        if (another_sets == set_or_map) return;
        another_sets.forEach((another_set_or_map) =>
          another_set_or_map.delete(key)
        );
      });
      set.clear();
    }
    set_or_map[2].clear();

    this.map.delete(key);
  }
  entries() {
    return this.map.entries();
  }
  keys() {
    return this.map.keys();
  }
  toJSON(): IMetaRelationMapSerialized<T, Meta> {
    return {
      relations: [...this[Symbol.iterator]()].map(([src, target, meta]) => ({
        src,
        target,
        meta,
      })),
    };
  }

  clone() {
    const result = new MetaRelationMap<T, Meta>()
    for (const [src, target, meta] of this) {
      result.set(src, target, meta)
    }
    return result
  }
}

export type IMetaRelationMapSerialized<T, Meta> = {
  relations: IMetaRelation<T, Meta>[];
};
