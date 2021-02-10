import * as _ from 'lodash';
import { StageObject } from 'src/stage/stageObject';
import { Hit, Hurtbox, HurtboxData } from 'src/collider';
import { PolarVector, Vector2 } from '@lawsumisu/common-utilities';
import { Unit } from 'src/unit';
import { BaseCharacter } from 'src/characters/index';
import { ColliderManager } from 'src/collider/manager';

export class Dummy extends BaseCharacter {
  public position = new Vector2(400, 250);
  private hitstun = 0;
  protected states = {
    basic: {}
  };

  constructor(playerIndex = 1) {
    super(playerIndex);
    this.defaultState = 'basic';
    this.colliderManager = new ColliderManager((hurtboxData: HurtboxData) => {
      return hurtboxData.isEmpty
        ? new HurtboxData(
            [
              { x: 0, y: -20, r: 10 },
              { x: 0, y: -35, r: 5 }
            ].map(({ x, y, r }) => Hurtbox.generateCircular({ x, y: y * Unit.toPx, r: r * Unit.toPx })),

            'basic',
            this.tag,
            0,
            {
              persist: true
            }
          )
        : null;
    });
  }

  public update(params: { time: number; delta: number }) {
    super.update(params);
    if (this.hasFreezeFrames) {
      return;
    }

    // TODO handle hitstun in super class
    this.hitstun = Math.max(0, this.hitstun - 1);
    if (this.hitstun === 0 && !this.isAirborne) {
      this.velocity.x = 0;
    }
  }

  public applyHit(hit: Hit): void {
    console.log(hit);
    super.applyHit(hit);
    this.setHitstun(hit);
  }

  public onTargetHit(target: StageObject): void {
    _.noop(target);
  }

  private setHitstun(hit: Hit): void {
    this.hitstun = hit.knockback * 0.1;
    this.velocity = new PolarVector(hit.knockback, hit.angle).toCartesian();
  }
}
