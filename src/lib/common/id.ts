/** 在这个服务里 id 始终为数字 */
export type ID = number;

export type IDGenerator = Generator<ID, any, never>;

export interface IIDGenerator {
  /** 生成下一个 ID */
  generate_next_id(): ID | false;
}

/** `IIDGenerator` 的实现函数。 */
export function IIDGenerator_impl(id_generator: Readonly<IDGenerator>) {
  return {
    /** 尝试生成下一个 id，如果生成失败，返回 `false`。 */
    generate_next_id() {
      const next = id_generator.next()
      if(next.done) return false
      return next.value;
    },
  };
}

/** 一个从 0 开始的顺序 id 生成器。
 * @param from 设置起始 id。
 */
export const incrementIDGeneratorFactory: (from?: number) => IDGenerator =
  function* (from = 0) {
    while (true){
      yield from++;
      if (from > Number.MAX_SAFE_INTEGER) {
        return 
      }
    }
  };

