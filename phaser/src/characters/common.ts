import { BaseCharacter, CommandTrigger } from 'src/characters/index';
import { StateDefinition } from 'src/state';
import { Command } from 'src/command';
import { playAnimation } from 'src/utilitiesPF/animation.util';
import * as _ from 'lodash';
import { GameInput } from 'src/plugins/gameInput.plugin';
import { FrameDefinitionMap } from 'src/characters/frameData';
import { PS } from 'src/global';
import { Vector2 } from '@lawsumisu/common-utilities';
import { Unit } from 'src/unit';

export interface CommonStateConfig {
  startAnimation?: string;
  idle?: boolean;
  onHitSound?: string;
}

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

export type CharacterState<T extends string> = T | CommonState;
type CharacterCommand<T extends string> = T | CommonCommand;
export type CharacterStateConfig<T> = Partial<T> & StateDefinition<CommonStateConfig>;

export class CommonCharacter<S extends string = string, C extends string = string, D = {}> extends BaseCharacter<
  CharacterState<S>,
  CharacterCommand<C>,
  CharacterStateConfig<D>
> {
  public static sfx = {
    land: 'sfx/land.ogg'
  };

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
        if (!this.isCommandExecuted(Command.registry.FORWARD) && !this.isCommandExecuted(Command.registry.BACK)) {
          this.stateManager.setState(CommonState.IDLE);
        } else {
          const animation = this.isCommandExecuted(Command.registry.FORWARD) ? 'WALK_FWD' : 'WALK_BACK';
          const d = this.isCommandExecuted(Command.registry.FORWARD) ? 1 : -1;
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
        if (!this.isCommandExecuted(Command.registry.FORWARD)) {
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

  protected commands: {
    [key in CharacterCommand<C>]?: CommandTrigger<CharacterState<S>>;
  } = {
    [CommonCommand.JUMP]: {
      command: new Command('*7|*8|*9', 1),
      trigger: () => !this.isAirborne && this.isIdle,
      state: CommonState.JUMP
    },
    [CommonCommand.RUN]: {
      command: new Command('6~6', 12),
      trigger: () => !this.isAirborne && this.isIdle,
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
      trigger: () => !this.isAirborne && this.isIdle,
      state: CommonState.DASH_BACK,
      priority: 1
    }
  };

  constructor(playerIndex = 0, frameDefinitionMap: FrameDefinitionMap = {}) {
    super(playerIndex, frameDefinitionMap);
  }

  public preload() {
    this.states = { ...this.commonStates, ...this.states };
    super.preload();
  }

  public create() {
    super.create();
    this.position = new Vector2(300, PS.stage.ground);
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
        this.playSound('land', { volume: .5 }, true);
      }
    }
  }

  protected afterStateTransition(config: CharacterStateConfig<D>): void {
    super.afterStateTransition(config);
    const { idle = true, startAnimation } = config;
    if (startAnimation) {
      playAnimation(this.sprite, startAnimation, true);
    }
    this.isIdle = idle;
  }
}
