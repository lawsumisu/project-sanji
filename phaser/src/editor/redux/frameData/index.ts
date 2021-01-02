import { FrameConfigTP, TextureDataTP } from 'src/assets';
import { FrameDefinitionMap, getSpriteIndexFromDefinition } from 'src/characters/frameData';
import spriteSheet from 'src/characters/aero/vanessa.png';
import spriteSheet2 from 'src/assets/sprites/rock.png';
import data from 'src/characters/aero/vanessa.json';
import data2 from 'src/assets/sprites/rock.json';
import actionCreatorFactory, { isType } from 'typescript-fsa';
import { Action } from 'redux';
import { Vector2 } from '@lawsumisu/common-utilities';

interface TextureDataMap {
  [key: string]: FrameConfigTP;
}

function processTextureData(textureData: TextureDataTP): TextureDataMap {
  return textureData.frames.reduce((acc: TextureDataMap, frame: FrameConfigTP) => {
    acc[frame.filename] = frame;
    return acc;
  }, {});
}

export function getSpriteConfig(frameData: FrameDataState, frameKey: string, frameIndex: number): FrameConfigTP | null {
  const animDef = frameData.definitionMap[frameKey].animDef;
  const texture = frameData.texture;
  const { prefix } = animDef;
  const spriteIndex = getSpriteIndexFromDefinition(animDef, frameIndex);
  const filename = `${prefix}/${spriteIndex.toString().padStart(2, '0')}.png`;
  const config = texture[filename];
  if (config) {
    return config;
  } else {
    console.warn(`Config for ${filename} not Found`);
    return null
  }
}

export function getAnchorPosition(config: FrameConfigTP): Vector2 {
  const { w, h } = config.sourceSize;
  const { x, y}  = config.spriteSourceSize;
  return new Vector2(Math.floor(config.anchor.x * w - x), Math.floor(config.anchor.y * h - y));
}

export interface FrameDataState {
  source: string;
  texture: TextureDataMap;
  definitionMap: FrameDefinitionMap;
  selection: { key: string; frame: number } | null;
}

const initialState: FrameDataState = {
  source: spriteSheet2,
  texture: processTextureData(data2.textures[0]),
  definitionMap: {},
  selection: null
};

const ACF = actionCreatorFactory('frameData');

export const frameDataActionCreators = {
  update: ACF<{ source: string; textureData: TextureDataTP; definitionMap: FrameDefinitionMap<string> }>('UPDATE'),
  select: ACF<{ key: string; frame: number }>('SELECT'),
  loadDefinition: ACF<FrameDefinitionMap>('LOAD'),
};

export function frameDataReducer(state: FrameDataState = initialState, action: Action): FrameDataState {
  if (isType(action, frameDataActionCreators.update)) {
    return {
      source: action.payload.source,
      texture: processTextureData(action.payload.textureData),
      definitionMap: action.payload.definitionMap,
      selection: null
    };
  } else if (isType(action, frameDataActionCreators.select)) {
    return {
      ...state,
      selection: { ...action.payload }
    };
  } else if (isType(action, frameDataActionCreators.loadDefinition)) {
    return {
      ...state,
      definitionMap: action.payload
    }
  }
  return state;
}
