import * as React from 'react';
import * as _ from 'lodash';
import { Icon } from 'src/editor/components';
import cx from 'classnames';
import { frameDataActionCreators } from 'src/editor/redux/frameData';
import { TextureDataTP } from 'src/assets';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';

interface Props {
  className?: string;
}

interface DispatchMappedProps {
  actions: {
    loadSpriteSheet: typeof frameDataActionCreators.loadSpriteSheet;
  };
}

interface State {
  texture: TextureDataTP | null;
}

class SpriteSheetLoader extends React.PureComponent<Props & DispatchMappedProps, State> {
  public state: State = { texture: null };

  private ref: HTMLInputElement | null;

  public static mapDispatchToProps(dispatch: Dispatch): DispatchMappedProps {
    return {
      actions: bindActionCreators(
        {
          loadSpriteSheet: frameDataActionCreators.loadSpriteSheet
        },
        dispatch
      )
    };
  }

  public render(): React.ReactNode {
    return (
      <React.Fragment>
        <Icon
          className={cx('icon', this.props.className)}
          icon="file-image"
          size="lg"
          onClick={this.onClick}
          hint="Load Sprite Sheet"
        />
        <input
          ref={this.setRef}
          type="file"
          accept=".json, .png"
          onChange={this.onLoadTexture}
          onClick={this.clear}
          multiple
        />
      </React.Fragment>
    );
  }

  private onLoadTexture = ({ target }: { target: HTMLInputElement }) => {
    if (target.files) {
      const textureFiles = [];
      const sourceFiles: File[] = [];
      for (let i = 0; i < target.files.length; ++i) {
        target.files[i].name.endsWith('.png') ? sourceFiles.push(target.files[i]) : textureFiles.push(target.files[i]);
      }
      textureFiles.forEach(f => this.loadSpriteSheet(f, sourceFiles));
    }
  };

  private loadSpriteSheet(file: File, sourceFiles: File[]) {
    this.readFile(file, textureFile => {
      const textureData = JSON.parse(textureFile as string).textures[0] as TextureDataTP;
      const imageFile = sourceFiles.find(f => f.name === textureData.image);
      if (imageFile) {
        this.readFile(imageFile, (source: string) => {
          const key = file.name.replace('.json', '');
          this.props.actions.loadSpriteSheet({ key, textureData, source });
          this.setState({ texture: null });
        });
      } else {
        alert(`Error while loading ${file.name}: Could not find image ${textureData.image}`);
      }
    });
  }

  private readFile(file: File, onload: (loadedFile: string | ArrayBuffer) => void): void {
    const fileReader = new FileReader();
    fileReader.onload = e => {
      if (e.target && e.target.result) {
        onload(e.target.result);
      }
    };
    file.name.endsWith('.png') ? fileReader.readAsDataURL(file) : fileReader.readAsText(file);
  }

  private onClick = () => {
    this.ref && this.ref.click();
  };

  private clear = () => {
    if (this.ref) {
      this.ref.value = '';
    }
  };

  private setRef = (ref: HTMLInputElement | null) => {
    this.ref = ref;
  };
}

export const ReduxConnectedSpriteSheetLoader = connect(null, SpriteSheetLoader.mapDispatchToProps)(SpriteSheetLoader);
