import * as _ from 'lodash';
import { addAnimation, addAnimationByFrames } from 'src/utilitiesPF/animation.util';
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

export interface AnimationFrameDefinition {
  animDef: AnimationDefinition;
}

export type FrameDefinitionMap<T extends string = string> = {
  [key in T]: AnimationFrameDefinition;
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