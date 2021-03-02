import * as React from 'react';
import * as _ from 'lodash';
import { BoxConfig, BoxDefinition, BoxType, PushboxConfig, PushboxDefinition } from 'src/characters/frameData';
import { FrameEditState } from 'src/editor/redux/frameEdit';
import { connect } from 'react-redux';
import { AppState } from 'src/editor/redux';
import { FrameDataState } from 'src/editor/redux/frameData';
import 'src/editor/components/frameDefinitionEditor/styles.scss';
import { Tool } from 'src/editor/components/frameDefinitionEditor/components/tool';
import { FrameInfo } from 'src/editor/components/frameDefinitionEditor/components/frameInfo';
import { bindActionCreators, Dispatch } from 'redux';
import {
  frameDefinitionEditActionCreators,
  getFrameDefData,
  TypedBoxDefinition
} from 'src/editor/redux/frameData/frameDefinitionEdit';
import { SelectedFrame } from 'src/editor/components/frameDefinitionEditor/components/selectedFrame';

export enum HBoxMode {
  CIRCLE = 'CIRCLE',
  CAPSULE = 'CAPSULE'
}

interface State {
  frameIndex: number;
  frameKey: string;
  newBoxType: BoxType;
  hitboxes: BoxConfig[];
  hurtboxes: BoxConfig[];
  pushbox: PushboxConfig | null;
  mode: HBoxMode;
}

interface StateMappedProps {
  frameData: FrameDataState;
  selected: FrameEditState;
}

export interface DispatchMappedProps {
  onAddHurtbox: typeof frameDefinitionEditActionCreators.addHurtbox;
  onEditHurtbox: typeof frameDefinitionEditActionCreators.editHurtbox;
  onDeleteHurtbox: typeof frameDefinitionEditActionCreators.deleteHurtbox;
  onAddHitbox: typeof frameDefinitionEditActionCreators.addHitbox;
  onEditHitbox: typeof frameDefinitionEditActionCreators.editHitbox;
  onDeleteHitbox: typeof frameDefinitionEditActionCreators.deleteHitbox;
  onAddPushbox: typeof frameDefinitionEditActionCreators.addPushbox;
  onEditPushbox: typeof frameDefinitionEditActionCreators.editPushbox;
  onDeletePushbox: typeof frameDefinitionEditActionCreators.deletePushbox;
}

// TODO add way to modify scale of sprites
class FrameDefinitionEditor extends React.PureComponent<StateMappedProps & DispatchMappedProps, State> {
  public static mapStateToProps(state: AppState): StateMappedProps {
    return {
      frameData: state.frameData,
      selected: { ...state.frameEdit }
    };
  }

  public static mapDispatchToProps(dispatch: Dispatch): DispatchMappedProps {
    return bindActionCreators(
      {
        onAddHurtbox: frameDefinitionEditActionCreators.addHurtbox,
        onEditHurtbox: frameDefinitionEditActionCreators.editHurtbox,
        onDeleteHurtbox: frameDefinitionEditActionCreators.deleteHurtbox,
        onAddHitbox: frameDefinitionEditActionCreators.addHitbox,
        onEditHitbox: frameDefinitionEditActionCreators.editHitbox,
        onDeleteHitbox: frameDefinitionEditActionCreators.deleteHitbox,
        onAddPushbox: frameDefinitionEditActionCreators.addPushbox,
        onEditPushbox: frameDefinitionEditActionCreators.editPushbox,
        onDeletePushbox: frameDefinitionEditActionCreators.deletePushbox
      },
      dispatch
    );
  }

