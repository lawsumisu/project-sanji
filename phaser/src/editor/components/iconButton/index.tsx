import * as React from 'react';
import * as _ from 'lodash';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import cx from 'classnames';
import 'src/editor/components/iconButton/styles.scss';

interface IconProps {
  hint?: string;
  disabled?: boolean;
}

export default class Icon extends React.PureComponent<FontAwesomeIconProps & IconProps> {
  public render(): React.ReactNode {
    const { className, hint, disabled, onClick, ...rest } = this.props;
    return (
      <div title={hint}>
        <FontAwesomeIcon
          className={cx('icon', disabled && 'mod--disabled', className)}
          onClick={!disabled ? onClick : _.noop}
          {...rest}
        />
      </div>
    );
  }
}
