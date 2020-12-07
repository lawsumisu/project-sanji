import * as React from 'react';
import { DefinitionLoader, FrameDefinitionEditor } from 'src/editor/components';
import 'src/editor/components/root/styles.scss';
import FrameDefinitionMapRenderer from 'src/editor/components/frameDefinitionMapRenderer';
import cx from 'classnames';
import { AppState } from 'src/editor/redux';
import { connect } from 'react-redux';

interface MappedStateProps {
  keys: string[];
}

class Root extends React.PureComponent<MappedStateProps> {
  public static mapStateToProps(state: AppState): MappedStateProps {
    return {
      keys: Object.keys(state.frameData.definitionMap).sort(),
    }
  }
  public render(): React.ReactNode {
    return (
      <div className="cn--root">
        <div className={cx("root--section", 'mod--animations')}>
          <div className="section--header">Animations<DefinitionLoader/></div>
          <FrameDefinitionMapRenderer keys={this.props.keys} className="cn--animations"/>
        </div>
        <div className="root--section">
          <div className="section--header">Frame Editor</div>
          <FrameDefinitionEditor />
        </div>
      </div>
    );
  }
}

export default connect(Root.mapStateToProps, null)(Root) as React.ComponentType;