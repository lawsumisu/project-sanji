import * as React from 'react';
import { CapsuleBoxConfig } from 'src/characters/frameData';
import Box, { BoxProps } from 'src/editor/components/box';
import * as _ from 'lodash';
import 'src/editor/components/frameDefinitionEditor/styles.scss';

export enum SelectionType {
  HANDLE_1 = 'HANDLE_1',
  HANDLE_2 = 'HANDLE_2',
  BOX = 'BOX'
}

interface CapsuleProps extends BoxProps {
  config: CapsuleBoxConfig;
  onSelect: (e: React.MouseEvent, selectionType: SelectionType) => void;
}

export default class EditableCapsuleBox extends React.PureComponent<CapsuleProps> {
  public static defaultProps = {
    scale: 1,
    persistent: false,
    onMouseDown: _.noop,
    onMouseUp: _.noop,
  };

  public render(): React.ReactNode {
    const {
      scale,
      config: { x1, y1, x2, y2, r }
    } = this.props;
    const handleRadius = Math.min(r / 2, 3);
    return (
      <div className="cn--capsule-box">
        <Box {...this.props} onMouseDown={this.getOnMouseDownFn(SelectionType.BOX)} />
        <Box
          origin={this.props.origin}
          config={{ x: x1, y: y1, r: handleRadius }}
          scale={scale}
          className="capsule-handle"
          onMouseDown={this.getOnMouseDownFn(SelectionType.HANDLE_1)}
        />
        <Box
          origin={this.props.origin}
          config={{ x: x2, y: y2, r: handleRadius }}
          scale={scale}
          className="capsule-handle"
          onMouseDown={this.getOnMouseDownFn(SelectionType.HANDLE_2)}
        />
      </div>
    );
  }

  private getOnMouseDownFn(selectionType: SelectionType) {
    return (e: React.MouseEvent) => {
      this.props.onSelect(e, selectionType);
    };
  }
}
