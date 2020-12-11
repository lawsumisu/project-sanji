import * as React from 'react';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import cx from 'classnames';
import 'src/editor/components/iconButton/styles.scss'

export default class Icon extends React.PureComponent<FontAwesomeIconProps & { hint?: string; }> {
  public render(): React.ReactNode {
    const { className, hint, ...rest} = this.props;
    return (
      <div title={hint}>
        <FontAwesomeIcon className={cx('icon', className)}{...rest} />
      </div>
    )
  }
}