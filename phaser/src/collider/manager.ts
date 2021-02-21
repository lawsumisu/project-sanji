import * as _ from 'lodash';
import { PS } from 'src/global';
import {
  Collider,
  CollisionData,
  CollisionDataMap,
  Direction,
  Hitbox,
  HitboxData,
  Hurtbox,
  HurtboxData,
  PushboxData
} from 'src/collider';
import {
  BoxConfig,
  BoxDefinition,
  BoxType,
  FrameDefinitionMap,
  HitboxDefinition,
  isCircleBox
} from 'src/characters/frameData';
import { StageObject } from 'src/stage/stageObject';
import { Vector2 } from '@lawsumisu/common-utilities';

export type HitboxDataGenerator = (hitboxData: HitboxData) => HitboxData | null;
export type HurtboxDataGenerator = (hurtboxData: HurtboxData) => HurtboxData | null;
export type PushboxDataGenerator = (pushboxData: PushboxData) => PushboxData | null;

export class ColliderManager {
  private collisionData: CollisionDataMap = {
    hitData: HitboxData.EMPTY,
    hurtData: HurtboxData.EMPTY,
    pushboxData: PushboxData.EMPTY
  };
  protected hurtboxDataGenerator: HurtboxDataGenerator;
  protected hitboxDataGenerator: HitboxDataGenerator;
  protected pushboxDataGenerator: PushboxDataGenerator;

  public constructor(
    hurtDefinition: HurtboxDataGenerator = () => null,
    hitDefinition: HitboxDataGenerator = () => null,
    pushboxDataGenerator: PushboxDataGenerator = () => null
  ) {
    this.hitboxDataGenerator = hitDefinition;
    this.hurtboxDataGenerator = hurtDefinition;
    this.pushboxDataGenerator = pushboxDataGenerator;
  }

  // TODO pass in updateParams rather than relying on functions like getAnimInfo
  public update(): void {
    // Update hurt data
    const prevHurtData = this.collisionData.hurtData;
    const hurtData = this.hurtboxDataGenerator(prevHurtData);
    const persistHurtboxes = _.isFunction(prevHurtData.persist) ? prevHurtData.persist() : prevHurtData.persist;
    if (!_.isNil(hurtData) || !persistHurtboxes) {
      this.setHurtData(hurtData);
    }
    // Update hitData
    const prevHitData = this.collisionData.hitData;
    const hitData = this.hitboxDataGenerator(prevHitData);
    const persistHitboxes = _.isFunction(prevHitData.persist) ? prevHitData.persist() : prevHitData.persist;
    if (!_.isNil(hitData) || !persistHitboxes) {
      this.setHitData(hitData ? hitData : HitboxData.EMPTY);
    }
    // Update pushboxData
    const prevPushboxData = this.collisionData.pushboxData;
    const pushboxData = this.pushboxDataGenerator(prevPushboxData);
    const persistPushbox = _.isFunction(prevPushboxData.persist) ? prevPushboxData.persist() : prevPushboxData.persist;
    if (!_.isNil(pushboxData) && !persistPushbox) {
      this.collisionData.pushboxData = pushboxData ? pushboxData : PushboxData.EMPTY;
    }
  }

  public clearHitboxData(): void {
    this.setHitData(HitboxData.EMPTY);
  }

  public getPushbox(origin: Vector2): Phaser.Geom.Rectangle {
    const { x, y, width, height } = this.collisionData.pushboxData.pushbox;
    return new Phaser.Geom.Rectangle(x + origin.x, y + origin.y, width, height);
  }

  private setHitData(data: HitboxData): void {
    PS.stage.removeHitboxData(this.collisionData.hitData.tag);
    this.collisionData.hitData = data;
    PS.stage.addHitboxData(data);
  }

  private setHurtData(data: HurtboxData | null): void {
    const { tag, owner } = this.collisionData.hurtData;
    PS.stage.removeHurtboxData(tag, owner);
    this.collisionData.hurtData = data ? data : HurtboxData.EMPTY;
    PS.stage.addHurtboxData(this.collisionData.hurtData);
  }
}

export interface AnimInfo {
  direction: Direction;
  index: number;
  frameKey: string;
}

export class FrameDefinitionColliderManager extends ColliderManager {
  private stageObject: StageObject;
  private readonly frameDefinitionMap: FrameDefinitionMap;
  private readonly getAnimInfo: () => AnimInfo | null;
  private ignoreCollisionTags: Set<string>;

  public constructor(
    stageObject: StageObject,
    frameDefinitionMap: FrameDefinitionMap,
    getAnimInfo: () => AnimInfo | null
  ) {
    super();
    this.stageObject = stageObject;
    this.hitboxDataGenerator = this.generateHitboxData;
    this.hurtboxDataGenerator = this.generateHurtboxData;
    this.frameDefinitionMap = frameDefinitionMap;
    this.getAnimInfo = getAnimInfo;
    this.ignoreCollisionsWith();
    this.pushboxDataGenerator = this.generatePushboxData;
  }

