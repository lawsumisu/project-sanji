import { FrameConfigTP, TextureDataTP } from 'src/assets';
import { FrameDefinitionMap, getSpriteIndexFromDefinition } from 'src/characters';
import spriteSheet from 'src/assets/vanessa.png';
import data from 'src/assets/vanessa.json';
import aero from 'src/characters/aero/frameData';
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

export function getSpriteConfig(frameData: FrameDataState, frameKey: string, frameIndex: number): FrameConfigTP {
  const animDef = frameData.definitionMap[frameKey].animDef;
  const texture = frameData.texture;
  const { prefix } = animDef;
  const spriteIndex = getSpriteIndexFromDefinition(animDef, frameIndex);
  const filename = `${prefix}/${spriteIndex.toString().padStart(2, '0')}.png`;
  const config = texture[filename];
  if (config) {
    return config;
  } else {
    throw new Error(`Config for ${filename} not Found`);
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
  definitionMap: FrameDefinitionMap<string>;
  selection: { key: string; frame: number } | null;
}

const initialState: FrameDataState = {
  source: spriteSheet,
  texture: processTextureData(data.textures[0]),
  definitionMap: aero,
  selection: null
};

const ACF = actionCreatorFactory('frameData');

const actionCreators = {
  update: ACF<{ source: string; textureData: TextureDataTP; definitionMap: FrameDefinitionMap<string> }>('UPDATE'),
  select: ACF<{ key: string; frame: number }>('SELECT')
};

export function frameDataReducer(state: FrameDataState = initialState, action: Action): FrameDataState {
  if (isType(action, actionCreators.update)) {
    return {
      source: action.payload.source,
      texture: processTextureData(action.payload.textureData),
      definitionMap: action.payload.definitionMap,
      selection: null
    };
  } else if (isType(action, actionCreators.select)) {
    return {
      ...state,
      selection: { ...action.payload }
    };
  }
  return state;
}
