import { type } from "os";
import {
  ExcludeKey,
  ExcludeKeyFrom,
  RemoveNeverKey,
  RemoveNeverKeyRecursively,
} from "./types_utils";

export type DirectlySerializeBaseType =
  | number
  | string
  | boolean
  | undefined
  | null;
/** 判断类型 `T` 是否可以直接序列化。谢谢 ChatGPT。 */
export type IsDirectlySerializeType<T> = T extends DirectlySerializeBaseType
  ? true
  : T extends Array<infer U>
  ? IsDirectlySerializeType<U>
  : T extends (...param: any) => any
  ? false
  : T extends object
  ? IsObjectSerializable<T> extends never
    ? true
    : false extends IsObjectSerializable<T>
    ? false
    : true
  : false;

type IsObjectSerializable<T> =
  | {
      [K in keyof T]: IsDirectlySerializeType<T[K]>;
    }[keyof T]
  | (keyof T extends Exclude<keyof T, symbol> ? true : false);

export type ToDirectlySerialized<T> = T extends DirectlySerializeBaseType
  ? T
  : T extends object
  ? RemoveNeverKey<{
      [Key in keyof T]: T[Key] extends DirectlySerializeBaseType
        ? T[Key]
        : T[Key] extends Function
        ? never
        : ToDirectlySerialized<T[Key]>;
    }>
  : never;

export function JSON_serialize(item: any) {
  return JSON.stringify(item);
}

/** 对 `target` 进行序列化。
 * * 如果 `obj` 是 `ISerializable` 类型的，则调用 `obj.serialize` 进行序列化。
 * * 否则，如果 `obj` 是可以直接序列化的类型（即符合 `isDirectlySerializeType`），则使用 `non_ISerializable_serializer` 进行序列化。
 * * 否则，返回 `never`
 *
 * 注意，在实现上并不会判断 `obj` 是否是直接序列化的类型，仅凭类型系统作为保证。
 */
export function serialize<T>(target: T): string {
  return JSON.stringify(target);
}

export function deserialize<T, U>(
  src: string
): T extends ISerializable<U>
  ? U
  : IsDirectlySerializeType<T> extends true
  ? T
  : never {
  return JSON.parse(src);
}

/** 可序列化的对象接口。
 *
 * 在这里，序列化的定义是将对象转换为一个保存对象关键信息的的字符串。
 *
 * @template Serialized 进行序列化后得到的结果。`T` **必须可以直接序列化**。
 */
export interface ISerializable<Serialized> {
  toJSON(): Serialized;
}

export type Serialize<T extends ISerializable<any>> = T extends ISerializable<
  infer U
>
  ? U
  : never;
export type ExcludeISerializable<T extends ISerializable<any>> = ExcludeKeyFrom<
  T,
  ISerializable<any>
>;
