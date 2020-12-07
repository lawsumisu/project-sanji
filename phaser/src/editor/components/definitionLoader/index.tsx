import * as React from 'react';
import { FrameDefinitionMap } from 'src/characters/frameData';
import { bindActionCreators, Dispatch } from 'redux';
import { frameDataActionCreators } from 'src/editor/redux/frameData';
import { connect } from 'react-redux';

interface DispatchMappedProps {
  actions: {
    loadDefinition: typeof frameDataActionCreators.loadDefinition,
  }
}

class DefinitionLoader extends React.PureComponent<DispatchMappedProps> {
  public static mapDispatchToProps(dispatch: Dispatch): DispatchMappedProps {
    return {
      actions: bindActionCreators({
        loadDefinition: frameDataActionCreators.loadDefinition,
      }, dispatch)
    }
  }
  public render(): React.ReactNode {
    return (
      <div>
        <input type="file" accept=".json" onChange={this.onChange}/>
      </div>
    )
  }

  private onChange = ({ target }: { target: HTMLInputElement }) => {
    const fileReader = new FileReader();
    fileReader.onload = (e => {
      if (e.target && e.target.result) {
        this.props.actions.loadDefinition(JSON.parse(e.target.result as string) as FrameDefinitionMap);
      }
    });
    fileReader.readAsText(target.files![0])
  }
}

export const ReduxConnectedDefinitionLoader = connect(null, DefinitionLoader.mapDispatchToProps)(DefinitionLoader);