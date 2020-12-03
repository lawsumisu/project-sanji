import { StateDefinition, StateManager } from 'src/state';
import { Vector2 } from '@lawsumisu/common-utilities';
import { GameInput, InputHistory } from 'src/plugins/gameInput.plugin';
import * as _ from 'lodash';
import { addAnimationsByDefinition, FrameDefinitionMap, getFrameIndexFromSpriteIndex } from 'src/characters/frameData';
import { playAnimation } from 'src/utilitiesPF/animation.util';
import { Command } from 'src/command/';
import { PS } from 'src/global';
import { StageObject } from 'src/stage/stageObject';
import { Unit } from 'src/unit';
import { Hit } from 'src/collider';

export enum CommonState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  DASH_BACK = 'DASH_BACK',
  JUMP = 'JUMP',
  FALL = 'FALL',
  CROUCH = 'CROUCH',
  RUN = 'RUN'
}

export enum CommonCommand {
  WALK = 'WALK',
  JUMP = 'JUMP',
  CROUCH = 'CROUCH',
  RUN = 'RUN',
  DASH_BACK = 'DASH_BACK'
}

export interface CommonStateConfig {
  startAnimation?: string;
  idle?: boolean;
}

interface CommandTrigger<S extends string> {
  command: Command;
  trigger?: () => boolean | (() => boolean);
  state: CharacterState<S>;
  priority?: number;
}

export type CharacterState<T extends string> = T | CommonState;
type CharacterCommand<T extends string> = T | CommonCommand;
export type CharacterStateConfig<T> = Partial<T> & StateDefinition<CommonStateConfig>;

export class BaseCharacter<S extends string = string, C extends string = string, D = {}> extends StageObject {
  protected stateManager: StateManager<CharacterState<S>, CharacterStateConfig<D>>;
  protected nextStates: Array<{ state: CharacterState<S>; executionTrigger: () => boolean }> = [];
  protected defaultState: S | CommonState;
  protected frameDefinitionMap: FrameDefinitionMap;

  protected sprite: Phaser.GameObjects.Sprite;

  protected walkSpeed = 100;
  protected runSpeed = 175;
  protected dashSpeed = 250;
  protected jumpSpeed = 200;
  protected gravity = 500;

  protected velocity: Vector2 = Vector2.ZERO;
  public position: Vector2 = Vector2.ZERO;
  private direction: -1 | 1 = 1;

  private readonly playerIndex: number;
  protected target: StageObject;
  protected isIdle: boolean;

  protected commands: {
    [key in CharacterCommand<C>]?: CommandTrigger<S>;
  } = {
    [CommonCommand.JUMP]: {
      command: new Command('7|8|9', 1),
      trigger: () => !this.isAirborne,
      state: CommonState.JUMP
    },
    [CommonCommand.RUN]: {
      command: new Command('6~6', 12),
      trigger: () => !this.isAirborne,
      state: CommonState.RUN,
      priority: 1
    },
    [CommonCommand.CROUCH]: {
      command: new Command('*1|*2|*3', 1),
      trigger: () => !this.isAirborne && this.isIdle,
      state: CommonState.CROUCH
    },
    [CommonCommand.WALK]: {
      command: new Command('*4|*6', 1),
      trigger: () => this.stateManager.current.key === CommonState.IDLE,
      state: CommonState.WALK
    },
    [CommonCommand.DASH_BACK]: {
      command: new Command('4~4', 12),
      trigger: () => !this.isAirborne,
      state: CommonState.DASH_BACK,
      priority: 1
    }
  };

  private commandList: CharacterCommand<C>[];

