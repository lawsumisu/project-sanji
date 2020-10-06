import { BaseCharacter, CommonState } from 'src/characters';
import { PS } from 'src/global';
import { Command } from 'src/command';

enum AeroState {
  N_LIGHT = 'N_LIGHT',
  N_LIGHT_2 = 'N_LIGHT_2'
}

enum AeroCommand {
  N_LIGHT = 'N_LIGHT'
}

export default class Aero extends BaseCharacter<AeroState, AeroCommand> {
  constructor(playerIndex = 0) {
    super(playerIndex);
    this.commands = {
      ...this.commands,
      [AeroCommand.N_LIGHT]: [
        {
          command: new Command('a', 1),
          trigger: () => this.stateManager.current.key === CommonState.IDLE,
          state: AeroState.N_LIGHT,
          priority: 2
        },
        {
          command: new Command('a', 1),
          executionTrigger: () => this.sprite.anims.currentFrame.index >= 4,
          trigger: () => this.sprite.anims.currentFrame.index <= 4,
          state: AeroState.N_LIGHT_2,
        },
      ]
    };

    this.states = {
      ...this.states,
      [AeroState.N_LIGHT]: {
        startAnimation: 'LIGHT_JAB_1',
        update: () => {
          this.velocity.x = 0;
          if (!this.sprite.anims.isPlaying) {
            this.stateManager.setState(CommonState.IDLE);
          }
        }
      },
      [AeroState.N_LIGHT_2]: {
        startAnimation: 'LIGHT_JAB_2',
        update: () => {
          this.velocity.x = 0;
          if (!this.sprite.anims.isPlaying) {
            this.stateManager.setState(CommonState.IDLE);
          }
        }
      }
    }
  }

  public preload(): void {
    super.preload();
    PS.stage.load.multiatlas('vanessa', 'characters/aero/vanessa.json', 'characters/aero');
  }
}