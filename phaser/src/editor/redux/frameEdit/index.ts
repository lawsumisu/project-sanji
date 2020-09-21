import { Action } from 'redux';
import actionCreatorFactory, { isType } from 'typescript-fsa';

export interface FrameEditState {
  frame: {
    key: string;
    index: number;
  } | null;
}

const initialState: FrameEditState = {
  frame: null,
};

const ACF = actionCreatorFactory('frameEdit');

export const frameEditActionCreators = {
  select: ACF<{ key: string, index: number}>('SELECT'),
  clear: ACF('CLEAR')
};

export function frameEditReducer(state: FrameEditState = initialState, action: Action): FrameEditState {
  if (isType(action, frameEditActionCreators.select)) {
    return {
      ...state,
      frame: action.payload,
    };
  } else if (isType(action, frameEditActionCreators.clear)) {
    return {
      ...state,
      frame: null
    };
  }
  return state;
}
