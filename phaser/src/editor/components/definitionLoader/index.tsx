import * as React from 'react';
import { FrameDefinitionMap } from 'src/characters/frameData';
import { bindActionCreators, Dispatch } from 'redux';
import { frameDataActionCreators } from 'src/editor/redux/frameData';
import { connect } from 'react-redux';
import 'src/editor/components/definitionLoader/styles.scss';
import cx from 'classnames';
import { Icon } from 'src/editor/components';

interface Props {
  className?: string;
}

interface DispatchMappedProps {
  actions: {
    loadDefinition: typeof frameDataActionCreators.loadDefinition,
  }
}

class DefinitionLoader extends React.PureComponent<Props & DispatchMappedProps> {
  private ref: HTMLInputElement | null = null;

  public static mapDispatchToProps(dispatch: Dispatch): DispatchMappedProps {
    return {
      actions: bindActionCreators({
        loadDefinition: frameDataActionCreators.loadDefinition,
      }, dispatch)
    }
  }

  public render(): React.ReactNode {
    return (
      <React.Fragment>
        <Icon className={cx('icon', this.props.className)} icon="file-code" size="lg" onClick={this.onClick} hint="Load Config File"/>
        <input ref={this.setRef} type="file" accept=".json" onChange={this.onChange} onClick={this.clear}/>
      </React.Fragment>
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
  };

  private clear = () => {
    if (this.ref) {
      this.ref.value = '';
    }
  };

  private setRef = (ref: HTMLInputElement | null): void => {
    this.ref = ref;
  };

  private onClick = (): void => {
    this.ref && this.ref.click();
  }

}

export const ReduxConnectedDefinitionLoader = connect(null, DefinitionLoader.mapDispatchToProps)(DefinitionLoader);