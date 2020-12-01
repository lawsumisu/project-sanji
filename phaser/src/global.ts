import { GI, GameInputPlugin } from 'src/plugins/gameInput.plugin';
import { Stage } from 'src/stage';

let stage: Stage;
export const PS = {
  get gameInput(): GameInputPlugin {
    return GI;
  },
  get stage(): Stage {
    return stage;
  },
  set stage(newStage: Stage) {
    stage = newStage;
  },
  get config() {
    return {
      width: 384 * 2,
      height: 260 * 2,
    }
  }
};