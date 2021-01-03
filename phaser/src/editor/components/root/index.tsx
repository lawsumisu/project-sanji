import * as React from 'react';
import { DefinitionLoader, FrameDefinitionEditor, SpriteSheetLoader } from 'src/editor/components';
import 'src/editor/components/root/styles.scss';
import FrameDefinitionMapRenderer from 'src/editor/components/frameDefinitionMapRenderer';
import cx from 'classnames';
import { AppState } from 'src/editor/redux';
import { connect } from 'react-redux';

interface MappedStateProps {
  keys: string[];
}

const Header = ({ name, children }: { name: string; children?: React.ReactNode }) => (
  <div className="cn--section-header">
    <div className="section-header--name">{name}</div>
    {children}
  </div>
);

class Root extends React.PureComponent<MappedStateProps> {
  public static mapStateToProps(state: AppState): MappedStateProps {
    return {
      keys: Object.keys(state.frameData.definitionMap).sort()
    };
  }
  public render(): React.ReactNode {
    return (
      <div className="cn--root">
        <div className={cx('root--section', 'mod--animations')}>
          <Header name="Configuration"><SpriteSheetLoader/><DefinitionLoader/></Header>
          <FrameDefinitionMapRenderer keys={this.props.keys} className="cn--animations" />
        </div>
        <div className="root--section">
          <Header name="Frame Editor"/>
          <FrameDefinitionEditor />
        </div>
      </div>
    );
  }
}

export default connect(Root.mapStateToProps, null)(Root) as React.ComponentType;
