import { Vector2 } from '@lawsumisu/common-utilities';
import { Direction, Hit } from 'src/collider';

export interface UpdateParams {
  time: number;
  delta: number; // Number of ms since last update
}

export abstract class StageObject {
  public position: Vector2;
  private static objectCounter = 1;
  public readonly tag: string;
  protected hitlag: number = 0;
  protected _orientation: Direction = {x: true, y: true};

  protected constructor() {
    this.tag = ['level-', `${StageObject.objectCounter}`.padStart(3, '0')].join('');
    StageObject.objectCounter++;
  }

  public update(_params: UpdateParams): void {
    if (this.hitlag > 0) {
      this.hitlag = Math.max(0, this.hitlag - 1);
    }
  }

  public abstract applyHit(hit: Hit): void;

  public abstract onTargetHit(stageObject: StageObject, hit: Hit): void;

  public get orientation(): Direction {
    return {...this._orientation };
  }

  protected setHitlag(hit: Hit, m = 1): void {
    this.hitlag = Math.floor(((hit.knockback / 20) + 3) * m);
  }

  public get isHitlagged(): boolean {
    return this.hitlag > 0;
  }
}