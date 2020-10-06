import * as React from 'react';
import * as _ from 'lodash';
import { BoxConfig, BoxType, isCircleBox } from 'src/characters';
import cx from 'classnames';
import 'src/editor/components/box/styles.scss';
import { Vector2 } from '@lawsumisu/common-utilities';

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

export function getCapsuleStyle(config: BoxConfig, origin: Vector2, s: number = 1): React.CSSProperties {
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

export default class Box extends React.PureComponent<BoxProps> {
  public static defaultProps = {
    scale: 1,
    persistent: false,
    type: BoxType.HURT,
    onMouseDown: _.noop,
    onMouseUp: _.noop
  };

  public render(): React.ReactNode {
    return (
      <div
        style={getCapsuleStyle(this.props.config, this.props.origin, this.props.scale)}
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
}
