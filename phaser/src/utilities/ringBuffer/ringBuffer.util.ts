import { Scalar } from 'src/utilities/math/scalar.util';

/**
 * Generic container for an ordered list of the last n inserted items.
 */
export class RingBuffer<T = any> {
  public readonly size: number;
  private buffer: T[] = [];
  private ringIndex = 0;

  constructor(size: number) {
    if (size < 0) {
      throw new Error('size must be positive');
    } else if (size !== Math.round(size)) {
      throw new RangeError('Invalid array length');
    } else {
      this.size = size;
    }
  }

  /**
   * Inserts an item at the end of this buffer. If the buffer is full during this insert, then the least recently added item is removed.
   * Performed in O(1) runtime.
   * @param item
   */
  public push(item: T): void {
    if (this.length < this.size) {
      this.buffer.push(item);
    } else {
      this.buffer[this.ringIndex] = item;
      this.ringIndex = (this.ringIndex + 1) % this.length;
    }
  }

  /**
   * Get the item at the provided index. Valid indices can be in the range of [-n, n-1] where n is the max size of this buffer. If the
   * index is negative, then indexing starts from the most-recently added element (i.e at(-1) will return the last element in the
   * buffer, at(-2) will return second to last element, etc.)
   * @param index
   */
  public at(index: number): T {
    if (index !== Math.round(index)) {
      throw new Error('index must be an integer');
    } else if (index !== Scalar.clamp(index, -this.size, this.size - 1)) {
      throw new Error(`index must be between ${-this.size} and ${this.size - 1}`);
    } else {
      const i = (this.ringIndex + index + this.size) % this.size;
      return this.buffer[i];
    }
  }

  /**
   * Returns an array of all elements in this buffer.
   */
  public toArray(): T[] {
    const output: T[] = [];
    for (let i = 0; i < this.size; ++i) {
      output.push(this.at(i));
    }
    return output;
  }

  /**
   * Gets the current number of items stored in this buffer.
   */
  public get length(): number {
    return this.buffer.length;
  }
}
