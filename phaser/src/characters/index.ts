import { StateDefinition, StateManager } from 'src/state';
import { Vector2 } from '@lawsumisu/common-utilities';
import { GameInput, InputHistory } from 'src/plugins/gameInput.plugin';
import * as _ from 'lodash';
import { addAnimationsByDefinition, getFrameIndexFromSpriteIndex } from 'src/characters/frameData';
import aero from 'src/characters/aero/aero.frame';
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
  RUN = 'RUN',
}

export enum CommonCommand {
  WALK = 'WALK',
  JUMP = 'JUMP',
  CROUCH = 'CROUCH',
  RUN = 'RUN',
  DASH_BACK = 'DASH_BACK',
}

interface CommonStateConfig {
  startAnimation?: string;
}

interface CommandTrigger<S extends string> {
  command: Command;
  trigger?: () => boolean;
  executionTrigger?: () => boolean;
  state: CharacterState<S>;
  priority?: number;
}

type CharacterState<T extends string> = T | CommonState;
type CharacterCommand<T extends string> = T | CommonCommand;

export class BaseCharacter<S extends string, C extends string> extends StageObject {
  protected stateManager: StateManager<CharacterState<S>, CommonStateConfig>;
  protected nextStates: Array<{state: CharacterState<S>, executionTrigger: () => boolean }> = [];

  protected sprite: Phaser.GameObjects.Sprite;

  protected walkSpeed = 100;
  protected runSpeed = 175;
  protected dashSpeed = 250;
  protected jumpSpeed = 200;
  protected gravity = 500;

  protected velocity: Vector2 = Vector2.ZERO;
  public position: Vector2 = new Vector2(300, 300);
  private direction: -1 | 1 = 1;

  private readonly playerIndex: number;

  protected commands: {
    [key in CharacterCommand<C>]?: CommandTrigger<S> | CommandTrigger<S>[];
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
      trigger: () => !this.isAirborne,
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

  protected states: { [key in CharacterState<S>]?: StateDefinition<CommonStateConfig> } = {
    [CommonState.IDLE]: {
      startAnimation: 'IDLE',
      update: () => {
        this.velocity.y = 0;
        this.velocity.x = 0;
      }
    },
    [CommonState.WALK]: {
      update: () => {
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
        if (!this.input.isInputDown(GameInput.RIGHT)) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [CommonState.DASH_BACK]: {
      startAnimation: 'DASH_BACK',
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
      update: (tick: number, stateTemporaryValues: { d: -1 | 1 }) => {
        if (tick <= 2) {
          if (tick === 0) {
            this.velocity.x = 0;
            playAnimation(this.sprite, 'SQUAT');
          }
          if (_.some([GameInput.UP_RIGHT, GameInput.UP_LEFT], (gi: GameInput) => this.input.isInputDown(gi))) {
            const jumpDirection = this.input.isInputDown(GameInput.UP_RIGHT) ? 1 : -1;
            stateTemporaryValues.d = jumpDirection === this.direction ? 1 : -1;
          }
        } else if (!this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key === 'SQUAT') {
          this.velocity.y = -this.jumpSpeed;
          this.velocity.x = this.walkSpeed * this.direction * (stateTemporaryValues.d || 0);
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

  constructor(playerIndex = 0) {
    super();
    this.playerIndex = playerIndex;
    this.stateManager = new StateManager<CharacterState<S>, CommonStateConfig>(this, () => {
      const { currentFrame, currentAnim } = this.sprite.anims;
      return {
        index: getFrameIndexFromSpriteIndex(aero[currentAnim.key].animDef, currentFrame.index),
        direction: { x: !this.sprite.flipX, y: true },
        frameDefinition: aero[currentAnim.key],
        frameKey: currentAnim.key
      };
    });
    this.stateManager.onAfterTransition((config: CommonStateConfig) => {
      if (config.startAnimation) {
        playAnimation(this.sprite, config.startAnimation, true);
      }
    });
  }

  public preload(): void {
    _.forEach(this.states, (value: StateDefinition<CommonStateConfig>, key: CharacterState<S>) => {
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
    addAnimationsByDefinition(this.sprite, aero);
    this.stateManager.setState(CommonState.IDLE);
  }

  public applyHit(): void {}

  public onTargetHit(_stageObject: StageObject, hit: Hit): void {
    this.setHitlag(hit);
  }

  public update(params: { time: number; delta: number }): void {
    super.update(params);
    this.updateState();
    if (!this.isHitlagged) {
      this.updateKinematics(params.delta);
      this.updateSprite();
    }
  }

  protected updateState(): void {
    commandListLoop: for (const name of this.commandList) {
      if (_.isArray(this.commands[name])) {
        const commandString = this.commands[name] as CommandTrigger<S>[];
        for (let i = commandString.length - 1; i >= 0; i--) {
          const { command, trigger = () => true, executionTrigger, state } = commandString[i];
          if (this.isNextStateBuffered(state)) {
            break;
          }
          if (i >= 1) {
            // Currently (potentially) executing this string, so check needs to change based on the current state:
            // If state i-1 has not been entered yet, but is buffered, then only need to check if command is executed.
            // If currently in state i-1, then need to check for command and trigger.
            const isNextStateBuffered = this.isNextStateBuffered(commandString[i - 1].state);
            const isCurrentState = this.stateManager.current.key === commandString[i - 1].state;
            if (isNextStateBuffered || isCurrentState) {
              if (command.isExecuted() && (isNextStateBuffered || (isCurrentState && trigger()))) {
                this.queueNextState(state, executionTrigger);
                break commandListLoop;
              }
            }
          } else if (command.isExecuted() && trigger()) {
            // Currently checking commandString[0], so not currently executing this string, so check first command like normal
            this.queueNextState(state);
            break commandListLoop;
          }
        }
      } else {
        const { command, trigger = () => true, state } = this.commands[name] as CommandTrigger<S>;
        if (command.isExecuted() && trigger()) {
          this.queueNextState(state);
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
    if (this.position.y > 300) {
      this.position.y = 300;
      this.velocity.y = 0;
      if (this.stateManager.current.key === CommonState.FALL) {
        this.stateManager.setState(CommonState.IDLE);
      }
    }
  }

  protected isNextStateBuffered(state: CharacterState<S>): boolean {
    return !!this.nextStates.find(nextState => nextState.state === state);
  }

  protected queueNextState(state: CharacterState<S>, executionTrigger: () => boolean = () => true): void {
    if (this.stateManager.current.key !== state && !this.nextStates.find(nextState => nextState.state === state)) {
      this.nextStates.push({ state, executionTrigger });
    }
  }

  protected goToNextState(): void {
    if (this.nextStates.length >= 1) {
      const [nextState, ...rest] = this.nextStates;
      if (nextState.executionTrigger()) {
        console.log(nextState.state, rest.map(i => i.state));
        this.stateManager.setState(nextState.state);
        this.nextStates = rest;
      }
    }
  }

  protected get input(): InputHistory {
    return PS.stage.gameInput.for(this.playerIndex);
  }

  protected get isAirborne(): boolean {
    const state = this.stateManager.current.key;
    return CommonState.FALL === state || (CommonState.JUMP === state && this.sprite.anims.currentAnim.key === 'JUMP');
  }
}
