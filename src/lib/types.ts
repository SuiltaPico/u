export type KeyOfArray<T extends readonly any[]> = T extends readonly (infer K)[]
  ? K
  : never;
