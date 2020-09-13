import { expect } from 'chai';
import { RingBuffer } from 'src/utilities/ringBuffer/ringBuffer.util';

describe('Ring Buffer Utility Tests', () => {
  describe('constructor', () => {
    it('throws error on non-integer size', () => {
      expect(() => new RingBuffer(1.4)).to.throw();
    });

    it('throws error on negative size', () => {
      expect(() => new RingBuffer(-1)).to.throw();
    });
  });

  describe('push', () => {
    it('added items increase length until buffer reaches max size', () => {
      const buffer = new RingBuffer<number>(3);
      expect(buffer.size).to.equal(3);
      expect(buffer.length).to.equal(0);
      buffer.push(1);
      expect(buffer.length).to.equal(1);

      buffer.push(2);
      expect(buffer.length).to.equal(2);

      buffer.push(3);
      expect(buffer.length).to.equal(3);

      buffer.push(4);
      expect(buffer.length).to.equal(3);
    });
  });

  describe('at', () => {
    it('gets objects by positive index', () => {
      const buffer = new RingBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      expect(buffer.at(0)).to.equal(1);
      expect(buffer.at(1)).to.equal(2);
      expect(buffer.at(2)).to.equal(3);
    });

    it('gets object by negative index', () => {
      const buffer = new RingBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      expect(buffer.at(-1)).to.equal(3);
      expect(buffer.at(-2)).to.equal(2);
      expect(buffer.at(-3)).to.equal(1);
    });

    it('throws error when index is out of bounds', () => {
      const buffer = new RingBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      expect(() => buffer.at(3)).to.throw();
      expect(() => buffer.at(-4)).to.throw();
    });
  });

  describe('toArray', () => {
    it('returns elements in order', () => {
      const buffer = new RingBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      buffer.push(5);
      expect(buffer.toArray()).to.deep.equal([3, 4, 5]);
    });
  });
});
