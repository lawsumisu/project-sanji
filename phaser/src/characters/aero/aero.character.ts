import { PS } from 'src/global';
import { Command } from 'src/command';
import { StageObject } from 'src/stage/stageObject';
import { Hit } from 'src/collider';
import { playAnimation } from 'src/utilitiesPF/animation.util';
import { GameInput } from 'src/plugins/gameInput.plugin';
import aero from 'src/characters/aero/aero.frame';
import { CharacterState, CharacterStateConfig, CommonCharacter, CommonState } from 'src/characters/common';

enum AeroState {
  N_LIGHT = 'N_LIGHT',
  N_LIGHT_2 = 'N_LIGHT_2',
  N_MED = 'N_MED',
  N_MED_2 = 'N_MED_2',
  ROLL = 'ROLL',
}

enum AeroCommand {
  N_LIGHT = 'N_LIGHT',
  N_LIGHT_2 = 'N_LIGHT_2',
  N_MED = 'N_MED',
  N_MED_2 = 'N_MED_2',
  ROLL = 'ROLL'
}

interface AeroStateConfig {
  attackLevel: number;
}

export default class Aero extends CommonCharacter<AeroState, AeroCommand, AeroStateConfig> {
  protected defaultState = CommonState.IDLE;
  private cancelFlag = false;

  protected states: { [key in CharacterState<AeroState>]?: CharacterStateConfig<AeroStateConfig> } = {
    [AeroState.N_LIGHT]: {
      startAnimation: 'LIGHT_JAB_1',
      attackLevel: 1,
      update: () => {
        this.velocity.x = 0;
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [AeroState.N_LIGHT_2]: {
      startAnimation: 'LIGHT_JAB_2',
      attackLevel: 1,
      update: () => {
        this.velocity.x = 0;
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [AeroState.N_MED]: {
      startAnimation: 'GUT_PUNCH_1',
      attackLevel: 2,
      update: () => {
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [AeroState.N_MED_2]: {
      startAnimation: 'GUT_PUNCH_2',
      attackLevel: 2,
      update: () => {
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [AeroState.ROLL]: {
      startAnimation: 'ROLL_STARTUP',
      idle: false,
      update: (tick: number, state: { continue: boolean  }) => {
        this.velocity.x = 0;
        if (!this.sprite.anims.isPlaying) {
          if (this.currentAnimation === 'ROLL_STARTUP') {
            playAnimation(this.sprite,'ROLL_1');
          } else if (state.continue) {
            playAnimation(this.sprite, this.currentAnimation === 'ROLL_1' ? 'ROLL_2' : 'ROLL_1');
            state.continue = false;
          } else {
            this.stateManager.setState(CommonState.IDLE);
          }
        }
        if (tick > 0 && this.input.isInputPressed(GameInput.INPUT1)) {
          state.continue = true;
        }
      }
    }
  };

  constructor(playerIndex = 0) {
    super(playerIndex, aero);
    // TODO make this an overwritten function
    this.stateManager.onBeforeTransition(() => {
      this.cancelFlag = false;
    });

    this.commands = {
      ...this.commands,
      [AeroCommand.N_LIGHT]: {
        command: new Command('a', 1),
        trigger: () => this.stateManager.current.key === CommonState.IDLE || this.canCancel(AeroState.N_LIGHT),
        state: AeroState.N_LIGHT,
        priority: 2
      },
      [AeroCommand.N_LIGHT_2]: {
        command: new Command('a', 1),
        trigger: () => {
          if (this.canChainFrom(AeroState.N_LIGHT, 4)) {
            return () => this.sprite.anims.currentFrame.index >= 4;
          } else {
            return false;
          }
        },
        state: AeroState.N_LIGHT_2,
      },
      [AeroCommand.N_MED]: {
        command: new Command('b', 1),
        trigger: () => this.stateManager.current.key === CommonState.IDLE || this.canCancel(AeroState.N_MED),
        state: AeroState.N_MED,
        priority: 2
      },
      [AeroCommand.N_MED_2]: {
        command: new Command('b', 1),
        trigger: () => {
          if (this.canChainFrom(AeroState.N_MED, 5)) {
            return () => this.sprite.anims.currentFrame.index >= 5;
          } else {
            return false
          }
        },
        state: AeroState.N_MED_2,
      },
      [AeroCommand.ROLL]: {
        command: new Command('d', 1),
        trigger: () => this.isIdle && !this.isAirborne,
        state: AeroState.ROLL,
        priority: 2,
      }
    };
  }

  public preload(): void {
    super.preload();
    PS.stage.load.multiatlas('vanessa', 'characters/aero/vanessa.json', 'characters/aero');
  }

  public onTargetHit(target: StageObject, hit: Hit): void {
    super.onTargetHit(target, hit);
    this.cancelFlag = true;
  }

  public canCancel(nextState: CharacterState<AeroState>): boolean {
    if (this.cancelFlag) {
      const { attackLevel: currentAttackLevel = 0 } = this.states[this.stateManager.current.key]!;
      const { attackLevel: nextAttackLevel = 0 } = this.states[nextState]!;
      return currentAttackLevel < nextAttackLevel;
    } else {
      return false;
    }
  }
}