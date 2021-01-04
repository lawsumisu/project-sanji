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
  HurtboxData
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

export type HitboxDataGenerator = (hitboxData: HitboxData) => HitboxData | null;
export type HurtboxDataGenerator = (hurtboxData: HurtboxData) => HurtboxData | null;

export class ColliderManager {
  private collisionData: CollisionDataMap = {
    hitData: HitboxData.EMPTY,
    hurtData: HurtboxData.EMPTY
  };
  protected hurtboxDataGenerator: HurtboxDataGenerator;
  protected hitboxDataGenerator: HitboxDataGenerator;

  public constructor(
    hurtDefinition: HurtboxDataGenerator = () => null,
    hitDefinition: HitboxDataGenerator = () => null
  ) {
    this.hitboxDataGenerator = hitDefinition;
    this.hurtboxDataGenerator = hurtDefinition;
  }

  public update(): void {
    const prevHurtData = this.collisionData.hurtData;
    const hurtData = this.hurtboxDataGenerator(prevHurtData);
    const persistHurtboxes = _.isFunction(prevHurtData.persist) ? prevHurtData.persist() : prevHurtData.persist;
    if (!_.isNil(hurtData) || !persistHurtboxes) {
      this.setHurtData(hurtData);
    }
    const prevHitData = this.collisionData.hitData;
    const hitData = this.hitboxDataGenerator(prevHitData);
    const persistHitboxes = _.isFunction(prevHitData.persist) ? prevHitData.persist() : prevHitData.persist;
    if (!_.isNil(hitData) || !persistHitboxes) {
      this.setHitData(hitData ? hitData : HitboxData.EMPTY);
    }
  }

  public clearHitboxData(): void {
    this.setHitData(HitboxData.EMPTY);
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

  public constructor(stageObject: StageObject, frameDefinitionMap: FrameDefinitionMap, getAnimInfo: () => AnimInfo | null) {
    super();
    this.stageObject = stageObject;
    this.hitboxDataGenerator = this.generateHitboxData;
    this.hurtboxDataGenerator = this.generateHurtboxData;
    this.frameDefinitionMap = frameDefinitionMap;
    this.getAnimInfo = getAnimInfo;
    this.ignoreCollisionsWith();
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
    if (animInfo && !_.isNil(boxDefinitionData)){
      const { frameKey } = animInfo;
      const { persist, tag, frameBoxDef, index } = boxDefinitionData;
      const frameDefinition = this.frameDefinitionMap.frameDef[frameKey];
      // TODO allow hitbox data to be overwritten at runtime
      const hit = { ...frameDefinition!.hitboxDef!.hit, ...frameBoxDef.hit };
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
