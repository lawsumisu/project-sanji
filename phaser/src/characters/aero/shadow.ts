import { BaseCharacterWithFrameDefinition } from 'src/characters';
import Aero from 'src/characters/aero/aero.character';
import { FrameDefinitionMap } from 'src/characters/frameData';
import { StageObject, UpdateParams } from 'src/stage/stageObject';
import { Hit } from 'src/collider';
import { Scalar } from '@lawsumisu/common-utilities';
import { Unit } from 'src/unit';
import * as _ from 'lodash';
import { AudioKey } from 'src/assets/audio';
import { playAnimation } from 'src/utilitiesPF/animation.util';
import { StateDefinition } from 'src/state';

interface AeroShadowStateConfig {
  startAnimation?: string;
  onHitSound?: AudioKey;
  cancelLock: number;
}

export enum AeroShadowState {
  STAND_L = 'STAND_L',
  STAND_R = 'STAND_R',
  STAND = 'STAND',
  STAND_UPPER = 'STAND_UPPER',
  STAND_DUNK = 'STAND_DUNK'
}

export class AeroShadow extends BaseCharacterWithFrameDefinition<AeroShadowState, StateDefinition<AeroShadowStateConfig>> {
  private readonly aero: Aero;
  private range = 20 * Unit.toPx;
  private speed = 4 * Unit.toPx;
  private readonly onHit: () => void;
  private cancelLock = 0;

  protected defaultState = AeroShadowState.STAND;
  protected audioKeys: AudioKey[] = ['rush1'];
  protected states: { [key in AeroShadowState]: StateDefinition<AeroShadowStateConfig> } = {
    [AeroShadowState.STAND]: {
      startAnimation: 'SHADOW_STAND',
      cancelLock: 0,
      update: () => {
        if (this.sprite.anims.currentFrame.index > 9) {
          this.disable();
        }
      }
    },
    [AeroShadowState.STAND_L]: {
      startAnimation: 'SHADOW_STAND_ATK_L',
      onHitSound: 'hitMed',
      cancelLock: 0,
      update: (tick: number) => {
        if (tick === 0) {
          this.move();
        }
        if (this.sprite.anims.currentFrame.index === 2) {
          this.playSound('rush1');
        }
        if (!this.sprite.anims.isPlaying) {
          this.goToNextState(AeroShadowState.STAND);
        }
      }
    },
    [AeroShadowState.STAND_R]: {
      startAnimation: 'SHADOW_STAND_ATK_R',
      onHitSound: 'hitMed',
      cancelLock: 0,
      update: (tick: number) => {
        if (tick === 0) {
          this.move();
        }
        if (this.sprite.anims.currentFrame.index === 2) {
          this.playSound('rush1');
        }
        if (!this.sprite.anims.isPlaying) {
          this.goToNextState(AeroShadowState.STAND);
        }
      }
    },
    [AeroShadowState.STAND_UPPER]: {
      startAnimation: 'SHADOW_UPPER',
      onHitSound: 'hitMed',
      cancelLock: 24,
      update: () => {
        if (this.sprite.anims.currentFrame.index === 5) {
          this.playSound('rush1');
        }
        if (!this.sprite.anims.isPlaying) {
          this.goToNextState(AeroShadowState.STAND);
        }
      }
    },
    [AeroShadowState.STAND_DUNK]: {
      startAnimation: 'SHADOW_DUNK',
      onHitSound: 'hitMed',
      cancelLock: 24,
      update: (tick: number) => {
        if (tick === 0) {
          this.position.y = this.aero.position.y;
          this.velocity.y = -100;
        }
        if (this.sprite.anims.currentFrame.index === 5) {
          this.playSound('rush1');
        }
        if (!this.sprite.anims.isPlaying) {
          this.goToNextState(AeroShadowState.STAND);
        }
      }
    }
  };
  constructor(aero: Aero, frameDefinitionMap: FrameDefinitionMap, onHit: () => void = _.noop) {
    super(aero.playerIndex, frameDefinitionMap);
    this.aero = aero;
    this.onHit = onHit;
  }

  public create(): void {
    super.create();
    this.sprite.tint = 0x222222;
    this.sprite.alpha = 0.6;
    this.disable();
    this.sprite.depth = 10;
    this.colliderManager.ignoreCollisionsWith(this.aero.tag);
  }

  public enable(params: Partial<{ state: AeroShadowState }> = {}): void {
    let state;
    if (this.cancelLock > 0) {
      return;
    } else if (params.state) {
      if (params.state === AeroShadowState.STAND_L && this.isCurrentState(AeroShadowState.STAND_L)) {
        state = AeroShadowState.STAND_R;
      } else if (params.state === AeroShadowState.STAND_R && this.isCurrentState(AeroShadowState.STAND_R)) {
        state = AeroShadowState.STAND_L;
      } else {
        state = params.state;
      }
    } else if (this.sprite.active && this.isCurrentState(AeroShadowState.STAND_R)) {
      state = AeroShadowState.STAND_L;
    } else {
      state = AeroShadowState.STAND_R;
    }
    this.stateManager.setState(state, {}, true);
    if (!this.sprite.active) {
      this.position = this.aero.position;
      this.sprite.setActive(true).setVisible(true);
    }
  }

  public disable(): void {
    this.sprite.setActive(false).setVisible(false);
  }

  public onTargetHit(target: StageObject, hit: Hit): void {
    super.onTargetHit(target, hit);
    const config = this.states[this.stateManager.current.key];
    if (config && config.onHitSound) {
      this.playSound(config.onHitSound, {}, true);
    }
    this.onHit();
  }

  public update(params: UpdateParams): void {
    this.direction = this.position.x < this.target.position.x ? 1 : -1;
    this.sprite.flipX = this.direction === -1;
    super.update(params);
    this.cancelLock = Math.max(0, this.cancelLock - 1);
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

  protected afterStateTransition(config: AeroShadowStateConfig, params: { startFrame?: number } = {}): void {
    super.afterStateTransition(config, params);
    const { startAnimation } = config;
    if (startAnimation) {
      playAnimation(this.sprite, startAnimation, { force: true, startFrame: params.startFrame });
    }
    this.cancelLock = config.cancelLock;
    this.colliderManager.clearHitboxData();
  }

  public canCancel(inFrames: number = 0): boolean {
    return this.cancelLock - inFrames <= 0;
  }
}
