import { GameInput } from 'src/plugins/gameInput.plugin';
import { PS } from 'src/global';
import * as _ from 'lodash';
import { CommandParser, isNonTerminal, Token, TokenType } from 'src/command/parser';

export enum CommandInputType {
  DOWN = 'DOWN',
  PRESS = 'PRESS',
  RELEASE = 'RELEASE'
}

interface CommandInput {
  input: Input;
  strict?: boolean;
}

interface CheckInputParams {
  facingRight: boolean;
  historyIndex: number;
  ignoreType: boolean;
}

interface Input {
  checkInput(playerIndex: number, params: Partial<CheckInputParams>): boolean;
  toString(): string;
  equals(input: Input): boolean;
}

export class SimpleInput implements Input {
  input: GameInput | ((facingRight: boolean) => GameInput);
  type: CommandInputType;

  constructor(input: GameInput | ((facingRight: boolean) => GameInput), type: CommandInputType) {
    this.input = input;
    this.type = type;
  }

  public checkInput(playerIndex: number, params: Partial<CheckInputParams> = {}): boolean {
    const { facingRight = true, historyIndex = 0, ignoreType = false } = params;
    const history = PS.gameInput.for(playerIndex);
    const input = _.isFunction(this.input) ? this.input(facingRight) : this.input;
    if (ignoreType) {
      return history.isInputDown(input, historyIndex) || history.isInputReleased(input, historyIndex);
    } else {
      switch (this.type) {
        case CommandInputType.DOWN:
          return history.isInputDown(input, historyIndex);
        case CommandInputType.PRESS:
          return history.isInputPressed(input, historyIndex);
        case CommandInputType.RELEASE:
          return history.isInputReleased(input, historyIndex);
      }
    }
  }

  public toString(): string {
    return (_.isFunction(this.input) ? this.input(true) : this.input).toString();
  }

  public equals(i: Input): boolean {
    if (_.has(i, 'input') && _.has(i, 'type')) {
      const si = i as SimpleInput;
      return si.input === this.input && si.type === this.type;
    }
    return false;
  }
}

export class JunctiveInput implements Input {
  isAnd: boolean;
  inputs: Input[];

  constructor(inputs: Input[], isAnd = false) {
    this.isAnd = isAnd;
    this.inputs = inputs;
  }

  public checkInput(playerIndex: number, params: Partial<CheckInputParams> = {}): boolean {
    return this.isAnd
      ? _.every(this.inputs, i => i.checkInput(playerIndex, params))
      : _.some(this.inputs, i => i.checkInput(playerIndex, params));
  }

  public toString(): string {
    return '(' + this.inputs.map(i => i.toString()).join(this.isAnd ? '+' : '/') + ')';
  }

  public equals(i: Input): boolean {
    if (_.has(i, 'inputs') && _.has(i, 'isAnd')) {
      const ji = i as JunctiveInput;
      if (this.isAnd !== ji.isAnd || this.inputs.length !== ji.inputs.length) {
        return false;
      }
      for (const input of this.inputs) {
        if (!_.some(ji.inputs, jiInput => jiInput.equals(input))) {
          return false;
        }
      }
      return true;
    }
    return false;
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
    l: GameInput.INPUT5
  };

  private static reverseGameInputMap: { [key in GameInput]?: GameInput } = [
    [GameInput.RIGHT, GameInput.LEFT],
    [GameInput.UP_RIGHT, GameInput.UP_LEFT],
    [GameInput.DOWN_RIGHT, GameInput.DOWN_LEFT]
  ].reduce((acc, [k1, k2]) => {
    acc[k1] = k2;
    acc[k2] = k1;
    return acc;
  }, {});

  public static registry = {
    FORWARD: new Command('*6', 1),
    FORWARD_ANY: new Command('*3|*6|*9', 1),
    BACK: new Command('*4', 1),
    BACK_ANY: new Command('*1|*4|*7', 1),
    GUARD: new Command('*l', 1)
  };

  private readonly inputs: CommandInput[];
  private readonly inputTime: number;

  constructor(cmd: string, inputTime: number = 1) {
    this.inputs = Command.parse(cmd);
    this.inputTime = inputTime;
  }

  public isExecuted(playerIndex: number, facingRight = true): boolean {
    let i = this.inputs.length - 1;
    if (!this.inputs[i].input.checkInput(playerIndex, { facingRight })) {
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
        } else if (!commandInput.input.checkInput(playerIndex, { facingRight, historyIndex: j, ignoreType: true })) {
          return false;
        }
      }
      if (commandInput.input.checkInput(playerIndex, { facingRight, historyIndex: j })) {
        if (inputIndex === 0) {
          return true;
        } else {
          return this.isExecutedRecursive(playerIndex, facingRight, j + 1, inputIndex - 1, executionTime);
        }
      }
    }
    return false;
  }

  public static parse(cmd: string): CommandInput[] {
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
    const inputStr = input.replace('~', '');
    const parsedInput = CommandParser.parse(CommandParser.tokenize(inputStr));
    if (parsedInput) {
      return { input: Command.getInputFromToken(parsedInput), strict };
    }
    throw new Error(`Invalid input ${inputStr}`);
  }

  private static getInputFromToken(token: Token): Input {
    if (isNonTerminal(token)) {
      switch (token.type) {
        case TokenType.AND_INPUT: {
          const tokens = token.nestedTokens.filter(t => t.type !== TokenType.AND);
          return tokens.length === 1
            ? Command.getInputFromToken(tokens[0])
            : new JunctiveInput(tokens.map(Command.getInputFromToken), true);
        }
        case TokenType.OR_INPUT: {
          const tokens = token.nestedTokens.filter(t => t.type !== TokenType.OR);
          return new JunctiveInput(tokens.map(Command.getInputFromToken));
        }
        case TokenType.INPUT: {
          return Command.getInputFromToken(token.nestedTokens[1] || token.nestedTokens[0]);
        }
        default:
          throw new Error('Token does not correspond to valid input');
      }
    } else {
      switch (token.type) {
        case TokenType.BASE_INPUT: {
          const { value = '' } = token;
          const type = value.startsWith('*') ? CommandInputType.DOWN : CommandInputType.PRESS;
          const input = Command.commandToGameInputMap[value.replace('*', '')];
          if (Command.reverseGameInputMap[input]) {
            return new SimpleInput(facingRight => (facingRight ? input : Command.reverseGameInputMap[input]!), type);
          } else {
            return new SimpleInput(input, type);
          }
        }
        default:
          throw new Error('Token does not correspond to valid input');
      }
    }
  }

  public toString(): string {
    return this.inputs.map(ci => ci.input.toString()).join('');
  }
}
