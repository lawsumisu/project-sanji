import * as React from 'react';
import * as _ from 'lodash';
import { BoxConfig, BoxType, isCircleBox, PushboxConfig } from 'src/characters/frameData';
import cx from 'classnames';
import 'src/editor/components/box/styles.scss';
import { Vector2 } from '@lawsumisu/common-utilities';
import { round } from 'src/editor/redux/utilities';

export interface BoxProps {
  scale: number;
  persistent: boolean;
  type: BoxType;
  origin: Vector2;
  config: BoxConfig;
  className?: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
}

export default class Box extends React.PureComponent<BoxProps> {
  public static defaultProps = {
    scale: 1,
    persistent: false,
    type: BoxType.HURT,
    onMouseDown: _.noop,
    onMouseUp: _.noop,
  };

  public render(): React.ReactNode {
    return (
      <div
        style={this.getStyle()}
        className={cx(
          'box',
          isCircleBox(this.props.config) ? 'mod--circle' : 'mod--capsule',
          this.props.persistent && 'mod--persistent',
          this.props.type === BoxType.HIT ? 'mod--hit' : 'mod--hurt',
          this.props.className
        )}
        onMouseDown={this.props.onMouseDown}
        onMouseUp={this.props.onMouseUp}
      />
    );
  }

  private getStyle(): React.CSSProperties {
    const { config, origin, scale: s = 1} = this.props;
    const { r } = config;
    if (isCircleBox(config)) {
      const { x, y } = config;
      return {
        width: r * 2 * s,
        height: r * 2 * s,
        left: (x + origin.x - r) * s,
        top: (y + origin.y - r) * s
      };
    } else {
      const { x1, y1, x2, y2 } = config;
      const v = new Vector2(x2, y2).subtract(new Vector2(x1, y1));
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const theta = Math.atan2(v.y, v.x);
      const mag = v.magnitude();
      return {
        transform: `rotate(${theta}rad)`,
        transformOrigin: '50% 50%',
        width: mag * s,
        height: r * 2 * s,
        padding: `0 ${r * s}px`,
        top: (cy + origin.y - r) * s,
        left: (cx + origin.x - mag / 2 - r) * s,
        borderRadius: `${r * s}px`
      };
    }
  }
}

interface PushboxProps {
  scale: number;
  persistent: boolean;
  origin: Vector2;
  config: PushboxConfig;
  className?: string;
  onChange: (pushbox: PushboxConfig) => void;
  editable: boolean;
}

interface PushboxState {
  editableValues: { x: boolean; y: boolean; width: boolean; height: boolean };
  editMode: 'size' | 'position';
  dragOrigin: Vector2;
  originalConfig: PushboxConfig;
}

export class Pushbox extends React.PureComponent<PushboxProps, PushboxState> {
  public static defaultProps = {
    onChange: _.noop,
    scale: 1,
    persistent: false,
    editable: true
  };

  private defaultState: PushboxState = {
    editableValues: { x: false, y: false, width: false, height: false },
    editMode: 'size',
    dragOrigin: Vector2.ZERO,
    originalConfig: { x: 0, y: 0, width: 0, height: 0 }
  };

  public state: PushboxState = {
    ...this.defaultState
  };

  public componentDidMount(): void {
    window.addEventListener('mousemove', this.onWindowMouseMove);
    window.addEventListener('mouseup', this.onWindowMouseUp);
  }
  public componentWillUnmount(): void {
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
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
    if (_.some(this.state.editableValues)) {
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
      ...this.defaultState
    });
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

  private getOnMouseDownFn(editableValues: Partial<PushboxState['editableValues']>) {
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
