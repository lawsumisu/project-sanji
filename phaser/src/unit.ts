import * as Phaser from 'phaser';

export class Unit {
  public static toPx = 2.73;

  public static rectToPx(rect: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
    const { x, y, width: w, height: h } = rect;
    return new Phaser.Geom.Rectangle(x * this.toPx, y * this.toPx, w * this.toPx, h * this.toPx);
  }

  public static rectToUnit(rect: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
    const { x, y, width: w, height: h } = rect;
    return new Phaser.Geom.Rectangle(x / this.toPx, y / this.toPx, w / this.toPx, h / this.toPx);
  }
}