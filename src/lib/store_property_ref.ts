import { Store } from "pinia";

export default class StorePropertyRef<
  S extends Store,
  Property extends keyof S
> {
  #store: S;
  #property: Property;
  /** 便于模板自动解引用 */
  __v_isRef = true
  constructor(store: S, property: Property) {
    this.#store = store;
    this.#property = property;
  }

  public get value(): S[Property] {
    return this.#store[this.#property];
  }

  public set value(v: S[Property]) {
    //const patch = {} as any
    this.#store[this.#property] = v
    //this.#store.$patch(patch);
  }
}
