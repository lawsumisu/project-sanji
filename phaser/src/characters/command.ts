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

  public checkInput(historyIndex: number = 0): boolean {
    switch (this.type) {
      case CommandInputType.DOWN:
        return PS.gameInput.isInputDown(this.input, historyIndex);
      case CommandInputType.PRESS:
        return PS.gameInput.isInputPressed(this.input, historyIndex);
      case CommandInputType.RELEASE:
        return PS.gameInput.isInputReleased(this.input, historyIndex);
    }
  }

  public checkInputIgnoringType(historyIndex = 0): boolean {
    return (
      PS.gameInput.isInputDown(this.input, historyIndex) || PS.gameInput.isInputReleased(this.input, historyIndex)
    );
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

  public checkInput(historyIndex: number = 0): boolean {
    const c1 = this.input1.checkInput(historyIndex);
    if (c1 && !this.isAnd) {
      return true;
    } else {
      const c2 = this.input2.checkInput(historyIndex);
      return this.isAnd ? c1 && c2 : c2;
    }
  }

  public checkInputIgnoringType(historyIndex: number = 0): boolean {
    const c1 = this.input1.checkInputIgnoringType(historyIndex);
    if (c1 && this.isAnd) {
      return true;
    } else {
      const c2 = this.input2.checkInputIgnoringType(historyIndex);
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

  constructor(cmd: string, inputTime: number) {
    this.inputs = Command.parse(cmd);
    this.inputTime = inputTime;
  }

  public isExecuted(): boolean {
    let i = this.inputs.length - 1;
    if (!this.inputs[i].input.checkInput()) {
      return false;
    } else if (this.inputs.length === 1) {
      return true;
    } else {
      return this.isExecutedRecursive(1, i - 1, Math.min(this.inputTime, PS.gameInput.bufferLength));
    }
  }

  private isExecutedRecursive(historyIndex: number, inputIndex: number, executionTime: number): boolean {
    for (let j = historyIndex; j < executionTime; j++) {
      const commandInput = this.inputs[inputIndex];
      if (commandInput.strict) {
        // If strict case, then fail early if any inputs other than the one being checked for have been inputted.
        if (PS.gameInput.getInputs(j).size === 0) {
          continue;
        } else if (!commandInput.input.checkInputIgnoringType(j)) {
          return false;
        }
      }
      if (commandInput.input.checkInput(j)) {
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
    const regex = /\(?[a-d1-9]([|+]\(*[a-d1-9]\)*)*\)?~?/g;
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
      .map((c: string) => Command.commandToGameInputMap[c])
      .reduce((accumulator: JunctiveInput | SimpleInput, value: GameInput) => {
        const si = new SimpleInput(value, CommandInputType.PRESS);
        if (accumulator === null) {
          return si;
        } else {
          return new JunctiveInput(accumulator, si);
        }
      }, null);

    console.log(parsedInput);
    return {input: parsedInput!, strict};
  }
}
