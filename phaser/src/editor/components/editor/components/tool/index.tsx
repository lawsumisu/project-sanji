import * as React from 'react';
import 'src/editor/components/editor/components/tool/styles.scss';

interface ToolOption {
  onSelect?: () => void;
  name: string;
}

interface ToolProps {
  options: ToolOption[];
}

interface ToolState {
  selectedOption: ToolOption;
}

export class Tool extends React.PureComponent<ToolProps, ToolState> {
  constructor(props: ToolProps) {
    super(props);
    this.state = {
      selectedOption: props.options[0]
    };
  }
  public render(): React.ReactNode {
    return (
      <div className="cn--tool">
        {this.state.selectedOption.onSelect ? (
          <input
            type="button"
            className="selection"
            onClick={this.state.selectedOption.onSelect}
            value={this.state.selectedOption.name}
          />
        ) : (
          <div className="selection">{this.state.selectedOption.name}</div>
        )}
        {this.props.options.length >= 2 &&
          this.props.options.map((option: ToolOption, index: number) => (
            <input
              key={index}
              type="button"
              className="option"
              onClick={this.getOnSelectFn(option)}
              value={option.name}
              disabled={option.name === this.state.selectedOption.name}
            />
          ))}
      </div>
    );
  }

  private getOnSelectFn(option: ToolOption) {
    return () => {
      option.onSelect && option.onSelect();
      this.setState({
        selectedOption: option
      });
    };
  }
}
