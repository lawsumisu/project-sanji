import * as React from 'react';
import { FrameDefinitionEditor } from 'src/editor/components';
import aero from 'src/characters/aero/frameData';
import 'src/editor/components/root/styles.scss';
import FrameDefinitionMapRenderer from 'src/editor/components/frameDefinitionMapRenderer';
import cx from 'classnames';

export default class Editor extends React.PureComponent {
  private keys = Object.keys(aero).sort();

  public render(): React.ReactNode {
    return (
      <div className="cn--root">
        <div className={cx("root--section", 'mod--animations')}>
          <div className="section--header">Animations</div>
          <FrameDefinitionMapRenderer keys={this.keys} className="cn--animations"/>
        </div>
        <div className="root--section">
          <div className="section--header">Frame Editor</div>
          <FrameDefinitionEditor />
        </div>
      </div>
    );
  }
}