  public static getDerivedStateFromProps(props: StateMappedProps, state: State): State {
    if (props.selected.frame && !_.isEqual(props.selected.frame, { key: state.frameKey, index: state.frameIndex })) {
      const {
        frameData,
        selected: {
          frame: { key, index }
        }
      } = props;
      const hit = getFrameDefData(frameData, key, index, BoxType.HIT) as BoxDefinition | null;
      const hurt = getFrameDefData(frameData, key, index, BoxType.HURT) as BoxDefinition | null;
      const pushbox = getFrameDefData(frameData, key, index, BoxType.PUSH) as PushboxDefinition | null;
      return {
        frameIndex: props.selected.frame.index,
        frameKey: props.selected.frame.key,
        newBoxType: state.newBoxType,
        hitboxes: hit ? hit.boxes.map(box => ({ ...box })) : [],
        hurtboxes: hurt ? hurt.boxes.map(box => ({ ...box })) : [],
        pushbox: pushbox ? pushbox.box : null,
        mode: state.mode
      };
    }
    return state;
  }

  public state: State = {
    frameKey: '',
    frameIndex: 0,
    newBoxType: BoxType.HURT,
    hitboxes: [],
    hurtboxes: [],
    pushbox: null,
    mode: HBoxMode.CIRCLE
  };

  public render(): React.ReactNode {
    const { selected, frameData } = this.props;
    return (
      <div className="cn--frame-editor">
        {selected.frame ? (
          <SelectedFrame
            frameData={frameData}
            onAddBox={this.onAddBox}
            onCommit={this.onCommit}
            onEdit={this.onEdit}
            onDeleteBox={this.onDeleteBox}
            {...this.state}
          />
        ) : (
          <div className="cn--frame" />
        )}
        <div className="cn--inspector">
          <div className="cn--tools">
            <Tool
              options={[
                { onSelect: this.onClickCircleMode, name: 'Circle' },
                {
                  onSelect: this.onClickCapsuleMode,
                  name: 'Capsule'
                }
              ]}
            />
            <Tool
              options={[
                { onSelect: this.getNewBoxOnSelectFn(BoxType.HURT), name: 'Hurtbox' },
                { onSelect: this.getNewBoxOnSelectFn(BoxType.HIT), name: 'Hitbox' }
              ]}
            />
            <Tool options={[{ onSelect: this.getNewBoxOnSelectFn(BoxType.PUSH), name: 'Pushbox' }]} />
          </div>
          <FrameInfo
            hurtboxes={this.state.hurtboxes}
            hitboxes={this.state.hitboxes}
            pushbox={this.state.pushbox}
            onChangeHurtboxes={this.getOnChangeDataFn(BoxType.HURT)}
            onChangeHitboxes={this.getOnChangeDataFn(BoxType.HIT)}
            onChangePushbox={this.getOnChangeDataFn(BoxType.PUSH)}
          />
        </div>
      </div>
    );
  }

  private onClickCapsuleMode = (): void => {
    this.setState({
      mode: HBoxMode.CAPSULE
    });
  };

  private onClickCircleMode = (): void => {
    this.setState({
      mode: HBoxMode.CIRCLE
    });
  };

  private getNewBoxOnSelectFn(boxType: BoxType) {
    return () => {
      this.setState({
        newBoxType: boxType
      });
    };
  }

  private onEdit = <T extends BoxType>(type: T, definition: Partial<TypedBoxDefinition<T>>): void => {
    switch (type) {
      case BoxType.HURT: {
        const def = definition as Partial<TypedBoxDefinition<BoxType.HURT>>;
        this.setState({
          hurtboxes: def.boxes || []
        });
        break;
      }
      case BoxType.HIT: {
        const def = definition as Partial<TypedBoxDefinition<BoxType.HIT>>;
        this.setState({
          hitboxes: def.boxes || []
        });
        break;
      }
      case BoxType.PUSH: {
        const def = definition as Partial<TypedBoxDefinition<BoxType.PUSH>>;
        this.setState({
          pushbox: def.box || null
        });
        break;
      }
    }
  };

  private onAddBox = <T extends BoxType>(type: T, box: T extends BoxType.PUSH ? PushboxConfig : BoxConfig): void => {
    switch(type) {
      case BoxType.HURT: {
        this.onSetData(type, [...this.state.hurtboxes, box] as any);
        break;
      }
      case BoxType.HIT: {
        this.onSetData(type, [...this.state.hitboxes, box] as any);
        break;
      }
      case BoxType.PUSH: {
        this.onSetData(type, box as any);
        break;
      }
    }
  };

