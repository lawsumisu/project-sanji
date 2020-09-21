import * as React from 'react';
import * as _ from 'lodash';
import { AnimationFrameConfig, FrameDefinition, FrameDefinitionMap, HitboxConfig } from 'src/characters';
import { SpriteFrame } from 'src/editor/components';
import 'src/editor/components/frameDefinitionDisplay/styles.scss';
import { AppState } from 'src/editor/redux';
import { connect } from 'react-redux';

interface FrameDefinitionDisplayProps {
  definition: FrameDefinition;
  frameKey: string;
}

class FrameDefinitionDisplay extends React.PureComponent<FrameDefinitionDisplayProps> {
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
              const { index: start, endIndex: end = start} = value;
              return acc + end - start + 1;
            }
          },
          0
        );
    return (
      <div className="cn--frame-definition-display">
        {_.times(uniqueFrames, (i: number) => {
          return <SpriteFrame key={i} frameKey={this.props.frameKey} frameIndex={i} hit={this.getHitboxes(i)} />;
        })}
      </div>
    );
  }

  private getHitboxes(index: number): { boxes: HitboxConfig[]; persistent?: boolean } {
    const { hitboxDef } = this.props.definition;
    if (hitboxDef) {
      if (hitboxDef[index]) {
        return { boxes: hitboxDef[index].boxes };
      } else {
        for (let i = index - 1; i >= 0; --i) {
          const H = hitboxDef[i];
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

interface FrameDefinitionMapProps<T extends string = string> {
  keys: T[];
}

interface StateMappedFrameDefinitionMapProps {
  definitionMap: FrameDefinitionMap<string>;
}

class FrameDefinitionMapDisplay extends React.PureComponent<
  FrameDefinitionMapProps & StateMappedFrameDefinitionMapProps
> {
  public static mapStateToProps(state: AppState): StateMappedFrameDefinitionMapProps {
    return { definitionMap: state.frameData.definitionMap };
  }
  public render(): React.ReactNode {
    return (
      <div className="cn--frame-definition-map-display">
        {this.props.keys
          .filter((key: string) => _.has(this.props.definitionMap, key))
          .map((key: string, i: number) => (
            <FrameDefinitionDisplay key={i} definition={this.props.definitionMap[key]!} frameKey={key} />
          ))}
      </div>
    );
  }
}

export const FrameDefinitionMapDisplayRX = connect(
  FrameDefinitionMapDisplay.mapStateToProps,
  null
)(FrameDefinitionMapDisplay);
