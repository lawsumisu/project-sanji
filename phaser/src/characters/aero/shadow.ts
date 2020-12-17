import { BaseCharacter } from 'src/characters';
import Aero from 'src/characters/aero/aero.character';
import { StateDefinition } from 'src/state';
import { FrameDefinitionMap } from 'src/characters/frameData';
import { StageObject, UpdateParams } from 'src/stage/stageObject';
import { Hit } from 'src/collider';
import { Scalar } from '@lawsumisu/common-utilities';
import { Unit } from 'src/unit';

export enum AeroShadowState {
  STAND_L = 'STAND_L',
  STAND_R = 'STAND_R'
}

export class AeroShadow extends BaseCharacter<AeroShadowState> {
  private readonly aero: Aero;
  private range = 20 * Unit.toPx;
  private speed = 4 * Unit.toPx;

  protected defaultState = AeroShadowState.STAND_R;
  protected states: { [key in AeroShadowState]: StateDefinition } = {
    [AeroShadowState.STAND_L]: {
      update: (tick: number) => {
        if (tick === 0) {
          this.playAnimation('MACHINE_GUN_L', true);
          this.move();
        }
        if (!this.sprite.anims.isPlaying) {
          this.stop();
        }
      }
    },
    [AeroShadowState.STAND_R]: {
      update: (tick: number) => {
        if (tick === 0) {
          this.playAnimation('MACHINE_GUN_R', true);
          this.move();
        }
        if (!this.sprite.anims.isPlaying) {
          this.stop();
        }
      }
    }
  };
  constructor(aero: Aero, frameDefinitionMap: FrameDefinitionMap) {
    super(aero.playerIndex, frameDefinitionMap);
    this.aero = aero;
  }

  public create(): void {
    super.create();
    this.sprite.tint = 0x222222;
    this.sprite.alpha = 0.6;
    this.stop();
    this.sprite.depth = 10;
    this.stateManager.ignoreCollisionsWith(this.aero.tag);
  }

  public start(params: Partial<{ state: AeroShadowState }> = {}): void {
    let state;
    if (params.state) {
      state = params.state;
    } else if (this.sprite.active && this.isCurrentState(AeroShadowState.STAND_R)) {
      state = AeroShadowState.STAND_L;
    } else {
      state = this.defaultState;
    }
    this.stateManager.setState(state, {}, true);
    if (!this.sprite.active) {
      this.position = this.aero.position;
      this.sprite.setActive(true).setVisible(true);
    }
  }

  public stop(): void {
    this.sprite.setActive(false).setVisible(false);
  }

  public onTargetHit(target: StageObject, hit: Hit): void {
    super.onTargetHit(target, hit);
    this.playSound('hitMed', {}, true);
  }

  public update(params: UpdateParams): void {
    this.direction = this.position.x < this.target.position.x ? 1 : -1;
    this.sprite.flipX = this.direction === -1;
    super.update(params);
  }

  private move(): void {
    const cmp = this.direction === 1 ? Math.min : Math.max;
    const lo = this.aero.position.x + 20 * this.direction;
    const hi = this.target.position.x - 30 * this.direction;
    const nx = this.position.x + this.speed * this.direction;
    const limit = this.aero.position.x + this.range * this.direction;
    if (lo <= hi) {
      this.position.x = Scalar.clamp(cmp(nx, limit), lo, hi);
    } else {
      this.position.x = Scalar.clamp(cmp(nx, limit), hi, lo);
    }
  }
}
