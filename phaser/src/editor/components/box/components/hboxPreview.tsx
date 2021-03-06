import * as React from 'react';
import * as _ from 'lodash';
import { BoxConfig, BoxType, isCircleBox } from 'src/characters/frameData';
import { Vector2 } from '@lawsumisu/common-utilities';
import cx from 'classnames';
import { round } from 'src/editor/utilities/math.util';
import { BoxPreviewProps, BoxPreviewState } from 'src/editor/components';

interface HboxPreviewProps extends BoxPreviewProps<BoxConfig> {
  type: BoxType;
  config: BoxConfig;
  onDelete: () => void;
}

interface HboxPreviewState extends BoxPreviewState<BoxConfig> {
  dragHandle?: 'handle1' | 'handle2' | null;
}

export default class HboxPreview extends React.PureComponent<HboxPreviewProps, HboxPreviewState> {
  public static defaultProps = {
    scale: 1,
    persistent: false,
    type: BoxType.HURT,
    editable: true,
    onChange: _.noop,
    onDelete: _.noop,
    onFinishEdit: _.noop
  };

  public state: HboxPreviewState = {
    dragOrigin: null,
    originalConfig: null
  };

  private ref: HTMLDivElement | null = null;

  public componentDidMount(): void {
    window.addEventListener('mousemove', this.onWindowMouseMove);
    window.addEventListener('mouseup', this.onWindowMouseUp);
    window.addEventListener('keydown', this.onWindowKeyDown);
    this.ref && this.ref.addEventListener('wheel', this.onContainerWheel);
    if (this.props.initialDragOrigin) {
      this.setState({
        dragOrigin: this.props.initialDragOrigin,
        originalConfig: { ...this.props.config },
        dragHandle: isCircleBox(this.props.config) ? null : 'handle2'
      });
    }
  }
  public componentWillUnmount(): void {
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
    window.removeEventListener('keydown', this.onWindowKeyDown);
    this.ref && this.ref.removeEventListener('wheel', this.onContainerWheel);
  }

  public render(): React.ReactNode {
    const handleSize = Math.min(this.props.config.r / 2, 3) * 2 * this.props.scale;
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
        onMouseDown={this.onContainerMouseDown}
        ref={this.setRef}
      >
        {!isCircleBox(this.props.config) && this.props.editable && (
          <div style={{ height: handleSize }} className="cn--capsule-handles">
            <div
              style={{ width: handleSize, height: handleSize, left: -handleSize / 2 }}
              className="capsule--handle"
              onMouseDown={this.getOnMouseDownFn('handle1')}
            />
            <div
              style={{ width: handleSize, height: handleSize, right: -handleSize / 2 }}
              className="capsule--handle"
              onMouseDown={this.getOnMouseDownFn('handle2')}
            />
          </div>
        )}
      </div>
    );
  }

  private onFinishEdit = _.debounce(() => this.props.onFinishEdit(), 100);

  private onContainerMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    this.setState({
      dragOrigin: new Vector2(e.clientX, e.clientY),
      originalConfig: { ...this.props.config },
      dragHandle: null
    });
  };

  private onContainerWheel = (e: WheelEvent) => {
    const { deltaY } = e;
    e.stopPropagation();
    e.preventDefault();
    this.props.onChange({ ...this.props.config, r: Math.max(5, this.props.config.r - deltaY) });
    this.onFinishEdit();
  };

  private onWindowMouseMove = (e: MouseEvent) => {
    if (this.state.dragOrigin && this.state.originalConfig) {
      const { scale: s } = this.props;
      const d = new Vector2(e.clientX, e.clientY).subtract(this.state.dragOrigin).scale(1 / s);
      const { r } = this.props.config;
      if (isCircleBox(this.state.originalConfig)) {
        const { x, y } = this.state.originalConfig;
        this.props.onChange({ r, x: round(x + d.x), y: round(y + d.y) });
      } else {
        const { x1, y1, x2, y2 } = this.state.originalConfig;
        if (this.state.dragHandle) {
          if (this.state.dragHandle === 'handle1') {
            this.props.onChange({
              ...this.state.originalConfig,
              x1: round(x1 + d.x),
              y1: round(y1 + d.y),
              r
            });
          } else {
            this.props.onChange({
              ...this.state.originalConfig,
              x2: round(x2 + d.x),
              y2: round(y2 + d.y),
              r
            });
          }
        } else {
          this.props.onChange({
            x1: round(x1 + d.x),
            y1: round(y1 + d.y),
            x2: round(x2 + d.x),
            y2: round(y2 + d.y),
            r
          });
        }
      }
    }
  };

  private onWindowMouseUp = () => {
    if (this.state.dragOrigin) {
      this.setState({
        dragOrigin: null,
        originalConfig: null
      });
      this.props.onFinishEdit();
    }
  };

  private onWindowKeyDown = (e: KeyboardEvent): void => {
    if (this.state.dragOrigin) {
      if (e.key === 'q') {
        this.props.onDelete();
      }
      const s = 0.5;
      let delta = 0;
      if (e.key === 'w') {
        delta = s;
      } else if (e.key === 's') {
        delta = -s;
      }
      if (delta !== 0) {
        this.props.onChange({ ...this.props.config, r: this.props.config.r + delta });
      }
    }
  };

  private setRef = (ref: HTMLDivElement | null): void => {
    this.ref = ref;
  };

  private getOnMouseDownFn(handle: HboxPreviewState['dragHandle']) {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      this.setState({
        dragHandle: handle,
        dragOrigin: new Vector2(e.clientX, e.clientY),
        originalConfig: { ...this.props.config }
      });
    };
  }

  private getStyle(): React.CSSProperties {
    const { config, origin, scale: s = 1 } = this.props;
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
