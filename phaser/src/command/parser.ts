import * as _ from 'lodash';

/**
 * Grammar:
 * start: =     AND_INPUT | OR_INPUT | BASE_INPUT
 * INPUT:=      BASE_INPUT | (LP (AND_INPUT | OR_INPUT) RP) | OR_INPUT
 * AND_INPUT:=  INPUT ('+' INPUT)+
 * OR_INPUT:=   AND_INPUT ('|' AND_INPUT)+
 * BASE_INPUT:= '*'?[1,2,3,4,5,6,7,8,9,a,b,c,d,l,r]
 * OP:=         '+' | '|'
 * LP:=         '('
 * RP:=         ')'
 */

export enum TokenType {
  OR = '|',
  AND = '+',
  LP = '(',
  RP = ')',
  BASE_INPUT = 'BASE_INPUT',
  OR_INPUT = 'OR_INPUT',
  AND_INPUT = 'AND_INPUT',
  INPUT = 'INPUT'
}

export interface Token {
  value?: string;
  type: TokenType;
}

export interface NonTerminalToken extends Token {
  nestedTokens: Token[]
}

export function isNonTerminal(token: Token): token is NonTerminalToken {
  return _.has(token, 'nestedTokens');
}

export class CommandParser {
  public static tokenize(s: string): Token[] {
    const regex = /(\*?[1-9a-dl])|([()|+])/g;
    const matches = s.match(regex);
    if (matches) {
      return matches.map(m => {
        switch (m) {
          case '(':
            return { type: TokenType.LP };
          case ')':
            return { type: TokenType.RP};
          case '+':
            return { type: TokenType.AND };
          case '|':
            return { type: TokenType.OR };
          default:
            return { type: TokenType.BASE_INPUT, value: m };
        }
      });
    } else {
      return [];
    }
  }

  public static parse(tokens: Token[]): Token | null {
    if (tokens.length === 1 && tokens[0].type === TokenType.BASE_INPUT) {
      return tokens[0];
    } else {
      return CommandParser.parseAndInput(tokens) || CommandParser.parseOrInput(tokens);
    }
  }

  private static parseInput(tokens: Token[]): NonTerminalToken | null {
    if (tokens.length === 1 && tokens[0].type === TokenType.BASE_INPUT) {
      return { type: TokenType.INPUT, nestedTokens: [...tokens ]};
    } else if (tokens.length >= 3 && tokens[0].type === TokenType.LP && tokens[tokens.length - 1].type === TokenType.RP) {
      const rest = tokens.filter((__, i) => i !== 0 && i !== tokens.length -1);
      const token = CommandParser.parseAndInput(rest) || CommandParser.parseOrInput(rest);
      if (token) {
        return { type: TokenType.INPUT, nestedTokens: [...tokens] }
      }
    } else if (tokens.length >= 3) {
      return CommandParser.parseOrInput(tokens);
    }
    return null;
  }

  private static parseAndInput(tokens: Token[]): NonTerminalToken | null {
    let seen: Token[] = [];
    const nestedTokens: Token[] = [];
    for (let i = 0; i <= tokens.length; ++i) {
      const token = tokens[i];
      if (i === tokens.length || tokens[i].type === TokenType.AND) {
        const inputToken = CommandParser.parseInput(seen);
        if (inputToken) {
          nestedTokens.push(inputToken);
          token && nestedTokens.push(token);
          seen = [];
          continue;
        }
      }
      token && seen.push(token);
    }
    return seen.length > 0 || nestedTokens.length < 3 ? null : { type: TokenType.AND_INPUT, nestedTokens }
  }

  private static parseOrInput(tokens: Token[]): NonTerminalToken | null {
    let seen: Token[] = [];
    const nestedTokens: Token[] = [];
    for (let i = 0; i <= tokens.length; ++i) {
      const token = tokens[i];
      if (i === tokens.length || tokens[i].type === TokenType.OR) {
        const inputToken = CommandParser.parseInput(seen);
        if (inputToken) {
          nestedTokens.push(inputToken);
          token && nestedTokens.push(token);
          seen = [];
          continue;
        }
      }
      token && seen.push(token);
    }
    return seen.length > 0 || nestedTokens.length < 3 ? null : { type: TokenType.OR_INPUT, nestedTokens }
  }

  public static getValue(token: Token): string {
    switch (token.type) {
      case TokenType.RP:
      case TokenType.LP:
      case TokenType.OR:
      case TokenType.AND:
        return token.type;
      case TokenType.BASE_INPUT:
        return token.value || token.type;
      default:
        return (token as NonTerminalToken).nestedTokens.map(CommandParser.getValue).join('');
    }
  }
}
