import { addAnimation } from 'src/utilitiesPF/animation.util';
import { Stage } from 'src/stage';
import { StateDefinition, StateManager } from 'src/state';
import { Vector2 } from '@lawsumisu/common-utilities';
import { GameInput, GameInputPlugin } from 'src/plugins/gameInput.plugin';
import * as _ from 'lodash';

enum CommonState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  JUMP = 'JUMP',
  FALL = 'FALL',
  CROUCH = 'CROUCH'
}

export class Player {
  protected stateManager: StateManager<CommonState>;

  private sprite: Phaser.GameObjects.Sprite;
  private stage: Stage;

  private walkSpeed: number = 200;

  private velocity: Vector2 = Vector2.ZERO;
  private position: Vector2 = new Vector2(100, 100);

  private states: { [key in CommonState]?: StateDefinition } = {
    [CommonState.IDLE]: {
      update: () => {
      }
    },
    [CommonState.WALK]: {
      update: () => {
        if (!this.input.isInputDown(GameInput.LEFT) && !this.input.isInputDown(GameInput.RIGHT)) {
          this.velocity.x = 0;
          this.stateManager.setState(CommonState.IDLE);
        } else {
          this.velocity.x = this.walkSpeed * (this.input.isInputDown(GameInput.LEFT) ? -1 : 1);
        }
      }
    }
  };

  constructor(stage: Stage) {
    this.stage = stage;
    this.stateManager = new StateManager<CommonState>();

    _.forEach(this.states, (value: StateDefinition, key: CommonState) => {
      this.stateManager.addState(key, value);
    });
  }

  public create() {
    // TODO load create values from file.
    this.sprite = this.stage.add.sprite(100, 100, 'vanessa', 'idle/11.png');
    addAnimation(this.sprite, 'idle', 'vanessa', 6, 'idle', 10);
    this.sprite.anims.play('idle');
    this.stateManager.setState(CommonState.IDLE);
  }

  public update(params: { time: number; delta: number;}): void {
    this.updateState();
    this.updateKinematics(params.delta);
    this.updateSprite();
  }

  private updateState(): void {
    let state = this.stateManager.current.key;
    if (
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
