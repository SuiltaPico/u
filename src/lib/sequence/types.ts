export interface Sliceable {
  slice<T>(start?: number, end?: number): T;
}
