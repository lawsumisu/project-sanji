import 'src/editor/components/box/styles.scss';
import { BoxType } from 'src/characters/frameData';
import { Vector2 } from '@lawsumisu/common-utilities';
export { default as PushboxPreview } from 'src/editor/components/box/components/pushboxPreview';
export { default as HboxPreview } from 'src/editor/components/box/components/hboxPreview';

export interface BoxPreviewProps<T> {
  scale: number;
  persistent: boolean;
  editable: boolean;
  type: BoxType;
  origin: Vector2;
  className?: string;
  config: T
  initialDragOrigin?: Vector2;
  onChange: (config: T) => void;
}

export interface BoxPreviewState<T> {
  dragOrigin: Vector2 | null;
  originalConfig: BoxPreviewProps<T>['config'] | null;
}