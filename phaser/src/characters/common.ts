import { BaseCharacterWithFrameDefinition, CommandTrigger } from 'src/characters/index';
import { StateDefinition } from 'src/state';
import { Command } from 'src/command';
import { playAnimation } from 'src/utilitiesPF/animation.util';
import * as _ from 'lodash';
import { FrameDefinitionMap } from 'src/characters/frameData';
import { PS } from 'src/global';
import { PolarVector, Vector2 } from '@lawsumisu/common-utilities';
import { Unit } from 'src/unit';
import { AudioKey } from 'src/assets/audio';
import { Hit } from 'src/collider';
import { StageObject } from 'src/stage/stageObject';

export enum StateType {
  AIR = 'AIR',
  STAND = 'STAND',
  CROUCH = 'CROUCH',
  IDLE = 'IDLE',
  ATTACK = 'ATTACK',
  BLOCK = 'BLOCK'
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
  BLOCK_CROUCH = 'BLOCK_CROUCH'
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

  protected states: StateMap<S, D>;
  protected audioKeys: AudioKey[] = [];

  private commonStates: { [key in CommonState]: StateDefinition<CommonStateConfig> } = {
    [CommonState.NULL]: { type: [] },
    [CommonState.STAND]: {
      startAnimation: 'STAND',
      type: [StateType.IDLE, StateType.STAND],
      update: () => {
        this.velocity.y = 0;
        this.velocity.x = 0;

      }
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
          this.velocity.x = this.walkSpeed * d;
        }
      }
    },
    [CommonState.CROUCH_TRANSITION]: {
      type: [StateType.IDLE, StateType.CROUCH],
      update: (tick: number) => {
        this.velocity.x = 0;
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
        this.velocity.x = 0;
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
        this.velocity.x = this.runSpeed;
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
          this.velocity.x = -this.dashSpeed;
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
          if (tick === 0) {
            this.velocity.x = 0;
          }
          if (this.isCommandExecuted(Command.registry.FORWARD_ANY) || this.isCommandExecuted(Command.registry.BACK_ANY)) {
            const jumpDirection = this.isCommandExecuted(Command.registry.FORWARD_ANY);
            params.d = jumpDirection ? 1 : -1;
          }
        } else if (!this.sprite.anims.isPlaying && this.currentAnimation === 'SQUAT') {
          this.velocity.y = -this.jumpSpeed;
          this.velocity.x = this.walkSpeed * (params.d || 0);
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
      update: (tick: number) => {
        if (tick === 0) {
          this.velocity.x = 0;
        }
        if (!this.isCommandExecuted(Command.registry.GUARD)) {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [CommonState.BLOCK_CROUCH]: {
      startAnimation: 'BLOCK_CROUCH',
      type: [StateType.BLOCK, StateType.CROUCH],
      update: (tick: number) => {
        if (tick === 0) {
          this.velocity.x = 0;
        }
        if (!this.isCommandExecuted(Command.registry.GUARD)) {
          this.stateManager.setState(CommonState.CROUCH);
        } else if (!this.isCommandExecuted(new Command('*1|*2|*3', 1))) {
          this.stateManager.setState(CommonState.BLOCK_STAND);
        }
      }
    }
  };
  private commonAudioKeys: AudioKey[] = ['land'];

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
        trigger: () =>  this.isIdle && this.isStanding,
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
    this.audioKeys = [ ...this.commonAudioKeys, ...this.audioKeys ];
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
    this.hitstun = Math.max(0, this.hitstun - 1);
    if (this.hitstun === 1 && !this.isAirborne) {
      this.velocity.x = 0;
    }
  }


  public onTargetHit(target: StageObject, hit: Hit): void {
    super.onTargetHit(target, hit);
    const config = this.states[this.stateManager.current.key];
    if (config && config.onHitSound) {
      this.playSound(config.onHitSound, {}, true);
    }
  }

  public applyHit(hit: Hit): void {
    console.log(hit);
    super.applyHit(hit);
    this.setHitstun(hit);
  }

  protected updateKinematics(delta: number): void {
    if (this.isAirborne) {
      this.velocity.y += this.gravity * delta;
    }
    const d = this._orientation.x ? 1: -1;
    const velocity = new Vector2(this.velocity.x * d, this.velocity.y);
    this.position = this.position.add(velocity.scale(delta * Unit.toPx));

    // TODO handle this in a separate function?
    if (this.position.x < PS.stage.left) {
      this.position.x = PS.stage.left;
    } else if (this.position.x > PS.stage.right) {
      this.position.x = PS.stage.right;
    }
    if (this.isAirborne) {
      const bounds = this.bounds;
      if (bounds.bottom > PS.stage.ground) {
        this.position.y = PS.stage.ground;
        this.velocity.y = 0;
        this.stateManager.setState(CommonState.STAND);
        this.playSound('land', { volume: 0.5 }, true);
        // this.sprite.flipX = !this._orientation.x;
      }
    } else if (this.position.y > PS.stage.ground) {
      this.position.y = PS.stage.ground;
    }
  }

  protected afterStateTransition(config: CharacterStateConfig<D>, params: { startFrame?: number } = {}): void {
    super.afterStateTransition(config, params);
    const { startAnimation } = config;
    if (startAnimation) {
      playAnimation(this.sprite, [this.frameDefinitionMap.name, startAnimation].join('-'), { force: true, startFrame: params.startFrame });
    }
  }

  protected get isStanding(): boolean {
    return this.checkStateType(StateType.STAND);
  }

  protected get isCrouching(): boolean {
    return this.checkStateType(StateType.CROUCH);
  }

  protected get isIdle(): boolean {
    return this.checkStateType(StateType.IDLE);
  }

  protected get isAirborne(): boolean {
    return super.isAirborne || this.checkStateType(StateType.AIR);
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

  private setHitstun(hit: Hit): void {
    this.hitstun = hit.knockback * 0.1;
    this.velocity = new PolarVector(hit.knockback, hit.angle).toCartesian();
  }
}
