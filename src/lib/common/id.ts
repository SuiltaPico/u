export type IDGenerator = Generator<number, never, never>;

export const incrementIDGeneratorFactory: (from?: number) => IDGenerator =
  function* (from = 0) {
    while (true) yield from++;
  };
