import { Action } from 'redux';
import actionCreatorFactory, { isType } from 'typescript-fsa';
import { BoxType, PushboxDefinition } from 'src/characters/frameData';
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

export function getFrameDefData<T extends BoxType>(
  frameDataState: FrameDataState,
  frameKey: string,
  frameIndex: number,
  type: T
): (T extends BoxType.PUSH ? PushboxDefinition : never) | null {
  const { definitionMap, frameDefinitionEdits } = frameDataState;
  switch (type) {
    case BoxType.PUSH: {
      const id = getFrameDefId(frameKey, frameIndex, BoxType.PUSH);
      const originalData = _.get(definitionMap, id, null);
      const data = _.merge({}, originalData, (frameDefinitionEdits[id] || {}).data);
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

export const frameDefinitionEditActionCreators = {
  addPushbox: ACF<{ pushboxDef: PushboxDefinition; frameIndex: number; frameKey: string }>('ADD_PUSHBOX'),
  editPushbox: ACF<{ pushboxDef: Partial<PushboxDefinition>; frameIndex: number; frameKey: string }>('EDIT_PUSHBOX'),
  deletePushbox: ACF<{ frameIndex: number; frameKey: string }>('DELETE_PUSHBOX')
};

// TODO update edits field on change to support undo/redo
export function frameDefinitionEditReducer(state: FrameDefinitionEditState, action: Action): FrameDefinitionEditState {
  if (
    isType(action, frameDefinitionEditActionCreators.addPushbox) ||
    isType(action, frameDefinitionEditActionCreators.editPushbox)
  ) {
    const { frameKey, frameIndex, pushboxDef } = action.payload;
    const id = getFrameDefId(frameKey, frameIndex, BoxType.PUSH);
    return _.merge({}, state, { [id]: { data: pushboxDef } });
  } else if (isType(action, frameDefinitionEditActionCreators.deletePushbox)) {
    const { frameKey, frameIndex } = action.payload;
    const id = getFrameDefId(frameKey, frameIndex, BoxType.PUSH);
    return _.merge({}, state, { [id]: { data: null } });
  }
  return state;
}
