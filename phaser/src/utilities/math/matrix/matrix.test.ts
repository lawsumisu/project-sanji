import { Matrix3 } from 'src/utilities/math/matrix/matrix.util';
import { expect } from 'chai';

describe('Matrix Utility Tests', () => {
  describe('Matrix3', () => {
    describe('multiply()', () => {
      it('multiplicative identity', () => {
        const m1 = new Matrix3(2, 5, 6, 2, 9, 10, 8, 6, 3);
        expect(Matrix3.IDENTITY.multiply(m1)).to.deep.equal(m1);
        expect(m1.multiply(Matrix3.IDENTITY)).to.deep.equal(m1);
      });
    });
  });
});
