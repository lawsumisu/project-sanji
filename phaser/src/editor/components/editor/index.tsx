import * as React from 'react';
import * as _ from 'lodash';
import { BoxConfig, BoxType, CapsuleBoxConfig, isCircleBox } from 'src/characters';
import { Box, Sprite } from 'src/editor/components';
import { FrameEditState } from 'src/editor/redux/frameEdit';
import { connect } from 'react-redux';
import { AppState } from 'src/editor/redux';
import { FrameDataState, getAnchorPosition, getSpriteConfig } from 'src/editor/redux/frameData';
import 'src/editor/components/editor/styles.scss';
import { getBoxDefinition } from 'src/editor/redux/utilities';
import { Vector2 } from '@lawsumisu/common-utilities';
import EditableCapsuleBox, { SelectionType } from 'src/editor/components/editor/components/capsule.component';
import { Tool } from 'src/editor/components/editor/components/tool';

enum BoxMode {
  CIRCLE = 'CIRCLE',
  CAPSULE = 'CAPSULE'
}

interface EditorState {
  selectedFrame: FrameEditState['frame'];
  newBoxType: BoxType;
  hitboxes: BoxConfig[];
  hurtboxes: BoxConfig[];
  selectedBox: { offset: Vector2; index: number; selectionType: SelectionType; boxType: BoxType } | null;
  incompleteCapsule: { x: number; y: number } | null;
  mode: BoxMode;
}

interface StateMappedEditorProps {
  frameData: FrameDataState;
  selected: FrameEditState;
}

class Editor extends React.PureComponent<StateMappedEditorProps, EditorState> {
  public static mapStateToProps(state: AppState): StateMappedEditorProps {
    return {
      frameData: state.frameData,
      selected: { ...state.frameEdit }
    };
  }

  public static getDerivedStateFromProps(props: StateMappedEditorProps, state: EditorState): EditorState {
    if (props.selected.frame && !_.isEqual(props.selected.frame, state.selectedFrame)) {
      const hit = getBoxDefinition(props.frameData, props.selected.frame.key, props.selected.frame.index, BoxType.HIT);
      const hurt = getBoxDefinition(
        props.frameData,
        props.selected.frame.key,
        props.selected.frame.index,
        BoxType.HURT
      );
      return {
        selectedFrame: props.selected.frame,
        newBoxType: state.newBoxType,
        hitboxes: hit ? hit.boxes.map(box => ({ ...box })) : [],
        hurtboxes: hurt ? hurt.boxes.map(box => ({ ...box })) : [],
        selectedBox: null,
        mode: state.mode,
        incompleteCapsule: null
      };
    }
    return state;
  }

  public state: EditorState = {
    selectedFrame: null,
    newBoxType: BoxType.HURT,
    hitboxes: [],
    hurtboxes: [],
    selectedBox: null,
    mode: BoxMode.CIRCLE,
    incompleteCapsule: null
  };

  private scale = 5;

  private ref: HTMLDivElement | null;

  public render(): React.ReactNode {
    if (this.state.selectedFrame) {
      const { key, index } = this.state.selectedFrame;
      const config = getSpriteConfig(this.props.frameData, key, index);
      const origin = this.origin;
      return (
        <div className="cn--frame-editor">
          <div
            className="cn--frame"
            onMouseMove={this.onMouseMove}
            onKeyDown={this.onKeyDown}
            tabIndex={0}
            onMouseUp={this.onMouseUp}
            onMouseDown={this.onMouseDown}
          >
            <div ref={this.setRef}>
              <Sprite source={this.props.frameData.source} config={config} scale={this.scale} />
              <this.BoxDisplay origin={origin} type={BoxType.HURT} boxes={this.state.hurtboxes} />
              <this.BoxDisplay origin={origin} type={BoxType.HIT} boxes={this.state.hitboxes} />
            </div>
          </div>
          <div className="cn--tools">
            <Tool options={[{ onSelect: this.onSelectPrint, name: 'Print' }]} />
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
          </div>
        </div>
      );
    } else {
      return null;
    }
  }

  private deleteBox(): void {
    if (this.state.selectedBox) {
      const { index } = this.state.selectedBox;
      const key = this.getSelectedBoxKey()!;
      this.setState({
        selectedBox: null,
        [key]: this.state[key].filter((__, i: number) => i !== index)
      } as any);
    }
  }

  private get origin(): Vector2 {
    const { key, index } = this.state.selectedFrame!;
    const config = getSpriteConfig(this.props.frameData, key, index);
    return getAnchorPosition(config);
  }

  private getSelectedBoxKey(): 'hitboxes' | 'hurtboxes' | null {
    if (this.state.selectedBox) {
      return this.state.selectedBox.boxType === BoxType.HIT ? 'hitboxes' : 'hurtboxes';
    } else {
      return null;
    }
  }

  private onMouseDown = (e: React.MouseEvent): void => {
    if (this.ref && _.isNil(this.state.selectedBox)) {
      const o = new Vector2(e.clientX, e.clientY)
        .subtract(new Vector2(this.ref.offsetLeft, this.ref.offsetTop))
        .scale(1 / this.scale)
        .subtract(this.origin);
      const key = this.state.newBoxType === BoxType.HIT ? 'hitboxes' : 'hurtboxes';
      if (this.state.mode === BoxMode.CIRCLE) {
        const box = { x: o.x, y: o.y, r: 10 };
        this.setState({
          selectedBox: {
            offset: Vector2.ZERO,
            index: this.state[key].length,
            selectionType: SelectionType.BOX,
            boxType: this.state.newBoxType
          },
          [key]: [...this.state[key], box]
        } as any);
      } else {
        if (this.state.incompleteCapsule) {
          const { x, y } = this.state.incompleteCapsule;
          const box = { x1: x, y1: y, x2: o.x, y2: o.y, r: 10 };
          this.setState({
            selectedBox: {
              offset: Vector2.ZERO,
              index: this.state[key].length,
              selectionType: SelectionType.BOX,
              boxType: this.state.newBoxType
            },
            [key]: [...this.state[key], box],
            incompleteCapsule: null
          } as any);
        } else {
          this.setState({
            incompleteCapsule: { x: o.x, y: o.y }
          });
        }
      }
    }
  };

