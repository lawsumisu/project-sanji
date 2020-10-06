import { BoxDefinition, BoxType } from 'src/characters/frameData';
import { FrameDataState } from 'src/editor/redux/frameData';

export function getBoxDefinition(
  frameData: FrameDataState,
  frameKey: string,
  frameIndex: number,
  type: BoxType
): BoxDefinition | null {
  const { hitboxDef, hurtboxDef } = frameData.definitionMap[frameKey];
  if (type === BoxType.HIT && hitboxDef) {
    return hitboxDef[frameIndex] || null;
  } else if (type === BoxType.HURT && hurtboxDef) {
    return hurtboxDef[frameIndex] || null;
  }
  return null;
}
