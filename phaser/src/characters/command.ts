import { GameInput, GameInputPlugin } from 'src/plugins/gameInput.plugin';

enum CommandInputType {
  DOWN = 'DOWN',
  PRESS = 'PRESS',
  RELEASE = 'RELEASE'
}

interface CommandInput {
  input: GameInput;
  type: CommandInputType;
  strict?: boolean;
}

export class Command {
  private static commandToGameInputMap: { [key: string]: GameInput } = {
    1: GameInput.DOWN_LEFT,
    2: GameInput.DOWN,
    3: GameInput.DOWN_RIGHT,
    4: GameInput.LEFT,
    6: GameInput.RIGHT,
    a: GameInput.INPUT3,
    b: GameInput.INPUT4,
    c: GameInput.INPUT2,
    d: GameInput.INPUT1,
  };

  private readonly inputs: CommandInput[];
  private readonly inputTime: number;

  private readonly gameInput: GameInputPlugin;

  constructor(cmd: string, inputTime: number, gameInput: GameInputPlugin) {
    this.inputs = Command.parse(cmd);
    this.inputTime = inputTime;
    this.gameInput = gameInput;
  }

  public isExecuted(): boolean {
    let i = this.inputs.length - 1;
    if (!this.checkInput(this.inputs[i])) {
      return false;
    } else if (this.inputs.length === 1) {
      return true;
    } else {
      return this.isExecutedRecursive(1, i - 1, Math.min(this.inputTime, this.gameInput.bufferLength));
    }
  }

  private isExecutedRecursive(historyIndex: number, inputIndex: number, executionTime: number): boolean {
    for (let j = historyIndex; j < executionTime; j++) {
      const input = this.inputs[inputIndex];
      if (input.strict) {
        // If strict case, then fail early if any inputs other than the one being checked for have been inputted.
        if (this.gameInput.getInputs(j).size === 0) {
          continue;
        } else if (!this.checkInputIgnoringType(input, j)) {
          return false;
        }
      }
      if (this.checkInput(input, j)) {
        if (inputIndex === 0) {
          return true;
        } else {
          return this.isExecutedRecursive(j + 1, inputIndex - 1, executionTime);
        }
      }
    }
    return false;
  }

  private checkInput(commandInput: CommandInput, index = 0): boolean {
    switch (commandInput.type) {
      case CommandInputType.DOWN:
        return this.gameInput.isInputDown(commandInput.input, index);
      case CommandInputType.PRESS:
        return this.gameInput.isInputPressed(commandInput.input, index);
      case CommandInputType.RELEASE:
        return this.gameInput.isInputReleased(commandInput.input, index);
    }
  }

  private checkInputIgnoringType(commandInput: CommandInput, index = 0): boolean {
    return this.gameInput.isInputDown(commandInput.input, index) || this.gameInput.isInputReleased(commandInput.input, index);
  }

  private static parse(cmd: string): CommandInput[] {
    const regex = /[a-d1-9]~?/g;
    const matches = cmd.match(regex);
    if (matches) {
      return matches.map(Command.parseInput);
    } else {
      return [];
    }
  }

  private static parseInput(input: string): CommandInput {
    let strict;
    let gi: GameInput = GameInput.INPUT1;
    for (let i = 0; i < input.length; i++) {
      const c = input[i];
      if (c.match(/[a-d1-9]/)) {
        gi = Command.commandToGameInputMap[c];
      } else {
        strict = c === '~';
      }
    }
    return { input: gi, type: CommandInputType.PRESS, strict }
  }
}