  private onMouseMove = (e: React.MouseEvent): void => {
    if (this.ref && this.state.selectedBox) {
      const { index, offset } = this.state.selectedBox;
      const s = this.scale ** 2;
      const o = new Vector2(e.clientX, e.clientY)
        .subtract(new Vector2(this.ref.offsetLeft, this.ref.offsetTop))
        .scale(1 / this.scale)
        .subtract(offset)
        .subtract(this.origin);
      const nx = Math.round(o.x * s) / s;
      const ny = Math.round(o.y * s) / s;
      const key = this.getSelectedBoxKey()!;
      if (isCircleBox(this.state[key][index])) {
        const boxes = [...this.state[key]];
        boxes[index] = { ...boxes[index], x: Math.round(o.x * s) / s, y: Math.round(o.y * s) / s };
        this.setState({
          [key]: boxes
        } as any);
      } else {
        this.updateCapsuleBoxPosition(nx, ny);
      }
    }
  };

  private updateCapsuleBoxPosition(nx: number, ny: number): void {
    if (this.state.selectedBox) {
      const { index, selectionType = SelectionType.BOX } = this.state.selectedBox;
      const key = this.getSelectedBoxKey()!;
      const box = { ...this.state[key][index] } as CapsuleBoxConfig;
      switch (selectionType) {
        case SelectionType.HANDLE_1: {
          box.x1 = nx;
          box.y1 = ny;
          break;
        }
        case SelectionType.HANDLE_2: {
          box.x2 = nx;
          box.y2 = ny;
          break;
        }
        case SelectionType.BOX: {
          const oldX = (box.x1 + box.x2) / 2;
          const oldY = (box.y1 + box.y2) / 2;
          box.x1 += nx - oldX;
          box.x2 += nx - oldX;
          box.y1 += ny - oldY;
          box.y2 += ny - oldY;
          break;
        }
      }
      this.updateSelectedBox(box);
    }
  }

  public updateSelectedBox(newConfig: BoxConfig) {
    if (this.state.selectedBox) {
      const key = this.getSelectedBoxKey()!;
      const { index } = this.state.selectedBox;
      const boxes = [...this.state[key]];
      boxes[index] = newConfig;
      this.setState({
        [key]: boxes
      } as any);
    }
  }

  private onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (this.state.selectedBox) {
      if (e.key === 'q') {
        this.deleteBox();
      }
      const s = 0.5;
      let delta = 0;
      if (e.key === 'w') {
        delta = s;
      } else if (e.key === 's') {
        delta = -s;
      }
      if (delta !== 0) {
        const { index } = this.state.selectedBox;
        const key = this.getSelectedBoxKey()!;
        const boxes = [...this.state[key]];
        boxes[index] = { ...boxes[index], r: boxes[index].r + delta };
        this.setState({
          [key]: boxes
        } as any);
      }
    }
  };

  private onSelectPrint = (): void => {
    console.log(JSON.stringify(this.state.hurtboxes), JSON.stringify(this.state.hitboxes));
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

  private getBoxOnSelectFn(index: number, type: BoxType): any {
    return (e: React.MouseEvent, selectionType: SelectionType = SelectionType.BOX) => {
      const boxes = type === BoxType.HIT ? this.state.hitboxes : this.state.hurtboxes;
      e.stopPropagation();
      if (this.ref) {
        const box = boxes[index];
        let bx, by;
        if (isCircleBox(box)) {
          bx = box.x;
          by = box.y;
        } else {
          switch (selectionType) {
            case SelectionType.HANDLE_1: {
              bx = box.x1;
              by = box.y1;
              break;
            }
            case SelectionType.HANDLE_2: {
              bx = box.x2;
              by = box.y2;
              break;
            }
            case SelectionType.BOX: {
              bx = (box.x1 + box.x2) / 2;
              by = (box.y1 + box.y2) / 2;
              break;
            }
          }
        }
        const origin = this.origin;
        const x = (e.clientX - this.ref.offsetLeft) / this.scale - bx - origin.x;
        const y = (e.clientY - this.ref.offsetTop) / this.scale - by - origin.y;
        this.setState({
          selectedBox: { index, offset: new Vector2(x, y), selectionType, boxType: type }
        });
      }
    };
  }

  private onMouseUp = (): void => {
    this.setState({
      selectedBox: null
    });
  };

  private BoxDisplay = ({ boxes, type, origin }: { boxes: BoxConfig[]; type: BoxType; origin: Vector2 }) => (
    <div>
      {boxes.map((box: BoxConfig, i: number) =>
        isCircleBox(box) ? (
          <Box
            key={i}
            config={box}
            type={type}
            origin={origin}
            scale={this.scale}
            className="editor-box"
            onMouseDown={this.getBoxOnSelectFn(i, type)}
          />
        ) : (
          <EditableCapsuleBox
            key={i}
            config={box}
            scale={this.scale}
            type={type}
            origin={origin}
            onSelect={this.getBoxOnSelectFn(i, type)}
          />
        )
      )}
      {this.state.incompleteCapsule && (
        <Box type={type} config={{ ...this.state.incompleteCapsule, r: 3 }} scale={this.scale} origin={origin} />
      )}
    </div>
  );
}

export const EditorRX = connect(Editor.mapStateToProps, null)(Editor);
