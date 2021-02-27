import * as React from 'react';
import { AnimationFrameConfig } from 'src/characters/frameData';
import * as _ from 'lodash';
import { SpriteRenderer } from 'src/editor/components';
import { FrameDataState, getSpriteConfig, getSpriteSource } from 'src/editor/redux/frameData';
import 'src/editor/components/animationRenderer/styles.scss';

interface Props {
  frameData: FrameDataState;
  frameKey: string;
}

interface State {
  currentIndex: number;
}

export default class AnimationRenderer extends React.PureComponent<Props, State> {
  public state: State = {
    currentIndex: 0,
  };

  private requestId = 0;
  private start = -1;
  private uniqueFrameCount: number;

  public componentDidMount(): void {
    const { frames } = this.props.frameData.definitionMap[this.props.frameKey].animDef;
    this.uniqueFrameCount = _.isNumber(frames)
      ? frames
      : _.reduce(
          frames,
          (acc: number, value: number | AnimationFrameConfig) => {
            if (_.isNumber(value)) {
              return acc + 1;
            } else {
              const { index: start, endIndex: end = start } = value;
              return acc + end - start + 1;
            }
          },
          0
        );
  }

  public componentWillUnmount(): void {
    this.pauseAnimation();
  }

  public render(): React.ReactNode {
    const source = getSpriteSource(this.props.frameData, this.props.frameKey);
    const config = source && getSpriteConfig(this.props.frameData, this.props.frameKey, this.state.currentIndex);
    return (
      <div className="cn--animation-renderer" onMouseEnter={this.startAnimation} onMouseLeave={this.pauseAnimation}>
        {config && source && <SpriteRenderer config={config} source={source} scale={0.5} />}
      </div>
    );
  }

  private animate(timestamp: number, frameRate: number, uniqueFrameCount: number) {
    if (this.start < 0) {
      this.start = timestamp;
    }
    const elapsed = timestamp - this.start;
    if (elapsed >= 1000 / frameRate) {
      this.start = timestamp;
      this.setState({ currentIndex: (this.state.currentIndex + 1) % uniqueFrameCount });
    }
    this.requestId = window.requestAnimationFrame(timestamp => this.animate(timestamp, frameRate, uniqueFrameCount));
  }

  private startAnimation = () => {
    window.cancelAnimationFrame(this.requestId);
    const { frameRate } = this.props.frameData.definitionMap[this.props.frameKey].animDef;
    window.requestAnimationFrame(timestamp => this.animate(timestamp, frameRate, this.uniqueFrameCount));
  };
  private pauseAnimation = () => {
    window.cancelAnimationFrame(this.requestId);
    this.start = -1;
  };
}
