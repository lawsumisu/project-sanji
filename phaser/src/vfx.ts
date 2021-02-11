import * as _ from 'lodash';
import * as Phaser from 'phaser';
import { Vector2 } from '@lawsumisu/common-utilities';

type VfxTimer = number | ((tick: number) => boolean);
export class Vfx {
  public static shake(sprite: Phaser.GameObjects.Sprite, offset: Vector2, frequency: number, timer: VfxTimer): Vfx {
    let o = offset.clone();
    const f = Math.max(1, Math.floor(frequency));
    return new Vfx(
      sprite,
      (sprite, tick) => {
        if (tick % f === 0) {
          sprite.x += o.x;
          sprite.y += o.y;
          o = o.scale(-1);
        }
      },
      timer
    );
  }

  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly transform: (sprite: Phaser.GameObjects.Sprite, tick: number) => void;
  private readonly timer: number | ((tick: number) => boolean);
  private tick = 0;
  constructor(
    sprite: Phaser.GameObjects.Sprite,
    transform: (sprite: Phaser.GameObjects.Sprite, tick: number) => void,
    timer: number | ((tick: number) => boolean)
  ) {
    this.sprite = sprite;
    this.timer = timer;
    this.transform = transform;
  }

  public update(): void {
    if (this.shouldUpdate) {
      this.tick++;
      this.transform(this.sprite, this.tick);
    }
  }

  public get shouldUpdate(): boolean {
    if (_.isNumber(this.timer)) {
      return this.timer > this.tick;
    } else {
      return this.timer(this.tick);
    }
  }
}
