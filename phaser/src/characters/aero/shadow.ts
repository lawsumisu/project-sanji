import { BaseCharacterWithFrameDefinition } from 'src/characters';
import Aero from 'src/characters/aero/aero.character';
import { FrameDefinitionMap } from 'src/characters/frameData';
import { StageObject, UpdateParams } from 'src/stage/stageObject';
import { Hit } from 'src/collider';
import { Scalar, Vector2 } from '@lawsumisu/common-utilities';
import { Unit } from 'src/unit';
import * as _ from 'lodash';
import { AudioKey } from 'src/assets/audio';
import { playAnimation } from 'src/utilitiesPF/animation.util';
import { StateDefinition } from 'src/state';
import { PS } from 'src/global';

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
  // TODO set states with constructor; provide access to position, velocity, and sprite via stateParams.
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
          this.position.y = PS.stage.ground;
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
          this.position.y = PS.stage.ground;
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
        this.position.y = PS.stage.ground;
        if (this.sprite.anims.currentFrame.index === 3) {
          this.playSound('rush1');
        }
        if (!this.sprite.anims.isPlaying) {
          this.goToNextState(AeroShadowState.STAND);
        }
      }
    },
    [AeroShadowState.STAND_DUNK]: {
      startAnimation: 'SHADOW_DUNK',
      onHitSound: 'hitHeavy',
      cancelLock: 24,
      update: (tick: number) => {
        if (tick === 0) {
          this.position.y = PS.stage.ground;
          this.velocity.x = this.aero.velocity.x;
          this.velocity.y = -90;
        } else if (this.position.y === PS.stage.ground) {
          this.velocity.x = 0;
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
    this.colliderManager.ignoreCollisionsWith(this.aero.tag);
  }

  public enable(params: Partial<{ state: AeroShadowState, velocity: Vector2 }> = {}): void {
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
    this.stateManager.setState(state, params, true);
    if (!this.sprite.active) {
      this.position = this.aero.position;
      this.sprite.setActive(true).setVisible(true);
    }
    this.freezeFrames = 0;
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
    this._orientation.x = this.position.x < this.target.position.x;
    this.sprite.flipX = !this._orientation.x;
    super.update(params);
    this.cancelLock = Math.max(0, this.cancelLock - 1);
  }

  private move(): void {
    const d = this._orientation.x ? 1 : -1;
    const cmp = this._orientation.x ? Math.min : Math.max;
    const lo = this.aero.position.x + 20 * d;
    const hi = this.target.position.x - 30 * d;
    const nx = this.position.x + this.speed * d;
    const limit = this.aero.position.x + this.range * d;
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
      playAnimation(this.sprite, [this.frameDefinitionMap.name,startAnimation].join('-'), { force: true, startFrame: params.startFrame });
    }
    this.cancelLock = config.cancelLock;
    this.colliderManager.clearHitboxData();
  }

  public canCancel(inFrames: number = 0): boolean {
    return this.cancelLock - inFrames <= 0;
  }

  public get isActive(): boolean {
    return this.sprite.active;
  }
}


