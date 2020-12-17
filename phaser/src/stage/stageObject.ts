import { Vector2 } from '@lawsumisu/common-utilities';
import { Hit } from 'src/collider';

export interface UpdateParams {
  time: number;
  delta: number; // Number of ms since last update
}

export abstract class StageObject {
  public position: Vector2;
  private static objectCounter = 1;
  public readonly tag: string;
  protected hitlag: number = 0;

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

  protected setHitlag(__: Hit, m = 1): void {
    this.hitlag = Math.floor(5 * m);
  }

  protected get isHitlagged(): boolean {
    return this.hitlag > 0;
  }
}