import * as _ from 'lodash';
import { addAnimation, addAnimationByFrames } from 'src/utilitiesPF/animation.util';
import { Hit } from 'src/frame';

export interface CircleBoxConfig {
  x: number;
  y: number;
  r: number;
}

export interface CapsuleBoxConfig {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  r: number;
}

export function isCircleBox(box: BoxConfig): box is CircleBoxConfig {
  return _.has(box, 'x');
}

export type BoxConfig = CircleBoxConfig | CapsuleBoxConfig

export interface AnimationFrameConfig {
  index: number;
  endIndex?: number;
  loop?: number;
  prefix?: string;
}

export interface AnimationDefinition {
  frames: number | Array<number | AnimationFrameConfig>;
  assetKey: string;
  prefix: string;
  frameRate: number;
  repeat?: number;
}

export interface HitboxDefinition {
  hit?: Hit;
  tag?: string | number;
  boxes: BoxConfig[];
  persistUntilFrame?: number;
}

export interface FrameDefinition {
  animDef: AnimationDefinition;
  hitboxDef?: {
    hit: Hit;
    [key: number] : HitboxDefinition;
  };
}

export type FrameDefinitionMap<T extends string = string> = {
  [key in T]: FrameDefinition;
};

export function addAnimationsByDefinition(sprite: Phaser.GameObjects.Sprite, definitionMap: FrameDefinitionMap): void {
  _.forEach(definitionMap, (definition, key: string) => {
    const { frames, prefix, frameRate, repeat = 0, assetKey } = definition.animDef;
    if (_.isNumber(frames)) {
      addAnimation(sprite, key, assetKey, frames, prefix, frameRate, repeat);
    } else {
      addAnimationByFrames(sprite, key, assetKey, frames, prefix, frameRate, repeat);
    }
  });
}

export function getSpriteIndexFromDefinition(animDef: AnimationDefinition, frameIndex: number): number {
  const { frames } = animDef;
  if (_.isNumber(frames)) {
    return frameIndex + 1;
  } else {
    let frameIndexOffset = 0;
    for (let i = 0; i < frames.length; i++) {
      const config: number | AnimationFrameConfig = frames[i];
      const mappedConfig: AnimationFrameConfig = _.isNumber(config) ? { index: config } : config;
      const { index: start, endIndex: end = start } = mappedConfig;
      const f = frameIndex - frameIndexOffset;
      if (f <= end - start) {
        return start + f;
      } else {
        frameIndexOffset += end - start + 1;
      }
    }
    return -1;
  }
}