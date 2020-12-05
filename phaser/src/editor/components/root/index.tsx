import * as React from 'react';
import { Editor } from 'src/editor/components';
import aero from 'src/characters/aero/frameData';
import 'src/editor/components/root/styles.scss';
import FrameDefinitionMapRenderer from 'src/editor/components/frameDefinitionMapRenderer';

export default class HitboxEditor extends React.PureComponent {
  private keys = Object.keys(aero).sort();

  public render(): React.ReactNode {
    return (
      <div className="cn--root">
        <div className="root--section">
          Animations
          <FrameDefinitionMapRenderer keys={this.keys} className="cn--animations"/>
        </div>
        <Editor />
      </div>
    );
  }
}