import * as React from 'react';
import * as _ from 'lodash';
import { HitboxConfig } from 'src/characters';
import { Box, Sprite } from 'src/editor/components';
import { FrameEditState } from 'src/editor/redux/frameEdit';
import { connect } from 'react-redux';
import { AppState } from 'src/editor/redux';
import { FrameDataState, getAnchorPosition, getSpriteConfig } from 'src/editor/redux/frameData';
import 'src/editor/components/editor/styles.scss';
import { BoxType } from 'src/editor/components/box';
import { getFrameDefinition } from 'src/editor/redux/utilities';
import { Vector2 } from '@lawsumisu/common-utilities';

interface EditorState {
  selectedFrame: FrameEditState['frame'];
  hitboxes: Array<{ x: number; y: number; r: number }>;
  selectedBox: { offset: Vector2; index: number } | null;
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
      const hit = getFrameDefinition(props.frameData, props.selected.frame.key, props.selected.frame.index);
      return {
        selectedFrame: props.selected.frame,
        hitboxes: hit ? hit.boxes.map(box => ({ ...box })) : [],
        selectedBox: null
      };
    }
    return state;
  }

  public state: EditorState = {
    selectedFrame: null,
    hitboxes: [],
    selectedBox: null
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
          <input type="button" value="Print" onClick={this.onButtonClick}/>
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
              <div>
                {this.state.hitboxes.map((box: HitboxConfig, i: number) => (
                  <Box
                    key={i}
                    config={box}
                    type={BoxType.HIT}
                    origin={origin}
                    scale={this.scale}
                    className="editor-box"
                    onMouseDown={this.getBoxOnMouseDownFn(i)}
                  />
                ))}
              </div>
            </div>
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
      this.setState({
        selectedBox: null,
        hitboxes: this.state.hitboxes.filter((__, i: number) => i !== index)
      });
    }
  }

  private get origin(): Vector2 {
    const { key, index } = this.state.selectedFrame!;
    const config = getSpriteConfig(this.props.frameData, key, index);
    return getAnchorPosition(config);
  }

  private onMouseDown = (e: React.MouseEvent): void => {
    if (this.ref && _.isNil(this.state.selectedBox)) {
      const o = new Vector2(e.clientX, e.clientY)
        .subtract(new Vector2(this.ref.offsetLeft, this.ref.offsetTop))
        .scale(1 / this.scale)
        .subtract(this.origin);
      const box = { x: o.x, y: o.y, r: 10 };
      this.setState({
        selectedBox: { offset: Vector2.ZERO, index: this.state.hitboxes.length },
        hitboxes: [...this.state.hitboxes, box ]
      });
    }
  };

  private onMouseMove = (e: React.MouseEvent): void => {
    if (this.ref && this.state.selectedBox) {
      const { index, offset } = this.state.selectedBox;
      const s = this.scale**2;
      const o = new Vector2(e.clientX, e.clientY)
        .subtract(new Vector2(this.ref.offsetLeft, this.ref.offsetTop))
        .scale(1 / this.scale)
        .subtract(offset)
        .subtract(this.origin);
      const hitboxes = [...this.state.hitboxes];
      hitboxes[index] = { ...hitboxes[index], x: Math.round(o.x * s) / s, y: Math.round(o.y * s) /s  };
      this.setState({
        hitboxes
      });
    }
  };

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
        const hitboxes = [...this.state.hitboxes];
        hitboxes[index] = { ...hitboxes[index], r: hitboxes[index].r + delta };
        this.setState({
          hitboxes
        });
      }
    }
  };

  private onButtonClick = (): void => {
    console.log(JSON.stringify(this.state.hitboxes));
  };

  private setRef = (ref: HTMLDivElement | null): void => {
    this.ref = ref;
  };

  private getBoxOnMouseDownFn(index: number): any {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      if (this.ref) {
        const box = this.state.hitboxes[index];
        const origin = this.origin;
        const x = (e.clientX - this.ref.offsetLeft) / this.scale - box.x - origin.x;
        const y = (e.clientY - this.ref.offsetTop) / this.scale - box.y - origin.y;
        this.setState({
          selectedBox: { index, offset: new Vector2(x, y) }
        });
      }
    };
  }

  private onMouseUp = (): void => {
    this.setState({
      selectedBox: null
    });
  };
}

export const EditorRX = connect(Editor.mapStateToProps, null)(Editor);
