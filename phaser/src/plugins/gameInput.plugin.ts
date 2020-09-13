import * as Phaser from 'phaser';
import * as _ from 'lodash';

const keyCodes = Phaser.Input.Keyboard.KeyCodes;

export enum GameInput {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  UP = 'UP',
  DOWN = 'DOWN',
  INPUT1 = 'INPUT1',
  INPUT2 = 'INPUT2',
  INPUT3 = 'INPUT3',
  INPUT4 = 'INPUT4',
  INPUT5 = 'INPUT5',
  INPUT6 = 'INPUT6'
}

enum InputType {
  KEYBOARD = 'KEYBOARD',
  GAMEPAD = 'GAMEPAD'
}

interface InputConfig {
  type: InputType;
}

interface KeyboardConfig extends InputConfig {
  type: InputType.KEYBOARD;
  key: number;
}

interface GamepadConfig extends InputConfig {
  type: InputType.GAMEPAD;
  key: 'left' | 'right' | 'up' | 'down' | 'A' | 'B' | 'X' | 'Y' | 'L1' | 'R1';
}

function isKeyboard(config: InputConfig): config is KeyboardConfig {
  return config.type === InputType.KEYBOARD;
}

function isGamepad(config: InputConfig): config is GamepadConfig {
  return config.type === InputType.GAMEPAD;
}

function getKeyboardConfig(key: number): KeyboardConfig {
  return { type: InputType.KEYBOARD, key };
}

function getGamepadConfig(key: GamepadConfig['key']): GamepadConfig {
  return { type: InputType.GAMEPAD, key };
}

type InputMap = {
  [key in GameInput]: InputConfig[];
};

/**
 * A plugin that allows mapping between device inputs and relevant game inputs.
 */
export class GameInputPlugin extends Phaser.Plugins.ScenePlugin {
  public static defaultInputs = {
    [GameInput.DOWN]: [getKeyboardConfig(keyCodes.DOWN), getGamepadConfig('down')],
    [GameInput.UP]: [getKeyboardConfig(keyCodes.UP), getGamepadConfig('up')],
    [GameInput.RIGHT]: [getKeyboardConfig(keyCodes.RIGHT), getGamepadConfig('right')],
    [GameInput.LEFT]: [getKeyboardConfig(keyCodes.LEFT), getGamepadConfig('left')],
    [GameInput.INPUT1]: [
      getKeyboardConfig(keyCodes.A),
      getGamepadConfig('A'),
      getGamepadConfig('X')
    ],
    [GameInput.INPUT2]: [
      getKeyboardConfig(keyCodes.S),
      getGamepadConfig('B'),
      getGamepadConfig('Y')
    ],
    [GameInput.INPUT3]: [getKeyboardConfig(keyCodes.W), getGamepadConfig('L1')],
    [GameInput.INPUT4]: [getKeyboardConfig(keyCodes.E), getGamepadConfig('R1')],
    [GameInput.INPUT5]: [],
    [GameInput.INPUT6]: []
  };

  private inputMap: InputMap;
  private inputState: { [key in GameInput]: { isDown: boolean; duration: number } };

  public boot(): void {
    this.systems.events
      .on('start', this.onSceneStart)
      .on('update', this.onSceneUpdate)
      .once('destroy', this.onSceneDestroy);
  }

  /**
   * Returns if the input was pressed within the last n frames (default 1).
   * @param {GameInput} input
   * @param {number} duration
   * @returns {boolean}
   */
  public isInputPressed(input: GameInput, duration: number = 1): boolean {
    const state = this.inputState[input];
    return state.isDown && state.duration <= duration;
  }

  /**
   * Returns true if the input was released this frame.
   * @param {GameInput} input
   * @returns {boolean}
   */
  public isInputReleased(input: GameInput): boolean {
    const state = this.inputState[input];
    return !state.isDown && state.duration === 1;
  }

  /**
   * Returns true if the input has been down for at least n frames (default 1)
   * @param {GameInput} input
   * @param {number} duration
   * @returns {boolean}
   */
  public isInputDown(input: GameInput, duration: number = 1): boolean {
    const state = this.inputState[input];
    return state.isDown && state.duration >= duration;
  }

  /**
   * Returns true if the input is not down for at least n frames (default 1)
   * @param {GameInput} input
   * @param {number} duration
   * @returns {boolean}
   */
  public isInputUp(input: GameInput, duration: number = 1): boolean {
    const state = this.inputState[input];
    return !state.isDown && state.duration >= duration;
  }

  /**
   * Return number of frames this input has been up or down.
   * @param {GameInput} input
   * @returns {number}
   */
  public getDuration(input: GameInput): number {
    return this.inputState[input].duration;
  }

  private onSceneStart = (): void => {
    this.setupInputMap();
    this.clearInputs();
  };

  private onSceneUpdate = (): void => {
    const { gamepad, keyboard } = this.scene.input;
    const isGamePadConnected = !!gamepad.pad1;
    _.forEach(this.inputMap, (configs: InputConfig[], input: GameInput) => {
      let isDown = false;
      for (const config of configs) {
        if (
          (isKeyboard(config) && keyboard.addKey(config.key).isDown) ||
          (isGamePadConnected && isGamepad(config) && gamepad.pad1[config.key])
        ) {
          // Found down input, so can exit early
          isDown = true;
          break;
        }
      }
      if (this.inputState[input].isDown !== isDown) {
        // Input was either just pressed or just released, so reset duration
        this.inputState[input].duration = 0;
      }
      this.inputState[input] = {
        isDown,
        duration: this.inputState[input].duration + 1
      };
    });
  };

  private onSceneDestroy = (): void => {
    this.clearInputs();
  };

  private setupInputMap(): void {
    this.inputMap = {
      ...GameInputPlugin.defaultInputs
    };
  }

  private clearInputs(): void {
    this.inputState = {
      [GameInput.DOWN]: { isDown: false, duration: 0 },
      [GameInput.UP]: { isDown: false, duration: 0 },
      [GameInput.RIGHT]: { isDown: false, duration: 0 },
      [GameInput.LEFT]: { isDown: false, duration: 0 },
      [GameInput.INPUT1]: { isDown: false, duration: 0 },
      [GameInput.INPUT2]: { isDown: false, duration: 0 },
      [GameInput.INPUT3]: { isDown: false, duration: 0 },
      [GameInput.INPUT4]: { isDown: false, duration: 0 },
      [GameInput.INPUT5]: { isDown: false, duration: 0 },
      [GameInput.INPUT6]: { isDown: false, duration: 0 }
    };
  }
}
