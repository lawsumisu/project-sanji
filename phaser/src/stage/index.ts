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
import { Vector2 } from '@lawsumisu/common-utilities';

export class Stage extends Phaser.Scene {
  protected hitData: { [tag: string]: HitboxData } = {};
  protected hurtData: { [tag: string]: HurtboxData } = {};
  private stageObjects: StageObject[] = [];
  p1: BaseCharacter;
  p2: StageObject;

  public ground = 0;

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
    this.p1 = new Aero();
    this.p2 = new Dummy();
    this.addStageObject(this.p1);
    this.addStageObject(this.p2);
    PS.stage = this;
  }

  public preload(): void {
    this.load.image('background', 'assets/stages/makoto.jpg');
    this.p1.preload();
  }

  public create(): void {
    const { width: bgWidth, height: bgHeight } = this.game.textures.get('background').source[0];
    this.cameras.main.setBounds(0, 0, bgWidth, bgHeight);
    this.add.image(bgWidth / 2, bgHeight / 2, 'background');
    this.ground = bgHeight - 32;
    this.p1.create();
    this.p1.position.x = bgWidth / 2;
    this.p2.position = new Vector2(400, this.ground - 25);
    this.cameras.main.setZoom(2);
  }

  public update(time: number, delta: number): void {
    this.draw();
    this.stageObjects.forEach((so: StageObject) => so.update({ time, delta: delta / 1000 }));
    this.updateHits();
    this.updateCamera();
  }

  public addStageObject(stageObject: StageObject): void {
    this.stageObjects.push(stageObject);
  }

  private updateCamera(): void {
    const camera = this.cameras.main;
    camera.scrollX = this.p1.position.x - camera.width / 2;
    camera.scrollY = this.p1.position.y - camera.height / 2 - 40;
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
                  const { x, y, radius: r } = hurtbox.transformBox(hurtOffset);
                  this.debug.drawCircle({ x, y, r }, {
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
          const { x, y, radius: r } = hitbox.transformBox(p);
          this.debug.drawCircle({ x, y, r }, hitboxOptions);
        } else if (hitbox.isCapsular()) {
          this.debug.drawCapsule(hitbox.transformBox(p), hitboxOptions);
        }
      });
    });

    _.forEach(this.hurtData, (hurtboxData: HurtboxData) => {
      const p = this.getStageObject(hurtboxData.owner).position;
      if (hurtboxData.owner !== this.p1.tag) {
        hurtboxData.data.forEach((hurtbox: Hurtbox) => {
          if (hurtbox.isCircular()) {
            const { x, y, radius: r } = hurtbox.transformBox(p);
            this.debug.drawCircle({ x, y, r } , hurtboxOptions);
          } else if (hurtbox.isCapsular()) {
            this.debug.drawCapsule(hurtbox.transformBox(p), hurtboxOptions);
          }
        });
      }
    });
  }

  private getStageObject(owner: string): StageObject {
    return this.stageObjects.find((so: StageObject) => so.tag === owner)!;
  }
}
