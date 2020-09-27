import * as React from 'react';
import { CapsuleBoxConfig } from 'src/characters';
import Box, { BoxProps, BoxType } from 'src/editor/components/box';
import * as _ from 'lodash';
import 'src/editor/components/editor/styles.scss';
import { Vector2 } from '@lawsumisu/common-utilities';

enum SelectionType {
  HANDLE_1 = 'HANDLE_1',
  HANDLE_2 = 'HANDLE_2',
  BOX = 'BOX'
}

interface CapsuleProps extends BoxProps {
  config: CapsuleBoxConfig;
  onChange: (capsule: { x1: number; x2: number; y1: number; y2: number; r: number }) => void;
}

interface CapsuleState {
  selection: { selectionType: SelectionType; offset: Vector2 } | null;
}
export default class EditableCapsuleBox extends React.PureComponent<CapsuleProps, CapsuleState> {
  public static defaultProps = {
    scale: 1,
    persistent: false,
    type: BoxType.HURT,
    onMouseDown: _.noop,
    onMouseUp: _.noop,
    onChange: _.noop
  };

  public state: CapsuleState = {
    selection: null
  };

  private ref: HTMLDivElement | null = null;

  public render(): React.ReactNode {
    const {
      scale,
      config: { x1, y1, x2, y2, r }
    } = this.props;
    const handleRadius = Math.min(r / 2, 3);
    return (
      <div className="cn--capsule-box" ref={this.setRef} onMouseMove={this.onMouseMove} onMouseUp={this.onMouseUp}>
        <Box {...this.props} onMouseDown={this.getOnSelectFn(SelectionType.BOX)}/>
        <Box
          origin={this.props.origin}
          config={{ x: x1, y: y1, r: handleRadius }}
          scale={scale}
          className="capsule-handle"
          onMouseDown={this.getOnSelectFn(SelectionType.HANDLE_1)}
        />
        <Box
          origin={this.props.origin}
          config={{ x: x2, y: y2, r: handleRadius }}
          scale={scale}
          className="capsule-handle"
          onMouseDown={this.getOnSelectFn(SelectionType.HANDLE_2)}
        />
      </div>
    );
  }

  private onMouseMove = (e: React.MouseEvent): void => {
    if (this.ref && this.state.selection) {
      const { selectionType, offset } = this.state.selection;
      const s = this.props.scale ** 2;
      const o = new Vector2(e.clientX, e.clientY)
        .subtract(new Vector2(this.ref.offsetLeft, this.ref.offsetTop))
        .scale(1 / this.props.scale)
        .subtract(offset)
        .subtract(this.props.origin);
      const newCapsule = { ...this.props.config };
      const nx = Math.round(o.x * s) / s;
      const ny = Math.round(o.y * s) / s;
      switch (selectionType) {
        case SelectionType.HANDLE_1: {
          newCapsule.x1 = nx;
          newCapsule.y1 = ny;
          break;
        }
        case SelectionType.HANDLE_2: {
          newCapsule.x2 = nx;
          newCapsule.y2 = ny;
          break;
        }
        case SelectionType.BOX: {
          const oldX = (newCapsule.x1 + newCapsule.x2) / 2;
          const oldY = (newCapsule.y1 + newCapsule.y2) / 2;
          newCapsule.x1 += nx - oldX;
          newCapsule.x2 += nx - oldX;
          newCapsule.y1 += ny - oldY;
          newCapsule.y2 += ny - oldY;
          break;
        }
      }
      this.props.onChange(newCapsule);
    }
  };

  private getOnSelectFn(selectionType: SelectionType) {
    return (e: React.MouseEvent) => {
      if (this.ref && _.isNil(this.state.selection)) {
        e.stopPropagation();
        let bx, by;
        const { x1, y1, x2, y2 } = this.props.config;
        switch (selectionType) {
          case SelectionType.HANDLE_1: {
            bx = this.props.config.x1;
            by = this.props.config.y1;
            break;
          }
          case SelectionType.HANDLE_2: {
            bx = this.props.config.x2;
            by = this.props.config.y2;
            break;
          }
          case SelectionType.BOX: {
            bx = (x1 + x2) / 2;
            by = (y1 + y2) / 2;
            break;
          }
        }
        const origin = this.props.origin;
        const x = (e.clientX - this.ref.offsetLeft) / this.props.scale - bx - origin.x;
        const y = (e.clientY - this.ref.offsetTop) / this.props.scale - by - origin.y;
        this.setState({
          selection: { selectionType, offset: new Vector2(x, y) }
        });
      }
    };
  }

  private onMouseUp = (): void => {
    this.setState({
      selection: null
    });
  };

  private setRef = (ref: HTMLDivElement | null) => {
    this.ref = ref;
  };
}
