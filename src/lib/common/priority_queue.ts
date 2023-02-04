export class PriorityQueue<T> {
  heap: T[] = [];

  constructor(private comparator: (a: T, b: T) => number) { }

  push(element: T): void {
    this.heap.push(element);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) {
      return undefined;
    }
    if (this.heap.length === 1) {
      return this.heap.pop();
    }
    const result = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return result;
  }

  get length(){
    return this.heap.length
  }

  private getLeftChildIndex(index: number): number {
    return 2 * index + 1;
  }

  private getRightChildIndex(index: number): number {
    return 2 * index + 2;
  }

  private getParentIndex(index: number): number {
    return Math.floor((index - 1) / 2);
  }

  private bubbleUp(index: number): void {
    let parentIndex = this.getParentIndex(index);
    while (
      index > 0 &&
      this.comparator(this.heap[index], this.heap[parentIndex]) < 0
    ) {
      [this.heap[index], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[index],
      ];
      index = parentIndex;
      parentIndex = this.getParentIndex(index);
    }
  }

  private bubbleDown(index: number): void {
    let minIndex = index;
    let leftChildIndex = this.getLeftChildIndex(index);
    if (
      leftChildIndex < this.heap.length &&
      this.comparator(this.heap[leftChildIndex], this.heap[minIndex]) < 0
    ) {
      minIndex = leftChildIndex;
    }
    let rightChildIndex = this.getRightChildIndex(index);
    if (
      rightChildIndex < this.heap.length &&
      this.comparator(this.heap[rightChildIndex], this.heap[minIndex]) < 0
    ) {
      minIndex = rightChildIndex;
    }
    if (index !== minIndex) {
      [this.heap[index], this.heap[minIndex]] = [
        this.heap[minIndex],
        this.heap[index],
      ];
      this.bubbleDown(minIndex);
    }
  }
}