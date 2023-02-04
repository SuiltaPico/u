/** 关系。 */
export interface IRelation<T> {
  src: T;
  target: T;
}

export function create_IRelation<T>(src: T, target: T) {
  return {
    src,
    target,
  } as IRelation<T>;
}

/** 带有元信息的关系。 */
export interface IMetaRelation<T, Meta> extends IRelation<T> {
  meta: Meta;
}

export function create_IMetaRelation<T, Meta>(src: T, target: T, meta: Meta) {
  return {
    src,
    target,
    meta,
  } as IMetaRelation<T, Meta>;
}
