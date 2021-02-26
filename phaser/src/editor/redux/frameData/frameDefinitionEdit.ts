import { Action } from 'redux';
import actionCreatorFactory, { isType } from 'typescript-fsa';
import { BoxDefinition, BoxType, HitboxDefinition, PushboxDefinition } from 'src/characters/frameData';
import * as _ from 'lodash';
import { FrameDataState } from 'src/editor/redux/frameData/index';

export interface FrameDefinitionEditState {
  [key: string]: {
    edits: [];
    editIndex: number;
    data: any;
  };
}

const ACF = actionCreatorFactory('frameData');
export type TypedBoxDefinition<T extends BoxType> = T extends BoxType.PUSH
  ? PushboxDefinition
  : T extends BoxType.HIT
  ? HitboxDefinition
  : T extends BoxType.HURT
  ? BoxDefinition
  : never;

export function getFrameDefData<T extends BoxType>(
  frameDataState: FrameDataState,
  frameKey: string,
  frameIndex: number,
  type: T
): TypedBoxDefinition<T> | null {
  const { definitionMap, frameDefinitionEdits } = frameDataState;
  const id = getFrameDefId(frameKey, frameIndex, type);
  const originalData = _.get(definitionMap, id, null);
  const data = _.merge({}, originalData, (frameDefinitionEdits[id] || {}).data);
  switch (type) {
    case BoxType.HURT:
    case BoxType.HIT: {
      return data.boxes ? data : null;
    }
    case BoxType.PUSH: {
      return data.box ? data : null;
    }
    default: {
      return null;
    }
  }
}

export function getFrameDefId(frameKey: string, frameIndex: number, type: BoxType): string {
  const definitionString = type === BoxType.PUSH ? 'pushboxDef' : type === BoxType.HIT ? 'hitboxDef' : 'hurtboxDef';
  return [frameKey, definitionString, frameIndex].join('.');
}

type WithFrameId<T = {}> = T & { frameIndex: number; frameKey: string };
export const frameDefinitionEditActionCreators = {
  addHurtbox: ACF<WithFrameId<{ hurtboxDef: BoxDefinition }>>('ADD_HURTBOX'),
  editHurtbox: ACF<WithFrameId<{ hurtboxDef: Partial<BoxDefinition> }>>('EDIT_HURTBOX'),
  deleteHurtbox: ACF<WithFrameId>('DELETE_HURTBOX'),
  addHitbox: ACF<WithFrameId<{ hitboxDef: HitboxDefinition }>>('ADD_HITBOX'),
  editHitbox: ACF<WithFrameId<{ hitboxDef: Partial<HitboxDefinition> }>>('EDIT_HITBOX'),
  deleteHitbox: ACF<WithFrameId>('DELETE_HITBOX'),
  addPushbox: ACF<WithFrameId<{ pushboxDef: PushboxDefinition }>>('ADD_PUSHBOX'),
  editPushbox: ACF<WithFrameId<{ pushboxDef: Partial<PushboxDefinition> }>>('EDIT_PUSHBOX'),
  deletePushbox: ACF<WithFrameId>('DELETE_PUSHBOX')
};

// TODO update edits field on change to support undo/redo
export function frameDefinitionEditReducer(state: FrameDefinitionEditState, action: Action): FrameDefinitionEditState {
  if (
    isType(action, frameDefinitionEditActionCreators.addHurtbox) ||
    isType(action, frameDefinitionEditActionCreators.editHurtbox)
  ) {
    const { frameKey, frameIndex, hurtboxDef } = action.payload;
    const id = getFrameDefId(frameKey, frameIndex, BoxType.HURT);
    const newState = _.merge({}, state, { [id]: {} });
    newState[id].data = hurtboxDef;
    return newState;
  } else if (
    isType(action, frameDefinitionEditActionCreators.addHitbox) ||
    isType(action, frameDefinitionEditActionCreators.editHitbox)
  ) {
    const { frameKey, frameIndex, hitboxDef } = action.payload;
    const id = getFrameDefId(frameKey, frameIndex, BoxType.PUSH);
    const newState = _.merge({}, state, { [id]: {} });
    newState[id].data = hitboxDef;
    return newState;
  } else if (
    isType(action, frameDefinitionEditActionCreators.addPushbox) ||
    isType(action, frameDefinitionEditActionCreators.editPushbox)
  ) {
    const { frameKey, frameIndex, pushboxDef } = action.payload;
    const id = getFrameDefId(frameKey, frameIndex, BoxType.PUSH);
    return _.merge({}, state, { [id]: { data: pushboxDef } });
  } else if (
    isType(action, frameDefinitionEditActionCreators.deleteHurtbox) ||
    isType(action, frameDefinitionEditActionCreators.deleteHitbox) ||
    isType(action, frameDefinitionEditActionCreators.deletePushbox)
  ) {
    const { deleteHurtbox, deleteHitbox } = frameDefinitionEditActionCreators;
    const { frameKey, frameIndex } = action.payload;
    const type =
      action.type === deleteHurtbox.type
        ? BoxType.HURT
        : action.type === deleteHitbox.type
        ? BoxType.HIT
        : BoxType.PUSH;
    const id = getFrameDefId(frameKey, frameIndex, type);
    return _.merge({}, state, { [id]: { data: null } });
  }
  return state;
}
