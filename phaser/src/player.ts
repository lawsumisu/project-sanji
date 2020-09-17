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
  CROUCH = 'CROUCH'
}

interface CommonStateConfig {
  animation?: string;
}

export class Player {
  protected stateManager: StateManager<CommonState, CommonStateConfig>;

  private sprite: Phaser.GameObjects.Sprite;
  private stage: Stage;

  private walkSpeed: number = 200;

  private velocity: Vector2 = Vector2.ZERO;
  private position: Vector2 = new Vector2(100, 100);
  private direction: -1 | 1 = 1;

  private states: { [key in CommonState]?: StateDefinition<CommonStateConfig> } = {
    [CommonState.IDLE]: {
      animation: 'IDLE',
      update: () => {
      }
    },
    [CommonState.WALK]: {
      update: () => {
        if (!this.input.isInputDown(GameInput.LEFT) && !this.input.isInputDown(GameInput.RIGHT)) {
          this.velocity.x = 0;
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
        if (!_.some([GameInput.DOWN_LEFT, GameInput.DOWN_RIGHT, GameInput.DOWN], this.input.isInputDown)) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
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
    this.sprite = this.stage.add.sprite(100, 100, 'vanessa', 'idle/11.png');
    addAnimationsByDefinition(this.sprite, aero);
    this.stateManager.setState(CommonState.IDLE);
  }

  public update(params: { time: number; delta: number;}): void {
    this.updateState();
    this.updateKinematics(params.delta);
    this.updateSprite();
  }

  private updateState(): void {
    const cmd = new Command('6~6236a', 30, this.stage.gameInput);
    const t = cmd.isExecuted();
    if (t) {
      console.log('hadoken');
    }
    let state = this.stateManager.current.key;
    if (_.some([GameInput.DOWN_LEFT, GameInput.DOWN_RIGHT, GameInput.DOWN], this.input.isInputDown)) {
      state = CommonState.CROUCH;
    } else if (
      state === CommonState.IDLE &&
      (this.input.isInputDown(GameInput.RIGHT) || this.input.isInputDown(GameInput.LEFT))
    ) {
      state = CommonState.WALK;
    }
    this.stateManager.setState(state);
    this.stateManager.update();
  }

  private updateSprite(): void {
    this.sprite.x = this.position.x;
    this.sprite.y = this.position.y;
    this.sprite.anims.setTimeScale(1);
  }

  public updateKinematics(delta: number): void {
    this.position = this.position.add(this.velocity.scale(delta));
  }

  private get input(): GameInputPlugin {
    return this.stage.gameInput;
  }
}
