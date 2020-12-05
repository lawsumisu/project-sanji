import * as React from 'react';
import { AnimationRenderer } from 'src/editor/components';
import { FrameDataState } from 'src/editor/redux/frameData';
import FrameDefinitionRenderer from 'src/editor/components/frameDefinitionMapRenderer/components/frameDefinitionRenderer';

interface Props {
  frameKey: string;
  frameData: FrameDataState;
}

interface State {
  isOpen: boolean;
}
export class FrameDefinitionItem extends React.PureComponent<Props, State> {
  state = {
    isOpen: false
  };

  public render(): React.ReactNode {
    return (
      <div className="cn--frame-definition-item">
        <div className="frame-definition-item--tab">
          <div onClick={this.onClick} className="tab--name">{this.props.frameKey}</div>
          <AnimationRenderer frameData={this.props.frameData} frameKey={this.props.frameKey} />
        </div>
        {this.state.isOpen && (
          <FrameDefinitionRenderer
            definition={this.props.frameData.definitionMap[this.props.frameKey]}
            frameKey={this.props.frameKey}
          />
        )}
      </div>
    );
  }

  public onClick = () => {
    this.setState({
      isOpen: !this.state.isOpen,
    })
  }
}
