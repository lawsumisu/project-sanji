import * as _ from 'lodash';

export type StateDefinition<C = {}> = C & {
  update?: (tick: number, stateTemporaryValues: object) => void;
};

type State<K extends string, C> = StateDefinition<C> & {
  key: K;
};

export class StateManager<K extends string, C = {}> {
  // State Management
  private tick = 0;
  private onAfterTransitionFn = _.noop;
  private onBeforeTransitionFn: (key: K) => void = _.noop;
  private states: { [key in K]?: StateDefinition<C> } = {};
  private currentState: State<K, C>;
  private localState = {};

  // TODO: separate out collider management from state management via a colliderManager object.
  public update(): void {
    if (this.currentState.update) {
      this.currentState.update(this.tick, this.localState);
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
  public onBeforeTransition(fn: (key: K) => void): void {
    this.onBeforeTransitionFn = fn;
  }

  public addState(key: K, stateDef: StateDefinition<C>): void {
    this.states[key] = stateDef;
  }

  /**
   * Updates the current player state.
   * @param key
   * @param localState
   * @param force: Forces the state to transition, even if the new state would be the same as the current one.
   */
  public setState(key: K, localState = {}, force?: boolean): void {
    if (!this.states[key]) {
      console.error(`${key} is not a valid state key; ignoring transition`);
      return;
    } else if (!this.currentState || this.currentState.key !== key || force) {
      this.onBeforeTransitionFn(key);
      const currentStateDef = this.getStateDefinition(key);
      this.currentState = {
        ...currentStateDef,
        key
      };
      this.onAfterTransitionFn(this.currentState);
      this.tick = 0;
      this.localState = { ...localState };
      // console.log(this.currentState.key);
    }
  }

  public get current(): { tick: number; key: K } {
    return { tick: this.tick, key: this.currentState.key };
  }

  public getStateDefinition(key: K): StateDefinition<C> {
    return { ...(this.states[key] as StateDefinition<C>) };
  }
}
