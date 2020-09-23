import * as Phaser from 'phaser';
import * as _ from 'lodash';
import { DebugDrawPlugin } from 'src/plugins/debug.plugin';
import { GameInputPlugin } from 'src/plugins/gameInput.plugin';
import { Collider, ColliderType, Hitbox, HitboxData, HurtboxData } from 'src/frame';
import { PS } from 'src/global';
import { Player } from 'src/player';

export class Stage extends Phaser.Scene {
  protected hitData: { [tag: string]: HitboxData } = {};
  protected hurtData: { [tag: string]: HurtboxData } = {};
  p1: Player;

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
    this.p1 = new Player();
    PS.stage = this;
  }

  public preload(): void {
    this.load.multiatlas('vanessa', 'assets/vanessa.json', 'assets');
  }

  public create(): void {
    this.cameras.main.setBounds(0, 0, 1500, 1200);
    this.p1.create();
  }

  public update(time: number, delta: number): void {
    this.draw();
    this.p1.update({ time, delta: delta / 1000 });
    this.updateHits();
  }

  private updateHits(): void {
    _.forEach(this.hitData, (hitboxData: HitboxData) => {
      hitboxData.data.forEach((hitbox: Hitbox<ColliderType.CIRCLE>) => {
        const { x, y, radius } = this.getColliderInWorldSpace(hitbox);
        this.debug.drawCircle(x, y, radius, {
          fill: {
            color: 0xff0000,
            alpha: 0.5
          }
        });
      });
    });
  }

  public addHitData(hit: HitboxData): void {
    if (!hit.isEmpty) {
      this.hitData[hit.tag] = hit;
    }
  }

  public removeHitData(tag: string): void {
    if (_.has(this.hitData, tag)) {
      delete this.hitData[tag];
    }
  }

  public get debug(): DebugDrawPlugin {
    return (<any>this.sys).debug;
  }

  public get gameInput(): GameInputPlugin {
    return (<any>this.sys).GI;
  }

  private draw(): void {
    // TODO
  }

  private getColliderInWorldSpace(item: Collider<ColliderType.CIRCLE>): Phaser.Geom.Circle {
    const p = this.p1.position; // TODO add gameObjects collection
    const { x, y, radius: r } = item.box;
    return new Phaser.Geom.Circle(x + p.x, y + p.y, r);
  }
}
