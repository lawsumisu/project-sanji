import * as _ from 'lodash';
import { StageObject } from 'src/stage/stageObject';
import { StateDefinition } from 'src/state';
import { Hit, Hurtbox, HurtboxData } from 'src/collider';
import { PolarVector, Vector2 } from '@lawsumisu/common-utilities';
import { Unit } from 'src/unit';
import { BaseCharacter } from 'src/characters/index';

export class Dummy extends BaseCharacter {
  public position = new Vector2(400, 250);
  protected velocity = Vector2.ZERO;
  private hitstun = 0;
  protected states: { [key: string]: StateDefinition } = {
    basic: {
      hurtDefinition: (__, hurtboxData: HurtboxData) => {
        return hurtboxData.isEmpty
          ? new HurtboxData(
              [
                { x: 0, y: 0, r: 10 },
                { x: 0, y: -15, r: 5 }
              ].map(({ x, y, r }) => Hurtbox.generateCircular({ x, y: y * Unit.toPx, r: r * Unit.toPx })),

              'basic',
              this.tag,
              0,
              {
                persist: true
              }
            )
          : null;
      }
    }
  };

  constructor(playerIndex = 1) {
    super(playerIndex);
    this.commands = {};
    this.defaultState = 'basic';
  }

  public update(params: { time: number; delta: number }) {
    super.update(params);
    if (this.isHitlagged) {
      return;
    }

    this.stateManager.update();
    this.updateKinematics(params.delta);
    this.hitstun = Math.max(0, this.hitstun - 1);
    if (this.hitstun === 0) {
      this.velocity = Vector2.ZERO;
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
    this.hitstun = hit.knockback / 3;
    this.velocity = new PolarVector(hit.knockback, hit.angle).toCartesian();
  }
}
