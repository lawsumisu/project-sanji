import { Vector2 } from '@lawsumisu/common-utilities';
import { Direction, Hit } from 'src/collider';
import { Vfx } from 'src/vfx';

export interface UpdateParams {
  time: number;
  delta: number; // Number of ms since last update
}

export class StageObject {
  public position: Vector2 = Vector2.ZERO;
  public velocity: Vector2 = Vector2.ZERO;
  private static objectCounter = 1;
  public readonly tag: string;
  protected freezeFrames: number = 0;
  protected _orientation: Direction = { x: true, y: true };
  protected _sprite: Phaser.GameObjects.Sprite;
  protected _pushable = true;
  protected activeVfx: Vfx[] = [];

  protected constructor() {
    this.tag = ['level-', `${StageObject.objectCounter}`.padStart(3, '0')].join('');
    StageObject.objectCounter++;
  }

  public update(_params: UpdateParams): void {
    if (this.freezeFrames > 0) {
      this.freezeFrames = Math.max(0, this.freezeFrames - 1);
    }
    this.activeVfx.forEach(vfx => vfx.update());
    this.activeVfx = this.activeVfx.filter(vfx => vfx.shouldUpdate);
  }

  public applyHitToSelf(_hit: Hit, _stageObject: StageObject): void {}

  public applyHitToTarget(hit: Hit, stageObject: StageObject, ) {
    stageObject.applyHitToSelf(hit, this);
  }

  protected setOrientedVelocity(v: { x?: number; y?: number }): void {
    const d = this._orientation.x ? 1 : -1;
    const { x = this.velocity.x, y = this.velocity.y } = v;
    this.velocity = new Vector2(x * d, y);
  }

  protected modifyOrientedPosition(p: {x?: number; y?: number}): void {
    const { x = 0, y = 0 } = p;
    const d = this._orientation.x ? 1 : -1;
    this.position = this.position.add(new Vector2(x * d, y));
  }

  public get orientation(): Direction {
    return { ...this._orientation };
  }

  public get hasFreezeFrames(): boolean {
    return this.freezeFrames > 0;
  }

  public addVfx(vfx: Vfx): void {
    this.activeVfx.push(vfx);
  }

  get sprite(): Phaser.GameObjects.Sprite {
    return this._sprite;
  }

  get pushable(): boolean {
    return this._pushable;
  }
}
