import { FrameConfigTP, TextureDataTP } from 'src/assets';
import {
  BoxDefinition,
  FrameDefinitionMap,
  getSpriteIndexFromDefinition,
  PushboxConfig,
  PushboxDefinition
} from 'src/characters/frameData';
import actionCreatorFactory, { isType } from 'typescript-fsa';
import { Action } from 'redux';
import { Vector2 } from '@lawsumisu/common-utilities';
import * as _ from 'lodash';
import { normalizeDefinitionMap } from 'src/editor/redux/utilities';

interface TextureDataMap {
  [key: string]: FrameConfigTP;
}

function processTextureData(textureData: TextureDataTP): TextureDataMap {
  return textureData.frames.reduce((acc: TextureDataMap, frame: FrameConfigTP) => {
    acc[frame.filename] = frame;
    return acc;
  }, {});
}

export function getSpriteSource(frameData: FrameDataState, frameKey: string): string | null {
  const animDef = frameData.definitionMap[frameKey].animDef;
  const { assetKey } = animDef;
  const { source = null } = frameData.spriteSheets[assetKey] || {};
  return source;
}

export const getSpriteConfig = _.memoize(
  (frameData: FrameDataState, frameKey: string, frameIndex: number) => {
    const animDef = frameData.definitionMap[frameKey].animDef;
    const { prefix, assetKey } = animDef;
    const { texture = {} } = frameData.spriteSheets[assetKey] || {};
    const spriteIndex = getSpriteIndexFromDefinition(animDef, frameIndex);
    const filename = `${prefix}/${spriteIndex.toString().padStart(2, '0')}.png`;
    const config = texture[filename];
    if (config) {
      return config;
    } else {
      console.warn(`Config for ${filename} not Found`);
      return null;
    }
  },
  (frameData: FrameDataState, frameKey: string, frameIndex: number) => {
    const animDef = frameData.definitionMap[frameKey].animDef;
    const { prefix, assetKey } = animDef;
    return [prefix, assetKey, frameKey, frameIndex].join('-');
  }
);

export function getAnchorPosition(config: FrameConfigTP): Vector2 {
  const { w, h } = config.sourceSize;
  const { x, y } = config.spriteSourceSize;
  return new Vector2(Math.floor(config.anchor.x * w - x), Math.floor(config.anchor.y * h - y));
}

export interface NormalizedFrameDefinitionMap {
  hurtboxes: {
    [key: string]: Pick<BoxDefinition, 'boxes'>;
  };
  hitboxes: {
    [key: string]: Pick<BoxDefinition, 'boxes'>;
  };
  pushboxes: {
    [key: string]: PushboxDefinition;
  };
  frameDef: {
    [key: string]: {
      hitboxDef: {
        [key: string]: string;
      };
      hurtboxDef: {
        [key: string]: string;
      };
      pushboxDef: {
        [key: string]: string;
      };
    };
  };
}

interface SpriteSheetInfo {
  source: string;
  texture: TextureDataMap;
}

export interface FrameDataState {
  normalizedDefinitionMap: NormalizedFrameDefinitionMap;
  definitionMap: FrameDefinitionMap['frameDef'];
  spriteSheets: { [key: string]: SpriteSheetInfo };
  selection: { key: string; frame: number } | null;
}

const initialState: FrameDataState = {
  definitionMap: {},
  normalizedDefinitionMap: { pushboxes: {}, hitboxes: {}, hurtboxes: {}, frameDef: {} },
  spriteSheets: {},
  selection: null
};

const ACF = actionCreatorFactory('frameData');

export const frameDataActionCreators = {
  select: ACF<{ key: string; frame: number }>('SELECT'),
  loadDefinition: ACF<FrameDefinitionMap['frameDef']>('LOAD_DEFINITION'),
  loadSpriteSheet: ACF<{ key: string; source: string; textureData: TextureDataTP }>('LOAD_SPRITE_SHEET'),
  addPushbox: ACF<{ uuid: string; pushbox: PushboxConfig; frameIndex: number; frameKey: string }>('ADD_PUSHBOX'),
  editPushbox: ACF<{ uuid: string; pushbox: Partial<PushboxConfig> }>('EDIT_PUSHBOX'),
  deletePushbox: ACF<{ uuid: string; frameKey: string; }>('DELETE_PUSHBOX')
};

export function frameDataReducer(state: FrameDataState = initialState, action: Action): FrameDataState {
  if (isType(action, frameDataActionCreators.select)) {
    return {
      ...state,
      selection: { ...action.payload }
    };
  } else if (isType(action, frameDataActionCreators.loadDefinition)) {
    return {
      ...state,
      definitionMap: action.payload,
      normalizedDefinitionMap: normalizeDefinitionMap(action.payload)
    };
  } else if (isType(action, frameDataActionCreators.loadSpriteSheet)) {
    const { key, source, textureData } = action.payload;
    return {
      ...state,
      spriteSheets: {
        ...state.spriteSheets,
        [key]: {
          source,
          texture: processTextureData(textureData)
        }
      }
    };
  } else if (isType(action, frameDataActionCreators.editPushbox)) {
    const { uuid, pushbox } = action.payload;
    // TODO update original definitionMap
    return {
      ...state,
      normalizedDefinitionMap: {
        ...state.normalizedDefinitionMap,
        pushboxes: {
          ...state.normalizedDefinitionMap.pushboxes,
          [uuid]: {
            ...state.normalizedDefinitionMap.pushboxes[uuid],
            box: {
              ...state.normalizedDefinitionMap.pushboxes[uuid].box,
              ...pushbox
            }
          }
        }
      }
    };
  } else if (isType(action, frameDataActionCreators.addPushbox)) {
    const { uuid, pushbox, frameKey, frameIndex } = action.payload;
    return _.merge({}, state, {
      normalizedDefinitionMap: {
        frameDef: { [frameKey]: { pushboxDef: { [frameIndex]: uuid } } },
        pushboxes: { [uuid]: { box: { pushbox } } }
      }
    });
  } else if (isType(action, frameDataActionCreators.deletePushbox)) {
    const { uuid, frameKey } = action.payload;
    return {
      ...state,
      normalizedDefinitionMap: {
        ...state.normalizedDefinitionMap,
        frameDef: {
          ...state.normalizedDefinitionMap.frameDef,
          [frameKey]: {
            ...state.normalizedDefinitionMap.frameDef[frameKey],
            pushboxDef: _.pickBy(state.normalizedDefinitionMap.frameDef[frameKey].pushboxDef, value => value !== uuid)
          }
        },
        pushboxes: _.pickBy(state.normalizedDefinitionMap.pushboxes, (_value, key) => key !== uuid)
      }
    };
  }
  return state;
}
