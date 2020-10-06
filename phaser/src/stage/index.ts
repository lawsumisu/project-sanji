import * as Phaser from 'phaser';
import * as _ from 'lodash';
import { DebugDrawPlugin } from 'src/plugins/debug.plugin';
import { GameInputPlugin } from 'src/plugins/gameInput.plugin';
import { Collider, HitboxData, Hurtbox, HurtboxData } from 'src/collider';
import { PS } from 'src/global';
import { BaseCharacter } from 'src/characters';
import { StageObject } from 'src/stage/stageObject';
import { Dummy } from 'src/characters/dummy';
import Aero from 'src/characters/aero/aero.character';

export class Stage extends Phaser.Scene {
  protected hitData: { [tag: string]: HitboxData } = {};
  protected hurtData: { [tag: string]: HurtboxData } = {};
  private stageObjects: StageObject[] = [];
  p1: BaseCharacter;

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
    this.p1 = new Aero();
    this.addStageObject(this.p1);
    this.addStageObject(new Dummy());
    PS.stage = this;
  }

  public preload(): void {
    this.p1.preload();
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
        if (!hitboxData.hasCollided(hurtboxData) && hitboxData.owner !== hurtboxData.owner) {
          const hitOffset = this.getStageObject(hitboxData.owner).position;
          const hurtOffset = this.getStageObject(hurtboxData.owner).position;
          for (let hitbox of hitboxData.data) {
            for (const hurtbox of hurtboxData.data) {
              if (Collider.checkCollision(hitbox, hurtbox, { offset1: hitOffset, offset2: hurtOffset })) {
                hitboxData.registerCollision(hurtboxData);
                // TODO handle hits
                const hurtObject = this.getStageObject(hurtboxData.owner);
                hurtObject.applyHit(hitbox.hit);
                this.p1.onTargetHit(hurtObject, hitbox.hit);
                if (hurtbox.isCircular()) {
                  const { x, y, radius } = hurtbox.transformBox(hurtOffset);
                  this.debug.drawCircle(x, y, radius, {
                    fill: {
                      color: 0xffff00,
                      alpha: 0.6
                    }
                  });
                }
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
    const hitboxOptions = {
      fill: {
        color: 0xff0000,
        alpha: 0.5
      }
    };
    const hurtboxOptions = {
      fill: {
        color: 0x00ffff,
        alpha: 0.5
      }
    };
    _.forEach(this.hitData, (hitboxData: HitboxData) => {
      const p = this.getStageObject(hitboxData.owner).position;
      hitboxData.data.forEach((hitbox: Collider) => {
        if (hitbox.isCircular()) {
          const { x, y, radius } = hitbox.transformBox(p);
          this.debug.drawCircle(x, y, radius, hitboxOptions);
        } else if (hitbox.isCapsular()) {
          this.debug.drawCapsule(hitbox.transformBox(p), hitboxOptions);
        }
      });
    });

    _.forEach(this.hurtData, (hurtboxData: HurtboxData) => {
      const p = this.getStageObject(hurtboxData.owner).position;
      hurtboxData.data.forEach((hurtbox: Hurtbox) => {
        if (hurtbox.isCircular()) {
          const { x, y, radius } = hurtbox.transformBox(p);
          this.debug.drawCircle(x, y, radius, hurtboxOptions);
        } else if (hurtbox.isCapsular()) {
          this.debug.drawCapsule(hurtbox.transformBox(p), hurtboxOptions);
        }
      });
    });
  }

  private getStageObject(owner: string): StageObject {
    return this.stageObjects.find((so: StageObject) => so.tag === owner)!;
  }
}
