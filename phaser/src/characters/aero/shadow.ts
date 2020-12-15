import { BaseCharacter } from 'src/characters';
import Aero from 'src/characters/aero/aero.character';
import { StateDefinition } from 'src/state';
import { FrameDefinitionMap } from 'src/characters/frameData';
import { StageObject } from 'src/stage/stageObject';
import { Hit } from 'src/collider';
import { Vector2 } from '@lawsumisu/common-utilities';

export enum AeroShadowState {
  STAND_L = 'STAND_L',
  STAND_R = 'STAND_R',
}

export class AeroShadow extends BaseCharacter<AeroShadowState> {
  private readonly aero: Aero;
  protected defaultState = AeroShadowState.STAND_R;
  protected states: {[key in AeroShadowState]: StateDefinition } = {
    [AeroShadowState.STAND_L]: {
      update: (tick: number) => {
        if (tick === 0) {
          this.playAnimation('MACHINE_GUN_L', true);
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
    this.sprite.alpha = .5;
    this.stop();
  }

  public start(params: Partial<{ state: AeroShadowState, direction: -1 | 1}>): void {
    const { direction = 1 } = params;
    let state;
    if (params.state) {
      state = params.state;
    } else if (this.sprite.active && this.isCurrentState(AeroShadowState.STAND_R)) {
      state = AeroShadowState.STAND_L;
    } else {
      state = this.defaultState;
    }
    this.stateManager.setState(state, {}, true);
    this.sprite.setActive(true).setVisible(true);
    this.sprite.flipX = direction === -1;
    this.position = this.aero.position.add(new Vector2(10, 0));
  }

  public stop(): void {
    this.sprite.setActive(false).setVisible(false);
  }

  public onTargetHit(target: StageObject, hit: Hit): void {
    super.onTargetHit(target, hit);
    this.playSound('hitMed', {}, true);
  }
}