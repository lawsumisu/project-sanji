import { AnimationFrameConfig, FrameDefinition } from 'src/characters/frameData';
import * as React from 'react';
import * as _ from 'lodash';
import { FrameRenderer } from 'src/editor/components/index';
import cx from 'classnames';

interface Props {
  definition: FrameDefinition;
  frameKey: string;
  className?: string;
}

export default class FrameDefinitionRenderer extends React.PureComponent<Props> {
  public render(): React.ReactNode {
    const { frames } = this.props.definition.animDef;
    const uniqueFrames: number = _.isNumber(frames)
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
    return (
      <div className={cx('cn--frame-definition-renderer', this.props.className)}>
        {_.times(uniqueFrames, (i: number) => {
          return <FrameRenderer key={i} frameKey={this.props.frameKey} frameIndex={i} />;
        })}
      </div>
    );
  }
}
