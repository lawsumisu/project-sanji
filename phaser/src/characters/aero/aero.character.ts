import { PS } from 'src/global';
import { Command } from 'src/command';
import { StageObject } from 'src/stage/stageObject';
import { Hit } from 'src/collider';
import { playAnimation } from 'src/utilitiesPF/animation.util';
import { GameInput } from 'src/plugins/gameInput.plugin';
import aero from 'src/characters/aero/aero.frame.json';
import { CharacterState, CommonCharacter, CommonState, StateMap, StateType } from 'src/characters/common';
import { CommandTrigger } from 'src/characters';
import { AeroShadow } from 'src/characters/aero/shadow';

enum AeroStateType {
  RIGHT_ARM = 'RIGHT_ARM',
  LEFT_ARM = 'LEFT_ARM',
  MED = 'MED'
}

enum AeroState {
  STAND_LIGHT_L_1 = 'STAND_LIGHT_L_1',
  STAND_LIGHT_L_2 = 'STAND_LIGHT_L_2',
  STAND_LIGHT_R_1 = 'STAND_LIGHT_R_1',
  STAND_LIGHT_R_2 = 'STAND_LIGHT_R_2',
  STAND_MED_L_1 = 'STAND_MED_L_1',
  STAND_MED_L_2 = 'STAND_MED_L_2',
  STAND_MED_R_1 = 'STAND_MED_R_1',
  STAND_MED_R_2 = 'STAND_MED_R_2',
  STAND_HEAVY_R = 'STAND_HEAVY_R',
  STAND_HEAVY_L = 'STAND_HEAVY_L',
  ROLL = 'ROLL',
  DASH_BODY = 'DASH_BODY',
  DASH_STRAIGHT = 'DASH_STRAIGHT',
  DASH_UPPER = 'DASH_UPPER',
  UPPER = 'UPPER',
}

interface AeroStateConfig {
  cancelPotential: number;
}

export default class Aero extends CommonCharacter<AeroState, AeroStateConfig> {
  public static sfx = {
    ...CommonCharacter.sfx,
    hitLight: 'sfx/hits/SE_00007.ogg',
    hitMed: 'sfx/hits/SE_00008.ogg',
    hitHeavy: 'sfx/hits/SE_00009.ogg',
    punch1: 'sfx/hits/SE_00025.ogg',
    punch2: 'sfx/hits/SE_00026.ogg',
    jabVoice: 'sfx/vanessa/001.ogg'
  };

  private cancelFlag = false;
  private shadow: AeroShadow;
  private preRollState: CharacterState<AeroState> = CommonState.NULL;

