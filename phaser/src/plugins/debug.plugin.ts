import * as Phaser from 'phaser';
import * as _ from 'lodash';
import { Vector2 } from '@lawsumisu/common-utilities';

export interface Drawable {
  draw: (plugin: DebugDrawPlugin) => void;
}

export function isDrawable(o: unknown): o is Drawable {
  return _.hasIn(o, 'draw') && _.isFunction((<{ draw: unknown }>o).draw);
}

enum ConfigType {
  LINE = 'LINE',
  RECT = 'RECT',
  CIRCLE = 'CIRCLE',
  CAPSULE = 'CAPSULE'
}

interface RectLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DebugOptions {
  lineColor: number;
  lineWidth: number;
  fill: {
    color?: number;
    alpha?: number;
  };
  persist: boolean;
}

interface DebugConfig extends DebugOptions {
  type: ConfigType;
}

interface LineConfig extends DebugConfig {
  type: ConfigType.LINE;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface RectConfig extends RectLike, DebugConfig {
  type: ConfigType.RECT;
}

interface CircleConfig extends DebugConfig {
  type: ConfigType.CIRCLE;
  x: number;
  y: number;
  r: number;
}

interface CapsuleConfig extends DebugConfig {
  type: ConfigType.CAPSULE;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  r: number;
}

function isRect(config: DebugConfig): config is RectConfig {
  return config.type === ConfigType.RECT;
}

function isLine(config: DebugConfig): config is LineConfig {
  return config.type === ConfigType.LINE;
}

function isCircle(config: DebugConfig): config is CircleConfig {
  return config.type === ConfigType.CIRCLE;
}

function isCapsule(config: DebugConfig): config is CapsuleConfig {
  return config.type === ConfigType.CAPSULE;
}

export class DebugDrawPlugin extends Phaser.Plugins.ScenePlugin {
  private graphics: Phaser.GameObjects.Graphics | null = null;
  private configs: DebugConfig[] = [];
  private persistentConfigs: DebugConfig[] = [];

  public boot(): void {
    this.systems.events
      .on('start', this.onSceneStart)
      .on('postupdate', this.onScenePostUpdate)
      .on('shutdown', this.onSceneShutdown)
      .once('destroy', this.onSceneDestroy);
  }

  public line(x1: number, y1: number, x2: number, y2: number, options: Partial<DebugOptions>): void {
    const { lineColor = 0xffffff, lineWidth = 1, persist } = options;
    const configs = persist ? this.persistentConfigs : this.configs;
    configs.push(<LineConfig>{ type: ConfigType.LINE, x1, y1, x2, y2, lineColor, lineWidth });
  }

  public rect(rect: RectLike, options: Partial<DebugOptions> = {}): void {
    const { x, y, width, height } = rect;
    const { lineColor = 0xffffff, lineWidth = 1, persist } = options;
    const configs = persist ? this.persistentConfigs : this.configs;
    configs.push(<RectConfig>{ type: ConfigType.RECT, x, y, width, height, lineColor, lineWidth });
  }

  public circle(circle: { x: number, y: number, r: number }, options: Partial<DebugOptions> = {}): void {
    const { lineColor = 0xffffff, fill, lineWidth = 1, persist } = options;
    const { x, y, r } = circle;
    const configs = persist ? this.persistentConfigs : this.configs;
    configs.push(<CircleConfig>{ type: ConfigType.CIRCLE, x, y, r, lineColor, lineWidth, fill });
  }

  public capsule(
    capsule: { x1: number; y1: number; x2: number; y2: number; r: number },
    options: Partial<DebugOptions> = {}
  ): void {
    const { x1, y1, x2, y2, r } = capsule;
    const { lineColor = 0xffffff, fill, lineWidth = 1, persist } = options;
    const configs = persist ? this.persistentConfigs : this.configs;
    configs.push(<CapsuleConfig>{ type: ConfigType.CAPSULE, x1, x2, y1, y2, r, lineColor, lineWidth, fill });
  }

  public clearPersist(): void {
    this.persistentConfigs = [];
  }

  private onSceneStart = (): void => {
    this.graphics = this.scene.add.graphics();
    this.graphics.depth = 100;
  };

  private onSceneShutdown = (): void => {
    if (this.graphics) {
      this.graphics.destroy();
    }
    this.graphics = null;
  };

  private onScenePostUpdate = (): void => {
    if (this.graphics) {
      this.graphics.clear();
      this.systems.displayList.bringToTop(this.graphics);
      this.persistentConfigs.forEach(config => this.drawGraphicFromConfig(config));
      this.configs.forEach(config => this.drawGraphicFromConfig(config));
      this.configs = [];
    }
  };

  private drawGraphicFromConfig(config: DebugConfig) {
    if (this.graphics) {
      this.graphics.lineStyle(config.lineWidth, config.lineColor);
      if (config.fill) {
        this.graphics.fillStyle(config.fill.color || 0xffffff, config.fill.alpha || 1);
      } else {
        this.graphics.fillStyle(0, 0);
      }
      if (isLine(config)) {
        this.graphics.strokeLineShape(new Phaser.Geom.Line(config.x1, config.y1, config.x2, config.y2));
      } else if (isRect(config)) {
        this.graphics.strokeRect(config.x, config.y, config.width, config.height);
      } else if (isCircle(config)) {
        const circle = new Phaser.Geom.Circle(config.x, config.y, config.r);
        if (config.fill) {
          this.graphics.fillCircleShape(circle);
        } else {
          this.graphics.strokeCircleShape(circle);
        }
      } else if (isCapsule(config)) {
        const majorAxis = new Vector2(config.x2, config.y2).subtract(new Vector2(config.x1, config.y1));
        const theta = Math.atan2(majorAxis.y, majorAxis.x);
        if (config.fill) {
          this.graphics.beginPath();
          this.graphics.arc(config.x1, config.y1, config.r, theta + Math.PI / 2, theta - Math.PI / 2);
          this.graphics.arc(config.x2, config.y2, config.r, theta - Math.PI / 2, theta + Math.PI / 2);
          this.graphics.fillPath();
        }
      }
    }
  }

  private onSceneDestroy = () => {
    this.systems.events
      .off('start', this.onSceneStart)
      .off('render', this.onScenePostUpdate)
      .off('shutdown', this.onSceneShutdown)
      .off('destroy', this.onSceneDestroy);
  };
}
