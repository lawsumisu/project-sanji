import * as React from 'react';
import { AnimationFrameConfig } from 'src/characters/frameData';
import * as _ from 'lodash';
import { SpriteRenderer } from 'src/editor/components';
import { FrameDataState, getSpriteConfig } from 'src/editor/redux/frameData';
import 'src/editor/components/animationRenderer/styles.scss';

interface Props {
  frameData: FrameDataState;
  frameKey: string;
}

interface State {
  currentIndex: number;
}

export default class AnimationRenderer extends React.PureComponent<Props, State> {
  public state = {
    currentIndex: 0
  };

  private interval = 0;
  private uniqueFrameCount = 0;

  public componentDidMount(): void {
    const { frames, frameRate } = this.props.frameData.definitionMap[this.props.frameKey].animDef;
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
    this.interval = window.setInterval(() => {
      this.setState({ currentIndex: (this.state.currentIndex + 1) % this.uniqueFrameCount });
    }, 1000 / frameRate);
  }

  public componentWillUnmount(): void {
    window.clearInterval(this.interval);
  }

  public render(): React.ReactNode {
    const config = getSpriteConfig(this.props.frameData, this.props.frameKey, this.state.currentIndex);
    return (
      <div className="cn--animation-renderer">
        <SpriteRenderer config={config} source={this.props.frameData.source} scale={0.5} />
      </div>
    );
  }
}
