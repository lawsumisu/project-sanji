import * as Phaser from 'phaser';
import * as _ from 'lodash';
import { DebugDrawPlugin } from 'src/plugins/debug.plugin';
import { GameInputPlugin } from 'src/plugins/gameInput.plugin';
import { Collider, ColliderType, Hitbox, HitboxData, Hurtbox, HurtboxData } from 'src/frame';
import { PS } from 'src/global';
import { Player } from 'src/player';
import { StageObject } from 'src/stage/stageObject';
import { Dummy } from 'src/characters/dummy';

export class Stage extends Phaser.Scene {
  protected hitData: { [tag: string]: HitboxData } = {};
  protected hurtData: { [tag: string]: HurtboxData } = {};
  private stageObjects: StageObject[] = [];
  p1: Player;

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
    this.p1 = new Player();
    this.stageObjects.push(this.p1);
    this.stageObjects.push(new Dummy());
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
    this.stageObjects.forEach((so: StageObject) => so.update({ time, delta: delta / 1000 }));
    this.updateHits();
  }

  public addStageObject(stageObject: StageObject): void {
    this.stageObjects.push(stageObject);
  }

  private updateHits(): void {
    _.forEach(this.hitData, (hitboxData: HitboxData) => {
      _.forEach(this.hurtData, (hurtboxData: HurtboxData) => {
        if (!hitboxData.hasCollided(hurtboxData)) {
          for (let hitbox of hitboxData.data) {
            for (const hurtbox of hurtboxData.data) {
              const hit = this.getColliderInWorldSpace(hitbox as Hitbox<ColliderType.CIRCLE>, hitboxData.owner);
              const hurt = this.getColliderInWorldSpace(hurtbox as Hurtbox<ColliderType.CIRCLE>, hurtboxData.owner);
              if (Phaser.Geom.Intersects.CircleToCircle(hit, hurt)) {
                hitboxData.registerCollision(hurtboxData);
                // TODO handle hits
                const hurtObject = this.getStageObject(hurtboxData.owner);
                hurtObject.applyHit(hitbox.hit);
                this.p1.onTargetHit(hurtObject, hitbox.hit);
                const { x, y, radius } = hurt;
                this.debug.drawCircle(x, y, radius, {
                  fill: {
                    color: 0xffff00,
                    alpha: 0.6
                  }
                });
                break;
              }
            }
            if (hitboxData.hasCollided(hurtboxData)) {
              break;
            }
          }
        }
      });
    });
  }

  public addHitboxData(hit: HitboxData): void {
    if (!hit.isEmpty) {
      this.hitData[hit.tag] = hit;
    }
  }

  public removeHitboxData(tag: string): void {
    if (_.has(this.hitData, tag)) {
      delete this.hitData[tag];
    }
  }

  public addHurtboxData(hurt: HurtboxData): void {
    if (!hurt.isEmpty) {
      console.log(hurt);
      this.hurtData[hurt.tag] = hurt;
    }
  }

  public removeHurtboxData(tag: string): void {
    if (_.has(this.hurtData, tag)) {
      delete this.hurtData[tag];
    }
  }

  public get debug(): DebugDrawPlugin {
    return (<any>this.sys).debug;
  }

  public get gameInput(): GameInputPlugin {
    return (<any>this.sys).GI;
  }

  private draw(): void {
    _.forEach(this.hitData, (hitboxData: HitboxData) => {
      hitboxData.data.forEach((hitbox: Hitbox<ColliderType.CIRCLE>) => {
        const {x, y, radius} = this.getColliderInWorldSpace(hitbox, hitboxData.owner);
        this.debug.drawCircle(x, y, radius, {
          fill: {
            color: 0xff0000,
            alpha: 0.5
          }
        });
      });
    });

    _.forEach(this.hurtData, (hurtboxData: HurtboxData) => {
      hurtboxData.data.forEach((hurtbox: Hurtbox<ColliderType.CIRCLE>) => {
        const {x, y, radius} = this.getColliderInWorldSpace(hurtbox, hurtboxData.owner);
        this.debug.drawCircle(x, y, radius, {
          fill: {
            color: 0x00ffff,
            alpha: 0.5
          }
        });
      });
    });
  }

  private getStageObject(owner: string): StageObject {
    return this.stageObjects.find((so: StageObject) => so.tag === owner)!;
  }

  private getColliderInWorldSpace(item: Collider<ColliderType.CIRCLE>, owner: string): Phaser.Geom.Circle {
    const p = this.getStageObject(owner).position;
    const { x, y, radius: r } = item.box;
    return new Phaser.Geom.Circle(x + p.x, y + p.y, r);
  }
}
