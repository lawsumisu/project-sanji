import * as React from 'react';
import { BoxConfig, BoxType, isCircleBox } from 'src/characters/frameData';
import { Vector2 } from '@lawsumisu/common-utilities';
import * as _ from 'lodash';
import cx from 'classnames';
import { round } from 'src/editor/redux/utilities';

interface HitboxPreviewProps {
  scale: number;
  persistent: boolean;
  type: BoxType;
  origin: Vector2;
  config: BoxConfig;
  className?: string;
  onChange: (config: BoxConfig) => void;
}

interface HitboxPreviewState {
  dragOrigin: Vector2 | null;
  originalConfig: BoxConfig | null;
}

export default class HitboxPreview extends React.PureComponent<HitboxPreviewProps, HitboxPreviewState> {
  public static defaultProps = {
    scale: 1,
    persistent: false,
    type: BoxType.HURT,
  };

  public state: HitboxPreviewState = {
    dragOrigin: null,
    originalConfig: null,
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
          isCircleBox(this.props.config) ? 'mod--circle' : 'mod--capsule',
          this.props.persistent && 'mod--persistent',
          this.props.type === BoxType.HIT ? 'mod--hit' : 'mod--hurt',
          this.props.className
        )}
        onMouseDown={this.onContainerMouseDown}
      />
    );
  }

  private onContainerMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    this.setState({
      dragOrigin: new Vector2(e.clientX, e.clientY),
      originalConfig: { ...this.props.config }
    });
  };

  private onWindowMouseMove = (e: MouseEvent) => {
    if (this.state.dragOrigin && this.state.originalConfig) {
      const { scale: s } = this.props;
      const d = new Vector2(e.clientX, e.clientY).subtract(this.state.dragOrigin).scale( 1 / s);
      // TODO handle capsules
      if (isCircleBox(this.state.originalConfig)) {
        const { x, y } = this.state.originalConfig;
        this.props.onChange({ ...this.state.originalConfig, x: round(x + d.x), y: round(y + d.y) });
      }
    }
  };

  private onWindowMouseUp = () => {
    this.setState({
      dragOrigin: null,
      originalConfig: null,
    });
  };

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
