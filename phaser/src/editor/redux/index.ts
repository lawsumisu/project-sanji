import { combineReducers, createStore, Reducer } from 'redux';
import { frameDataReducer, FrameDataState } from 'src/editor/redux/frameData';
import { frameEditReducer, FrameEditState } from 'src/editor/redux/frameEdit';

export interface AppState {
  frameData: FrameDataState;
  frameEdit: FrameEditState;
}

const rootReducer: Reducer<AppState> = combineReducers({
  frameData: frameDataReducer,
  frameEdit: frameEditReducer,
});

const store = createStore(
  rootReducer,
  (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__()
);

export { store };
