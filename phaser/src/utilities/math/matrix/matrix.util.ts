import * as Phaser from 'phaser';
import { Vector3 } from 'src/utilities/math/vector/vector';

type Matrix3Array = [number, number, number, number, number, number, number, number, number];
export class Matrix3 {
  public static fromPhaserMatrix(M: Phaser.Math.Matrix3): Matrix3 {
    return new Matrix3(M.val[0], M.val[1], M.val[2], M.val[3], M.val[4], M.val[5], M.val[6], M.val[7], M.val[8]);
  }

  public static get IDENTITY(): Matrix3 {
    return new Matrix3(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }

  private readonly array: Matrix3Array;

  constructor(a00: number, a01: number, a02: number, a10: number, a11: number, a12: number, a20: number, a21: number, a22: number) {
    this.array = [a00, a01, a02, a10, a11, a12, a20, a21, a22];
  }

  public add(m: Matrix3): Matrix3 {
    const newMatrixArray: Matrix3Array = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < newMatrixArray.length; ++i) {
      newMatrixArray[i] = this.array[i] + m.array[i];
    }
    return new Matrix3(...newMatrixArray);
  }

  public subtract(m: Matrix3): Matrix3 {
    const newMatrixArray: Matrix3Array = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < newMatrixArray.length; ++i) {
      newMatrixArray[i] = this.array[i] - m.array[i];
    }
    return new Matrix3(...newMatrixArray);
  }

  public multiply(M: Matrix3): Matrix3;
  public multiply(v: Vector3): Vector3;
  public multiply(input: Matrix3 | Vector3): typeof input {
    if (input instanceof Matrix3) {
      return Matrix3.fromPhaserMatrix(this.asPhaserMatrix().multiply(input.asPhaserMatrix()));
    } else {
      const x = this.value(0, 0) * input.x + this.value(0, 1) * input.y + this.value(0, 2) * input.z;
      const y = this.value(1, 0) * input.x + this.value(1, 1) * input.y + this.value(1, 2) * input.z;
      const z = this.value(2, 0) * input.x + this.value(2, 1) * input.y + this.value(2, 2) * input.z;
      return new Vector3(x, y, z);
    }

  }
  
  public determinant(): number {
    return new Phaser.Math.Matrix3().fromArray(this.array).determinant();
  }

  public inverse(): Matrix3 {
    return Matrix3.fromPhaserMatrix(this.asPhaserMatrix().invert());
  }
  
  public value(row: number, col: number): number {
    const i = row * 3 + col;
    if (i < this.array.length) {
      return this.array[i];
    } else {
      throw Error(`Invalid row or column: (${row}, ${col})`);
    }
  }
  
  public asPhaserMatrix(): Phaser.Math.Matrix3 {
    return new Phaser.Math.Matrix3().fromArray(this.array);
  }

}
