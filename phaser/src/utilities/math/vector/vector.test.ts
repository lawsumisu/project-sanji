import { Vector2 } from 'src/utilities/math/vector/vector';
import { expect } from 'chai';

describe('Vector Tests', () => {
  describe('add()', () => {
    it ('adds two vectors together', () => {
      const p = new Vector2(1, 2);
      const q = new Vector2(3, 4);
      expect(p.add(q)).to.deep.equal(new Vector2(4, 6));

      // Check that old vectors are unchanged
      expect(p).to.deep.equal(new Vector2(1, 2));
      expect(q).to.deep.equal(new Vector2(3, 4));
    });

    it('additive identity', () => {
      expect(new Vector2(1, 10).add(Vector2.ZERO)).to.deep.equal(new Vector2(1, 10));
    });

    it ('addition is communicative', () => {
      const p = new Vector2(1.1, -3.8);
      const q = new Vector2(0, 2.2);
      expect(p.add(q)).to.deep.equal(q.add(p));
    });
  });

  describe('subtract()', () => {
    it ('subtracts two vectors', () => {
      const p = new Vector2(1, 2);
      const q = new Vector2(3, 4);
      expect(p.subtract(q)).to.deep.equal(new Vector2(-2, -2));

      // Check that old vectors are unchanged
      expect(p).to.deep.equal(new Vector2(1, 2));
      expect(q).to.deep.equal(new Vector2(3, 4));
    });
  });

  describe('negate()', () => {
    it('negates the vector', () => {
      expect(new Vector2(2, -3).negate()).to.deep.equal(new Vector2(-2, 3));
    });
  });

  describe('scale()', () => {
    it('scales the vector', () => {
      const p = new Vector2(51, 8);
      expect(p.scale(2)).to.deep.equal(new Vector2(102, 16));

      // Check that old vector is unchanged
      expect(p).to.deep.equal(new Vector2(51, 8));
    });
  });

  describe('magnitude()', () => {
    it('calculates magnitude', () => {
      expect(new Vector2(3, 4).magnitude()).to.equal(5);
    });

    it('additive inverse', () => {
      const p = new Vector2(2, 2);
      const q = p.negate();
      expect(p.add(q)).to.deep.equal(Vector2.ZERO);
    });
  });

  describe('normalize()', () => {
    it('normalizes vector', () => {
      const v = new Vector2(1, 1);
      expect(v.normalize()).to.deep.equal(new Vector2(1 / Math.sqrt(2),  1 / Math.sqrt(2)));
    });
    it('normalizing zero vector returns zero vector', () => {
      expect(Vector2.ZERO.normalize()).to.deep.equal(Vector2.ZERO);
    });
  });
});
