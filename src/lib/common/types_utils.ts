export type ItemsOfArray<T extends readonly any[]> =
  T extends readonly (infer K)[] ? K : never;
export type ExcludeKey<IA, Keys> = {
  [KA in Exclude<keyof IA, Keys>]: IA[KA];
};
/** 从 `IA` 中移除所有 `IB` 拥有的键。 */
export type ExcludeKeyFrom<IA, IB> = {
  [KA in Exclude<keyof IA, keyof IB>]: IA[KA];
};
/** 移除 `T` 的所有值类型为 `never` 的属性 */
export type RemoveNeverKey<T extends object> = Pick<
  T,
  { [K in keyof T]: T[K] extends never ? never : K }[keyof T]
>;
/** 递归地移除 `T` 的所有值类型为 `never` 的属性 */
export type RemoveNeverKeyRecursively<T extends object> = {
  [K in keyof RemoveNeverKey<T>]: T[K] extends object
    ? RemoveNeverKeyRecursively<T>
    : T[K];
};