  protected states: StateMap<AeroState, AeroStateConfig> = {
    [AeroState.STAND_LIGHT_L_1]: {
      startAnimation: 'LIGHT_JAB_1',
      type: [StateType.ATTACK, StateType.STAND, AeroStateType.LEFT_ARM],
      cancelPotential: 1,
      onHitSound: 'hitLight',
      update: () => {
        this.velocity.x = 0;
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [AeroState.STAND_LIGHT_L_2]: {
      startAnimation: 'LIGHT_JAB_2',
      cancelPotential: 1,
      type: [StateType.ATTACK, StateType.STAND, AeroStateType.LEFT_ARM],
      onHitSound: 'hitLight',
      update: () => {
        this.velocity.x = 0;
        if (this.sprite.anims.currentFrame.index === 2) {
          this.playSound('jabVoice', { volume: 0.5 });
        } else if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [AeroState.STAND_LIGHT_R_1]: {
      startAnimation: 'LIGHT_3',
      cancelPotential: 1,
      type: [StateType.ATTACK, StateType.STAND, AeroStateType.RIGHT_ARM],
      onHitSound: 'hitLight',
      update: () => {
        this.velocity.x = 0;
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [AeroState.STAND_LIGHT_R_2]: {
      startAnimation: 'LIGHT_4',
      cancelPotential: 1,
      type: [StateType.ATTACK, StateType.STAND, AeroStateType.RIGHT_ARM],
      onHitSound: 'hitLight',
      update: () => {
        this.velocity.x = 0;
        if (this.sprite.anims.currentFrame.index === 2) {
          this.playSound('jabVoice', { volume: 0.5 });
        } else if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [AeroState.STAND_MED_R_1]: {
      startAnimation: 'GUT_PUNCH_1',
      cancelPotential: 2,
      type: [StateType.ATTACK, StateType.STAND, AeroStateType.RIGHT_ARM, AeroStateType.MED],
      onHitSound: 'hitMed',
      update: () => {
        this.velocity.x = 0;
        if (this.sprite.anims.currentFrame.index === 3) {
          this.playSound('punch1', { volume: 0.5 });
        }
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [AeroState.STAND_MED_L_1]: {
      startAnimation: 'GUT_PUNCH_2',
      cancelPotential: 2,
      type: [StateType.ATTACK, StateType.STAND, AeroStateType.LEFT_ARM],
      onHitSound: 'hitMed',
      update: () => {
        if (this.sprite.anims.currentFrame.index === 2) {
          this.playSound('punch1', { volume: 0.5 });
        }
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [AeroState.STAND_MED_R_2]: {
      startAnimation: 'STAND_MED_R_2',
      cancelPotential: 2,
      type: [StateType.ATTACK, StateType.STAND, AeroStateType.RIGHT_ARM, AeroStateType.MED],
      onHitSound: 'hitMed',
      update: () => {
        this.velocity.x = 0;
        if (this.sprite.anims.currentFrame.index === 3) {
          this.playSound('punch1', { volume: 0.5 });
        }
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [AeroState.STAND_MED_L_2]: {
      startAnimation: 'STAND_MED_L_2',
      cancelPotential: 2,
      type: [StateType.ATTACK, StateType.STAND, AeroStateType.LEFT_ARM],
      onHitSound: 'hitMed',
      update: () => {
        this.velocity.x = 0;
        if (this.sprite.anims.currentFrame.index === 4) {
          this.playSound('punch1', { volume: 0.5 });
        }
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [AeroState.STAND_HEAVY_R]: {
      startAnimation: 'STAND_HEAVY_R',
      cancelPotential: 3,
      type: [StateType.ATTACK, StateType.STAND, AeroStateType.RIGHT_ARM],
      onHitSound: 'hitHeavy',
      update: () => {
        this.velocity.x = 0;
        if (this.sprite.anims.currentFrame.index === 3) {
          this.playSound('punch2', { volume: 0.5 });
        }
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [AeroState.STAND_HEAVY_L]: {
      startAnimation: 'STAND_HEAVY_L',
      cancelPotential: 3,
      type: [StateType.ATTACK, StateType.STAND, AeroStateType.LEFT_ARM],
      onHitSound: 'hitHeavy',
      update: () => {
        if (this.sprite.anims.currentFrame.index === 3) {
          this.playSound('punch2', { volume: 0.5 });
        }
        if (!this.sprite.anims.isPlaying) {
          this.stateManager.setState(CommonState.STAND);
        }
      }
    },
    [AeroState.ROLL]: {
      startAnimation: 'ROLL_STARTUP',
      cancelPotential: 4,
      type: [StateType.ATTACK, StateType.STAND],
      update: (tick: number, localState: { continue: boolean }) => {
        this.velocity.x = 0;
        if (!this.sprite.anims.isPlaying) {
          if (this.currentAnimation === 'ROLL_STARTUP') {
            this.shadow.start();
            playAnimation(this.sprite, 'ROLL_1');
          } else if (localState.continue) {
            this.cancelFlag = false;
            playAnimation(this.sprite, this.currentAnimation === 'ROLL_1' ? 'ROLL_2' : 'ROLL_1');
            this.shadow.start();
            localState.continue = false;
          } else {
            this.stateManager.setState(CommonState.STAND);
            this.preRollState = CommonState.NULL;
          }
        }
        if (tick > 0 && this.input.isInputPressed(GameInput.INPUT1)) {
          localState.continue = true;
        }
      }
    },
    [AeroState.DASH_BODY]: {
      startAnimation: 'DASH',
      cancelPotential: 4,
      type: [StateType.STAND],
      update: (tick: number, params: { strength: number }) => {
        const { strength = 0 } = params;
        if (tick === 0) {
          this.velocity.x = (105 + 20 * strength) * this.direction;
        }
        if (!this.sprite.anims.isPlaying) {
          this.velocity.x = 0;
          if (this.currentAnimation === 'DASH') {
            this.playAnimation('DASH_BODY')
          } else {
            this.goToNextState(CommonState.STAND);
          }
        }
      }
    },
    [AeroState.DASH_STRAIGHT]: {
      startAnimation: 'DASH_STRAIGHT',
      type: [StateType.STAND, StateType.ATTACK],
      update: () => {
        this.velocity.x = 0;
        if (!this.sprite.anims.isPlaying) {
          this.goToNextState(CommonState.STAND)
        }
      }
    }
  };

  constructor(playerIndex = 0) {
    super(playerIndex, aero);
  }

  protected getCommandList(): Array<CommandTrigger<CharacterState<AeroState>>> {
    return [
      ...super.getCommandList(),
      {
        command: new Command('a', 1),
        trigger: () => (this.isIdle && !this.isAirborne) || this.canBeatCancel(),
        state: AeroState.STAND_LIGHT_R_1,
        priority: 2
      },
      {
        command: new Command('a', 1),
        trigger: () => {
          if (this.canBeatCancel()) {
            return true;
          } else if (this.canChainFrom(AeroState.STAND_LIGHT_R_1) || this.canChainFrom(AeroState.STAND_LIGHT_R_2, 5)) {
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
        trigger: () => (this.isIdle && !this.isAirborne) || this.canBeatCancel(),
        state: AeroState.STAND_LIGHT_R_2,
        priority: 3
      },
      {
        command: new Command('*6+a', 1),
        trigger: () => {
          if (this.canBeatCancel() && this.checkStateType([AeroStateType.RIGHT_ARM], this.preRollState!)) {
            return true;
          } else if (this.canChainFrom(AeroState.STAND_LIGHT_R_1) || this.canChainFrom(AeroState.STAND_LIGHT_R_2)) {
            return () => this.sprite.anims.currentFrame.index >= 4;
          } else {
            return false;
          }
        },
        state: AeroState.STAND_LIGHT_L_2,
        priority: 3.5
      },
      {
        command: new Command('b', 1),
        trigger: () =>
          (!this.isAirborne && (this.isIdle || this.canCancel(AeroState.STAND_MED_R_1))) || this.canBeatCancel(),
        state: AeroState.STAND_MED_R_1,
        priority: 2
      },
      {
        command: new Command('b', 1),
        trigger: () => {
          if (this.canBeatCancel() && this.checkStateType([AeroStateType.RIGHT_ARM], this.preRollState)) {
            return true;
          } else if (this.canChainFrom(AeroState.STAND_MED_R_2)) {
            return () => this.sprite.anims.currentFrame.index >= 4;
          } else if (this.canChainFrom(AeroState.STAND_MED_R_1)) {
            return () => this.sprite.anims.currentFrame.index >= 5;
          } else {
            return false;
          }
        },
        state: AeroState.STAND_MED_L_1,
        priority: 2.5
      },
      {
        command: new Command('*6+b', 1),
        trigger: () =>
          (!this.isAirborne && (this.isIdle || this.canCancel(AeroState.STAND_MED_R_2))) || this.canBeatCancel(),
        state: AeroState.STAND_MED_R_2,
        priority: 3
      },
      {
        command: new Command('*6+b', 1),
        trigger: () => {
          if (this.canBeatCancel() && this.checkStateType([AeroStateType.RIGHT_ARM], this.preRollState)) {
            return true;
          } else if (this.canChainFrom(AeroState.STAND_MED_R_2) || this.canChainFrom(AeroState.STAND_MED_R_1)) {
            return () => {
              const i = this.stateManager.current.key === AeroState.STAND_MED_R_1 ? 4 : 5;
              return this.sprite.anims.currentFrame.index >= i;
            };
          } else {
            return false;
          }
        },
        priority: 3.5,
        state: AeroState.STAND_MED_L_2
      },
      {
        command: new Command('c', 1),
        trigger: () =>
          !this.isAirborne && (this.isIdle || this.canCancel(AeroState.STAND_HEAVY_R) || this.canBeatCancel()),
        priority: 4,
        state: AeroState.STAND_HEAVY_R
      },
      {
        command: new Command('c', 1),
        trigger: () => {
          if (this.canBeatCancel() && this.checkStateType([AeroStateType.RIGHT_ARM], this.preRollState)) {
            return true;
          } else if (this.canChainFrom(AeroState.STAND_HEAVY_R)) {
            return () => this.sprite.anims.currentFrame.index >= 6;
          } else {
            return false;
          }
        },
        priority: 4.5,
        state: AeroState.STAND_HEAVY_L
      },
      {
        command: new Command('d', 3),
        trigger: () => !this.isAirborne && (this.isIdle || this.canCancel(AeroState.ROLL)),
        state: AeroState.ROLL,
        priority: 2
      },
      {
        command: new Command('236a', 18),
        trigger: () => !this.isAirborne && (this.isIdle || this.canCancel(AeroState.DASH_BODY)),
        state: AeroState.DASH_BODY,
        stateParams: { strength: 1 },
        priority: 10
      },
      {
        command: new Command('236b', 18),
        trigger: () => !this.isAirborne && (this.isIdle || this.canCancel(AeroState.DASH_BODY)),
        state: AeroState.DASH_BODY,
        stateParams: { strength: 2 },
        priority: 10
      },
      {
        command: new Command('236c', 18),
        trigger: () => !this.isAirborne && (this.isIdle || this.canCancel(AeroState.DASH_BODY)),
        state: AeroState.DASH_BODY,
        stateParams: { strength: 3 },
        priority: 10
      },
      {
        command: new Command('236a', 18),
        trigger: () => {
          if (this.isCurrentState(AeroState.DASH_BODY))  {
            return () => this.currentAnimation === 'DASH_BODY' && this.sprite.anims.currentFrame.index >= 4;
          } else {
            return false;
          }
        },
        state: AeroState.DASH_STRAIGHT,
      }
    ];
  }

  public preload(): void {
    super.preload();
    PS.stage.load.multiatlas('vanessa', 'characters/aero/vanessa.json', 'characters/aero');
  }

  public create(): void {
    super.create();
    this.shadow = new AeroShadow(this, aero, () => {
      this.cancelFlag = true;
    });
    this.shadow.create();
    this.colliderManager.ignoreCollisionsWith(this.shadow.tag);
    PS.stage.addStageObject(this.shadow);
  }

  public setTarget(so: StageObject): void {
    super.setTarget(so);
    this.shadow.setTarget(so);
  }

  public onTargetHit(target: StageObject, hit: Hit): void {
    super.onTargetHit(target, hit);
    const config = this.states[this.stateManager.current.key];
    if (config && config.onHitSound) {
      this.playSound(config.onHitSound, {}, true);
    }
    this.cancelFlag = true;
  }

  private canCancel(nextState: CharacterState<AeroState>): boolean {
    if (this.cancelFlag) {
      const { cancelPotential: currentPotential = 0 } = this.states[this.stateManager.current.key]!;
      const { cancelPotential: nextPotential = 0 } = this.states[nextState]!;
      return currentPotential < nextPotential;
    } else {
      return false;
    }
  }

  private canBeatCancel(): boolean {
    return this.cancelFlag && this.isCurrentState(AeroState.ROLL);
  }

  protected beforeStateTransition(nextKey: CharacterState<AeroState>): void {
    super.beforeStateTransition(nextKey);
    this.cancelFlag = false;
    if (nextKey === AeroState.ROLL && this.checkStateType(StateType.ATTACK)) {
      this.preRollState = this.stateManager.current.key;
      console.log(this.preRollState);
    }
  }
}
