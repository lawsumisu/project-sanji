import chai, { assert, expect } from 'chai';
import * as sinon from 'sinon';
import { SinonSandbox } from 'sinon';
import * as sinonChai from 'sinon-chai';
import { GameInput, InputHistory } from 'src/plugins/gameInput.plugin';
import { Command, CommandInputType, SimpleInput } from 'src/command';
import { PS } from 'src/global';
import { CommandParser, NonTerminalToken, Token, TokenType } from 'src/command/parser';

chai.use(sinonChai);

describe('Command Tests', () => {
  let sandbox: SinonSandbox;

  const setupInputHistory = (inputs: Array<Set<GameInput>>) => {
    const history = new InputHistory({});
    history.load(inputs);
    sandbox.stub(PS, 'gameInput').get(() => ({
      for: () => history
    }));
  };
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Simple Input', () => {
    it('checkInput', () => {
      setupInputHistory([
        new Set([GameInput.RIGHT, GameInput.INPUT1]),
        new Set([GameInput.DOWN_RIGHT]),
        new Set([GameInput.RIGHT])
      ]);

      const simpleInput = new SimpleInput(GameInput.RIGHT, CommandInputType.PRESS);
      assert.isTrue(simpleInput.checkInput(0));
      assert.isFalse(simpleInput.checkInput(0, { facingRight: true, historyIndex: 1 }));
      assert.isTrue(simpleInput.checkInput(0, { facingRight: true, historyIndex: 2 }));
    });
  });

  describe('Command Parser', () => {
    describe('tokenize', () => {
      it('tokenizes single character string', () => {
        const tokens = CommandParser.tokenize('a');
        expect(tokens.length).to.equal(1);
        expect(tokens[0]).to.deep.equal({ value: 'a', type: TokenType.BASE_INPUT });

        const tokens2 = CommandParser.tokenize('*c');
        expect(tokens2.length).to.equal(1);
        expect(tokens2[0]).to.deep.equal({ value: '*c', type: TokenType.BASE_INPUT });
      });

      it('tokenizes operator string', () => {
        const tokens1 = CommandParser.tokenize('a+b');
        expect(tokens1.length).to.equal(3);
        expect(tokens1).to.deep.equal([
          { value: 'a', type: TokenType.BASE_INPUT },
          { type: TokenType.AND },
          { value: 'b', type: TokenType.BASE_INPUT }
        ]);

        const tokens2 = CommandParser.tokenize('b|c|d');
        expect(tokens2.length).to.equal(5);
        expect(tokens2).to.deep.equal([
          { value: 'b', type: TokenType.BASE_INPUT },
          { type: TokenType.OR },
          { value: 'c', type: TokenType.BASE_INPUT },
          { type: TokenType.OR },
          { value: 'd', type: TokenType.BASE_INPUT }
        ]);
      });

      it('tokenizes parenthetical string', () => {
        const tokens1 = CommandParser.tokenize('(*1|*2|*3)');
        expect(tokens1.length).to.equal(7);
        expect(tokens1).to.deep.equal([
          { type: TokenType.LP },
          { value: '*1', type: TokenType.BASE_INPUT },
          { type: TokenType.OR },
          { value: '*2', type: TokenType.BASE_INPUT },
          { type: TokenType.OR },
          { value: '*3', type: TokenType.BASE_INPUT },
          { type: TokenType.RP }
        ]);
      });
    });
    describe('parse', () => {
      it('parses BASE input', () => {
        const parsed = CommandParser.parse(CommandParser.tokenize('*4'));
        assert.isNotNull(parsed);
        const { type, value } = parsed as Token;
        expect(type).to.equal(TokenType.BASE_INPUT);
        expect(value).to.equal('*4');
      });

      it('parses AND input', () => {
        const parsed = CommandParser.parse(CommandParser.tokenize('1+2'));
        assert.isNotNull(parsed);
        const { type, nestedTokens } = parsed as NonTerminalToken;
        expect(type).to.equal(TokenType.AND_INPUT);
        expect(nestedTokens).to.deep.equal([
          { type: TokenType.INPUT, nestedTokens: [{ type: TokenType.BASE_INPUT, value: '1' }] },
          { type: TokenType.AND },
          { type: TokenType.INPUT, nestedTokens: [{ type: TokenType.BASE_INPUT, value: '2' }] }
        ]);
      });

      it('parses OR input', () => {
        const parsed = CommandParser.parse(CommandParser.tokenize('1|2|*3'));
        assert.isNotNull(parsed);
        const { type, nestedTokens } = parsed as NonTerminalToken;
        expect(type).to.equal(TokenType.OR_INPUT);
        expect(nestedTokens).to.deep.equal([
          { type: TokenType.INPUT, nestedTokens: [{ type: TokenType.BASE_INPUT, value: '1' }] },
          { type: TokenType.OR },
          { type: TokenType.INPUT, nestedTokens: [{ type: TokenType.BASE_INPUT, value: '2' }] },
          { type: TokenType.OR },
          { type: TokenType.INPUT, nestedTokens: [{ type: TokenType.BASE_INPUT, value: '*3' }] }
        ]);
      });
      it('parses parenthentical inputs', () => {
        const parsed = CommandParser.parse(CommandParser.tokenize('(a+b)|c'));
        assert.isNotNull(parsed);
        const { type, nestedTokens } = parsed as NonTerminalToken;
        expect(type).to.equal(TokenType.OR_INPUT);
        expect(nestedTokens).to.deep.equal([
          {
            type: TokenType.INPUT,
            nestedTokens: [
              { type: TokenType.LP },
              { type: TokenType.BASE_INPUT, value: 'a' },
              { type: TokenType.AND },
              { type: TokenType.BASE_INPUT, value: 'b' },
              { type: TokenType.RP }
            ]
          },
          { type: TokenType.OR },
          { type: TokenType.INPUT, nestedTokens: [{ type: TokenType.BASE_INPUT, value: 'c' }] }
        ]);

        const parsed2 = CommandParser.parse(CommandParser.tokenize('b+(c|d)'));
        assert.isNotNull(parsed2);
        const { type: type2, nestedTokens: nestedTokens2 } = parsed2 as NonTerminalToken;
        expect(type2).to.equal(TokenType.AND_INPUT);
        expect(nestedTokens2).to.deep.equal([
          { type: TokenType.INPUT, nestedTokens: [{ type: TokenType.BASE_INPUT, value: 'b' }] },
          { type: TokenType.AND },
          {
            type: TokenType.INPUT,
            nestedTokens: [
              { type: TokenType.LP },
              { type: TokenType.BASE_INPUT, value: 'c' },
              { type: TokenType.OR },
              { type: TokenType.BASE_INPUT, value: 'd' },
              { type: TokenType.RP }
            ]
          }
        ]);
      });
      it('groups ands before ors', () => {
        const parsed = CommandParser.parse(CommandParser.tokenize('1|2|3+b'));
        assert.isNotNull(parsed);
        const { type, nestedTokens } = parsed as NonTerminalToken;
        expect(type).to.equal(TokenType.AND_INPUT);
        expect(nestedTokens).to.deep.equal([
          {
            type: TokenType.INPUT,
            nestedTokens: [
              { type: TokenType.BASE_INPUT, value: '1' },
              { type: TokenType.OR },
              { type: TokenType.BASE_INPUT, value: '2' },
              { type: TokenType.OR },
              { type: TokenType.BASE_INPUT, value: '3' }
            ]
          },
          { type: TokenType.AND },
          { type: TokenType.INPUT, nestedTokens: [{ type: TokenType.BASE_INPUT, value: 'b' }] }
        ]);
      });
    });
  });
  describe('Command', () => {
    describe('parse', () => {
      it('parses single character input', () => {
        const inputs = Command.parse('a');
        expect(inputs.length).to.equal(1);
        assert.isTrue(inputs[0].input.equals(new SimpleInput(GameInput.INPUT3, CommandInputType.PRESS)));
        assert.isFalse(inputs[0].strict);
      });

      it('parses multicharacter simple input', () => {
        const inputs = Command.parse('*b');
        expect(inputs.length).to.equal(1);
        assert.isTrue(inputs[0].input.equals(new SimpleInput(GameInput.INPUT4, CommandInputType.DOWN)));
        assert.isFalse(inputs[0].strict);
      });
    });
  });
});
