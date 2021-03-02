import * as React from 'react';
import cx from 'classnames';
import { BoxConfig, BoxType, PushboxConfig } from 'src/characters/frameData';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Props {
  hurtboxes: BoxConfig[];
  hitboxes: BoxConfig[];
  pushbox: PushboxConfig | null;
  onChangeHurtboxes: (hurtboxes: BoxConfig[]) => void;
  onChangeHitboxes: (hitboxes: BoxConfig[]) => void;
  onChangePushbox: (pushbox: PushboxConfig) => void;
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
        <div className="frame-info--header">Frame Definition</div>
        <div>
          <this.BoxConfigDisplay
            header="Hurtboxes"
            className="mod--hurt"
            boxes={this.props.hurtboxes}
            canPaste={this.state.hurtboxesToCopy.length > 0}
            type={BoxType.HURT}
          />
          <this.BoxConfigDisplay
            header="Hitboxes"
            className="mod--hit"
            boxes={this.props.hitboxes}
            canPaste={this.state.hitboxesToCopy.length > 0}
            type={BoxType.HIT}
          />
          <div className={cx('frame-info--boxes', 'mod--push')}>
            <div className="boxes--header">
              Pushbox
              <div className="cn--header-btns">
                <FontAwesomeIcon icon={['far', 'clipboard']} className="header--btn" />
                <FontAwesomeIcon
                  icon="notes-medical"
                  className={cx('header--btn', !this.state.pushboxToCopy && 'mod--disabled')}
                  onClick={this.getOnReplaceFn(BoxType.PUSH, !!this.state.pushboxToCopy)}
                />
              </div>
            </div>
            <div className="boxes--info">
              {this.props.pushbox ? (
                <span className="info--box mod--push" onClick={this.getOnCopyItemFn(BoxType.PUSH, 0)}>
                <span>{stringify(this.props.pushbox)}</span>
                <FontAwesomeIcon className="box--icon" icon="copy" />
              </span>
              ) : (
                <span>No Pushbox Set</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  BoxConfigDisplay = ({
    header,
    className,
    boxes,
    type,
    canPaste = false
  }: {
    boxes: BoxConfig[];
    header: string;
    className?: string;
    canPaste: boolean;
    type: BoxType;
  }) => (
    <div className={cx('frame-info--boxes', className)}>
      <div className="boxes--header">
        {header}
        <div className="cn--header-btns">
          <FontAwesomeIcon icon={['far', 'clipboard']} className="header--btn" />
          <FontAwesomeIcon
            icon="paste"
            className={cx('header--btn', !canPaste && 'mod--disabled')}
            onClick={this.getOnAppendFn(type, canPaste)}
          />
          <FontAwesomeIcon
            icon="notes-medical"
            className={cx('header--btn', !canPaste && 'mod--disabled')}
            onClick={this.getOnReplaceFn(type, canPaste)}
          />
        </div>
      </div>
      <div className="boxes--info">
        {boxes.length > 0 ? (
          <>
            <span>[</span>
            {boxes.map((config, i) => (
              <span key={i} className="info--box" onClick={this.getOnCopyItemFn(type, i)}>
                <span>{stringify(config)}</span>
                <span>{i < boxes.length - 1 ? ',' : ''}</span>
                <FontAwesomeIcon className="box--icon" icon="copy" />
              </span>
            ))}
            <span>]</span>
          </>
        ) : (
          <span>No Boxes Set</span>
        )}
      </div>
    </div>
  );

  private getOnCopyItemFn(type: BoxType, i: number) {
    return () => {
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

  private getOnAppendFn(type: BoxType, canPaste: boolean) {
    switch (type) {
      case BoxType.HURT: {
        return () => {
          if (canPaste) {
            this.props.onChangeHurtboxes([...this.props.hurtboxes, ...this.state.hurtboxesToCopy]);
          }
        };
      }
      case BoxType.HIT: {
        return () => {
          if (canPaste) {
            this.props.onChangeHitboxes([...this.props.hitboxes, ...this.state.hitboxesToCopy]);
          }
        };
      }
      case BoxType.PUSH: {
        return () => {
          if (canPaste && this.state.pushboxToCopy) {
            this.props.onChangePushbox(this.state.pushboxToCopy);
          }
        };
      }
    }
  }

  private getOnReplaceFn(type: BoxType, canPaste: boolean) {
    switch (type) {
      case BoxType.HURT: {
        return () => {
          if (canPaste) {
            this.props.onChangeHurtboxes([...this.state.hurtboxesToCopy]);
          }
        };
      }
      case BoxType.HIT: {
        return () => {
          if (canPaste) {
            this.props.onChangeHitboxes([...this.state.hitboxesToCopy]);
          }
        };
      }
      case BoxType.PUSH: {
        return () => {
          if (canPaste && this.state.pushboxToCopy) {
            this.props.onChangePushbox(this.state.pushboxToCopy);
          }
        };
      }
    }
  }
}
