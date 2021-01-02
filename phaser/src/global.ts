import { GI, GameInputPlugin } from 'src/plugins/gameInput.plugin';
import { Stage } from 'src/stage';
import { SoundLibrary } from 'src/assets/audio';

let stage: Stage;
let soundLibrary: SoundLibrary;

export const PS = {
  get gameInput(): GameInputPlugin {
    return GI;
  },
  get stage(): Stage {
    return stage;
  },
  set stage(newStage: Stage) {
    stage = newStage;
    soundLibrary = new SoundLibrary(stage);
  },
  get config() {
    return {
      width: 384 * 2,
      height: 260 * 2,
    }
  },
  get soundLibrary() {
    return soundLibrary;
  }
};