import * as _ from 'lodash';
import { BoxDefinition, BoxType, PushboxDefinition } from 'src/characters/frameData';
import { FrameDataState } from 'src/editor/redux/frameData';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faAngleLeft,
  faAngleRight,
  faCopy,
  faCrosshairs,
  faFileCode,
  faFileImage
} from '@fortawesome/free-solid-svg-icons';
import { getFrameDefId } from 'src/editor/redux/frameData/frameDefinitionEdit';

// TODO move this logicinto frameDefinitionEdit.ts
export function getBoxDefinition(
  frameData: FrameDataState,
  frameKey: string,
  frameIndex: number,
  type: BoxType
): BoxDefinition | PushboxDefinition | null {
  const { hitboxDef, hurtboxDef } = frameData.definitionMap[frameKey];
  if (type === BoxType.HIT && hitboxDef) {
    return hitboxDef[frameIndex] || null;
  } else if (type === BoxType.HURT && hurtboxDef) {
    return hurtboxDef[frameIndex] || null;
  } else if (type === BoxType.PUSH) {
    const id = getFrameDefId(frameKey, frameIndex, BoxType.PUSH);
    const originalData = _.get(frameData.definitionMap,id, null);
    return _.merge({}, originalData, (frameData.frameDefinitionEdits[id] || {}).data);
  }
  return null;
}

export function initializeFontAwesome(): void {
  library.add(faAngleRight, faAngleLeft, faCopy, faFileCode, faFileImage, faCrosshairs);
}

export function round(v: number, precision = 100) {
  return Math.round(v * precision) / precision;
}
