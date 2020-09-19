import { Stage } from 'src/stage';
import { StateDefinition, StateManager } from 'src/state';
import { Vector2 } from '@lawsumisu/common-utilities';
import { GameInput, GameInputPlugin } from 'src/plugins/gameInput.plugin';
import * as _ from 'lodash';
import { addAnimationsByDefinition } from 'src/characters';
import aero from 'src/characters/aero/frameData';
import { playAnimation } from 'src/utilitiesPF/animation.util';
import { Command } from 'src/characters/command';

enum CommonState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  DASH_BACK = 'DASH_BACK',
  JUMP = 'JUMP',
  FALL = 'FALL',
  CROUCH = 'CROUCH',
  RUN = 'RUN'
}

enum CommonCommand {
  WALK = 'WALK',
  JUMP = 'JUMP',
  CROUCH = 'CROUCH',
  RUN = 'RUN',
  DASH_BACK = 'DASH_BACK',
}

interface CommonStateConfig {
  animation?: string;
}

export class Player {
  protected stateManager: StateManager<CommonState, CommonStateConfig>;

  private sprite: Phaser.GameObjects.Sprite;
  private stage: Stage;

  private walkSpeed = 200;
  private runSpeed = 350;
  private dashSpeed = 500;
  private jumpSpeed = 400;
  private gravity = 1000;

  private velocity: Vector2 = Vector2.ZERO;
  private position: Vector2 = new Vector2(200, 200);
  private direction: -1 | 1 = 1;

  private commands: {
    [key in CommonCommand]: { command: Command; trigger?: () => boolean; state: CommonState; priority?: number };
  } = {
    JUMP: {
      command: new Command('7|8|9', 1),
      trigger: () => !this.isAirborne,
      state: CommonState.JUMP
    },
    RUN: {
      command: new Command('6~6', 10),
      trigger: () => !this.isAirborne,
      state: CommonState.RUN,
      priority: 1
    },
    CROUCH: {
      command: new Command('*1|*2|*3', 1),
      trigger: () => !this.isAirborne,
      state: CommonState.CROUCH
    },
    WALK: {
      command: new Command('*4|*6', 1),
      trigger: () => this.stateManager.current.key === CommonState.IDLE,
      state: CommonState.WALK
    },
    DASH_BACK: {
      command: new Command('4~4', 10),
      trigger: () => !this.isAirborne,
      state: CommonState.DASH_BACK,
      priority: 1,
    }
  };

  private readonly commandList: CommonCommand[];

  private states: { [key in CommonState]?: StateDefinition<CommonStateConfig> } = {
    [CommonState.IDLE]: {
      animation: 'IDLE',
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
          this.stateManager.setState(CommonState.IDLE);
        } else if (tick === 0) {
          playAnimation(this.sprite, 'SQUAT');
        } else if (!this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key === 'SQUAT') {
          playAnimation(this.sprite, 'CROUCH');
        }
      }
    },
    [CommonState.RUN]: {
      animation: 'RUN',
      update: () => {
        this.velocity.x = this.runSpeed * this.direction;
        if (!this.input.isInputDown(GameInput.RIGHT)) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [CommonState.DASH_BACK]: {
      animation: 'DASH_BACK',
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
        if (tick === 0) {
          playAnimation(this.sprite, 'SQUAT');
          if (_.some([GameInput.UP_RIGHT, GameInput.UP_LEFT], (gi: GameInput) => this.input.isInputPressed(gi))) {
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
      animation: 'FALL'
    }
  };

  constructor(stage: Stage) {
    this.stage = stage;
    this.stateManager = new StateManager<CommonState, CommonStateConfig>();
    this.stateManager.onAfterTransition((config: CommonStateConfig) => {
      if (config.animation) {
        playAnimation(this.sprite, config.animation, true);
      }
    });

    _.forEach(this.states, (value: StateDefinition<CommonStateConfig>, key: CommonState) => {
      this.stateManager.addState(key, value);
    });
    this.commandList = (_.keys(this.commands) as CommonCommand[]).sort((a: CommonCommand, b: CommonCommand) => {
      const p1 = this.commands[a].priority || 0;
      const p2 = this.commands[b].priority || 0;
      return p2 - p1;
    });
  }

  public create() {
    // TODO load create values from file.
    this.sprite = this.stage.add.sprite(this.position.x, this.position.y, 'vanessa', 'idle/11.png');
    addAnimationsByDefinition(this.sprite, aero);
    this.stateManager.setState(CommonState.IDLE);
  }

  public update(params: { time: number; delta: number }): void {
    this.updateState();
    this.updateKinematics(params.delta);
    this.updateSprite();
  }

  private updateState(): void {
    for (const name of this.commandList) {
      const { command, trigger = () => true, state } = this.commands[name];
      if (command.isExecuted() && trigger()) {
        this.stateManager.setState(state);
        break;
      }
    }
    this.stateManager.update();
  }

  private updateSprite(): void {
    this.sprite.x = this.position.x;
    this.sprite.y = this.position.y;
    this.sprite.anims.setTimeScale(1);
  }

  public updateKinematics(delta: number): void {
    if (this.isAirborne) {
      this.velocity.y += this.gravity * delta;
    }
    this.position = this.position.add(this.velocity.scale(delta));

    // TODO handle this in a separate function?
    if (this.position.y > 200) {
      this.position.y = 200;
      if (this.stateManager.current.key === CommonState.FALL) {
        this.stateManager.setState(CommonState.IDLE);
      }
    }
  }

  private get input(): GameInputPlugin {
    return this.stage.gameInput;
  }

  private get isAirborne(): boolean {
    const state = this.stateManager.current.key;
    return CommonState.FALL === state || (CommonState.JUMP === state && this.sprite.anims.currentAnim.key === 'JUMP');
  }
}
