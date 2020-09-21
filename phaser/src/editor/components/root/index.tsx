import * as React from 'react';
import { Editor, FrameDefinitionMapDisplay } from 'src/editor/components';
import aero from 'src/characters/aero/frameData';
import 'src/editor/components/root/styles.scss';

export default class HitboxEditor extends React.PureComponent {
  private keys = Object.keys(aero).sort();

  public render(): React.ReactNode {
    return (
      <div className="cn--root">
        <FrameDefinitionMapDisplay keys={this.keys} />
        <Editor />
      </div>
    );
  }
}