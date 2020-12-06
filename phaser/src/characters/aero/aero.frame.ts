import { FrameDefinitionMap } from 'src/characters/frameData';

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
          { x1: 1.38, y1: -92.4, x2: 0.78, y2: -12.8, r: 13.5 }
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
        knockback: 10
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
        knockback: 10
      },
      1: {
        boxes: [
          { x: 57.8, y: -92.2, r: 10 },
          { x1: 22.83, y1: -88.79, x2: 58.85000000000001, y2: -92.17, r: 7 }
        ]
      }
    }
  },
  GUT_PUNCH_1: {
    animDef: {
      frames: [1, 2, 3, 4, 5, 11],
      assetKey: 'vanessa',
      prefix: 'attacks/gutpunch',
      frameRate: 14
    },
    hitboxDef: {
      hit: {
        damage: 10,
        angle: -75,
        knockback: 50
      },
      2: {
        boxes: [{ x1: 50.8, y1: -82.82000000000001, x2: 28.799999999999994, y2: -57.02, r: 8.5 }]
      }
    }
  },
  GUT_PUNCH_2: {
    animDef: {
      frames: [6, 7, 8, 9, 10, 11],
      assetKey: 'vanessa',
      prefix: 'attacks/gutpunch',
      frameRate: 14
    },
    hitboxDef: {
      hit: {
        damage: 10,
        angle: 0,
        knockback: 25
      },
      1: {
        boxes: [
          { x1: 50.42, y1: -74.58, x2: 27.64, y2: -60.76, r: 7.5 },
          { x1: 26.8, y1: -61, x2: 14.400000000000002, y2: -62.6, r: 6.5 }
        ]
      },
      2: {
        boxes: [{ x: 45, y: -72.2, r: 10 }]
      }
    }
  },
  STRAIGHT: {
    animDef: {
      frames: 10,
      assetKey: 'vanessa',
      prefix: 'attacks/rightcross',
      frameRate: 15
    },
    hitboxDef: {
      hit: {
        damage: 20,
        angle: 0,
        knockback: 50
      },
      2: {
        boxes: [{ x1: 30.4, y1: -92.37, x2: 68, y2: -92.19, r: 6.5 }]
      },
      3: {
        boxes: [{ x1: 32.6, y1: -89.8, x2: 67.8, y2: -89, r: 6.5 }],
        persistUntilFrame: 5
      }
    }
  },
  ROLL_STARTUP: {
    animDef: {
      frames: [1, 2],
      assetKey: 'vanessa',
      prefix: 'roll',
      frameRate: 15
    }
  },
  ROLL_1: {
    animDef: {
      frames: [3, 4, 5, 6, 7],
      assetKey: 'vanessa',
      prefix: 'roll',
      frameRate: 15
    }
  },
  ROLL_2: {
    animDef: {
      frames: [8, 9, 10, 11, 12],
      assetKey: 'vanessa',
      prefix: 'roll',
      frameRate: 15
    }
  },
  ROLL_RECOVERY: {
    animDef: {
      frames: [13],
      assetKey: 'vanessa',
      prefix: 'roll',
      frameRate: 15
    }
  }
};

export default frameData;