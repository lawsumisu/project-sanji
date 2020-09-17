import { FrameDefinitionMap } from 'src/characters';

const frameData: FrameDefinitionMap = {
  IDLE: {
    animDef: {
      frames: [{ index: 1, endIndex: 6, loop: 5}, 7, 8, 9, { index: 10, endIndex: 21, loop: 2 }, 22],
      assetKey: 'vanessa',
      prefix: 'idle',
      frameRate: 13,
      repeat: -1
    }
  },
  WALK_FWD: {
    animDef: {
      frames: 8,
      assetKey: 'vanessa',
      prefix: 'walkfwd',
      frameRate: 15,
      repeat: -1
    }
  },
  WALK_BACK: {
    animDef: {
      frames: 8,
      assetKey: 'vanessa',
      prefix: 'walkback',
      frameRate: 15,
      repeat: -1
    }
  },
  CROUCH: {
    animDef: {
      frames: [{ index: 3, endIndex: 12 }],
      assetKey: 'vanessa',
      prefix: 'crouch',
      frameRate: 13,
      repeat: -1,
    }
  },
  RUN: {
    animDef: {
      frames: 6,
      assetKey: 'vanessa',
      prefix: 'run',
      frameRate: 15,
      repeat: -1,
    }
  },
  JUMP: {
    animDef: {
      frames: 5,
      assetKey: 'vanessa',
      prefix: 'jump',
      frameRate: 15,
    }
  },
  FALL: {
    animDef: {
      frames: 5,
      assetKey: 'vanessa',
      prefix: 'fall',
      frameRate: 15,
    }
  }
};

export default frameData;
