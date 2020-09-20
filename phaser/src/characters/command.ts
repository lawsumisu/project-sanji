import { GameInput } from 'src/plugins/gameInput.plugin';
import { PS } from 'src/global';

enum CommandInputType {
  DOWN = 'DOWN',
  PRESS = 'PRESS',
  RELEASE = 'RELEASE'
}

interface CommandInput {
  input: SimpleInput | JunctiveInput;
  strict?: boolean;
}

class SimpleInput {
  input: GameInput;
  type: CommandInputType;

  constructor(input: GameInput, type: CommandInputType) {
    this.input = input;
    this.type = type;
  }

  public checkInput(playerIndex: number, historyIndex = 0): boolean {
    const history = PS.gameInput.for(playerIndex);
    switch (this.type) {
      case CommandInputType.DOWN:
        return history.isInputDown(this.input, historyIndex);
      case CommandInputType.PRESS:
        return history.isInputPressed(this.input, historyIndex);
      case CommandInputType.RELEASE:
        return history.isInputReleased(this.input, historyIndex);
    }
  }

  public checkInputIgnoringType(playerIndex: number, historyIndex = 0): boolean {
    const history = PS.gameInput.for(playerIndex);
    return history.isInputDown(this.input, historyIndex) || history.isInputReleased(this.input, historyIndex);
  }
}

class JunctiveInput {
  input1: JunctiveInput | SimpleInput;
  input2: JunctiveInput | SimpleInput;
  isAnd: boolean;

  constructor(input1: JunctiveInput | SimpleInput, input2: JunctiveInput | SimpleInput, isAnd = false) {
    this.input1 = input1;
    this.input2 = input2;
    this.isAnd = isAnd;
  }

  public checkInput(playerIndex: number, historyIndex = 0): boolean {
    const c1 = this.input1.checkInput(playerIndex, historyIndex);
    if (c1 && !this.isAnd) {
      return true;
    } else {
      const c2 = this.input2.checkInput(playerIndex, historyIndex);
      return this.isAnd ? c1 && c2 : c2;
    }
  }

  public checkInputIgnoringType(playerIndex: number, historyIndex = 0): boolean {
    const c1 = this.input1.checkInputIgnoringType(playerIndex, historyIndex);
    if (c1 && this.isAnd) {
      return true;
    } else {
      const c2 = this.input2.checkInputIgnoringType(playerIndex, historyIndex);
      return this.isAnd ? c1 && c2 : c2;
    }
  }
}

export class Command {
  private static commandToGameInputMap: { [key: string]: GameInput } = {
    1: GameInput.DOWN_LEFT,
    2: GameInput.DOWN,
    3: GameInput.DOWN_RIGHT,
    4: GameInput.LEFT,
    6: GameInput.RIGHT,
    7: GameInput.UP_LEFT,
    8: GameInput.UP,
    9: GameInput.UP_RIGHT,
    a: GameInput.INPUT3,
    b: GameInput.INPUT4,
    c: GameInput.INPUT2,
    d: GameInput.INPUT1
  };

  private readonly inputs: CommandInput[];
  private readonly inputTime: number;
  private readonly playerIndex: number;

  constructor(cmd: string, inputTime: number, playerIndex = 0) {
    this.inputs = Command.parse(cmd);
    this.inputTime = inputTime;
    this.playerIndex = playerIndex;
  }

  public isExecuted(): boolean {
    let i = this.inputs.length - 1;
    if (!this.inputs[i].input.checkInput(this.playerIndex)) {
      return false;
    } else if (this.inputs.length === 1) {
      return true;
    } else {
      const executionTime = Math.min(this.inputTime, PS.gameInput.for(this.playerIndex).historyLength);
      return this.isExecutedRecursive(1, i - 1, executionTime);
    }
  }

  private isExecutedRecursive(historyIndex: number, inputIndex: number, executionTime: number): boolean {
    for (let j = historyIndex; j < executionTime; j++) {
      const commandInput = this.inputs[inputIndex];
      if (commandInput.strict) {
        // If strict case, then fail early if any inputs other than the one being checked for have been inputted.
        if (PS.gameInput.for(this.playerIndex).getInputs(j).size === 0) {
          continue;
        } else if (!commandInput.input.checkInputIgnoringType(this.playerIndex, j)) {
          return false;
        }
      }
      if (commandInput.input.checkInput(this.playerIndex, j)) {
        if (inputIndex === 0) {
          return true;
        } else {
          return this.isExecutedRecursive(j + 1, inputIndex - 1, executionTime);
        }
      }
    }
    return false;
  }

  private static parse(cmd: string): CommandInput[] {
    const regex = /\(?\*?[a-d1-9]([|+]\(*\*?[a-d1-9]\)*)*\)?~?/g;
    const matches = cmd.match(regex);
    if (matches) {
      return matches.map(Command.parseInput);
    } else {
      return [];
    }
  }

  private static parseInput(input: string): CommandInput {
    let strict = input.endsWith('~');
    const parsedInput = input
      .replace('~', '')
      .split('|')
      .map((simpleInput: string) => {
        const type = simpleInput.startsWith('*') ? CommandInputType.DOWN : CommandInputType.PRESS;
        const input = Command.commandToGameInputMap[simpleInput.replace('*', '')];
        return new SimpleInput(input, type);
      })
      .reduce((accumulator: JunctiveInput | SimpleInput, simpleInput: SimpleInput) => {
        if (accumulator === null) {
          return simpleInput;
        } else {
          return new JunctiveInput(accumulator, simpleInput);
        }
      }, null);
    return {input: parsedInput!, strict};
  }
}
