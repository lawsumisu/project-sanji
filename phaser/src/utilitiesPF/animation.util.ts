import * as Phaser from 'phaser';
import * as _ from 'lodash';

export interface AnimationFrameConfig {
  index: number;
  prefix: string;
}

export function addAnimation(
  sprite: Phaser.GameObjects.Sprite,
  key: string,
  assetKey: string,
  count: number,
  prefix: string,
  frameRate: number,
  repeat: number = -1
): void {
  const frames = sprite.anims.animationManager.generateFrameNames(assetKey, {
    start: 1,
    end: count,
    zeroPad: 2,
    prefix: `${prefix}/`,
    suffix: '.png'
  });
  sprite.anims.animationManager.create({ key, frames, frameRate, repeat });
}

export function addAnimationByFrames(
  sprite: Phaser.GameObjects.Sprite,
  key: string,
  assetKey: string,
  frameData: Array<number | AnimationFrameConfig>,
  defaultPrefix: string,
  frameRate: number,
  repeat: number
): void {
  const frames: Phaser.Types.Animations.AnimationFrame[] = frameData
    .map((frame: number | AnimationFrameConfig) => {
      return _.isNumber(frame) ? { index: frame, prefix: defaultPrefix } : frame;
    })
    .map((config: AnimationFrameConfig) => {
      const frameString = `${config.index}`.padStart(2, '0');
      const prefix = config.prefix || defaultPrefix;
      return {
        key: assetKey,
        frame: `${prefix}/${frameString}.png`
      };
    });
  sprite.anims.animationManager.create({ key, frames, frameRate, repeat });
}

export function playAnimation(sprite: Phaser.GameObjects.Sprite, key: string, force = false): void {
  if (sprite.anims.getCurrentKey() !== key || force) {
    sprite.anims.play(key);
  }
}
