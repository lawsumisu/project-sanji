import { HitboxDefinition } from 'src/characters';
import { FrameDataState } from 'src/editor/redux/frameData';

export function getFrameDefinition(frameData: FrameDataState, frameKey: string, frameIndex: number): HitboxDefinition | null {
  const { hitboxDef } =  frameData.definitionMap[frameKey];
  if (hitboxDef) {
    return hitboxDef[frameIndex] ? hitboxDef[frameIndex] : null;
  }
  return null;
}