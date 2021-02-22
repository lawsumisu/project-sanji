import { BaseCharacterWithFrameDefinition, CommandTrigger } from 'src/characters/index';
import { StateDefinition } from 'src/state';
import { Command } from 'src/command';
import { playAnimation } from 'src/utilitiesPF/animation.util';
import * as _ from 'lodash';
import { FrameDefinitionMap } from 'src/characters/frameData';
import { PS } from 'src/global';
import { PolarVector, Scalar, Vector2 } from '@lawsumisu/common-utilities';
import { Unit } from 'src/unit';
import { AudioKey } from 'src/assets/audio';
import { Hit, HitType } from 'src/collider';
import { StageObject } from 'src/stage/stageObject';

export enum StateType {
  AIR = 'AIR',
  STAND = 'STAND',
  CROUCH = 'CROUCH',
  IDLE = 'IDLE',
  ATTACK = 'ATTACK',
  BLOCK = 'BLOCK',
  HIT = 'HIT'
}

export interface CommonStateConfig {
  startAnimation?: string;
  onHitSound?: AudioKey;
  type: string[] | string;
}

export enum CommonState {
  NULL = 'NULL',
  STAND = 'STAND',
  WALK = 'WALK',
  DASH_BACK = 'DASH_BACK',
  JUMP = 'JUMP',
  JUMP_SQUAT = 'JUMP_SQUAT',
  FALL = 'FALL',
  CROUCH_TRANSITION = 'CROUCH_TRANSITION',
  CROUCH = 'CROUCH',
  RUN = 'RUN',
  BLOCK_STAND = 'BLOCK_STAND',
  BLOCK_CROUCH = 'BLOCK_CROUCH',
  HIT = 'HIT',
  HIT_AIR = 'HIT_AIR',
  HIT_LAND = 'HIT_LAND',
  WAKE_UP = 'WAKE_UP'
}

export type CharacterState<T extends string> = T | CommonState;
export type CharacterStateConfig<T> = Partial<T> & StateDefinition<CommonStateConfig>;
export type StateMap<S extends string, D> = { [key in S]: CharacterStateConfig<D> } &
  { [key in CommonState]?: CharacterStateConfig<D> };

export class CommonCharacter<S extends string, D> extends BaseCharacterWithFrameDefinition<
  CharacterState<S>,
  CharacterStateConfig<D>
