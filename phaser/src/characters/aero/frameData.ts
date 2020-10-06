import { FrameDefinitionMap } from 'src/characters';

const frameData: FrameDefinitionMap = {
  IDLE: {
    animDef: {
      frames: [{ index: 1, endIndex: 6, loop: 5 }, 7, 8, 9, { index: 10, endIndex: 21, loop: 2 }, 22],
      assetKey: 'vanessa',
      prefix: 'idle',
      frameRate: 13,
      repeat: -1
    },
    hurtboxDef: {
      0: {
        boxes: [
          { x1: 1.3800000000000001, y1: -92.39999999999999, x2: 0.7800000000000002, y2: -12.800000000000011, r: 13.5 }
        ],
        persistUntilFrame: 22
      }
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
    hurtboxDef: {
      0: {
        boxes: [
          { x1: 0.8874999999999997, y1: -84.6875, x2: 2.72, y2: -9.32, r: 11 },
          { x1: 5.42, y1: -48.90999999999998, x2: 23.62, y2: -8.93000000000002, r: 10 },
          { x1: -4.56, y1: -55.6, x2: -15.18, y2: -8.599999999999962, r: 9 },
          { x: 1.8, y: -96.8, r: 10 }
        ]
      },
      1: {
        boxes: [
          { x1: 0.8874999999999997, y1: -84.6875, x2: 2.72, y2: -9.32, r: 11 },
          { x1: 5.42, y1: -48.90999999999998, x2: 23.62, y2: -8.93000000000002, r: 10 },
          { x1: -4.56, y1: -55.6, x2: -15.18, y2: -8.599999999999962, r: 9 },
          { x: 4.8, y: -96.8, r: 10 },
          { x1: 16, y1: -86, x2: 39.4, y2: -74.6, r: 6.5 }
        ]
      }
    },
    hitboxDef: {
      hit: {
        damage: 10,
        angle: 0,
        knockback: 0
      },
      1: {
        boxes: [{ x1: 16, y1: -86, x2: 39.4, y2: -74.6, r: 6.5 }]
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
        damage: 10,
        angle: 0,
        knockback: 0
      },
      1: {
        boxes: [
          { x: 57.8, y: -92.2, r: 10 },
          { x1: 22.83, y1: -88.79, x2: 58.85000000000001, y2: -92.17, r: 7 }
        ]
      }
    }
  }
};

export default frameData;
