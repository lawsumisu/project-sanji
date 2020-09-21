import * as React from 'react';
import * as _ from 'lodash';
import { HitboxConfig } from 'src/characters';
import cx from 'classnames';
import 'src/editor/components/box/styles.scss';
import { Vector2 } from '@lawsumisu/common-utilities';

export enum BoxType {
  HIT = 'HIT',
  HURT = 'HURT'
}

interface BoxProps {
  scale: number;
  persistent: boolean;
  type: BoxType;
  origin: Vector2;
  config: HitboxConfig;
  className?: string;
  onMouseDown: () => void;
  onMouseUp: () => void;
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
    const { origin, scale: s } = this.props;
    const { x, y, r } = this.props.config;
    const style = { width: r * 2 * s, height: r * 2 * s, left: (x + origin.x - r) * s, top: (y + origin.y - r ) * s };
    return (
      <div
        style={style}
        className={cx(
          'box',
          'mod--circle',
          this.props.persistent && 'mod--persistant',
          this.props.type === BoxType.HIT ? 'mod--hit' : 'mod--hurt',
          this.props.className,
        )}
        onMouseDown={this.props.onMouseDown}
        onMouseUp={this.props.onMouseUp}
      />
    );
  }
}