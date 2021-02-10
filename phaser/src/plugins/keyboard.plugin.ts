import { PS } from 'src/global';
import * as Phaser from "phaser";
const keyCodes = Phaser.Input.Keyboard.KeyCodes;

type Unpacked<T> = T extends (infer U)[] ? U : T;

/**
 * A plugin that allows mapping between device inputs and relevant game inputs.
 */
export class KeyboardPluginPS extends Phaser.Plugins.ScenePlugin {
  private readonly checkKeys = [keyCodes.ONE, keyCodes.TWO, keyCodes.THREE];
  private pressedKeys: {[key: number]: number} = {};

  isKeyPressed(key: Unpacked<KeyboardPluginPS['checkKeys']>) {
    return PS.stage.input.keyboard.addKey(key).isDown && this.pressedKeys[key] <= 1;
  }

  isKeyDown(key: Unpacked<KeyboardPluginPS['checkKeys']>) {
    return PS.stage.input.keyboard.addKey(key).isDown;
  }

  public boot(): void {
    this.systems.events
      .on('start', this.onSceneStart)
      .on('update', this.onSceneUpdate)
      .once('destroy', this.onSceneDestroy);
  }


  private onSceneStart = (): void => {
  };

  private onSceneUpdate = (): void => {
    this.checkKeys.forEach(key => {
      if (!this.pressedKeys[key]) {
        this.pressedKeys[key] = 0;
      }
      if (PS.stage.input.keyboard.addKey(key).isDown) {
        this.pressedKeys[key] += 1;
      } else {
        this.pressedKeys[key] = 0;
      }
    });
  };

  private onSceneDestroy = (): void => {};
}
