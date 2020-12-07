import { PS } from 'src/global';
import { Command } from 'src/command';
import { StageObject } from 'src/stage/stageObject';
import { Hit } from 'src/collider';
import { playAnimation } from 'src/utilitiesPF/animation.util';
import { GameInput } from 'src/plugins/gameInput.plugin';
import aero from 'src/characters/aero/aero.frame';
import { CharacterState, CharacterStateConfig, CommonCharacter, CommonState } from 'src/characters/common';
import { CommandTrigger } from 'src/characters';

enum AeroState {
  STAND_LIGHT_L_1 = 'STAND_LIGHT_L_1',
  STAND_LIGHT_L_2 = 'STAND_LIGHT_L_2',
  STAND_LIGHT_R_1 = 'STAND_LIGHT_R_1',
  STAND_LIGHT_R_2 = 'STAND_LIGHT_R_2',
  STAND_MED_L_1 = 'STAND_MED_L_1',
  STAND_MED_L_2 = 'STAND_MED_L_2',
  STAND_MED_R_1 = 'STAND_MED_R_1',
  STAND_MED_R_2 = 'STAND_MED_R_2',
  STAND_HEAVY = 'STAND_HEAVY',
  ROLL = 'ROLL'
}

interface AeroStateConfig {
  attackLevel: number;
}

export default class Aero extends CommonCharacter<AeroState, AeroStateConfig> {
  public static sfx = {
    ...CommonCharacter.sfx,
    hitLight: 'sfx/hits/SE_00007.ogg',
    hitMed: 'sfx/hits/SE_00008.ogg',
    hitHeavy: 'sfx/hits/SE_00009.ogg',
    punch1: 'sfx/hits/SE_00025.ogg',
    punch2: 'sfx/hits/SE_00026.ogg',
    jabVoice: 'sfx/vanessa/001.ogg',
  };

  protected defaultState = CommonState.IDLE;
  private cancelFlag = false;

