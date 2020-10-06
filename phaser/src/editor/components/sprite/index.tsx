import * as React from 'react';
import { FrameConfigTP } from 'src/assets';

export interface SpriteProps {
  source: string;
  scale: number;
  config: FrameConfigTP;
}

export default class Sprite extends React.PureComponent<SpriteProps> {
  public static defaultProps = {
    scale: 1
  };

  private ref: HTMLCanvasElement | null;

  public componentDidUpdate(): void {
    this.updateImage();
  }

  public render(): React.ReactNode {
    const { w, h } = this.props.config.spriteSourceSize;
    return <canvas ref={this.setRef} width={w * this.props.scale} height={h * this.props.scale} />;
  }

  private setRef = (ref: HTMLCanvasElement | null): void => {
    this.ref = ref;
    this.updateImage();
  };

  private updateImage(): void {
    if (this.ref !== null) {
      const context = this.ref.getContext('2d');
      const imageObj = new Image();
      imageObj.onload = () => {
        if (context && this.ref) {
          context.imageSmoothingEnabled = false;
          context.clearRect(0, 0, this.ref.width, this.ref.height);
          // draw cropped image
          const { w, h } = this.props.config.spriteSourceSize;
          const { frame } = this.props.config;
          const { scale } = this.props;
          context.drawImage(imageObj, frame.x, frame.y, w, h, 0, 0, w * scale, h * scale);
        }
      };
      imageObj.src = this.props.source;
    }
  }
}
