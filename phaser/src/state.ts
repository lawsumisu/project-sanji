import * as _ from 'lodash';
import { CollisionDataMap, Direction, Hitbox, HitboxData, HurtboxData } from 'src/frame';
import { FrameDefinition, HitboxConfig } from 'src/characters';
import { PS } from 'src/global';
import { StageObject } from 'src/stage/stageObject';

export type StateDefinition<C = {}, F extends string = string> = C & {
  frameKey?: F;
  hitDefinition?: (tick: number, hitData: HitboxData) => HitboxData | null;
  update?: (tick: number, stateTemporaryValues: object) => void;
};

type State<K extends string, C, F extends string> = StateDefinition<C, F> & {
  key: K;
};

interface AnimInfo {
  direction: Direction;
  index: number;
  frameDefinition: FrameDefinition
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
    const prevHitData = this.collisionData.hitData;
    const hitData = this.generateHitboxData(prevHitData);
    const persist = _.isFunction(prevHitData.persist) ? prevHitData.persist() : prevHitData.persist;
    if (!_.isNil(hitData) || !persist) {
      this.setHitData(hitData ? hitData : HitboxData.EMPTY);
    }
    this.tick++;
  }

  /**
   * Set callback that is called after a state transitions to a new state.
   * @param fn
   */
  public onAfterTransition(fn: (config: C) => any): void {
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
        key,
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
    PS.stage.removeHitData(this.collisionData.hitData.tag);
    this.collisionData.hitData = data;
    PS.stage.addHitData(data);
  }

  private generateHitboxData(hitboxData: HitboxData): HitboxData | null{
    const { index, direction, frameDefinition, frameKey } = this.getAnimInfo();
    if (frameDefinition.hitboxDef && frameDefinition.hitboxDef[index] && hitboxData.index !== index) {
      const frameHitDef = frameDefinition.hitboxDef[index];
      const persist = (): boolean => {
        const { index: i, frameKey: currentFrameKey } = this.getAnimInfo();
        const { persistUntilFrame = index + 1 } = frameHitDef;
        return frameKey === currentFrameKey && (i === index || i < persistUntilFrame);
      };
      const hit = { ...frameDefinition.hitboxDef.hit, ...frameHitDef.hit };
      const tag = frameHitDef.tag ? [frameKey, frameHitDef.tag].join('-') : frameKey;
      return new HitboxData(
        frameHitDef.boxes.map((box: HitboxConfig) =>
          Hitbox.generateCircular(new Phaser.Geom.Circle(box.x, box.y, box.r), hit, direction)
        ),
        tag,
        this.stageObject.tag,
        index,
        { persist, registeredCollisions: hitboxData.registeredCollisions }
      );
    } else {
      return null;
    }
  }
}
