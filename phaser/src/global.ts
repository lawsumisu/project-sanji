import { GI, GameInputPlugin } from 'src/plugins/gameInput.plugin';

export const PS = {
  get gameInput(): GameInputPlugin {
    return GI;
  }
};