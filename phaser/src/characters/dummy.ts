import * as _ from 'lodash';
import { StageObject } from 'src/stage/stageObject';
import { StateDefinition, StateManager } from 'src/state';
import { Hit, Hurtbox, HurtboxData } from 'src/frame';
import { Vector2 } from '@lawsumisu/common-utilities';
import { Unit } from 'src/unit';

export class Dummy extends StageObject {
  public position = new Vector2(400, 250);
  private stateManager: StateManager<string>;
  private states: { [key: string]: StateDefinition } = {
    basic: {
      hurtDefinition: (__, hurtboxData: HurtboxData) => {
        return hurtboxData.isEmpty
          ? new HurtboxData(
              [
                { x: 0, y: 0, r: 10 },
                { x: 0, y: -15, r: 5 }
              ].map(({ x, y, r }) => Hurtbox.generateCircular(new Phaser.Geom.Circle(x, y * Unit.toPx, r * Unit.toPx))),

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

  constructor() {
    super();
    this.stateManager = new StateManager<string>(this, () => {
      return {
        index: 0,
        direction: { x: true, y: true },
        frameKey: 'basic'
      };
    });
    _.forEach(this.states, (value: StateDefinition, key: string) => {
      this.stateManager.addState(key, value);
    });
    this.stateManager.setState('basic');
  }

  public update(params: { time: number; delta: number }) {
    super.update(params);
    if (this.isHitlagged) {
      return;
    }

    this.stateManager.update();
  }

  public applyHit(hit: Hit): void {
    console.log(hit);
    this.setHitlag(hit);
  }

  public onTargetHit(target: StageObject): void {
    _.noop(target);
  }
}
