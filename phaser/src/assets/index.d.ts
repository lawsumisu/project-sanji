export interface FrameConfigTP {
  filename: string;
  rotated: boolean;
  trimmed: boolean;
  sourceSize: {
    w: number;
    h: number;
  };
  spriteSourceSize: {
    w: number;
    h: number;
    x: number;
    y: number;
  };
  frame: {
    w: number;
    h: number;
    x: number;
    y: number;
  };
  anchor: {
    x: number;
    y: number;
  };
}

export interface TextureDataTP {
  image: string;
  format: string;
  size: {
    w: number;
    h: number;
  };
  scale: number;
  frames: FrameConfigTP[];
}
