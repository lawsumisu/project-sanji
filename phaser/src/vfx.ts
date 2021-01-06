import * as _ from 'lodash';
import * as Phaser from 'phaser';
import { Vector2 } from '@lawsumisu/common-utilities';

type VfxTimer = number | ((tick: number) => boolean);
export class Vfx {
  public static shake(sprite: Phaser.GameObjects.Sprite, offset: Vector2, timer: VfxTimer): Vfx {
    let o = offset.clone();
    return new Vfx(
      sprite,
      sprite => {
        sprite.x += o.x;
        sprite.y += o.y;
        o = o.scale(-1);
      },
      timer
    );
  }

  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly transform: (sprite: Phaser.GameObjects.Sprite) => void;
  private readonly timer: number | ((tick: number) => boolean);
  private tick = 0;
  constructor(
    sprite: Phaser.GameObjects.Sprite,
    transform: (sprite: Phaser.GameObjects.Sprite) => void,
    timer: number | ((tick: number) => boolean)
  ) {
    this.sprite = sprite;
    this.timer = timer;
    this.transform = transform;
  }

  public update(): void {
    if (this.shouldUpdate) {
      this.tick++;
      this.transform(this.sprite);
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
