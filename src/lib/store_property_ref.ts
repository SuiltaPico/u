import { Store } from "pinia";
import { ref, Ref, watch } from "vue";

// export default class StorePropertyRef<
//   S extends Store,
//   Property extends keyof S
// > {
//   #store: S;
//   #property: Property;
//   /** 便于模板自动解引用 */
//   __v_isRef = true
//   constructor(store: S, property: Property) {
//     this.#store = store;
//     this.#property = property;
//   }

//   public get value(): S[Property] {
//     return this.#store[this.#property];
//   }

//   public set value(v: S[Property]) {
//     //const patch = {} as any
//     this.#store[this.#property] = v
//     //this.#store.$patch(patch);
//   }
// }

export default class StorePropertyRef<
  S extends Store,
  Property extends keyof S
> {
  #store: S;
  #property: Property;
  #ref;

  /** 便于模板自动解引用 */
  constructor(store: S, property: Property) {
    this.#store = store;
    this.#property = property;
    this.#ref = ref(this.#store[this.#property]) as Ref<S[Property]>;
    watch(this.#ref, (new_value) => {
      this.#store[this.#property] = new_value;
    });
  }

  public ref() {
    return this.#ref;
  }
}
