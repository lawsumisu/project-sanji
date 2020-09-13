import { expect } from 'chai';
import { Queue } from 'src/utilities/collections/queue/index';
describe('Queue Collection Utility Tests', () => {
  describe('push', () => {
    it('adds items to the queue', () => {
      const q = new Queue<number>();
      expect(q.length).to.equal(0);

      q.push(1);
      expect(q.length).to.equal(1);

      q.push(1);
      expect(q.length).to.equal(2);
    });
  });

  describe('pop', () => {
    it('pops items from the queue in FIFO', () => {
      const q = new Queue<number>();
      q.push(1);
      q.push(2);
      q.push(3);

      expect(q.pop()).to.equal(1);
      expect(q.length).to.equal(2);

      expect(q.pop()).to.equal(2);
      expect(q.length).to.equal(1);

      expect(q.pop()).to.equal(3);
      expect(q.length).to.equal(0);
    });

    it('pops items in FIFO even when new items are added', () => {
      const q = new Queue<number>();
      q.push(1);
      q.push(2);

      expect(q.pop()).to.equal(1);
      expect(q.length).to.equal(1);

      q.push(3);
      expect(q.pop()).to.equal(2);
      expect(q.length).to.equal(1);

      expect(q.pop()).to.equal(3);
      expect(q.length).to.equal(0);
    });

    it('throws error when popping an empty queue', () => {
      const q = new Queue<number>();
      expect(() => q.pop()).to.throw();
    });
  });
});
