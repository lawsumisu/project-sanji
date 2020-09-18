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
  JUMP = 'JUMP',
  FALL = 'FALL',
  CROUCH = 'CROUCH',
  RUN = 'RUN'
}

enum CommonCommand {
  WALK = 'WALK',
  JUMP = 'JUMP',
  CROUCH = 'CROUCH',
  RUN = 'RUN'
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
  private jumpSpeed = 400;
  private gravity = 1000;

  private velocity: Vector2 = Vector2.ZERO;
  private position: Vector2 = new Vector2(200, 200);
  private direction: -1 | 1 = 1;

  private commands: { [key in CommonCommand]: Command } = {
    JUMP: new Command('7|8|9', 1),
    RUN: new Command('6~6', 10),
    CROUCH: new Command('*1|*2|*3', 1),
    WALK: new Command('*4|*6', 1),
  };

  private commandList: Array<{name: CommonCommand; trigger?: () => boolean; state: CommonState}> = [
    {
      name: CommonCommand.RUN,
      trigger: () => !this.isAirborne,
      state: CommonState.RUN
    },
    {
      name: CommonCommand.JUMP,
      trigger: () => !this.isAirborne,
      state: CommonState.JUMP,
    },
    {
      name: CommonCommand.CROUCH,
      trigger: () => !this.isAirborne,
      state: CommonState.CROUCH,
    },
    {
      name: CommonCommand.WALK,
      trigger: () => this.stateManager.current.key === CommonState.IDLE,
      state: CommonState.WALK,
    }
  ];

  private states: { [key in CommonState]?: StateDefinition<CommonStateConfig> } = {
    [CommonState.IDLE]: {
      animation: 'IDLE',
      update: () => {
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
      animation: 'CROUCH',
      update: () => {
        this.velocity.x = 0;
        if (
          !_.some([GameInput.DOWN_LEFT, GameInput.DOWN_RIGHT, GameInput.DOWN], (gi: GameInput) =>
            this.input.isInputDown(gi)
          )
        ) {
          this.stateManager.setState(CommonState.IDLE);
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
    [CommonState.JUMP]: {
      animation: 'JUMP',
      update: (tick: number) => {
        if (tick === 0) {
          this.velocity.y = -this.jumpSpeed;
          if (_.some([GameInput.UP_RIGHT, GameInput.UP_LEFT], (gi: GameInput) => this.input.isInputPressed(gi))) {
            const jumpDirection = this.input.isInputDown(GameInput.UP_RIGHT) ? 1 : -1;
            const d = jumpDirection === this.direction ? 1 : -1;
            this.velocity.x = this.walkSpeed * this.direction * d;
          }
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
    for (const command of this.commandList) {
      const { name, trigger = () => true, state } = command;
      if (this.commands[name].isExecuted() && trigger()) {
        this.stateManager.setState(state);
        break
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
    return [CommonState.JUMP, CommonState.FALL].includes(this.stateManager.current.key);
  }
}
