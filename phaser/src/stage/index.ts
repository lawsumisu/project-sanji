import * as Phaser from 'phaser';
import * as _ from 'lodash';
import { DebugDrawPlugin } from 'src/plugins/debug.plugin';
import { GameInputPlugin } from 'src/plugins/gameInput.plugin';
import { Collider, Hitbox, HitboxData, Hurtbox, HurtboxData } from 'src/collider';
import { PS } from 'src/global';
import { BaseCharacter } from 'src/characters';
import { StageObject } from 'src/stage/stageObject';
import Aero from 'src/characters/aero/aero.character';
import { Vector2 } from '@lawsumisu/common-utilities';
import Jack from 'src/characters/jack/jack.character';
import { KeyboardPluginPS } from 'src/plugins/keyboard.plugin';
import { AudioKey, SoundLibrary } from 'src/assets/audio';

export class Stage extends Phaser.Scene {
  protected hitData: { [tag: string]: HitboxData } = {};
  protected hurtData: { [tag: string]: HurtboxData } = {};
  private stageObjects: StageObject[] = [];
  p1: BaseCharacter;
  p2: BaseCharacter;
  bounds: Phaser.Geom.Rectangle;

  public ground = 0;

  private contact: { collider: Phaser.Geom.Circle; owner: string } | null = null;
  private debugSettings = {
    colliders: false,
    enableSounds: true
  };

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
    this.p1 = new Aero(0);
    this.p2 = new Jack(1);
    this.addStageObject(this.p1);
    this.addStageObject(this.p2);
    PS.stage = this;
    this.bounds = new Phaser.Geom.Rectangle(0, 0, 386, 200);
  }

  public preload(): void {
    this.load.image('background', 'assets/stages/makoto.jpg');
    this.p1.preload();
    this.p2.preload();
    PS.soundLibrary.load();
  }

  public create(): void {
    const { width: bgWidth, height: bgHeight } = this.game.textures.get('background').source[0];
    this.cameras.main.setBounds(0, 0, bgWidth, bgHeight);
    this.add.image(bgWidth / 2, bgHeight / 2, 'background');
    this.ground = bgHeight - 32;
    this.cameras.main.setZoom(2);
    this.setupPlayers();
  }

  public update(time: number, delta: number): void {
    this.stageObjects.forEach((so: StageObject) => so.update({ time, delta: delta / 1000 }));
    this.updateBounds();
    this.updateCollisions();
    this.updateHits();
    this.updateCamera();
    this.updateDebugSettings();
    this.draw();
  }

  public addStageObject(stageObject: StageObject): void {
    this.stageObjects.push(stageObject);
  }

  private setupPlayers(): void {
    this.p1.create();
    this.p2.create();
    this.p1.setTarget(this.p2);
    this.p2.setTarget(this.p1);
    this.p1.position.x = 200;
    this.p2.position = new Vector2(400, this.ground);
  }

  private updateBounds(): void {
    const margin = new Vector2(25, 0);
    this.bounds = new Phaser.Geom.Rectangle(0, 0, 386 - margin.x * 2, 200);
    const c = this.p1.position.add(this.p2.position).scale(0.5);
    this.bounds.centerX = c.x;
    this.bounds.centerY = c.y;
    const cameraBounds = this.cameras.main.getBounds();
    this.bounds.right = Math.min(this.bounds.right, cameraBounds.right - margin.x);
    this.bounds.left = Math.max(this.bounds.left, cameraBounds.left + margin.x);
  }

  private updateCamera(): void {
    const offset = new Vector2(0, -40);
    const padding = new Vector2(50, 0);
    const camera = this.cameras.main;
    const { x: x1 } = this.p1.position;
    const { x: x2 } = this.p2.position;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const distance = maxX - minX;
    const p = this.p1.position.add(this.p2.position).scale(0.5);
    if (distance >= 386 - padding.x * 2) {
      camera.scrollX = p.x - camera.width / 2 + offset.x;
    } else {
      if (minX <= camera.worldView.left + padding.x) {
        camera.scrollX += minX - camera.worldView.left - padding.x;
      } else if (maxX >= camera.worldView.right - padding.x) {
        camera.scrollX += maxX - camera.worldView.right + padding.x;
      }
    }
    camera.scrollY = p.y - camera.height / 2 + offset.y;
  }

  private updateDebugSettings(): void {
    const keycodes = Phaser.Input.Keyboard.KeyCodes;
    if (this.keyboard.isKeyPressed(keycodes.ONE)) {
      this.debugSettings.colliders = !this.debugSettings.colliders;
    }
    if (this.keyboard.isKeyPressed(keycodes.TWO)) {
      this.debugSettings.enableSounds = !this.debugSettings.enableSounds;
      console.log(`Sound ${this.debugSettings.enableSounds ? 'enabled' : 'disabled'}`);
    }
  }

  private updateHits(): void {
    _.forEach(this.hitData, (hitboxData: HitboxData) => {
      _.forEach(this.hurtData, (hurtboxData: HurtboxData) => {
        if (!hitboxData.hasCollided(hurtboxData) && !hitboxData.canIgnoreCollision(hurtboxData.owner)) {
          const { position: hitOffset, orientation: hitOrientation } = this.getStageObject(hitboxData.owner);
          const { position: hurtOffset, orientation: hurtOrientation } = this.getStageObject(hurtboxData.owner);
          for (let hitbox of hitboxData.data) {
            for (const hurtbox of hurtboxData.data) {
              if (
                Collider.checkCollision(hitbox, hurtbox, {
                  c1: { offset: hitOffset, orientation: hitOrientation },
                  c2: { offset: hurtOffset, orientation: hurtOrientation }
                })
              ) {
                hitboxData.registerCollision(hurtboxData);
                const hurtObject = this.getStageObject(hurtboxData.owner);
                const hitObject = this.getStageObject(hitboxData.owner);
                const hit = Hitbox.transformHit(hitbox.hit, hitOrientation);
                hurtObject.applyHit(hit);
                hitObject.onTargetHit(hurtObject, hit);
                if (hurtbox.isCircular()) {
                  this.contact = { collider: hurtbox.transformBox(hurtOffset, hurtOrientation), owner: hurtObject.tag };
                } else {
                  this.contact = null;
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

  public updateCollisions(): void {
    // TODO theoretically anything could have a push box, so modify this function to not just expect pushboxes of p1 and p2.
    const intersection = Phaser.Geom.Intersects.GetRectangleIntersection(this.p1.pushbox, this.p2.pushbox);
    if (intersection.width > 0) {
      const p1 = this.p1.position.x <= this.p2.position.x ? this.p1 : this.p2;
      const p2 = this.p1.position.x <= this.p2.position.x ? this.p2 : this.p1;
      let d1 = Math.max(intersection.width / 2, p1.position.x - this.bounds.left);
      let d2 = Math.min(intersection.width / 2, this.bounds.right - p2.position.x);
      if (d1 < intersection.width /2 ) {
        d2 = intersection.width - d1;
      } else if (d2 < intersection.width) {
        d1 = intersection.width - d2;
      }
      p1.position.x -= d1;
      p2.position.x += d2;
    }
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
      const key = [hurt.tag, hurt.owner].join('-');
      this.hurtData[key] = hurt;
    }
  }

  public removeHurtboxData(tag: string, owner: string): void {
    const key = [tag, owner].join('-');
    if (_.has(this.hurtData, key)) {
      delete this.hurtData[key];
    }
  }

  public get debugDraw(): DebugDrawPlugin {
    return (<any>this.sys).debugDraw;
  }

  public get gameInput(): GameInputPlugin {
    return (<any>this.sys).GI;
  }

  public get keyboard(): KeyboardPluginPS {
    return (<any>this.sys).keyboard;
  }

  public get left(): number {
    return this.bounds.left;
  }

  public get right(): number {
    return this.bounds.right;
  }

  private draw(): void {
    if (!this.debugSettings.colliders) {
      return;
    }
    const hitboxOptions = {
      fill: {
        color: 0xff0000,
        alpha: 0.2
      }
    };
    const hurtboxOptions = {
      fill: {
        color: 0x00ffff,
        alpha: 0.5
      }
    };
    _.forEach(this.hitData, (hitboxData: HitboxData) => {
      const { position, orientation } = this.getStageObject(hitboxData.owner);
      hitboxData.data.forEach((hitbox: Collider) => {
        if (hitbox.isCircular()) {
          const { x, y, radius: r } = hitbox.transformBox(position, orientation);
          this.debugDraw.circle({ x, y, r }, hitboxOptions);
        } else if (hitbox.isCapsular()) {
          this.debugDraw.capsule(hitbox.transformBox(position, orientation), hitboxOptions);
        }
      });
    });

    _.forEach(this.hurtData, (hurtboxData: HurtboxData) => {
      const { position, orientation } = this.getStageObject(hurtboxData.owner);
      if (hurtboxData.owner !== this.p1.tag) {
        hurtboxData.data.forEach((hurtbox: Hurtbox) => {
          if (hurtbox.isCircular()) {
            const { x, y, radius: r } = hurtbox.transformBox(position, orientation);
            this.debugDraw.circle({ x, y, r }, hurtboxOptions);
          } else if (hurtbox.isCapsular()) {
            this.debugDraw.capsule(hurtbox.transformBox(position, orientation), hurtboxOptions);
          }
        });
      }
    });

    if (this.contact && this.getStageObject(this.contact.owner).hasFreezeFrames) {
      const { x, y, radius: r } = this.contact.collider;
      this.debugDraw.circle(
        { x, y, r },
        {
          fill: {
            color: 0xffff00,
            alpha: 0.6
          }
        }
      );
    }

    this.debugDraw.rect(this.bounds, { lineColor: 0xffff00 });
    [this.p1.pushbox, this.p2.pushbox].forEach(pushbox => this.debugDraw.rect(pushbox, { lineColor: 0xff00ff }));
  }

  private getStageObject(owner: string): StageObject {
    return this.stageObjects.find((so: StageObject) => so.tag === owner)!;
  }

  public get settings() {
    return { ...this.debugSettings };
  }

  public playSound(key: AudioKey, extra?: Phaser.Types.Sound.SoundConfig | Phaser.Types.Sound.SoundMarker): void {
    if (this.settings.enableSounds) {
      this.sound.play(key, { volume: SoundLibrary.defaultVolume, ...extra });
    }
  }
}
