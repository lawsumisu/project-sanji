import * as React from 'react';
import { BoxConfig } from 'src/characters';
import cx from 'classnames';

interface Props {
  hurtboxes: BoxConfig[];
  hitboxes: BoxConfig[];
}

function stringify(o: any): string {
  const s = JSON.stringify(o, null, 2);
  return s.replace(/,\s+"/g, ', "').replace(/{\s+/g, '{ ').replace(/\s+}/g, ' }');
}

export class FrameInfo extends React.PureComponent<Props> {
  public render(): React.ReactNode {
    return (
      <div className="cn--frame-info">
        {this.props.hurtboxes.length > 0 && (
          <div className={cx("frame-info--boxes", 'mod--hurt')}>
            <div className="boxes--header">Hurtboxes</div>
            <div className="boxes--info">{stringify(this.props.hurtboxes)}</div>
          </div>
        )}
        {this.props.hitboxes.length > 0 && (
          <div className={cx('frame-info--boxes', 'mod--hit')}>
            <div className="boxes--header">Hitboxes</div>
            <div className="boxes--info">{stringify(this.props.hitboxes)}</div>
          </div>
        )}
      </div>
    );
  }
}
