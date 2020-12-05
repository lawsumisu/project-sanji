import { AnimationFrameConfig, BoxConfig, FrameDefinition } from 'src/characters/index';
import * as React from 'react';
import * as _ from 'lodash';
import { SpriteFrame } from 'src/editor/components/index';
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
          return (
            <SpriteFrame
              key={i}
              frameKey={this.props.frameKey}
              frameIndex={i}
              hit={this.getBoxes(i, 'hitboxDef')}
              hurt={this.getBoxes(i, 'hurtboxDef')}
            />
          );
        })}
      </div>
    );
  }

  private getBoxes(index: number, key: 'hitboxDef' | 'hurtboxDef'): { boxes: BoxConfig[]; persistent?: boolean } {
    if (this.props.definition[key]) {
      const boxDef = this.props.definition[key]!;
      if (boxDef[index]) {
        return { boxes: boxDef[index].boxes };
      } else {
        for (let i = index - 1; i >= 0; --i) {
          const H = boxDef[i];
          if (H) {
            if (H.persistUntilFrame && H.persistUntilFrame > index) {
              return { boxes: H.boxes, persistent: true };
            } else {
              break;
            }
          }
        }
      }
    }
    return { boxes: [] };
  }
}