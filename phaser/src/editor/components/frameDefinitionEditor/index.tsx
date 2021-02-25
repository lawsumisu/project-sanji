import * as React from 'react';
import * as _ from 'lodash';
import { BoxConfig, BoxDefinition, BoxType, PushboxConfig, PushboxDefinition } from 'src/characters/frameData';
import { HboxPreview, PushboxPreview, SpriteRenderer } from 'src/editor/components';
import { FrameEditState } from 'src/editor/redux/frameEdit';
import { connect } from 'react-redux';
import { AppState } from 'src/editor/redux';
import { FrameDataState, getAnchorPosition, getSpriteConfig, getSpriteSource } from 'src/editor/redux/frameData';
import 'src/editor/components/frameDefinitionEditor/styles.scss';
import { Vector2 } from '@lawsumisu/common-utilities';
import { Tool } from 'src/editor/components/frameDefinitionEditor/components/tool';
import { FrameInfo } from 'src/editor/components/frameDefinitionEditor/components/frameInfo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { bindActionCreators, Dispatch } from 'redux';
import { frameDefinitionEditActionCreators, getFrameDefData } from 'src/editor/redux/frameData/frameDefinitionEdit';

enum BoxMode {
  CIRCLE = 'CIRCLE',
  CAPSULE = 'CAPSULE'
}

function round(v: number, precision = 100) {
  return Math.round(v * precision) / precision;
}

interface State {
  selectedFrame: FrameEditState['frame'];
  newBoxType: BoxType;
  hitboxes: BoxConfig[];
  hurtboxes: BoxConfig[];
  pushbox: PushboxConfig | null;
  newBoxOrigin: Vector2 | null;
  mode: BoxMode;
}

interface StateMappedProps {
  frameData: FrameDataState;
  selected: FrameEditState;
}

interface DispatchMappedProps {
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
// TODO render Editor with non null selected frame props
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

