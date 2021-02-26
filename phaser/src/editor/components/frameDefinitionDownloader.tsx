import * as React from 'react';
import { Icon } from 'src/editor/components/index';
import { FrameDataState } from 'src/editor/redux/frameData';
import { connect } from 'react-redux';
import { AppState } from 'src/editor/redux';
import { saveAs } from 'file-saver';

interface StateMappedProps {
  frameData: FrameDataState;
}

class FrameDefinitionDownloader extends React.PureComponent<StateMappedProps> {
  public static mapStateToProps(state: AppState): StateMappedProps {
    return { frameData: state.frameData };
  }
  public render(): React.ReactNode {
    return (
      <Icon
        className="icon"
        icon="file-download"
        size="lg"
        onClick={this.onClick}
        hint="Download Config"
        disabled={!this.enabled}
      />
    );
  }

  private onClick = (): void => {
    const { definitionMap, filename} = this.props.frameData;
    var data = definitionMap;
    var fileName = filename;

    // Create a blob of the data
    var fileToSave = new Blob([JSON.stringify(data, undefined, 2)], {
      type: 'application/json'
    });

    // Save the file
    saveAs(fileToSave, fileName);
  };

  private get enabled(): boolean {
    return !!this.props.frameData.filename;
  }
}

export const ReduxConnectedFrameDefinitionDownloader = connect(
  FrameDefinitionDownloader.mapStateToProps,
  null
)(FrameDefinitionDownloader);
