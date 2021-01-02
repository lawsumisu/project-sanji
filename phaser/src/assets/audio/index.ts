import * as _ from 'lodash';
import { Scene } from 'phaser';

const audio =  {
  rush1: 'sfx/hits/song203.ogg',
  land: 'sfx/land.ogg',
  hitLight: 'sfx/hits/SE_00007.ogg',
  hitMed: 'sfx/hits/SE_00008.ogg',
  hitHeavy: 'sfx/hits/SE_00009.ogg',
  punch1: 'sfx/hits/SE_00025.ogg',
  punch2: 'sfx/hits/SE_00026.ogg',
  jabVoice: 'sfx/vanessa/001.ogg',
};

export type AudioKey = keyof typeof audio;

export class SoundLibrary {
  private readonly scene: Scene;

  private registeredSounds: {[key in AudioKey]?: object} = {};

  constructor(scene: Scene) {
    this.scene = scene;
  }
  public register(sfx: AudioKey): void {
    this.registeredSounds[sfx] = {}
  }

  public load(): void {
    _.forEach(this.registeredSounds, (_value, key: AudioKey) => {
      const path = audio[key];
      this.scene.load.audio(key, `assets/audio/${path}`);
    })
  }
}