  //TODO Set state in constructor and use key to refresh when props change
  public static getDerivedStateFromProps(props: StateMappedProps, state: State): State {
    if (props.selected.frame && !_.isEqual(props.selected.frame, state.selectedFrame)) {
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
        selectedFrame: props.selected.frame,
        newBoxType: state.newBoxType,
        hitboxes: hit ? hit.boxes.map(box => ({ ...box })) : [],
        hurtboxes: hurt ? hurt.boxes.map(box => ({ ...box })) : [],
        pushbox: pushbox ? pushbox.box : null,
        mode: state.mode,
        newBoxOrigin: null
      };
    }
    return state;
  }

  public state: State = {
    selectedFrame: null,
    newBoxType: BoxType.HURT,
    hitboxes: [],
    hurtboxes: [],
    pushbox: { x: 0, y: 0, width: 0, height: 0 },
    mode: BoxMode.CIRCLE,
    newBoxOrigin: null
  };

  private scale = 5;

  private ref: HTMLDivElement | null;

  public render(): React.ReactNode {
    return (
      <div className="cn--frame-editor">
        <div className="cn--frame" tabIndex={0} onMouseUp={this.onMouseUp} onMouseDown={this.onMouseDown}>
          <this.SelectedFrame />
        </div>
        <div>
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
          <FrameInfo hurtboxes={this.state.hurtboxes} hitboxes={this.state.hitboxes} pushbox={this.state.pushbox} />
        </div>
      </div>
    );
  }

  private get origin(): Vector2 {
    const { key, index } = this.state.selectedFrame!;
    const config = getSpriteConfig(this.props.frameData, key, index);
    return config ? getAnchorPosition(config) : Vector2.ZERO;
  }

  private onMouseDown = (e: React.MouseEvent): void => {
    if (this.ref) {
      const o = new Vector2(e.clientX, e.clientY)
        .subtract(new Vector2(this.ref.offsetLeft, this.ref.offsetTop))
        .scale(1 / this.scale)
        .subtract(this.origin);
      const ox = round(o.x);
      const oy = round(o.y);
      const newBoxOrigin = new Vector2(e.clientX, e.clientY);
      switch (this.state.newBoxType) {
        case BoxType.HURT:
        case BoxType.HIT:
          let box: BoxConfig;
          if (this.state.mode === BoxMode.CIRCLE) {
            box = { x: ox, y: oy, r: 10 };
          } else {
            box = { x1: ox, y1: oy, x2: ox, y2: oy, r: 10 };
          }
          if (this.props.selected.frame) {
            const { key: frameKey, index: frameIndex } = this.props.selected.frame;
            if (this.state.newBoxType === BoxType.HURT) {
              this.setState({
                hurtboxes: [...this.state.hurtboxes, box],
                newBoxOrigin
              }, () => {
                this.props.onAddHurtbox({ hurtboxDef: { boxes: this.state.hurtboxes }, frameIndex, frameKey})
              });
            } else {
              this.setState({
                hurtboxes: [...this.state.hurtboxes, box],
                newBoxOrigin
              }, () => {
                this.props.onAddHitbox({ hitboxDef: { boxes: this.state.hitboxes }, frameIndex, frameKey})
              });
            }
          }
          break;
        case BoxType.PUSH:
          if (this.props.selected.frame) {
            const { key: frameKey, index: frameIndex } = this.props.selected.frame;
            const pushbox = { x: ox, y: oy, width: 0, height: 0 };
            this.setState({
              pushbox,
              newBoxOrigin
            });
            this.props.onAddPushbox({ pushboxDef: { box: pushbox }, frameKey, frameIndex });
          }
          break;
      }
    }
  };

  private onClickCapsuleMode = (): void => {
    this.setState({
      mode: BoxMode.CAPSULE
    });
  };

  private onClickCircleMode = (): void => {
    this.setState({
      mode: BoxMode.CIRCLE
    });
  };

  private getNewBoxOnSelectFn(boxType: BoxType) {
    return () => {
      this.setState({
        newBoxType: boxType
      });
    };
  }

  private setRef = (ref: HTMLDivElement | null): void => {
    this.ref = ref;
  };

  private onMouseUp = (): void => {
    this.setState({
      newBoxOrigin: null
    });
  };

  private getOnHboxChangeFn(type: BoxType, index: number) {
    return (config: BoxConfig) => {
      if (type === BoxType.HURT) {
        const boxes = [...this.state.hurtboxes];
        boxes[index] = config;
        this.setState({
          hurtboxes: boxes
        });
      } else if (type === BoxType.HIT) {
        const boxes = [...this.state.hitboxes];
        boxes[index] = config;
        this.setState({
          hitboxes: boxes
        });
      }
    };
  }

  private getFinishEditFn(type: BoxType) {
    return () => {
      if (this.props.selected.frame) {
        const { key: frameKey, index: frameIndex } = this.props.selected.frame;
        switch(type) {
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
      }
    }
  }

  private onPushboxChange = (pushbox: PushboxConfig) => {
    if (this.state.pushbox) {
      this.setState({
        pushbox
      });
    }
  };

  private getOnDeleteFn(type: BoxType, index = 0) {
    return () => {
      if (type === BoxType.HURT) {
        this.setState({
          hurtboxes: this.state.hurtboxes.filter((__, i: number) => i !== index)
        }, () => {
          if (this.props.selected.frame) {
            const { key: frameKey, index: frameIndex } = this.props.selected.frame;
            if (this.state.hurtboxes.length === 0 && this.props.selected.frame) {
              this.props.onDeleteHurtbox({ frameIndex, frameKey })
            } else {
              this.props.onEditHurtbox({ hurtboxDef: { boxes: this.state.hurtboxes }, frameKey, frameIndex });
            }
          }
        });
      } else if (type === BoxType.HIT) {
        this.setState({
          hitboxes: this.state.hitboxes.filter((__, i: number) => i !== index)
        }, () => {
          if (this.props.selected.frame) {
            const { key: frameKey, index: frameIndex } = this.props.selected.frame;
            if (this.state.hurtboxes.length === 0 && this.props.selected.frame) {
              this.props.onDeleteHitbox({ frameIndex, frameKey })
            } else {
              this.props.onEditHurtbox({ hurtboxDef: { boxes: this.state.hurtboxes }, frameKey, frameIndex });
            }
          }
        });
      } else {
        if (this.props.selected.frame) {
          this.setState({
            pushbox: null
          });
          this.props.onDeletePushbox({
            frameKey: this.props.selected.frame.key,
            frameIndex: this.props.selected.frame.index
          });
        }
      }
    };
  }

  private HBoxesPreview = ({ boxes, type, origin }: { boxes: BoxConfig[]; type: BoxType; origin: Vector2 }) => (
    <div>
      {boxes.map((box: BoxConfig, i: number) => (
        <HboxPreview
          key={i}
          config={box}
          type={type}
          origin={origin}
          scale={this.scale}
          className="editor-box"
          onChange={this.getOnHboxChangeFn(type, i)}
          onDelete={this.getOnDeleteFn(type, i)}
          initialDragOrigin={this.state.newBoxOrigin || undefined}
          onFinishEdit={this.getFinishEditFn(type)}
        />
      ))}
    </div>
  );

  private SelectedFrame = () => {
    if (this.state.selectedFrame) {
      const { key, index } = this.state.selectedFrame;
      const source = getSpriteSource(this.props.frameData, key);
      const config = source && getSpriteConfig(this.props.frameData, key, index);
      const origin = this.origin;
      return (
        <div ref={this.setRef}>
          {config && source && <SpriteRenderer source={source} config={config} scale={this.scale} />}
          {this.HBoxesPreview({ origin, type: BoxType.HURT, boxes: this.state.hurtboxes })}
          {this.HBoxesPreview({ origin, type: BoxType.HIT, boxes: this.state.hitboxes })}
          {this.state.pushbox && (
            <PushboxPreview
              origin={origin}
              config={this.state.pushbox}
              scale={this.scale}
              onChange={this.onPushboxChange}
              onDelete={this.getOnDeleteFn(BoxType.PUSH)}
              initialDragOrigin={(this.state.newBoxType === BoxType.PUSH && this.state.newBoxOrigin) || undefined}
              onFinishEdit={this.getFinishEditFn(BoxType.PUSH)}
            />
          )}
          <FontAwesomeIcon
            style={{ left: origin.x * this.scale, top: origin.y * this.scale }}
            className="origin"
            icon="crosshairs"
          />
        </div>
      );
    } else {
      return null;
    }
  };
}

export const ReduxConnectedFrameDefinitionEditor = connect(
  FrameDefinitionEditor.mapStateToProps,
  FrameDefinitionEditor.mapDispatchToProps
)(FrameDefinitionEditor) as React.ComponentType<{}>;
