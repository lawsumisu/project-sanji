import * as _ from 'lodash';
import { addAnimation, addAnimationByFrames } from 'src/utilitiesPF/animation.util';
import { Hit } from 'src/collider';

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

export enum BoxType {
  HIT = 'HIT',
  HURT = 'HURT'
}

export interface BoxDefinition {
  tag?: string | number;
  boxes: BoxConfig[];
  persistThroughFrame?: number;
}

export interface HitboxDefinition extends BoxDefinition {
  hit?: Hit;
}

export interface FrameDefinition {
  animDef: AnimationDefinition;
  hurtboxDef?: {
    [key: number]: BoxDefinition;
  }
  hitboxDef?: {
    hit: Hit;
    [key: number]: HitboxDefinition;
  };
}

export type FrameDefinitionMap = {
  name: string;
  frameDef: {
    [key: string]: FrameDefinition;
  }
};

export function addAnimationsByDefinition(sprite: Phaser.GameObjects.Sprite, definitionMap: FrameDefinitionMap): void {
  const { name, frameDef } = definitionMap;
  _.forEach(frameDef, (definition, key: string) => {
    const { frames, prefix, frameRate, repeat = 0, assetKey } = definition.animDef;
    const animKey = [name, key].join('-');
    if (_.isNumber(frames)) {
      addAnimation(sprite, animKey, assetKey, frames, prefix, frameRate, repeat);
    } else {
      addAnimationByFrames(sprite, animKey, assetKey, frames, prefix, frameRate, repeat);
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

export function getFrameIndexFromSpriteIndex(animDef: AnimationDefinition, spriteIndex: number): number {
  const { frames } = animDef;
  if (_.isNumber(frames)) {
    return spriteIndex - 1;
  } else {
    let spriteIndexOffset = 0;
    let frameIndex = 0;
    for (let i = 0; i < frames.length; i++) {
      const config: number | AnimationFrameConfig = frames[i];
      const mappedConfig: AnimationFrameConfig = _.isNumber(config) ? { index: config } : config;
      const { index: start, endIndex: end = start, loop = 1 } = mappedConfig;
      const loopLength = end - start + 1;
      if (spriteIndex - spriteIndexOffset <= loopLength * loop) {
        return frameIndex + (spriteIndex - spriteIndexOffset - 1) % loopLength;
      } else {
        spriteIndexOffset += loopLength * loop;
        frameIndex += loopLength;
      }
    }
    return frameIndex;
  }
}