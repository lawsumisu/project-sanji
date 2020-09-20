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
  [key in GameInput]?: InputConfig[];
};

export let GI: GameInputPlugin;

export class InputHistory {
  private static inputStringMap = {
    [GameInput.DOWN]: '↓',
    [GameInput.UP]: '↑',
    [GameInput.RIGHT]: '→',
    [GameInput.LEFT]: '←',
    [GameInput.UP_RIGHT]: '↗',
    [GameInput.UP_LEFT]: '↖',
    [GameInput.DOWN_RIGHT]: '↘',
    [GameInput.DOWN_LEFT]: '↙'
  };

  public readonly historyLength: number;
  private readonly pad: 'pad1' | 'pad2' | 'pad3' | 'pad4' | null;
  private readonly mapping: InputMap;
  private inputHistory: RingBuffer<Set<GameInput>>;

  constructor(
    mapping: InputMap,
    config: { pad?: 'pad1' | 'pad2' | 'pad3' | 'pad4' | null; historyLength?: number } = {}
  ) {
    const { pad = null, historyLength = 100 } = config;
    this.mapping = mapping;
    this.pad = pad;
    this.historyLength = historyLength;

    this.clear();
  }

  /**
   * Returns if the input was pressed i frames ago (0 for current frame).
   * @param {GameInput} input
   * @param {number} i: number of frames ago
   * @returns {boolean}
   */
  public isInputPressed = (input: GameInput, i = 0): boolean => {
    return this.inputHistory.at(-(i + 1)).has(input) && !this.inputHistory.at(-(i + 2)).has(input);
  };

  /**
   * Returns true if the input was released this frame.
   * @param {GameInput} input
   * @param {number} i: number of frames ago
   * @returns {boolean}
   */
  public isInputReleased = (input: GameInput, i = 0): boolean => {
    return !this.inputHistory.at(-(i + 1)).has(input) && this.inputHistory.at(-(i + 2)).has(input);
  };

  /**
   * Returns true if the input is currently held down i frames ago (0 for current frame).
   * @param {GameInput} input
   * @param {number} i: number of frames ago
   * @returns {boolean}
   */
  public isInputDown = (input: GameInput, i = 0): boolean => {
    return this.inputHistory.at(-(i + 1)).has(input);
  };

  public getInputs(i = 0): Set<GameInput> {
    return new Set(this.inputHistory.at(-(i + 1)));
  }

  public update(input: Phaser.Input.InputPlugin): void {
    const { gamepad: gamepadInput, keyboard } = input;
    const inputsThisFrame = new Set<GameInput>();
    const gamepad = this.pad && !!gamepadInput[this.pad] && gamepadInput[this.pad];
    _.forEach(this.mapping, (configs: InputConfig[], input: GameInput) => {
      for (const config of configs) {
        if (
          (isKeyboard(config) && keyboard.addKey(config.key).isDown) ||
          (gamepad && isGamepad(config) && gamepad[config.key])
        ) {
          inputsThisFrame.add(input);
          break;
        }
      }
    });
    if (gamepad) {
      // Check for analog directional inputs
      const [x, y] = gamepad.axes.map((axis: Phaser.Input.Gamepad.Axis) => axis.getValue());
      if (x >= .5) {
        inputsThisFrame.add(GameInput.RIGHT);
      } else if (x <= -.5) {
        inputsThisFrame.add(GameInput.LEFT);
      }
      if (y >= .5) {
        inputsThisFrame.add(GameInput.DOWN);
      } else if (y <= -.5) {
        inputsThisFrame.add(GameInput.UP);
      }
    }
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
    if (inputsThisFrame.has(GameInput.UP_LEFT)) {
    }
    this.inputHistory.push(inputsThisFrame);
  }

  public toString(): string {
    const inputs = this.inputHistory.at(-1);
    return Array.from(inputs)
      .map((gi: GameInput) => InputHistory.inputStringMap[gi] || gi)
      .sort()
      .join(',');
  }

  public clear(): void {
    this.inputHistory = new RingBuffer(this.historyLength);
    _.times(this.historyLength, () => this.inputHistory.push(new Set()));
  }
}
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

  private histories: InputHistory[] = [
    new InputHistory(GameInputPlugin.defaultInputs, { pad: 'pad1'})
  ];

  public boot(): void {
    this.systems.events
      .on('start', this.onSceneStart)
      .on('update', this.onSceneUpdate)
      .once('destroy', this.onSceneDestroy);
  }

  public for(playerIndex: number) {
    return this.histories[playerIndex];
  }

  private onSceneStart = (): void => {
    this.histories.forEach((history: InputHistory) => history.clear());
    GI = this;
  };

  private onSceneUpdate = (): void => {
    this.histories.forEach((history: InputHistory) => history.update(this.scene.input));
  };

  private onSceneDestroy = (): void => {
    this.histories.forEach((history: InputHistory) => history.clear())
  };
}
