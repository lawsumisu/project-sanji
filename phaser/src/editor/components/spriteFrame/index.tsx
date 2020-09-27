import * as React from 'react';
import 'src/editor/components/spriteFrame/styles.scss';
import { BoxConfig } from 'src/characters';
import { Box, Sprite } from 'src/editor/components';
import { connect } from 'react-redux';
import { AppState } from 'src/editor/redux';
import { FrameDataState, getAnchorPosition, getSpriteConfig } from 'src/editor/redux/frameData';
import { bindActionCreators, Dispatch } from 'redux';
import { frameEditActionCreators, FrameEditState } from 'src/editor/redux/frameEdit';
import { BoxType } from 'src/editor/components/box';
import cx from 'classnames';

export interface SpriteFrameProps {
  frameKey: string;
  frameIndex: number;
  hit: {
    boxes: BoxConfig[];
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

class SpriteFrame extends React.PureComponent<
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
    const config = getSpriteConfig(this.props.frameData, this.props.frameKey, this.props.frameIndex);
    const origin = getAnchorPosition(config);
    return (
      <div className={cx('cn--sprite-frame', this.isSelected && 'mod--selected')} onClick={this.onClick}>
        <div className="cn--sprite">
          <Sprite config={config} source={this.props.frameData.source} />
          <div className="cn--box-display">
            {this.props.hit.boxes.map((box: BoxConfig, i: number) => (
              <Box key={i} config={box} persistent={this.props.hit.persistent} type={BoxType.HIT} origin={origin} />
            ))}
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
    return selectedFrame ? (selectedFrame.index === frameIndex && selectedFrame.key === frameKey) : false;
  }
}

export const SpriteFrameRX = connect(SpriteFrame.mapStateToProps, SpriteFrame.mapDispatchToProps)(SpriteFrame);
