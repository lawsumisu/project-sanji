import { Vector2 } from '@lawsumisu/common-utilities';
import { PushboxConfig } from 'src/characters/frameData';
import * as React from 'react';
import * as _ from 'lodash';
import cx from 'classnames';
import { round } from 'src/editor/utilities/math.util';
import { BoxPreviewProps, BoxPreviewState } from 'src/editor/components';

interface PushboxPreviewProps extends BoxPreviewProps<PushboxConfig> {}

interface PushboxPreviewState extends BoxPreviewState<PushboxConfig> {
  editableValues: { x: boolean; y: boolean; };
  editMode: 'size' | 'position';
}

export default class PushboxPreview extends React.PureComponent<PushboxPreviewProps, PushboxPreviewState> {
  public static defaultProps = {
    onChange: _.noop,
    onDelete: _.noop,
    onFinishEdit: _.noop,
    scale: 1,
    persistent: false,
    editable: true
  };

  public static getDerivedStateFromProps(
    props: PushboxPreviewProps,
    state: PushboxPreviewState
  ): PushboxPreviewState | null {
    if (props.initialDragOrigin && !state.dragOrigin) {
      return {
        editMode: 'size',
        dragOrigin: props.initialDragOrigin,
        originalConfig: { ...props.config },
        editableValues: { x: true, y: true }
      };
    } else {
      return null;
    }
  }

  private static defaultState: PushboxPreviewState = {
    editableValues: { x: false, y: false },
    editMode: 'size',
    dragOrigin: null,
    originalConfig: null
  };

  public state: PushboxPreviewState = {
    ...PushboxPreview.defaultState
  };

  public componentDidMount(): void {
    window.addEventListener('mousemove', this.onWindowMouseMove);
    window.addEventListener('mouseup', this.onWindowMouseUp);
    window.addEventListener('keypress', this.onWindowKeyPress);
  }
  public componentWillUnmount(): void {
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
    window.removeEventListener('keypress', this.onWindowKeyPress);
  }

  public render(): React.ReactNode {
    return (
      <div
        style={this.getStyle()}
        className={cx(
          'box',
          'mod--push',
          this.props.persistent && 'mod--persistent',
          this.props.editable && 'mod--editable',
          this.props.className
        )}
        onMouseDown={this.onContainerMouseDown}
      >
        <div className="box--handle mod--vertical mod--top" onMouseDown={this.getOnMouseDownFn({ y: true })} />
        <div className="box--handle mod--horizontal mod--left" onMouseDown={this.getOnMouseDownFn({ x: true })} />
        <div className="box--handle mod--horizontal mod--right" onMouseDown={this.getOnMouseDownFn({ x: true })} />
        <div className="box--handle mod--vertical mod--bottom" onMouseDown={this.getOnMouseDownFn({ y: true })} />
      </div>
    );
  }

  private getStyle(): React.CSSProperties {
    const { origin, config, scale: s } = this.props;
    return {
      top: (origin.y + config.y) * s,
      left: (origin.x + config.x) * s,
      width: config.width * s,
      height: config.height * s
    };
  }

  private onWindowMouseMove = (e: MouseEvent) => {
    if (_.some(this.state.editableValues) && this.state.dragOrigin && this.state.originalConfig) {
      const { scale: s } = this.props;
      const d = new Vector2(e.clientX, e.clientY).subtract(this.state.dragOrigin).scale(1 / s);
      const newPushbox = { ...this.state.originalConfig };
      if (this.state.editableValues.x) {
        if (this.state.editMode === 'size') {
          if (d.x < -this.state.originalConfig.width) {
            newPushbox.x = round(newPushbox.x + d.x + this.state.originalConfig.width);
            newPushbox.width = -round(d.x + this.state.originalConfig.width);
          } else {
            newPushbox.width = round(newPushbox.width + d.x);
          }
        } else {
          newPushbox.x = round(newPushbox.x + d.x);
        }
      }
      if (this.state.editableValues.y) {
        if (this.state.editMode === 'size') {
          if (d.y < -this.state.originalConfig.height) {
            newPushbox.y = round(newPushbox.y + d.y + this.state.originalConfig.height);
            newPushbox.height = -round(d.y + this.state.originalConfig.height);
          } else {
            newPushbox.height = round(newPushbox.height + d.y);
          }
        } else {
          newPushbox.y = round(newPushbox.y + d.y);
        }
      }
      this.props.onChange(newPushbox);
    }
  };

  private onWindowMouseUp = () => {
    if (this.state.dragOrigin) {
      this.setState({
        ...PushboxPreview.defaultState
      });
      this.props.onFinishEdit();
    }
  };

  private onWindowKeyPress = (e: KeyboardEvent): void => {
    if (this.state.dragOrigin){
      if (e.key === 'q') {
        this.props.onDelete();
      }
    }
  };

  private onContainerMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    this.setState({
      editableValues: { x: true, y: true },
      editMode: 'position',
      dragOrigin: new Vector2(e.clientX, e.clientY),
      originalConfig: { ...this.props.config }
    });
  };

  private getOnMouseDownFn(editableValues: Partial<PushboxPreviewState['editableValues']>) {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      this.setState({
        editableValues: { ...this.state.editableValues, ...editableValues },
        dragOrigin: new Vector2(e.clientX, e.clientY),
        originalConfig: { ...this.props.config }
      });
    };
  }
}