  private onSetData = <T extends BoxType>(
    type: T,
    data: T extends BoxType.PUSH ? PushboxConfig : BoxConfig[]
  ): void => {
    const { frameKey, frameIndex } = this.state;
    if (type === BoxType.HURT) {
      this.setState(
        {
          hurtboxes: [...(data as BoxConfig[])]
        },
        () => {
          this.props.onAddHurtbox({ hurtboxDef: { boxes: this.state.hurtboxes }, frameIndex, frameKey });
        }
      );
    } else if (type === BoxType.HIT) {
      this.setState(
        {
          hitboxes: [...(data as BoxConfig[])]
        },
        () => {
          this.props.onAddHitbox({ hitboxDef: { boxes: this.state.hitboxes }, frameIndex, frameKey });
        }
      );
    } else {
      this.setState({
        pushbox: data as PushboxConfig
      });
      this.props.onAddPushbox({ pushboxDef: { box: data as PushboxConfig }, frameKey, frameIndex });
    }
  };

  private getOnChangeDataFn(type: BoxType.PUSH): (data: PushboxConfig) => void;
  private getOnChangeDataFn(type: BoxType.HURT | BoxType.HIT): (data: BoxConfig[]) => void;
  private getOnChangeDataFn(type: BoxType): any {
    switch (type) {
      case BoxType.HURT:
      case BoxType.HIT: {
        return (boxes: BoxConfig[]) => {
          this.onSetData(type, boxes);
        }
      }
      case BoxType.PUSH: {
        return (pushbox: PushboxConfig) => {
          this.onSetData(type, pushbox);
        }
      }
    }
  }

  private onCommit = <T extends BoxType>(type: T): void => {
    const { frameKey, frameIndex } = this.state;
    switch (type) {
      case BoxType.HURT: {
        this.props.onEditHurtbox({ hurtboxDef: { boxes: this.state.hurtboxes }, frameKey, frameIndex });
        break;
      }
      case BoxType.HIT: {
        this.props.onEditHitbox({ hitboxDef: { boxes: this.state.hitboxes }, frameKey, frameIndex });
        break;
      }
      case BoxType.PUSH: {
        this.props.onEditPushbox({ pushboxDef: { box: this.state.pushbox! }, frameKey, frameIndex });
        break;
      }
    }
  };

  private onDeleteBox = <T extends BoxType>(type: T, boxes: T extends BoxType.PUSH ? never : BoxConfig[]): void => {
    const { frameKey, frameIndex } = this.state;
    if (type === BoxType.HURT) {
      this.setState(
        {
          hurtboxes: boxes
        },
        () => {
          if (this.state.hurtboxes.length === 0) {
            this.props.onDeleteHurtbox({ frameIndex, frameKey });
          } else {
            this.props.onEditHurtbox({ hurtboxDef: { boxes: this.state.hurtboxes }, frameKey, frameIndex });
          }
        }
      );
    } else if (type === BoxType.HIT) {
      this.setState(
        {
          hitboxes: boxes
        },
        () => {
          if (this.state.hurtboxes.length === 0) {
            this.props.onDeleteHitbox({ frameIndex, frameKey });
          } else {
            this.props.onEditHurtbox({ hurtboxDef: { boxes: this.state.hurtboxes }, frameKey, frameIndex });
          }
        }
      );
    } else {
      this.setState({
        pushbox: null
      });
      this.props.onDeletePushbox({
        frameKey,
        frameIndex
      });
    }
  };
}

export const ReduxConnectedFrameDefinitionEditor = connect(
  FrameDefinitionEditor.mapStateToProps,
  FrameDefinitionEditor.mapDispatchToProps
)(FrameDefinitionEditor) as React.ComponentType<{}>;