  protected states: { [key in CharacterState<AeroState>]?: CharacterStateConfig<AeroStateConfig> } = {
    [AeroState.STAND_LIGHT_L_1]: {
      startAnimation: 'LIGHT_JAB_1',
      attackLevel: 1,
      idle: false,
      onHitSound: 'hitLight',
      update: () => {
        this.velocity.x = 0;
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [AeroState.STAND_LIGHT_L_2]: {
      startAnimation: 'LIGHT_JAB_2',
      attackLevel: 1,
      idle: false,
      onHitSound: 'hitLight',
      update: () => {
        this.velocity.x = 0;
        if (this.sprite.anims.currentFrame.index === 2) {
          this.playSound('jabVoice', { volume: .5 });
        } else if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [AeroState.STAND_LIGHT_R_1]: {
      startAnimation: 'LIGHT_3',
      attackLevel: 1,
      idle: false,
      onHitSound: 'hitLight',
      update: () => {
        this.velocity.x = 0;
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [AeroState.STAND_LIGHT_R_2]: {
      startAnimation: 'LIGHT_4',
      attackLevel: 1,
      idle: false,
      onHitSound: 'hitLight',
      update: () => {
        this.velocity.x = 0;
        if (this.sprite.anims.currentFrame.index === 2) {
          this.playSound('jabVoice', { volume: .5 });
        } else if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [AeroState.STAND_MED_R_1]: {
      startAnimation: 'GUT_PUNCH_1',
      attackLevel: 2,
      idle: false,
      onHitSound: 'hitMed',
      update: () => {
        this.velocity.x = 0;
        if (this.sprite.anims.currentFrame.index === 3) {
          this.playSound('punch1', { volume: 0.5 });
        }
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [AeroState.STAND_MED_L_1]: {
      startAnimation: 'GUT_PUNCH_2',
      attackLevel: 2,
      idle: false,
      onHitSound: 'hitMed',
      update: () => {
        if (this.sprite.anims.currentFrame.index === 2) {
          this.playSound('punch1', { volume: 0.5 });
        }
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [AeroState.STAND_MED_R_2]: {
      startAnimation: 'STAND_MED_R_2',
      attackLevel: 2,
      idle: false,
      onHitSound: 'hitMed',
      update: () => {
        this.velocity.x = 0;
        if (this.sprite.anims.currentFrame.index === 3) {
          this.playSound('punch1', { volume: 0.5 });
        }
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [AeroState.STAND_MED_L_2]: {
      startAnimation: 'STAND_MED_L_2',
      attackLevel: 2,
      idle: false,
      onHitSound: 'hitMed',
      update: () => {
        this.velocity.x = 0;
        if (this.sprite.anims.currentFrame.index === 4) {
          this.playSound('punch1', { volume: 0.5 });
        }
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [AeroState.STAND_HEAVY]: {
      startAnimation: 'STRAIGHT',
      attackLevel: 3,
      idle: false,
      onHitSound: 'hitHeavy',
      update: () => {
        if (this.sprite.anims.currentFrame.index === 3) {
          this.playSound('punch2', { volume: 0.5 });
        }
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.IDLE);
        }
      }
    },
    [AeroState.ROLL]: {
      startAnimation: 'ROLL_STARTUP',
      idle: false,
      update: (tick: number, localState: { continue: boolean }) => {
        this.velocity.x = 0;
        if (!this.sprite.anims.isPlaying) {
          if (this.currentAnimation === 'ROLL_STARTUP') {
            playAnimation(this.sprite, 'ROLL_1');
          } else if (localState.continue) {
            playAnimation(this.sprite, this.currentAnimation === 'ROLL_1' ? 'ROLL_2' : 'ROLL_1');
            localState.continue = false;
          } else {
            this.stateManager.setState(CommonState.IDLE);
          }
        }
        if (tick > 0 && this.input.isInputPressed(GameInput.INPUT1)) {
          localState.continue = true;
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
  }

  protected getCommandList(): Array<CommandTrigger<CharacterState<AeroState>>> {
    return [
      ...super.getCommandList(),
      {
        command: new Command('a', 1),
        trigger: () => this.isIdle && !this.isAirborne,
        state: AeroState.STAND_LIGHT_R_1,
        priority: 2
      },
      {
        command: new Command('a', 1),
        trigger: () => {
          if (this.canChainFrom(AeroState.STAND_LIGHT_R_1, 4) || this.canChainFrom(AeroState.STAND_LIGHT_R_2, 5)) {
            return () => this.sprite.anims.currentFrame.index >= 4;
          } else {
            return false;
          }
        },
        state: AeroState.STAND_LIGHT_L_1,
        priority: 2
      },
      {
        command: new Command('*6+a', 1),
        trigger: () => this.isIdle && !this.isAirborne,
        state: AeroState.STAND_LIGHT_R_2,
        priority: 3
      },
      {
        command: new Command('*6+a', 1),
        trigger: () => {
          if (this.canChainFrom(AeroState.STAND_LIGHT_R_1, 4) || this.canChainFrom(AeroState.STAND_LIGHT_R_2, 5)) {
            return () => this.sprite.anims.currentFrame.index >= 4;
          } else {
            return false;
          }
        },
        state: AeroState.STAND_LIGHT_L_2,
        priority: 3
      },
      {
        command: new Command('b', 1),
        trigger: () => !this.isAirborne && (this.isIdle || this.canCancel(AeroState.STAND_MED_R_1)),
        state: AeroState.STAND_MED_R_1,
        priority: 2
      },
      {
        command: new Command('b', 1),
        trigger: () => {
          if (this.canChainFrom(AeroState.STAND_MED_R_2, 5) || this.canChainFrom(AeroState.STAND_MED_R_1, 5)) {
            return () => {
              const i = this.stateManager.current.key === AeroState.STAND_MED_R_1 ? 5 : 6;
              return this.sprite.anims.currentFrame.index >= i;
            }
          } else {
            return false
          }
        },
        state: AeroState.STAND_MED_L_1,
      },
      {
        command: new Command('*6+b', 1),
        trigger: () => !this.isAirborne && (this.isIdle || this.canCancel(AeroState.STAND_MED_R_2)),
        state: AeroState.STAND_MED_R_2,
        priority: 3
      },
      {
        command: new Command('*6+b', 1),
        trigger: () => {
          if (this.canChainFrom(AeroState.STAND_MED_R_2, 5) || this.canChainFrom(AeroState.STAND_MED_R_1, 5)) {
            return () => {
              const i = this.stateManager.current.key === AeroState.STAND_MED_R_1 ? 5 : 6;
              return this.sprite.anims.currentFrame.index >= i;
            }
          } else {
            return false
          }
        },
        priority: 3,
        state: AeroState.STAND_MED_L_2,
      },
      {
        command: new Command('c', 1),
        trigger: () => this.isCurrentState(CommonState.IDLE) || this.canCancel(AeroState.STAND_HEAVY),
        state: AeroState.STAND_HEAVY
      },
      {
        command: new Command('d', 1),
        trigger: () => this.isIdle && !this.isAirborne,
        state: AeroState.ROLL,
        priority: 2
      }
    ];
  }

  public preload(): void {
    super.preload();
    PS.stage.load.multiatlas('vanessa', 'characters/aero/vanessa.json', 'characters/aero');
  }

  public onTargetHit(target: StageObject, hit: Hit): void {
    super.onTargetHit(target, hit);
    const config = this.states[this.stateManager.current.key];
    if (config && config.onHitSound) {
      this.playSound(config.onHitSound, {}, true);
    }
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