import chai, { assert } from 'chai';
import * as sinon from 'sinon';
import { SinonSandbox } from 'sinon';
import * as sinonChai from 'sinon-chai';
import { GameInput, InputHistory } from 'src/plugins/gameInput.plugin';
import { CommandInputType, SimpleInput } from 'src/command';
import { PS } from 'src/global';

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
      assert.isFalse(simpleInput.checkInput(0, true, 1));
      assert.isTrue(simpleInput.checkInput(0, true, 2));
    });

    it('checkInputIgnoringType', () => {
      setupInputHistory([
        new Set([GameInput.RIGHT, GameInput.INPUT1]),
        new Set([GameInput.DOWN_RIGHT]),
        new Set([GameInput.RIGHT])
      ]);
    })
  });
});