  protected states: { [key in CharacterState<S>]?: CharacterStateConfig<D> } = {};
  private commonStates: { [key in CommonState]: StateDefinition<CommonStateConfig> } = {
    [CommonState.IDLE]: {
      startAnimation: 'IDLE',
      update: () => {
        this.velocity.y = 0;
        this.velocity.x = 0;
        this.sprite.flipX = this.direction === -1;
      }
    },
    [CommonState.WALK]: {
      update: () => {
        this.sprite.flipX = this.direction === -1;
        if (!this.input.isInputDown(GameInput.LEFT) && !this.input.isInputDown(GameInput.RIGHT)) {
          this.stateManager.setState(CommonState.IDLE);
        } else {
          const walkDirection = this.input.isInputDown(GameInput.RIGHT) ? 1 : -1;
          const animation = walkDirection === this.direction ? 'WALK_FWD' : 'WALK_BACK';
          const d = walkDirection === this.direction ? 1 : -1;
          playAnimation(this.sprite, animation);
          this.velocity.x = this.walkSpeed * this.direction * d;
        }
      }
    },
    [CommonState.CROUCH]: {
      update: (tick: number) => {
        this.velocity.x = 0;
        if (
          !_.some([GameInput.DOWN_LEFT, GameInput.DOWN_RIGHT, GameInput.DOWN], (gi: GameInput) =>
            this.input.isInputDown(gi)
          )
        ) {
          playAnimation(this.sprite, 'STAND_UP');
        } else if (tick === 0) {
          playAnimation(this.sprite, 'SQUAT');
        } else if (!this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key === 'SQUAT') {
          playAnimation(this.sprite, 'CROUCH');
        }
        if (!this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key === 'STAND_UP') {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [CommonState.RUN]: {
      startAnimation: 'RUN',
      update: () => {
        this.velocity.x = this.runSpeed * this.direction;
        if (!this.isCommandExecuted(Command.common.FORWARD)) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [CommonState.DASH_BACK]: {
      startAnimation: 'DASH_BACK',
      idle: false,
      update: (tick: number) => {
        if (tick === 0) {
          this.velocity.x = this.dashSpeed * -this.direction;
        } else if (tick < 9 && this.sprite.anims.currentFrame.index === 2) {
          this.sprite.anims.pause();
        } else if (tick === 10) {
          this.sprite.anims.resume();
          this.velocity.x = 0;
        }
        if (!this.sprite.anims.isPlaying && this.sprite.anims.currentFrame.index === 3) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [CommonState.JUMP]: {
      startAnimation: 'SQUAT',
      update: (tick: number, state: { d: -1 | 1 | undefined }) => {
        if (tick <= 2) {
          if (tick === 0) {
            this.velocity.x = 0;
          }
          if (_.some([GameInput.UP_RIGHT, GameInput.UP_LEFT], (gi: GameInput) => this.input.isInputDown(gi))) {
            const jumpDirection = this.input.isInputDown(GameInput.UP_RIGHT) ? 1 : -1;
            state.d = jumpDirection === this.direction ? 1 : -1;
          }
        } else if (!this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key === 'SQUAT') {
          this.velocity.y = -this.jumpSpeed;
          this.velocity.x = this.walkSpeed * this.direction * (state.d || 0);
          playAnimation(this.sprite, 'JUMP');
        }
        if (this.velocity.y > 0) {
          this.stateManager.setState(CommonState.FALL);
        }
      }
    },
    [CommonState.FALL]: {
      startAnimation: 'FALL'
    }
  };

  constructor(playerIndex = 0, frameDefinitionMap: FrameDefinitionMap = {}) {
    super();
    this.frameDefinitionMap = frameDefinitionMap;
    this.playerIndex = playerIndex;
    this.stateManager = new StateManager<CharacterState<S>, D>(this, () => {
      const { currentFrame: frame, currentAnim: anim } = this.sprite.anims;
      return {
        index: anim ? getFrameIndexFromSpriteIndex(this.frameDefinitionMap[anim.key].animDef, frame.index) : -1,
        direction: { x: !this.sprite.flipX, y: true },
        frameDefinition: anim && this.frameDefinitionMap[anim.key],
        frameKey: anim && anim.key
      };
    });
    this.stateManager.onAfterTransition(config => this.afterStateTransition(config));
  }

  public preload(): void {
    this.states = { ...this.commonStates, ...this.states };
    _.forEach(this.states, (value: CharacterStateConfig<D>, key: CharacterState<S>) => {
      this.stateManager.addState(key, value);
    });
    this.commandList = (_.keys(this.commands) as CharacterCommand<C>[]).sort((a, b) => {
      const cA = this.commands[a];
      const cB = this.commands[b];
      const p1 = (_.isArray(cA) ? cA[0].priority : (cA as CommandTrigger<S>).priority) || 0;
      const p2 = (_.isArray(cB) ? cB[0].priority : (cB as CommandTrigger<S>).priority) || 0;
      return p2 - p1;
    });
  }

  public create() {
    // TODO load create values from file.
    this.sprite = PS.stage.add.sprite(this.position.x, this.position.y, 'vanessa', 'idle/11.png');
    addAnimationsByDefinition(this.sprite, this.frameDefinitionMap);
    this.stateManager.setState(this.defaultState);

    this.position = new Vector2(300, PS.stage.ground);
  }

  public applyHit(hit: Hit): void {
    this.setHitlag(hit);
  }

  public onTargetHit(_stageObject: StageObject, hit: Hit): void {
    this.setHitlag(hit);
  }

  public setTarget(stageObject: StageObject): void {
    this.target = stageObject;
  }

  public update(params: { time: number; delta: number }): void {
    super.update(params);
    this.direction = this.position.x < this.target.position.x ? 1 : -1;
    this.updateState();
    if (!this.isHitlagged) {
      this.updateKinematics(params.delta);
      this.updateSprite();
    }
  }

  protected updateState(): void {
    for (const name of this.commandList) {
      const { command, trigger = () => true, state } = this.commands[name] as CommandTrigger<S>;
      if (this.isCommandExecuted(command)) {
        const canTransition = trigger();
        if (_.isFunction(canTransition)) {
          // chainable state, so add to queue
          this.queueNextState(state, canTransition);
        } else if (canTransition) {
          // Immediately transition to next state.
          this.goToNextState(state);
          break;
        }
      }
    }
    if (this.isHitlagged) {
      this.sprite.anims.pause();
    } else {
      this.sprite.anims.resume();
      this.goToNextState();
      this.stateManager.update();
    }
  }

  protected updateSprite(): void {
    this.sprite.x = this.position.x;
    this.sprite.y = this.position.y;
  }

  protected updateKinematics(delta: number): void {
    if (this.isAirborne) {
      this.velocity.y += this.gravity * delta;
    }
    this.position = this.position.add(this.velocity.scale(delta * Unit.toPx));

    // TODO handle this in a separate function?
    if (this.position.y > PS.stage.ground) {
      this.position.y = PS.stage.ground;
      this.velocity.y = 0;
      if (this.stateManager.current.key === CommonState.FALL) {
        this.stateManager.setState(CommonState.IDLE);
      }
    }
  }

  protected afterStateTransition(config: CharacterStateConfig<D>): void {
    const { idle = true, startAnimation } = config;
    if (startAnimation) {
      playAnimation(this.sprite, startAnimation, true);
    }
    this.isIdle = idle;
  }

  protected isNextStateBuffered(state: CharacterState<S>): boolean {
    return !!this.nextStates.find(nextState => nextState.state === state);
  }

  protected queueNextState(state: CharacterState<S>, executionTrigger: () => boolean = () => true): void {
    if (this.stateManager.current.key !== state && !this.nextStates.find(nextState => nextState.state === state)) {
      this.nextStates.push({ state, executionTrigger });
    }
  }

  /**
   * Transition to the next state in the state transition queue.
   * If a state is provided directly, transition to that state immediately (this will clear the transition queue).
   * @param state
   */
  protected goToNextState(state?: CharacterState<S>): void {
    if (state) {
      this.nextStates = [];
      this.stateManager.setState(state);
    } else if (this.nextStates.length >= 1) {
      const [nextState, ...rest] = this.nextStates;
      if (nextState.executionTrigger()) {
        console.log(
          nextState.state,
          rest.map(i => i.state)
        );
        this.stateManager.setState(nextState.state);
        this.nextStates = rest;
      }
    }
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

  protected isCurrentState(state: CharacterState<S>): boolean {
    return this.stateManager.current.key === state;
  }

  protected isCommandExecuted(command: Command): boolean {
    return command.isExecuted(this.playerIndex, this.direction === 1);
  }

  protected get input(): InputHistory {
    return PS.stage.gameInput.for(this.playerIndex);
  }

  protected get isAirborne(): boolean {
    const state = this.stateManager.current.key;
    return CommonState.FALL === state || (CommonState.JUMP === state && this.sprite.anims.currentAnim.key === 'JUMP');
  }

  protected get currentAnimation(): string {
    return this.sprite.anims.currentAnim.key;
  }
}
