import * as _ from 'lodash';
import { Direction } from "src/frame";

export type StateDefinition<C = {}, F extends string = string> = C & {
  frameKey?: F;
  update?: (tick: number) => void;
};

type State<K extends string, C, F extends string> = StateDefinition<C, F> & {
  key: K;
};

interface AnimInfo {
  direction: Direction;
  index: number;
}

export class StateManager<K extends string, C = {}, F extends string = string> {
  // State Management
  private tick = 0;
  private doOnAfterTransition = _.noop;
  private doOnEndTransition = _.noop;
  private states: { [key in K]?: StateDefinition<C, F> } = {};
  private getAnimInfo: (() => AnimInfo) | null = null;
  private currentState: State<K, C, F>;

  public update(): void {
    this.tick++;
    if (this.currentState.update) {
      this.currentState.update(this.tick);
    }
  }

  /**
   * Set callback that is called after a state transitions to a new state.
   * @param fn
   */
  public onAfterTransition(fn: (config: C) => any): void {
    this.doOnAfterTransition = fn;
  }

  /**
   * Set callback that is called before a state transitions to a new state.
   * @param fn
   */
  public onBeforeTransition(fn: (config: C) => void): void {
    this.doOnEndTransition = fn;
  }

  public addState(key: K, state: StateDefinition<C, F>): void {
    this.states[key] = state;
  }

  /**
   * Updates the current player state.
   * @param key
   * @param force: Forces the state to transition, even if the new state would be the same as the current one.
   */
  public setState(key: K, force?: boolean): void {
    if (!this.currentState || this.currentState.key !== key || force) {
      this.doOnEndTransition(this.currentState);
      const currentStateDef = this.getStateDefinition(key);
      this.currentState = {
        ...currentStateDef,
        key,
      };
      this.doOnAfterTransition(this.currentState);
      this.tick = 0;
      if (this.currentState.update) {
        this.currentState.update(this.tick);
      }
      // console.log(this.currentState.key);
    }
  }

  public get current(): { tick: number; key: K } {
    return { tick: this.tick, key: this.currentState.key };
  }

  public getStateDefinition(key: K): StateDefinition<C, F> {
    return { ...(this.states[key] as StateDefinition<C, F>) };
  }
}
