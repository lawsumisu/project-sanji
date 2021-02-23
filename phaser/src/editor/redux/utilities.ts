import * as _ from 'lodash';
import { BoxDefinition, BoxType, FrameDefinitionMap, PushboxDefinition } from 'src/characters/frameData';
import { FrameDataState, NormalizedFrameDefinitionMap } from 'src/editor/redux/frameData';
import { library } from '@fortawesome/fontawesome-svg-core';
import { v4 as uuidv4 } from 'uuid';
import {
  faAngleLeft,
  faAngleRight,
  faCopy,
  faFileCode,
  faFileImage,
  faCrosshairs
} from '@fortawesome/free-solid-svg-icons';

export function getBoxDefinition(
  frameData: FrameDataState,
  frameKey: string,
  frameIndex: number,
  type: BoxType
): BoxDefinition | PushboxDefinition | null {
  const { hitboxDef, hurtboxDef } = frameData.definitionMap[frameKey];
  const { pushboxDef: foo } = frameData.normalizedDefinitionMap.frameDef[frameKey];
  if (type === BoxType.HIT && hitboxDef) {
    return hitboxDef[frameIndex] || null;
  } else if (type === BoxType.HURT && hurtboxDef) {
    return hurtboxDef[frameIndex] || null;
  } else if (type === BoxType.PUSH && foo) {
    return frameData.normalizedDefinitionMap.pushboxes[foo[frameIndex]] || null;
  }
  return null;
}

// TODO add types for accumulator
export function normalizeDefinitionMap(definitionMap: FrameDefinitionMap['frameDef']): NormalizedFrameDefinitionMap {
  return _.reduce(
    definitionMap,
    (acc: NormalizedFrameDefinitionMap, definition, key) => {
      const frameKeyEntry: NormalizedFrameDefinitionMap['frameDef'][0] = {
        pushboxDef: {},
        hitboxDef: {},
        hurtboxDef: {}
      };
      const accumulatorHelper = (
        accKey: 'pushboxes' | 'hurtboxes' | 'hitboxes',
        definitionKey: 'pushboxDef' | 'hurtboxDef' | 'hitboxDef',
        excludeKeys: string[] = []
      ) => {
        if (definition[definitionKey]) {
          _.forEach(definition[definitionKey], (pushbox, key) => {
            if (!excludeKeys.includes(key)) {
              const uuid = uuidv4();
              acc[accKey][uuid] = pushbox;
              frameKeyEntry[definitionKey][key] = uuid;
            }
          });
        }
      };
      accumulatorHelper('pushboxes', 'pushboxDef');
      accumulatorHelper('hurtboxes', 'hurtboxDef');
      accumulatorHelper('hitboxes', 'hitboxDef', ['hit']);
      acc.frameDef[key] = frameKeyEntry;
      return acc;
    },
    { pushboxes: {}, hitboxes: {}, hurtboxes: {}, frameDef: {} }
  );
}

export function initializeFontAwesome(): void {
  library.add(faAngleRight, faAngleLeft, faCopy, faFileCode, faFileImage, faCrosshairs);
}

export function round(v: number, precision = 100) {
  return Math.round(v * precision) / precision;
}
