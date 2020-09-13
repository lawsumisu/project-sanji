export class Scalar {
  public static clamp(value: number, lo: number, hi: number): number {
    return Math.min(Math.max(value, lo), hi);
  }

  public static toRadians(deg: number): number {
    return deg / 180 * Math.PI;
  }
}
