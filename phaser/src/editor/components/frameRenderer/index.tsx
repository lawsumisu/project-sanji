import * as React from 'react';
import 'src/editor/components/frameRenderer/styles.scss';
import { BoxConfig, BoxType, PushboxConfig } from 'src/characters/frameData';
import { HboxPreview, PushboxPreview, SpriteRenderer } from 'src/editor/components';
import { connect } from 'react-redux';
import { AppState } from 'src/editor/redux';
import { FrameDataState, getAnchorPosition, getSpriteConfig, getSpriteSource } from 'src/editor/redux/frameData';
import { bindActionCreators, Dispatch } from 'redux';
import { frameEditActionCreators, FrameEditState } from 'src/editor/redux/frameEdit';
import cx from 'classnames';
import { Vector2 } from '@lawsumisu/common-utilities';

export interface SpriteFrameProps {
  frameKey: string;
  frameIndex: number;
  hit: {
    boxes: BoxConfig[];
    persistent?: boolean;
  };
  hurt: {
    boxes: BoxConfig[];
    persistent?: boolean;
  };
  push?: {
    box: PushboxConfig;
    persistent?: boolean;
  };
}

interface StateMappedSpriteFrameProps {
  frameData: FrameDataState;
  selectedFrame: FrameEditState['frame'];
}

interface DispatchMappedSpriteFrameProps {
  actions: {
    select: typeof frameEditActionCreators.select;
  };
}

class FrameRenderer extends React.PureComponent<
  SpriteFrameProps & StateMappedSpriteFrameProps & DispatchMappedSpriteFrameProps
> {
  public static defaultProps = {
    hit: { boxes: [] }
  };

  public static mapStateToProps(state: AppState): StateMappedSpriteFrameProps {
    return { frameData: state.frameData, selectedFrame: state.frameEdit.frame };
  }

  public static mapDispatchToProps(dispatch: Dispatch): DispatchMappedSpriteFrameProps {
    return {
      actions: bindActionCreators(
        {
          select: frameEditActionCreators.select
        },
        dispatch
      )
    };
  }

  public render(): React.ReactNode {
    const source = getSpriteSource(this.props.frameData, this.props.frameKey);
    const config = source && getSpriteConfig(this.props.frameData, this.props.frameKey, this.props.frameIndex);
    const origin = config ? getAnchorPosition(config) : Vector2.ZERO;
    const pushboxPreviewProps = this.getPushboxPreviewProps();
    return (
      <div className={cx('cn--sprite-frame', this.isSelected && 'mod--selected')} onClick={this.onClick}>
        <div className="cn--sprite">
          {config && source && <SpriteRenderer config={config} source={source} />}
          <div className="cn--box-display">
            {this.props.hurt.boxes.map((box: BoxConfig, i: number) => (
              <HboxPreview
                key={i}
                config={box}
                persistent={this.props.hurt.persistent}
                type={BoxType.HURT}
                origin={origin}
                editable={false}
              />
            ))}
            {this.props.hit.boxes.map((box: BoxConfig, i: number) => (
              <HboxPreview
                key={i}
                config={box}
                persistent={this.props.hit.persistent}
                type={BoxType.HIT}
                origin={origin}
                editable={false}
              />
            ))}
            {pushboxPreviewProps && (
              <PushboxPreview
                origin={origin}
                config={pushboxPreviewProps.config}
                persistent={pushboxPreviewProps.persistent}
                editable={false}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  private onClick = (): void => {
    this.props.actions.select({ key: this.props.frameKey, index: this.props.frameIndex });
  };

  private get isSelected(): boolean {
    const { frameIndex, frameKey, selectedFrame } = this.props;
    return selectedFrame ? selectedFrame.index === frameIndex && selectedFrame.key === frameKey : false;
  }

  private getPushboxPreviewProps(): { config: PushboxConfig, persistent: boolean } | null {
    const { normalizedDefinitionMap: { pushboxes, frameDef: {[this.props.frameKey]: { pushboxDef }}}} = this.props.frameData;
    if (pushboxDef[this.props.frameIndex]) {
      return { config: pushboxes[pushboxDef[this.props.frameIndex]].box, persistent: false };
    } else {
      for (let i = this.props.frameIndex - 1; i >= 0; i--) {
        const pushboxUuid = pushboxDef[i];
        if (pushboxUuid) {
          const pushbox = pushboxes[pushboxUuid];
          if (pushbox.persistThroughFrame && pushbox.persistThroughFrame > i) {
            return { config: pushbox.box, persistent: true };
          } else {
            break;
          }
        }
      }
    }
    return null;
  }
}

export const ReduxConnectedFrameRenderer = connect(
  FrameRenderer.mapStateToProps,
  FrameRenderer.mapDispatchToProps
)(FrameRenderer);