> {
  private hitstun = 0;
  protected isLaunched = false;
  protected knockbackVelocity = Vector2.ZERO;
  protected comboDamage = 0;

  protected states: StateMap<S, D>;
  protected audioKeys: AudioKey[] = [];

  private commonStates: { [key in CommonState]: StateDefinition<CommonStateConfig> } = {
    [CommonState.NULL]: { type: [] },
    [CommonState.STAND]: {
      startAnimation: 'STAND',
      type: [StateType.IDLE, StateType.STAND]
    },
    [CommonState.WALK]: {
      type: [StateType.IDLE, StateType.STAND],
      update: () => {
        if (!this.isCommandExecuted(Command.registry.FORWARD) && !this.isCommandExecuted(Command.registry.BACK)) {
          this.stateManager.setState(CommonState.STAND);
        } else {
          const animation = this.isCommandExecuted(Command.registry.FORWARD) ? 'WALK_FWD' : 'WALK_BACK';
          const d = this.isCommandExecuted(Command.registry.FORWARD) ? 1 : -1;
          this.playAnimation(animation);
          this.setOrientedVelocity({ x: this.walkSpeed * d });
        }
      }
    },
    [CommonState.CROUCH_TRANSITION]: {
      type: [StateType.IDLE, StateType.CROUCH],
      update: (tick: number) => {
        if (!this.isCommandExecuted(new Command('*1|*2|*3', 1))) {
          this.playAnimation('STAND_UP');
        } else if (tick === 0) {
          this.playAnimation('SQUAT');
        } else if (!this.sprite.anims.isPlaying && this.currentAnimation === 'SQUAT') {
          this.stateManager.setState(CommonState.CROUCH);
        }
        if (!this.sprite.anims.isPlaying && this.currentAnimation === 'STAND_UP') {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [CommonState.CROUCH]: {
      startAnimation: 'CROUCH',
      type: [StateType.IDLE, StateType.CROUCH],
      update: () => {
        if (!this.isCommandExecuted(new Command('*1|*2|*3', 1))) {
          this.playAnimation('STAND_UP');
        }
        if (!this.sprite.anims.isPlaying && this.currentAnimation === 'STAND_UP') {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [CommonState.RUN]: {
      startAnimation: 'RUN',
      type: [StateType.IDLE, StateType.STAND],
      update: () => {
        this.setOrientedVelocity({ x: this.runSpeed });
        if (!this.isCommandExecuted(Command.registry.FORWARD)) {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [CommonState.DASH_BACK]: {
      startAnimation: 'DASH_BACK',
      type: [StateType.IDLE, StateType.STAND],
      update: (tick: number) => {
        if (tick === 0) {
          this.setOrientedVelocity({ x: -this.dashSpeed });
        } else if (tick < 9 && this.sprite.anims.currentFrame.index === 2) {
          this.sprite.anims.pause();
        } else if (tick === 10) {
          this.sprite.anims.resume();
          this.velocity.x = 0;
        }
        if (!this.sprite.anims.isPlaying && this.sprite.anims.currentFrame.index === 3) {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [CommonState.JUMP_SQUAT]: {
      startAnimation: 'SQUAT',
      type: [StateType.STAND],
      update: (tick: number, params: { d?: -1 | 1 }) => {
        if (tick <= 2) {
          if (
            this.isCommandExecuted(Command.registry.FORWARD_ANY) ||
            this.isCommandExecuted(Command.registry.BACK_ANY)
          ) {
            const jumpDirection = this.isCommandExecuted(Command.registry.FORWARD_ANY);
            params.d = jumpDirection ? 1 : -1;
          }
        } else if (!this.sprite.anims.isPlaying && this.currentAnimation === 'SQUAT') {
          this.setOrientedVelocity({ x: this.airSpeed * (params.d || 0), y: -this.jumpSpeed });
          this.goToNextState(CommonState.JUMP);
        }
      }
    },
    [CommonState.JUMP]: {
      startAnimation: 'JUMP',
      type: [StateType.IDLE, StateType.AIR],
      update: () => {
        if (this.velocity.y > 0) {
          this.stateManager.setState(CommonState.FALL);
        }
      }
    },
    [CommonState.FALL]: {
      startAnimation: 'FALL',
      type: [StateType.IDLE, StateType.AIR]
    },
    [CommonState.BLOCK_STAND]: {
      startAnimation: 'BLOCK_STAND',
      type: [StateType.BLOCK, StateType.STAND],
      update: () => {
        if (!this.isCommandExecuted(Command.registry.GUARD)) {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [CommonState.BLOCK_CROUCH]: {
      startAnimation: 'BLOCK_CROUCH',
      type: [StateType.BLOCK, StateType.CROUCH],
      update: () => {
        if (!this.isCommandExecuted(Command.registry.GUARD)) {
          this.stateManager.setState(CommonState.CROUCH);
        } else if (!this.isCommandExecuted(new Command('*1|*2|*3', 1))) {
          this.stateManager.setState(CommonState.BLOCK_STAND);
        }
      }
    },
    [CommonState.HIT]: {
      type: [StateType.HIT],
      update: (tick: number, params: { hit: Hit }) => {
        const { hit } = params;
        // TODO remove this after frameData refactor
        let hitVelocity = { angle: hit.angle, magnitude: hit.knockback };
        if (hit.knockback === 0) {
          hitVelocity = this.isLaunched && hit.velocity.air ? hit.velocity.air : hit.velocity.ground;
        }
        hitVelocity.angle = Scalar.toRadians(hitVelocity.angle);
        if (tick === 0) {
          this.comboDamage += hit.damage;
          this.hitstun = hit.hitstun;
          this.knockbackVelocity = Vector2.ZERO;
          this.velocity = new PolarVector(hitVelocity.magnitude, hitVelocity.angle).toCartesian();
          if (this.isLaunched) {
            this.velocity = this.velocity.add(new Vector2(0, -60));
          }
          const t1 =
            hit.type.find((t: HitType) => [HitType.HIGH, HitType.MID, HitType.LOW].includes(t)) || HitType.HIGH;
          const t2 =
            hit.type.find((t: HitType) => [HitType.LAUNCH, HitType.HEAVY, HitType.MEDIUM, HitType.LIGHT].includes(t)) ||
            HitType.LIGHT;
          let animKey = ['HIT', t1, t2].join('_');
          if (this.isLaunched) {
            animKey = 'HIT_HIGH_LAUNCH';
          }
          this.playAnimation(animKey, { force: true });
          if (animKey === 'HIT_HIGH_LAUNCH') {
            this.isLaunched = true;
          }
        }
        if (!this.sprite.anims.isPlaying && this.currentAnimation === 'HIT_HIGH_LAUNCH') {
          this.goToNextState(CommonState.HIT_AIR);
        }
        if (this.hitstun > 0) {
          const s = Math.sign(Math.cos(hitVelocity.angle));
          this.knockbackVelocity.x =
            Math.max(0, hit.pushback.base + this.comboDamage * 0.2 - hit.pushback.decay * tick) * s;
        } else {
          this.knockbackVelocity = Vector2.ZERO;
        }
        if (this.hitstun === 0 && !this.isAirborne) {
          this.isLaunched = false;
          this.comboDamage = 0;
          this.goToNextState(CommonState.STAND);
        }
      }
    },
    [CommonState.HIT_AIR]: {
      type: [StateType.HIT, StateType.AIR],
      startAnimation: 'HIT_HIGH_FALL'
    },
    [CommonState.HIT_LAND]: {
      type: [StateType.HIT],
      startAnimation: 'HIT_LAND',
      update: (tick: number) => {
        if (tick === 0) {
          this.knockbackVelocity = Vector2.ZERO;
          this.comboDamage = 0;
          this.velocity = Vector2.ZERO;
          this.isLaunched = false;
          this.playSoundForAnimation('landHeavy');
        }
        if (!this.sprite.anims.isPlaying) {
          this.goToNextState(CommonState.WAKE_UP);
        }
      }
    },
    [CommonState.WAKE_UP]: {
      type: [StateType.STAND],
      startAnimation: 'WAKE_UP_STAND',
      update: () => {
        if (!this.sprite.anims.isPlaying) {
          this.goToNextState(CommonState.STAND);
        }
      }
    }
  };
  private commonAudioKeys: AudioKey[] = ['land', 'landHeavy'];

  constructor(playerIndex = 0, frameDefinitionMap: FrameDefinitionMap) {
    super(playerIndex, frameDefinitionMap);
    this.defaultState = CommonState.STAND;
    this.commandList = this.getCommandList();
  }

  protected getCommandList(): Array<CommandTrigger<CharacterState<S>>> {
    return [
      {
        command: new Command('*7|*8|*9', 1),
        trigger: () => !this.isAirborne && (this.isIdle || this.checkStateType(StateType.BLOCK)),
        state: CommonState.JUMP_SQUAT
      },
      {
        command: new Command('6~6', 12),
        trigger: () => !this.isAirborne && this.isIdle,
        state: CommonState.RUN,
        priority: 1
      },
      {
        command: new Command('*1|*2|*3', 1),
        trigger: () => !this.isAirborne && this.isIdle && !this.isCrouching,
        state: CommonState.CROUCH_TRANSITION
      },
      {
        command: new Command('*4|*6', 1),
        trigger: () => this.stateManager.current.key === CommonState.STAND,
        state: CommonState.WALK
      },
      {
        command: new Command('4~4', 12),
        trigger: () => !this.isAirborne && this.isIdle,
        state: CommonState.DASH_BACK,
        priority: 1
      },
      {
        command: Command.registry.GUARD,
        trigger: () => this.isIdle && this.isStanding,
        state: CommonState.BLOCK_STAND,
        priority: 1
      },
      {
        command: new Command('*2+*l', 1),
        trigger: () => !this.isAirborne && (this.isIdle || this.checkStateType(StateType.BLOCK)),
        state: CommonState.BLOCK_CROUCH,
        priority: 2
      }
    ];
  }

  public preload() {
    this.states = { ...this.commonStates, ...this.states };
    this.audioKeys = [...this.commonAudioKeys, ...this.audioKeys];
    super.preload();
  }

  public create() {
    super.create();
    this.position = new Vector2(300, PS.stage.ground);
  }

  public update(params: { time: number; delta: number }): void {
    if (this.isIdle && !this.isAirborne) {
      this._orientation.x = this.position.x < this.target.position.x;
    }
    super.update(params);
    this.updateHitstun();
    // PS.stage.debugDraw.rect(this.bounds);
  }

  public onTargetHit(target: StageObject, hit: Hit): void {
    super.onTargetHit(target, hit);
    const config = this.states[this.stateManager.current.key];
    // TODO move onHitSound to frame data
    if (config && config.onHitSound) {
      PS.stage.playSound(config.onHitSound, {});
    } else if (hit.sfx && this.audioKeys.includes(hit.sfx as AudioKey)) {
      PS.stage.playSound(hit.sfx as AudioKey, {});
    }
  }

  public applyHit(hit: Hit): void {
    console.log(hit);
    super.applyHit(hit);
    this.goToNextState(CommonState.HIT, { hit }, true);
    this.stateManager.update();
  }

  protected updateKinematics(delta: number): void {
    if (this.isAirborne) {
      this.velocity.y += this.gravity * delta;
    }
    this.position = this.position.add(this.velocity.add(this.knockbackVelocity).scale(delta * Unit.toPx));

    // TODO handle this in a separate function?
    if (this.position.x < PS.stage.left) {
      if (this.hitstun) {
        this.target.position.x -= this.position.x - PS.stage.left;
      }
      this.position.x = PS.stage.left;
    } else if (this.position.x > PS.stage.right) {
      if (this.hitstun) {
        this.target.position.x -= this.position.x - PS.stage.right;
      }
      this.position.x = PS.stage.right;
    }
    if (this.velocity.y >= 0) {
      if (this.isLaunched || this.checkStateType(StateType.AIR)) {
        // const bounds = this.bounds;
        if (this.position.y > PS.stage.ground) {
          this.position.y = PS.stage.ground;
          this.velocity.y = 0;
          if (this.isHit) {
            this.goToNextState(CommonState.HIT_LAND);
          } else {
            // TODO add this to landing state.
            this.goToNextState(CommonState.STAND);
            PS.stage.playSound('land', {});
          }
        }
      } else if (this.position.y > PS.stage.ground) {
        this.position.y = PS.stage.ground;
        this.velocity = Vector2.ZERO;
      }
    }
  }

  protected updateHitstun(): void {
    if (this.hitstun > 0 && !this.hasFreezeFrames) {
      this.hitstun = Math.max(0, this.hitstun - 1);
      if (this.hitstun === 0 && !this.isAirborne) {
        this.velocity.x = 0;
      }
    }
  }

  protected afterStateTransition(config: CharacterStateConfig<D>, params: { startFrame?: number } = {}): void {
    super.afterStateTransition(config, params);
    const { startAnimation } = config;
    if (startAnimation) {
      playAnimation(this.sprite, [this.frameDefinitionMap.name, startAnimation].join('-'), {
        force: true,
        startFrame: params.startFrame
      });
    }
    if (this.checkStateType(StateType.ATTACK)) {
      this.sprite.depth = 25;
    } else {
      this.sprite.depth = 20;
    }
    if (!this.isAirborne) {
      this.velocity = Vector2.ZERO;
    }
  }

  protected get isStanding(): boolean {
    return this.checkStateType(StateType.STAND);
  }

  protected get isCrouching(): boolean {
    return this.checkStateType(StateType.CROUCH);
  }

  protected get isHit(): boolean {
    return this.checkStateType(StateType.HIT);
  }

  protected get isIdle(): boolean {
    return this.checkStateType(StateType.IDLE);
  }

  protected get isAirborne(): boolean {
    return super.isAirborne || this.checkStateType(StateType.AIR) || this.isLaunched;
  }

  protected checkStateType(
    toMatch: string | string[],
    state: CharacterState<S> = this.stateManager.current.key
  ): boolean {
    const { type } = this.states[state]!;
    const toMatchArray = _.isArray(toMatch) ? toMatch : [toMatch];
    const typeSet = _.isArray(type) ? new Set(type) : new Set([type]);
    return _.every(toMatchArray, m => typeSet.has(m));
  }

  /**
   * Checks if a state can be chained from a given state, up through the specified frame.
   */
  protected canChainFrom(fromState: CharacterState<S>, throughFrame = Number.MAX_VALUE): boolean {
    const lastQueuedState = this.nextStates[this.nextStates.length - 1];
    return (
      (lastQueuedState && lastQueuedState.state === fromState) ||
      (this.isCurrentState(fromState) && this.sprite.anims.currentFrame.index <= throughFrame)
    );
  }

  protected get bounds(): Phaser.Geom.Rectangle {
    const { flipX } = this.sprite;
    const {
      width,
      height,
      centerX,
      centerY,
      pivotX,
      pivotY,
      x,
      y,
      realHeight,
      realWidth
    } = this.sprite.anims.currentFrame.frame;
    const fx = flipX ? -1 : 1;
    const rect = new Phaser.Geom.Rectangle(0, 0, width, height);
    rect.centerX = this.position.x - (pivotX * realWidth - centerX - x) * fx;
    rect.centerY = this.position.y - pivotY * realHeight + centerY + y;
    return rect;
  }
}
