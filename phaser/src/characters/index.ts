import { StateDefinition, StateManager } from 'src/state';
import { Vector2 } from '@lawsumisu/common-utilities';
import { InputHistory } from 'src/plugins/gameInput.plugin';
import * as _ from 'lodash';
import { addAnimationsByDefinition, FrameDefinitionMap, getFrameIndexFromSpriteIndex } from 'src/characters/frameData';
import { Command } from 'src/command/';
import { PS } from 'src/global';
import { StageObject } from 'src/stage/stageObject';
import { Hit } from 'src/collider';
import { Unit } from 'src/unit';
import * as Phaser from 'phaser';
import { playAnimation } from 'src/utilitiesPF/animation.util';

export interface CommandTrigger<S extends string> {
  command: Command;
  trigger?: () => boolean | (() => boolean);
  state: S;
  priority?: number;
}

export class BaseCharacter<S extends string = string, D extends StateDefinition = StateDefinition> extends StageObject {
  protected stateManager: StateManager<S, D>;
  protected nextStates: Array<{ state: S; executionTrigger: () => boolean }> = [];
  protected defaultState: S;
  protected frameDefinitionMap: FrameDefinitionMap;

  protected sprite: Phaser.GameObjects.Sprite;

  protected walkSpeed = 100;
  protected runSpeed = 175;
  protected dashSpeed = 250;
  protected jumpSpeed = 150;
  protected gravity = 450;

  protected velocity: Vector2 = Vector2.ZERO;
  public position: Vector2 = Vector2.ZERO;
  protected direction: -1 | 1 = 1;

  public readonly playerIndex: number;
  protected target: StageObject;

  protected commandList: Array<CommandTrigger<S>> = [];

  protected states: { [key in S]?: D };
  private sounds: Set<string> = new Set<string>();

  constructor(playerIndex = 0, frameDefinitionMap: FrameDefinitionMap = {}) {
    super();
    this.frameDefinitionMap = frameDefinitionMap;
    this.playerIndex = playerIndex;
    this.stateManager = new StateManager<S, D>(this, () => {
      const { currentFrame: frame, currentAnim: anim } = this.sprite.anims;
      return {
        index: anim ? getFrameIndexFromSpriteIndex(this.frameDefinitionMap[anim.key].animDef, frame.index) : -1,
        direction: { x: !this.sprite.flipX, y: true },
        frameDefinition: anim && this.frameDefinitionMap[anim.key],
        frameKey: anim && anim.key
      };
    });
    this.stateManager.onBeforeTransition((key: S) => this.beforeStateTransition(key));
    this.stateManager.onAfterTransition(config => this.afterStateTransition(config));
  }

  public preload(): void {
    _.noop();
  }

  /**
   * Creates the sprite, integrates states, and builds command list for this character.
   */
  public create() {
    _.forEach(this.states, (value: D, key: S) => {
      this.stateManager.addState(key, value);
    });
    this.sprite = PS.stage.add.sprite(this.position.x, this.position.y, '');
    this.sprite.depth = 20;
    addAnimationsByDefinition(this.sprite, this.frameDefinitionMap);
    this.stateManager.setState(this.defaultState);
    this.commandList = this.commandList.sort((a, b) => {
      const p1 = a.priority || 0;
      const p2 = b.priority || 0;
      return p2 - p1;
    });
  }

  public applyHit(hit: Hit): void {
    this.setHitlag(hit);
  }

  public onTargetHit(_stageObject: StageObject, hit: Hit): void {
    this.setHitlag(hit);
  }

  public setTarget(stageObject: StageObject): void {
    this.target = stageObject;
  }

  public update(params: { time: number; delta: number }): void {
    super.update(params);
    this.updateState();
    if (!this.isHitlagged) {
      this.updateKinematics(params.delta);
      this.updateSprite();
    }
  }

  protected updateState(): void {
    for (const { command, trigger = () => true, state } of this.commandList) {
      if (this.isCommandExecuted(command)) {
        const canTransition = trigger();
        if (_.isFunction(canTransition)) {
          // chainable state, so add to queue
          this.queueNextState(state, canTransition);
          break;
        } else if (canTransition && !this.isCurrentState(state)) {
          // Immediately transition to next state.
          this.goToNextState(state);
          break;
        }
      }
    }
    if (this.isHitlagged) {
      this.sprite.anims.pause();
    } else {
      this.sprite.anims.resume();
      this.goToNextState();
      this.stateManager.update();
    }
  }

  protected updateSprite(): void {
    this.sprite.x = this.position.x;
    this.sprite.y = this.position.y;
  }

  protected updateKinematics(delta: number): void {
    if (this.isAirborne) {
      this.velocity.y += this.gravity * delta;
    }
    this.position = this.position.add(this.velocity.scale(delta * Unit.toPx));

    // TODO handle this in a separate function?
    if (this.position.y > PS.stage.ground) {
      this.position.y = PS.stage.ground;
      this.velocity.y = 0;
    }
  }

  protected isNextStateBuffered(state: S): boolean {
    return !!this.nextStates.find(nextState => nextState.state === state);
  }

  protected queueNextState(state: S, executionTrigger: () => boolean = () => true): void {
    if (this.stateManager.current.key !== state && !this.nextStates.find(nextState => nextState.state === state)) {
      this.nextStates.push({ state, executionTrigger });
    }
  }

  /**
   * Transition to the next state in the state transition queue.
   * If a state is provided directly, transition to that state immediately (this will clear the transition queue).
   * @param state
   */
  protected goToNextState(state?: S): void {
    if (state) {
      this.nextStates = [];
      this.stateManager.setState(state);
    } else if (this.nextStates.length >= 1) {
      const [nextState, ...rest] = this.nextStates;
      if (nextState.executionTrigger()) {
        console.log(
          nextState.state,
          rest.map(i => i.state)
        );
        this.stateManager.setState(nextState.state);
        this.nextStates = rest;
      }
    }
  }

  protected afterStateTransition(config: D): void {
    _.noop(config);
    this.sounds.clear();
  }

  protected beforeStateTransition(nextKey: S): void {
    _.noop(nextKey);
  }

  protected playSound(
    key: string,
    extra?: Phaser.Types.Sound.SoundConfig | Phaser.Types.Sound.SoundMarker,
    force?: boolean
  ): void {
    if (!(PS.stage.sound.get(key) && this.sounds.has(key)) || force) {
      PS.stage.sound.play(key, extra);
      this.sounds.add(key);
    }
  }

  protected playAnimation(key: string, force = false) {
    playAnimation(this.sprite, key, force);
  }

  protected isCurrentState(state: S): boolean {
    return this.stateManager.current.key === state;
  }

  protected isCommandExecuted(command: Command): boolean {
    return command.isExecuted(this.playerIndex, this.direction === 1);
  }

  protected get input(): InputHistory {
    return PS.stage.gameInput.for(this.playerIndex);
  }

  protected get isAirborne(): boolean {
    return this.position.y < PS.stage.ground;
  }

  protected get currentAnimation(): string {
    return this.sprite.anims.currentAnim.key;
  }
}
