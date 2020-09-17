import * as Phaser from 'phaser';
import * as _ from 'lodash';
import { RingBuffer } from '@lawsumisu/common-utilities';

const keyCodes = Phaser.Input.Keyboard.KeyCodes;

export enum GameInput {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  UP = 'UP',
  DOWN = 'DOWN',
  UP_LEFT = 'UP_LEFT',
  UP_RIGHT = 'UP_RIGHT',
  DOWN_LEFT = 'DOWN_LEFT',
  DOWN_RIGHT = 'DOWN_RIGHT',
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
  [key in GameInput]?: Array<InputConfig | Array<GameInput>>;
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
    [GameInput.INPUT1]: [getKeyboardConfig(keyCodes.A), getGamepadConfig('A')],
    [GameInput.INPUT2]: [getKeyboardConfig(keyCodes.S), getGamepadConfig('B')],
    [GameInput.INPUT3]: [getKeyboardConfig(keyCodes.W), getGamepadConfig('X')],
    [GameInput.INPUT4]: [getKeyboardConfig(keyCodes.E), getGamepadConfig('Y')],
    [GameInput.INPUT5]: [],
    [GameInput.INPUT6]: []
  };

  private static inputStringMap = {
    [GameInput.DOWN]: '↓',
    [GameInput.UP]: '↑',
    [GameInput.RIGHT]: '→',
    [GameInput.LEFT]: '←',
    [GameInput.UP_RIGHT]: '↗',
    [GameInput.UP_LEFT]: '↖',
    [GameInput.DOWN_RIGHT]: '↘',
    [GameInput.DOWN_LEFT]: '↙',
  };

  public readonly bufferLength = 100;

  private inputMap: InputMap;
  private inputBuffer: RingBuffer<Set<GameInput>>;

  public boot(): void {
    this.systems.events
      .on('start', this.onSceneStart)
      .on('update', this.onSceneUpdate)
      .once('destroy', this.onSceneDestroy);
  }

  /**
   * Returns if the input was pressed i frames ago (0 for current frame).
   * @param {GameInput} input
   * @param {number} i: number of frames ago
   * @returns {boolean}
   */
  public isInputPressed = (input: GameInput, i = 0): boolean => {
    return this.inputBuffer.at(-(i + 1)).has(input) && !this.inputBuffer.at(-(i + 2)).has(input);
  };

  /**
   * Returns true if the input was released this frame.
   * @param {GameInput} input
   * @param {number} i: number of frames ago
   * @returns {boolean}
   */
  public isInputReleased = (input: GameInput, i = 0): boolean => {
    return !this.inputBuffer.at(-(i + 1)).has(input) && this.inputBuffer.at(-(i + 2)).has(input);
  };

  /**
   * Returns true if the input is currently held down i frames ago (0 for current frame).
   * @param {GameInput} input
   * @param {number} i: number of frames ago
   * @returns {boolean}
   */
  public isInputDown = (input: GameInput, i = 0): boolean => {
    return this.inputBuffer.at(-(i + 1)).has(input);
  };

  public getInputs(i = 0): Set<GameInput> {
    return new Set(this.inputBuffer.at(-(i + 1)));
  }

  public toString(): string {
    const inputs = this.inputBuffer.at(-1);
    return Array.from(inputs).map((gi: GameInput) => GameInputPlugin.inputStringMap[gi] || gi).sort().join(',');
  }

  private onSceneStart = (): void => {
    this.setupInputMap();
    this.clearInputs();
  };

  private onSceneUpdate = (): void => {
    const { gamepad, keyboard } = this.scene.input;
    const isGamePadConnected = !!gamepad.pad1;
    const inputsThisFrame = new Set<GameInput>();
    _.forEach(this.inputMap, (configs: InputConfig[], input: GameInput) => {
      for (const config of configs) {
        if (
          (isKeyboard(config) && keyboard.addKey(config.key).isDown) ||
          (isGamePadConnected && isGamepad(config) && gamepad.pad1[config.key])
        ) {
          inputsThisFrame.add(input);
          break;
        }
      }
    });
    if (inputsThisFrame.has(GameInput.UP)) {
      if (inputsThisFrame.has(GameInput.RIGHT)) {
        inputsThisFrame.delete(GameInput.UP);
        inputsThisFrame.delete(GameInput.RIGHT);
        inputsThisFrame.add(GameInput.UP_RIGHT);
      } else if (inputsThisFrame.has(GameInput.LEFT)) {
        inputsThisFrame.delete(GameInput.UP);
        inputsThisFrame.delete(GameInput.LEFT);
        inputsThisFrame.add(GameInput.UP_LEFT);
      }
    } else if (inputsThisFrame.has(GameInput.DOWN)) {
      if (inputsThisFrame.has(GameInput.RIGHT)) {
        inputsThisFrame.delete(GameInput.DOWN);
        inputsThisFrame.delete(GameInput.RIGHT);
        inputsThisFrame.add(GameInput.DOWN_RIGHT);
      } else if (inputsThisFrame.has(GameInput.LEFT)) {
        inputsThisFrame.delete(GameInput.DOWN);
        inputsThisFrame.delete(GameInput.LEFT);
        inputsThisFrame.add(GameInput.DOWN_LEFT);
      }
    }
    this.inputBuffer.push(inputsThisFrame);
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
    this.inputBuffer = new RingBuffer(this.bufferLength);
    _.times(this.bufferLength, () => this.inputBuffer.push(new Set()))
  }
}
