export interface ICloneable {
  clone(): ThisType<this>
}

/** 对于非 `ICloneable` 对象只能克隆对象自己的属性。 */
export function clone<T>(obj: T): T {
  // @ts-ignore
  if (obj === undefined) return undefined
  if (typeof obj === "object") {
    // @ts-ignore
    if (typeof obj["clone"] === "function") {
      // @ts-ignore
      return obj.clone()
    }
    // @ts-ignore
    if (obj === null) return null
    const new_object = {}
    Reflect.ownKeys(obj).forEach(key => {
      // @ts-ignore
      new_object[key] = clone(obj[key])
    })
    // @ts-ignore
    return new_object
  }
  return obj
}