import { Vector2 } from '@lawsumisu/common-utilities';
import { PushboxConfig } from 'src/characters/frameData';
import * as React from 'react';
import * as _ from 'lodash';
import cx from 'classnames';
import { round } from 'src/editor/redux/utilities';
import { BoxPreviewProps, BoxPreviewState } from 'src/editor/components';

interface PushboxPreviewProps extends BoxPreviewProps<PushboxConfig> {}

interface PushboxPreviewState extends BoxPreviewState<PushboxConfig> {
  editableValues: { x: boolean; y: boolean; width: boolean; height: boolean };
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
        editableValues: { x: false, y: false, width: true, height: true }
      };
    } else {
      return null;
    }
  }

  private static defaultState: PushboxPreviewState = {
    editableValues: { x: false, y: false, width: false, height: false },
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
    window.addEventListener('keydown', this.onWindowKeyDown);
  }
  public componentWillUnmount(): void {
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
    window.removeEventListener('keydown', this.onWindowKeyDown);
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
        <div className="box--handle mod--horizontal mod--right" onMouseDown={this.getOnMouseDownFn({ width: true })} />
        <div className="box--handle mod--vertical mod--bottom" onMouseDown={this.getOnMouseDownFn({ height: true })} />
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
      const d = new Vector2(e.clientX, e.clientY).subtract(this.state.dragOrigin);
      const newPushbox = { ...this.state.originalConfig };
      if (this.state.editableValues.x) {
        newPushbox.x = round(newPushbox.x + d.x / s);
        if (this.state.editMode === 'size') {
          newPushbox.width = round(newPushbox.width - d.x / s);
        }
      } else if (this.state.editableValues.width) {
        newPushbox.width = round(newPushbox.width + d.x / s);
      }
      if (this.state.editableValues.y) {
        newPushbox.y = round(newPushbox.y + d.y / s);
        if (this.state.editMode === 'size') {
          newPushbox.height = round(newPushbox.height - d.y / s);
        }
      } else if (this.state.editableValues.height) {
        newPushbox.height = round(newPushbox.height + d.y / s);
      }
      this.props.onChange(newPushbox);
    }
  };

  private onWindowMouseUp = () => {
    this.setState({
      ...PushboxPreview.defaultState
    });
    this.props.onFinishEdit();
  };

  private onWindowKeyDown = (e: KeyboardEvent): void => {
    if (this.state.dragOrigin){
      if (e.key === 'q') {
        this.props.onDelete();
      }
    }
  };

  private onContainerMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    this.setState({
      editableValues: { ...this.state.editableValues, x: true, y: true },
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
