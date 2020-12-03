import * as _ from 'lodash';
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
import { BoxConfig, BoxDefinition, BoxType, FrameDefinition, HitboxDefinition, isCircleBox } from 'src/characters/frameData';
import { PS } from 'src/global';
import { StageObject } from 'src/stage/stageObject';

export type StateDefinition<C = {}, F extends string = string> = C & {
  frameKey?: F;
  hitDefinition?: (tick: number, hitData: HitboxData) => HitboxData | null;
  hurtDefinition?: (tick: number, hurtData: HurtboxData) => HurtboxData | null;
  update?: (tick: number, stateTemporaryValues: object) => void;
};

type State<K extends string, C, F extends string> = StateDefinition<C, F> & {
  key: K;
};

export interface AnimInfo {
  direction: Direction;
  index: number;
  frameDefinition?: FrameDefinition;
  frameKey: string;
}

export class StateManager<K extends string, C = {}, F extends string = string> {
  // State Management
  private stageObject: StageObject;
  private tick = 0;
  private onAfterTransitionFn = _.noop;
  private onBeforeTransitionFn = _.noop;
  private states: { [key in K]?: StateDefinition<C, F> } = {};
  private readonly getAnimInfo: () => AnimInfo;
  private currentState: State<K, C, F>;
  private stateTemporaryValues = {};
  private collisionData: CollisionDataMap = {
    hitData: HitboxData.EMPTY,
    hurtData: HurtboxData.EMPTY
  };

  constructor(stageObject: StageObject, getAnimInfo: () => AnimInfo) {
    this.stageObject = stageObject;
    this.getAnimInfo = getAnimInfo;
  }

  public update(): void {
    if (this.currentState.update) {
      this.currentState.update(this.tick, this.stateTemporaryValues);
    }
    const prevHurtData = this.collisionData.hurtData;
    const hurtData = this.currentState.hurtDefinition
      ? this.currentState.hurtDefinition(this.tick, prevHurtData)
      : this.generateHurtboxData(prevHurtData);
    const persistHurtboxes = _.isFunction(prevHurtData.persist) ? prevHurtData.persist() : prevHurtData.persist;
    if (!_.isNil(hurtData) || !persistHurtboxes) {
      this.setHurtData(hurtData);
    }
    if (this.currentState.hurtDefinition) {
    }
    const prevHitData = this.collisionData.hitData;
    const hitData = this.currentState.hitDefinition
      ? this.currentState.hitDefinition(this.tick, prevHitData)
      : this.generateHitboxData(prevHitData);
    const persistHitboxes = _.isFunction(prevHitData.persist) ? prevHitData.persist() : prevHitData.persist;
    if (!_.isNil(hitData) || !persistHitboxes) {
      this.setHitData(hitData ? hitData : HitboxData.EMPTY);
    }
    this.tick++;
  }

  /**
   * Set callback that is called after a state transitions to a new state.
   * @param fn
   */
  public onAfterTransition(fn: (config: C) => void): void {
    this.onAfterTransitionFn = fn;
  }

  /**
   * Set callback that is called before a state transitions to a new state.
   * @param fn
   */
  public onBeforeTransition(fn: (config: C) => void): void {
    this.onBeforeTransitionFn = fn;
  }

  public addState(key: K, stateDef: StateDefinition<C, F>): void {
    this.states[key] = stateDef;
  }

  /**
   * Updates the current player state.
   * @param key
   * @param force: Forces the state to transition, even if the new state would be the same as the current one.
   */
  public setState(key: K, force?: boolean): void {
    if (!this.currentState || this.currentState.key !== key || force) {
      this.onBeforeTransitionFn(this.currentState);
      const currentStateDef = this.getStateDefinition(key);
      this.currentState = {
        ...currentStateDef,
        key
      };
      this.onAfterTransitionFn(this.currentState);
      this.tick = 0;
      this.stateTemporaryValues = {};
      // console.log(this.currentState.key);
    }
  }

  public get current(): { tick: number; key: K } {
    return { tick: this.tick, key: this.currentState.key };
  }

  public getStateDefinition(key: K): StateDefinition<C, F> {
    return { ...(this.states[key] as StateDefinition<C, F>) };
  }

  private setHitData(data: HitboxData): void {
    PS.stage.removeHitboxData(this.collisionData.hitData.tag);
    this.collisionData.hitData = data;
    PS.stage.addHitboxData(data);
  }

  private setHurtData(data: HurtboxData | null): void {
    PS.stage.removeHurtboxData(this.collisionData.hurtData.tag);
    this.collisionData.hurtData = data ? data : HurtboxData.EMPTY;
    PS.stage.addHurtboxData(this.collisionData.hurtData);
  }

  private generateHurtboxData(hurtboxData: HurtboxData): HurtboxData | null {
    const boxDefinitionData = this.generateBoxDefinitionData(hurtboxData, BoxType.HURT);
    if (_.isNil(boxDefinitionData)) {
      return null;
    } else {
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
    }
  }

  private generateHitboxData(hitboxData: HitboxData): HitboxData | null {
    const boxDefinitionData = this.generateBoxDefinitionData(hitboxData, BoxType.HIT);
    if (_.isNil(boxDefinitionData)) {
      return null;
    } else {
      const { direction, frameDefinition } = this.getAnimInfo();
      const { persist, tag, frameBoxDef, index } = boxDefinitionData;
      const hit = { ...frameDefinition!.hitboxDef!.hit, ...frameBoxDef.hit };
      return new HitboxData(
        frameBoxDef.boxes.map((box: BoxConfig) => {
          if (isCircleBox(box)) {
            return Hitbox.generateCircular(box, hit, direction);
          } else {
            return Hitbox.generateCapsular(box, hit, direction);
          }
        }),
        tag,
        this.stageObject.tag,
        index,
        { persist, registeredCollisions: hitboxData.registeredCollisions }
      );
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
    const { index, frameDefinition, frameKey } = this.getAnimInfo();
    const key = boxType === BoxType.HIT ? 'hitboxDef' : 'hurtboxDef';
    if (frameDefinition && frameDefinition[key] && frameDefinition[key]![index] && (data.index !== index || data.isEmpty)) {
      const frameBoxDef = frameDefinition[key]![index] as T extends HitboxData ? HitboxDefinition : BoxDefinition;
      const persist = (): boolean => {
        const { index: i, frameKey: currentFrameKey } = this.getAnimInfo();
        const { persistUntilFrame = index + 1 } = frameBoxDef;
        return frameKey === currentFrameKey && (i === index || i < persistUntilFrame);
      };
      const tag = frameBoxDef.tag ? [frameKey, frameBoxDef.tag].join('-') : frameKey;
      return { persist, tag, frameBoxDef, index };
    } else {
      return null;
    }
  }
}