  public ignoreCollisionsWith(...tags: string[]): void {
    this.ignoreCollisionTags = new Set(tags);
    this.ignoreCollisionTags.add(this.stageObject.tag);
  }

  private generateHurtboxData(hurtboxData: HurtboxData): HurtboxData | null {
    const boxDefinitionData = this.generateBoxDefinitionData(hurtboxData, BoxType.HURT);
    if (!_.isNil(boxDefinitionData)) {
      const { persist, tag, frameBoxDef, index } = boxDefinitionData;
      return new HurtboxData(
        frameBoxDef.boxes.map(box => {
          if (isCircleBox(box)) {
            return Hurtbox.generateCircular(box);
          } else {
            return Hurtbox.generateCapsular(box);
          }
        }),
        tag,
        this.stageObject.tag,
        index,
        { persist }
      );
    } else {
      return null;
    }
  }

  private generateHitboxData(hitboxData: HitboxData): HitboxData | null {
    const boxDefinitionData = this.generateBoxDefinitionData(hitboxData, BoxType.HIT);
    const animInfo = this.getAnimInfo();
    if (animInfo && !_.isNil(boxDefinitionData)) {
      const { frameKey } = animInfo;
      const { persist, tag, frameBoxDef, index } = boxDefinitionData;
      const frameDefinition = this.frameDefinitionMap.frameDef[frameKey];
      // TODO allow hitbox data to be overwritten at runtime
      const hit = _.merge({ pushback: { base: 0, decay: 0 }}, { ...frameDefinition!.hitboxDef!.hit, ...frameBoxDef.hit });
      return new HitboxData(
        frameBoxDef.boxes.map((box: BoxConfig) => {
          if (isCircleBox(box)) {
            return Hitbox.generateCircular(box, hit);
          } else {
            return Hitbox.generateCapsular(box, hit);
          }
        }),
        tag,
        this.stageObject.tag,
        index,
        {
          persist,
          registeredCollisions: hitboxData.registeredCollisions,
          ignoreCollisionTags: this.ignoreCollisionTags
        }
      );
    } else {
      return null;
    }
  }

  private generatePushboxData(pushboxData: PushboxData): PushboxData | null {
    const animInfo = this.getAnimInfo();
    if (animInfo) {
      const { index, frameKey } = animInfo;
      const frameDefinition = this.frameDefinitionMap.frameDef[frameKey];
      if (
        frameDefinition &&
        frameDefinition.pushboxDef &&
        frameDefinition.pushboxDef[index] &&
        (pushboxData.index !== index || pushboxData.isEmpty)
      ) {
        const pushboxDef = frameDefinition.pushboxDef[index];
        const persist = (): boolean => {
          const { index: i, frameKey: currentFrameKey } = this.getAnimInfo()!;
          const { persistThroughFrame = index + 1 } = pushboxDef;
          return frameKey === currentFrameKey && (i === index || i <= persistThroughFrame);
        };
        const { x, y, width, height } = pushboxDef.box;
        console.log(pushboxDef);
        return new PushboxData(new Phaser.Geom.Rectangle(x, y, width, height), index, { persist })
      }
    }
    const { x, y, width, height } = this.frameDefinitionMap.tempPushbox;
    return new PushboxData(new Phaser.Geom.Rectangle(x, y, width, height), -1);
  }

  private generateBoxDefinitionData<T extends CollisionData<Collider>>(
    data: T,
    boxType: T extends HitboxData ? BoxType.HIT : BoxType.HURT
  ): {
    persist: () => boolean;
    tag: string;
    frameBoxDef: T extends HitboxData ? HitboxDefinition : BoxDefinition;
    index: number;
  } | null {
    const animInfo = this.getAnimInfo();
    if (animInfo) {
      const { index, frameKey } = animInfo;
      const frameDefinition = this.frameDefinitionMap.frameDef[frameKey];
      const key = boxType === BoxType.HIT ? 'hitboxDef' : 'hurtboxDef';
      if (
        frameDefinition &&
        frameDefinition[key] &&
        frameDefinition[key]![index] &&
        (data.index !== index || data.isEmpty)
      ) {
        const frameBoxDef = frameDefinition[key]![index] as T extends HitboxData ? HitboxDefinition : BoxDefinition;
        const persist = (): boolean => {
          const { index: i, frameKey: currentFrameKey } = this.getAnimInfo()!;
          const { persistThroughFrame = index + 1 } = frameBoxDef;
          return frameKey === currentFrameKey && (i === index || i <= persistThroughFrame);
        };
        const tag = frameBoxDef.tag ? [frameKey, frameBoxDef.tag].join('-') : frameKey;
        return { persist, tag, frameBoxDef, index };
      }
    }
    return null;
  }
}
