import { GameInput } from 'src/plugins/gameInput.plugin';
import { PS } from 'src/global';
import * as _ from 'lodash';

export enum CommandInputType {
  DOWN = 'DOWN',
  PRESS = 'PRESS',
  RELEASE = 'RELEASE'
}

interface CommandInput {
  input: SimpleInput | JunctiveInput;
  strict?: boolean;
}

export class SimpleInput {
  input: GameInput | ((facingRight: boolean) => GameInput);
  type: CommandInputType;

  constructor(input: GameInput | ((facingRight: boolean) => GameInput), type: CommandInputType) {
    this.input = input;
    this.type = type;
  }

  public checkInput(playerIndex: number, facingRight = true, historyIndex = 0): boolean {
    const history = PS.gameInput.for(playerIndex);
    const input = _.isFunction(this.input) ? this.input(facingRight) : this.input;
    switch (this.type) {
      case CommandInputType.DOWN:
        return history.isInputDown(input, historyIndex);
      case CommandInputType.PRESS:
        return history.isInputPressed(input, historyIndex);
      case CommandInputType.RELEASE:
        return history.isInputReleased(input, historyIndex);
    }
  }

  public checkInputIgnoringType(playerIndex: number, facingRight = true, historyIndex = 0): boolean {
    const history = PS.gameInput.for(playerIndex);
    const input = _.isFunction(this.input) ? this.input(facingRight) : this.input;
    return history.isInputDown(input, historyIndex) || history.isInputReleased(input, historyIndex);
  }

  public toString(): string {
    return (_.isFunction(this.input) ? this.input(true) : this.input).toString();
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

  public checkInput(playerIndex: number, facingRight = true, historyIndex = 0): boolean {
    const c1 = this.input1.checkInput(playerIndex, facingRight, historyIndex);
    if (c1 && !this.isAnd) {
      return true;
    } else {
      const c2 = this.input2.checkInput(playerIndex, facingRight, historyIndex);
      return this.isAnd ? c1 && c2 : c2;
    }
  }

  public checkInputIgnoringType(playerIndex: number, facingRight = true, historyIndex = 0): boolean {
    const c1 = this.input1.checkInputIgnoringType(playerIndex, facingRight, historyIndex);
    if (c1 && this.isAnd) {
      return true;
    } else {
      const c2 = this.input2.checkInputIgnoringType(playerIndex, facingRight, historyIndex);
      return this.isAnd ? c1 && c2 : c2;
    }
  }

  public toString(): string {
    return this.input1.toString() + (this.isAnd ? '+' : '/') + this.input2.toString();
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
    d: GameInput.INPUT1,
    l: GameInput.INPUT5,
  };

  private static reverseGameInputMap: { [key in GameInput]?: GameInput } = {
    [GameInput.RIGHT]: GameInput.LEFT,
    [GameInput.LEFT]: GameInput.RIGHT,
    [GameInput.DOWN_RIGHT]: GameInput.DOWN_LEFT,
    [GameInput.DOWN_LEFT]: GameInput.DOWN_RIGHT,
  };

  public static registry = {
    FORWARD: new Command('*6', 1),
    BACK: new Command('*4', 1),
    GUARD: new Command('*l', 1),
  };

  private readonly inputs: CommandInput[];
  private readonly inputTime: number;

  constructor(cmd: string, inputTime: number) {
    this.inputs = Command.parse(cmd);
    this.inputTime = inputTime;
    console.log(this.toString());
  }

  public isExecuted(playerIndex: number, facingRight = true): boolean {
    let i = this.inputs.length - 1;
    if (!this.inputs[i].input.checkInput(playerIndex, facingRight)) {
      return false;
    } else if (this.inputs.length === 1) {
      return true;
    } else {
      const executionTime = Math.min(this.inputTime, PS.gameInput.for(playerIndex).historyLength);
      return this.isExecutedRecursive(playerIndex, facingRight, 1, i - 1, executionTime);
    }
  }

  private isExecutedRecursive(
    playerIndex: number,
    facingRight: boolean,
    historyIndex: number,
    inputIndex: number,
    executionTime: number
  ): boolean {
    for (let j = historyIndex; j < executionTime; j++) {
      const commandInput = this.inputs[inputIndex];
      if (commandInput.strict) {
        // If strict case, then fail early if any inputs other than the one being checked for have been inputted.
        if (PS.gameInput.for(playerIndex).getInputs(j).size === 0) {
          continue;
        } else if (!commandInput.input.checkInputIgnoringType(playerIndex, facingRight, j)) {
          return false;
        }
      }
      if (commandInput.input.checkInput(playerIndex, facingRight, j)) {
        if (inputIndex === 0) {
          return true;
        } else {
          return this.isExecutedRecursive(playerIndex, facingRight, j + 1, inputIndex - 1, executionTime);
        }
      }
    }
    return false;
  }

  private static parse(cmd: string): CommandInput[] {
    const regex = /\(?\*?[a-dl1-9]([|+]\(*\*?[a-dl1-9]\)*)*\)?~?/g;
    const matches = cmd.match(regex);
    if (matches) {
      return matches.map(Command.parseInput);
    } else {
      return [];
    }
  }

  private static parseInput(input: string): CommandInput {
    let strict = input.endsWith('~');
    const parsedInput = Command.parseDisjunctiveInput(input.replace('~', ''));
    return { input: parsedInput!, strict };
  }

  private static parseConjunctiveInput(input: string): SimpleInput | JunctiveInput {
    return input
      .split('+')
      .map<SimpleInput | JunctiveInput>(simpleInput => {
        const type = simpleInput.startsWith('*') ? CommandInputType.DOWN : CommandInputType.PRESS;
        const input = Command.commandToGameInputMap[simpleInput.replace('*', '')];
        if (Command.reverseGameInputMap[input]) {
          return new SimpleInput(facingRight => (facingRight ? input : Command.reverseGameInputMap[input]!), type);
        } else {
          return new SimpleInput(input, type);
        }
      })
      .reduce((accumulator, simpleInput, i) => {
        if (i === 0) {
          return simpleInput;
        } else {
          return new JunctiveInput(accumulator, simpleInput, true);
        }
      });
  }

  private static parseDisjunctiveInput(input: string): SimpleInput | JunctiveInput {
    return input
      .split('|')
      .map(Command.parseConjunctiveInput)
      .reduce((accumulator, simpleInput, i) => {
        if (i === 0) {
          return simpleInput;
        } else {
          return new JunctiveInput(accumulator, simpleInput);
        }
      });
  }

  public toString(): string {
    return this.inputs.map(ci => ci.input.toString()).join('');
  }
}
