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
  private stateParams = {};
  private eventManager: {
    [key: string]: {
      nextId: number;
      [key: number]: (params: StateManager<K, C>['stateParams'], ...args: any[]) => void;
    };
  } = {};

  // TODO: separate out collider management from state management via a colliderManager object.
  public update(): void {
    if (this.currentState.update) {
      this.currentState.update(this.tick, this.stateParams);
    }
    this.tick++;
  }

  /**
   * Set callback that is called after a state transitions to a new state.
   * @param fn
   */
  public onAfterTransition(fn: (config: C, params: object) => void): void {
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
   * @param stateParams
   * @param force: Forces the state to transition, even if the new state would be the same as the current one.
   */
  public setState(key: K, stateParams = {}, force?: boolean): void {
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
      this.onAfterTransitionFn(this.currentState, stateParams);
      this.tick = 0;
      this.stateParams = { ...stateParams };
      // console.log(this.currentState.key);
    }
  }

  public get current(): { tick: number; key: K } {
    return { tick: this.tick, key: this.currentState.key };
  }

  public getStateDefinition(key: K): StateDefinition<C> {
    return { ...(this.states[key] as StateDefinition<C>) };
  }

  public addEventListener(key: string, listener: (params: StateManager<K, C>['stateParams'], ...args: any[]) => void) {
    if (!this.eventManager[key]) {
      this.eventManager[key] = { nextId: 0 };
    }
    const listeners = this.eventManager[key]!;
    listeners[listeners.nextId] = listener;
    listeners.nextId++;
    return () => delete listeners[listeners.nextId - 1];
  }

  public dispatchEvent(key: string, ...args: any[]): void {
    if (this.eventManager[key]) {
      _.forEach(this.eventManager[key], fn => {
        if (!_.isNumber(fn)) {
          fn(this.stateParams, ...args);
        }
      });
    }
  }
}
