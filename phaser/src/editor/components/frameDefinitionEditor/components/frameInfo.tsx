import * as React from 'react';
import cx from 'classnames';
import { BoxConfig, BoxType, PushboxConfig } from 'src/characters/frameData';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Props {
  hurtboxes: BoxConfig[];
  hitboxes: BoxConfig[];
  pushbox: PushboxConfig | null;
}

interface State {
  hitboxesToCopy: BoxConfig[];
  hurtboxesToCopy: BoxConfig[];
  pushboxToCopy: PushboxConfig | null;
}

function stringify(o: any): string {
  const s = JSON.stringify(o, null, 2);
  return s
    .replace(/,\s+"/g, ', "')
    .replace(/{\s+/g, '{ ')
    .replace(/\s+}/g, ' }');
}

export class FrameInfo extends React.PureComponent<Props, State> {
  public state: State = {
    hitboxesToCopy: [],
    hurtboxesToCopy: [],
    pushboxToCopy: null
  };

  public render(): React.ReactNode {
    return (
      <div className="cn--frame-info">
        <div>Frame Definition</div>
        <div>
          {this.props.hurtboxes.length > 0 && (
            <this.BoxConfigDisplay
              header="Hurtboxes"
              className="mod--hurt"
              boxes={this.props.hurtboxes}
              canPaste={this.state.hurtboxesToCopy.length > 0}
              onCopyEntry={this.getOnCopyFn(BoxType.HURT)}
            />
          )}
          {this.props.hitboxes.length > 0 && (
            <this.BoxConfigDisplay
              header="Hitboxes"
              className="mod--hit"
              boxes={this.props.hitboxes}
              canPaste={this.state.hitboxesToCopy.length > 0}
              onCopyEntry={this.getOnCopyFn(BoxType.HIT)}
            />
          )}
          {this.props.pushbox && (
            <div className={cx('frame-info--boxes', 'mod--push')}>
              <div className="boxes--header">Pushbox</div>
              <div className="boxes--info">{stringify(this.props.pushbox)}</div>
            </div>
          )}
        </div>
      </div>
    );
  }
  BoxConfigDisplay = class extends React.PureComponent<{
    boxes: BoxConfig[];
    header: string;
    className?: string;
    canPaste: boolean;
    onCopyEntry: (index: number) => void;
  }> {
    public static defaultProps = {
      canPaste: false
    };

    public render(): React.ReactNode {
      const { boxes, header, className, canPaste } = this.props;
      return (
        <div className={cx('frame-info--boxes', className)}>
          <div className="boxes--header">
            {header}
            <div className="cn--header-btns">
              <FontAwesomeIcon icon={['far', 'clipboard']} className="header--btn" />
              <FontAwesomeIcon icon="paste" className={cx('header--btn', !canPaste && 'mod--disabled')} />
              <FontAwesomeIcon icon="notes-medical" className={cx('header--btn', !canPaste && 'mod--disabled')} />
            </div>
          </div>
          <div className="boxes--info">
            <span>[</span>
            {boxes.map((config, i) => (
              <span key={i} className="info--box" onClick={this.getOnCopyFn(i)}>
                <span>{stringify(config)}</span>
                <span>{i < boxes.length - 1 ? ',' : ''}</span>
                <FontAwesomeIcon className="box--icon" icon="copy" />
              </span>
            ))}
            <span>]</span>
          </div>
        </div>
      );
    }

    getOnCopyFn(index: number) {
      return () => {
        this.props.onCopyEntry(index);
      };
    }
  };

  getOnCopyFn(type: BoxType) {
    return (i: number) => {
      console.log('copying', type, i);
      switch (type) {
        case BoxType.HURT: {
          this.setState({
            hurtboxesToCopy: [this.props.hurtboxes[i]]
          });
          break;
        }
        case BoxType.HIT: {
          this.setState({
            hitboxesToCopy: [this.props.hitboxes[i]]
          });
          break;
        }
        case BoxType.PUSH: {
          this.setState({
            pushboxToCopy: this.props.pushbox
          });
          break;
        }
      }
    };
  }
}
