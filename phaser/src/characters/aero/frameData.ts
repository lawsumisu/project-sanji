import { FrameDefinitionMap } from 'src/characters';

const frameData: FrameDefinitionMap = {
  IDLE: {
    animDef: {
      frames: [{ index: 1, endIndex: 6, loop: 5 }, 7, 8, 9, { index: 10, endIndex: 21, loop: 2 }, 22],
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
  SQUAT: {
    animDef: {
      frames: 2,
      assetKey: 'vanessa',
      prefix: 'crouch',
      frameRate: 25
    }
  },
  CROUCH: {
    animDef: {
      frames: [{ index: 3, endIndex: 12 }],
      assetKey: 'vanessa',
      prefix: 'crouch',
      frameRate: 13,
      repeat: -1
    }
  },
  STAND_UP: {
    animDef: {
      frames: [2, 1],
      assetKey: 'vanessa',
      prefix: 'crouch',
      frameRate: 15
    }
  },
  RUN: {
    animDef: {
      frames: 6,
      assetKey: 'vanessa',
      prefix: 'run',
      frameRate: 15,
      repeat: -1
    }
  },
  DASH_BACK: {
    animDef: {
      frames: 3,
      assetKey: 'vanessa',
      prefix: 'dashback',
      frameRate: 15
    }
  },
  JUMP: {
    animDef: {
      frames: 5,
      assetKey: 'vanessa',
      prefix: 'jump',
      frameRate: 15
    }
  },
  FALL: {
    animDef: {
      frames: 5,
      assetKey: 'vanessa',
      prefix: 'fall',
      frameRate: 15
    }
  },
  LIGHT_JAB_1: {
    animDef: {
      frames: 5,
      assetKey: 'vanessa',
      prefix: 'attacks/lightjab1',
      frameRate: 15
    },
    hitboxDef: {
      hit: {
        damage: 0,
        angle: 0,
        knockback: 0
      },
      1: {
        boxes: [{ x: 38.4, y: -75.2, r: 10 }]
      }
    }
  },
  LIGHT_JAB_2: {
    animDef: {
      frames: 6,
      assetKey: 'vanessa',
      prefix: 'attacks/lightjab2',
      frameRate: 15
    },
    hitboxDef: {
      hit: {
        damage: 0,
        angle: 0,
        knockback: 0
      },
      1: {
        boxes: [{ x: 56.4, y: -93.6, r: 10 }]
      }
    }
  }
};

export default frameData;
