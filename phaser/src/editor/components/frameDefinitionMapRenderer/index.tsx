import * as React from 'react';
import { AppState } from 'src/editor/redux';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import { FrameDataState } from 'src/editor/redux/frameData';
import { FrameDefinitionItem } from 'src/editor/components/frameDefinitionMapRenderer/components/frameDefinitionItem';
import 'src/editor/components/frameDefinitionMapRenderer/styles.scss';

interface Props {
  keys: string[];
  className?: string;
}

interface ReduxStateMappedProps {
  frameData: FrameDataState;
}

class FrameDefinitionMapRenderer extends React.PureComponent<Props & ReduxStateMappedProps> {
  public static mapStateToProps(state: AppState): ReduxStateMappedProps {
    return { frameData: state.frameData };
  }

  public render(): React.ReactNode {
    return (
      <div className={this.props.className}>
        {this.props.keys
          .filter((key: string) => _.has(this.props.frameData.definitionMap, key))
          .map((key: string, i: number) => (
            <FrameDefinitionItem key={i} frameKey={key} frameData={this.props.frameData}/>
          ))}
      </div>
    );
  }
}

export default connect(FrameDefinitionMapRenderer.mapStateToProps, null)(FrameDefinitionMapRenderer);
