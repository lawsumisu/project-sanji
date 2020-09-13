export class Queue<T = any> {
  private in: T[] = [];
  private out: T[] = [];

  public push(item: T): void {
    this.in.push(item);
  }

  public pop(): T {
    if (this.out.length === 0) {
      while (this.in.length > 0) {
        this.out.push(<T> this.in.pop());
      }
    }

    if (this.out.length > 0) {
      return <T> this.out.pop();
    } else {
      throw Error('Cannot pop from empty queue');
    }
  }

  public get length() {
    return this.in.length + this.out.length;
  }
}
