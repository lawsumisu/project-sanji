import * as React from 'react';
import * as _ from 'lodash';
import { Icon } from 'src/editor/components';
import cx from 'classnames';
import { frameDataActionCreators } from 'src/editor/redux/frameData';
import { TextureDataTP } from 'src/assets';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';

interface Props {
  className?: string
}

interface DispatchMappedProps {
  actions: {
    loadSpriteSheet: typeof frameDataActionCreators.loadSpriteSheet,
  }
}

interface State {
  texture: TextureDataTP | null
}

class SpriteSheetLoader extends React.PureComponent<Props & DispatchMappedProps, State> {
  public state: State = { texture: null };

  private sourceRef: HTMLInputElement | null;
  private textureRef: HTMLInputElement | null;

  public static mapDispatchToProps(dispatch: Dispatch): DispatchMappedProps {
    return {
      actions: bindActionCreators({
        loadSpriteSheet: frameDataActionCreators.loadSpriteSheet,
      }, dispatch)
    }
  }

  public render(): React.ReactNode {
    return (
      <React.Fragment>
        <Icon className={cx('icon', this.props.className)} icon="file-image" size="lg" onClick={this.onClick} hint="Load Sprite Sheet"/>
        <input ref={this.getSetRefFn('textureRef')} type="file" accept=".json" onChange={this.onLoadTexture} onClick={this.clear}/>
        <input ref={this.getSetRefFn('sourceRef')} type="file" accept=".png" onChange={this.onLoadSource} onClick={this.clear}/>
      </React.Fragment>
    )
  }

  private onLoadTexture = ({ target }: { target: HTMLInputElement }) => {
    const fileReader = new FileReader();
    fileReader.onload = (e => {
      if (e.target && e.target.result) {
        this.setState({ texture: (JSON.parse(e.target.result as string).textures[0]) as TextureDataTP});
        this.sourceRef && this.sourceRef.click();
      }
    });
    fileReader.readAsText(target.files![0])
  };

  private onLoadSource = ({ target }: { target: HTMLInputElement }) => {
    const fileReader = new FileReader();
    fileReader.onload = (e => {
      if (e.target && e.target.result) {
        if (!_.isNil(this.state.texture)) {
          const key = target.files![0].name.replace('.png', '');
          this.props.actions.loadSpriteSheet({ key, textureData: this.state.texture!, source: e.target.result as string });
          this.setState({ texture: null });
        }
      }
    });
    fileReader.readAsDataURL(target.files![0])
  };

  private onClick = () => {
    this.textureRef && this.textureRef.click();
  };

  private clear = () => {
    [this.sourceRef, this.textureRef].forEach(ref => {
      if (ref) {
        ref.value = '';
      }
    });
  };

  private getSetRefFn(key: 'sourceRef' | 'textureRef') {
    return (ref: HTMLInputElement | null) => {
      this[key] = ref;
    }
  }
}

export const ReduxConnectedSpriteSheetLoader = connect(null, SpriteSheetLoader.mapDispatchToProps)(SpriteSheetLoader);