import * as React from 'react';
import { FrameConfigTP } from 'src/assets';
import { loadImage } from 'src/editor/utilities/image.util';

export interface SpriteProps {
  source: string;
  scale: number;
  config: FrameConfigTP;
}

export default class SpriteRenderer extends React.PureComponent<SpriteProps> {
  public static defaultProps = {
    scale: 1
  };

  private ref: HTMLCanvasElement | null;
  private imagePromise: Promise<HTMLImageElement>;

  public componentDidMount(): void {
    this.imagePromise = loadImage(this.props.source);
    this.updateImage();
  }
  public componentDidUpdate(): void {
    this.updateImage();
  }

  public render(): React.ReactNode {
    const { w, h } = this.props.config.spriteSourceSize;
    return <canvas ref={this.setRef} width={w * this.props.scale} height={h * this.props.scale} />;
  }

  private setRef = (ref: HTMLCanvasElement | null): void => {
    this.ref = ref;
  };

  private updateImage(): void {
    this.imagePromise.then(image => {
      if (this.ref !== null) {
        const context = this.ref.getContext('2d');
        if (context) {

          context.imageSmoothingEnabled = false;
          context.clearRect(0, 0, this.ref.width, this.ref.height);
          // draw cropped image
          const { w, h } = this.props.config.spriteSourceSize;
          const { frame } = this.props.config;
          const { scale } = this.props;
          context.drawImage(image, frame.x, frame.y, w, h, 0, 0, w * scale, h * scale);
        }
      }
    });
  }
}
