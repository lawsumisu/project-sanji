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
import { ColliderManager, FrameDefinitionColliderManager } from 'src/collider/manager';
import { AudioKey } from 'src/assets/audio';
import { Vfx } from 'src/vfx';

export interface CommandTrigger<S extends string> {
  command: Command;
  trigger?: () => boolean | (() => boolean);
  state: S;
  stateParams?: { [key: string]: unknown };
  priority?: number;
}

export class BaseCharacter<S extends string = string, D extends StateDefinition = StateDefinition> extends StageObject {
  protected stateManager: StateManager<S, D>;
  protected colliderManager: ColliderManager;
  protected nextStates: Array<{ state: S; executionTrigger: () => boolean; stateParams: object }> = [];
  protected defaultState: S;

  protected walkSpeed = 100;
  protected runSpeed = 175;
  protected dashSpeed = 250;
  protected jumpSpeed = 150;
  protected gravity = 450;

  public readonly playerIndex: number;
  protected target: StageObject;

  protected commandList: Array<CommandTrigger<S>> = [];

  protected states: { [key in S]?: D };
  protected audioKeys: AudioKey[] = [];

  constructor(playerIndex = 0) {
    super();
    this.colliderManager = new ColliderManager();
    this.playerIndex = playerIndex;
    this.stateManager = new StateManager<S, D>();
    this.stateManager.onBeforeTransition((key: S) => this.beforeStateTransition(key));
    this.stateManager.onAfterTransition((config, params) => this.afterStateTransition(config, params));
    this.stateManager.addEventListener(
      'playSound',
      (
        stateParams: { playedSounds?: Set<AudioKey> },
        key: AudioKey,
        extra?: Phaser.Types.Sound.SoundConfig | Phaser.Types.Sound.SoundMarker,
        force = false
      ) => this.onPlaySoundEvent(stateParams, key, extra, force)
    );
  }

  public preload(): void {
    this.audioKeys.forEach(key => PS.soundLibrary.register(key));
  }

  /**
   * Creates the sprite, integrates states, and builds command list for this character.
   */
  public create() {
    _.forEach(this.states, (value: D, key: S) => {
      this.stateManager.addState(key, value);
    });
    this.setupSprite();
    this.stateManager.setState(this.defaultState);
    this.commandList = this.commandList.sort((a, b) => {
      const p1 = a.priority || 0;
      const p2 = b.priority || 0;
      return p2 - p1;
    });
  }

  public applyHit(hit: Hit): void {
    this.setHitlag(hit);
    this.addVfx(Vfx.shake(this.sprite, new Vector2(1,0), this.hitlag));
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
    for (const { command, trigger = () => true, state, stateParams = {} } of this.commandList) {
      if (this.isCommandExecuted(command)) {
        const canTransition = trigger();
        if (_.isFunction(canTransition)) {
          // chainable state, so add to queue
          this.queueNextState(state, stateParams, canTransition);
          break;
        } else if (canTransition && !this.isCurrentState(state)) {
          // Immediately transition to next state.
          this.isHitlagged ? this.queueNextState(state, stateParams) : this.goToNextState(state, stateParams);
          console.log(command.toString());
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
      this.colliderManager.update();
    }
  }

  protected updateSprite(): void {
    this.sprite.x = this.position.x;
    this.sprite.y = this.position.y;
    this.sprite.flipX = !this._orientation.x;
  }

  protected updateKinematics(delta: number): void {
    if (this.isAirborne) {
      this.velocity.y += this.gravity * delta;
    }
    this.position = this.position.add(this.velocity.scale(delta * Unit.toPx));

    // TODO handle this in a separate function?
    if (this.position.x < PS.stage.left) {
      this.position.x = PS.stage.left;
    } else if (this.position.x > PS.stage.right) {
      this.position.x = PS.stage.right;
    }
    if (this.position.y > PS.stage.ground) {
      this.position.y = PS.stage.ground;
      this.velocity.y = 0;
    }
  }

  protected setupSprite(): void {
    this._sprite = PS.stage.add.sprite(this.position.x, this.position.y, '');
    this.sprite.depth = 20;
  }

  protected isNextStateBuffered(state: S): boolean {
    return !!this.nextStates.find(nextState => nextState.state === state);
  }

  protected queueNextState(state: S, stateParams: object = {}, executionTrigger: () => boolean = () => true): void {
    if (this.stateManager.current.key !== state && !this.nextStates.find(nextState => nextState.state === state)) {
      this.nextStates.push({ state, executionTrigger, stateParams });
    }
  }

  /**
   * Transition to the next state in the state transition queue.
   * If a state is provided directly, transition to that state immediately (this will clear the transition queue).
   * @param state
   * @param stateParams
   * @param force
   */
  protected goToNextState(state?: S, stateParams: object = {}, force = false): void {
    if (state) {
      this.nextStates = [];
      this.stateManager.setState(state, stateParams, force);
    } else if (this.nextStates.length >= 1) {
      const [nextState, ...rest] = this.nextStates;
      if (nextState.executionTrigger()) {
        console.log(
          nextState.state,
          rest.map(i => i.state)
        );
        this.stateManager.setState(nextState.state, nextState.stateParams);
        this.nextStates = rest;
      }
    }
  }

  protected afterStateTransition(config: D, params: object): void {
    _.noop(config, params);
  }

  protected beforeStateTransition(nextKey: S): void {
    _.noop(nextKey);
  }

  protected onPlaySoundEvent(
    stateParams: { playedSounds?: Set<AudioKey> },
    key: AudioKey,
    extra?: Phaser.Types.Sound.SoundConfig | Phaser.Types.Sound.SoundMarker,
    force = false
  ): void {
    const { playedSounds = new Set() } = stateParams;
    if (!(PS.stage.sound.get(key) && playedSounds.has(key)) || force) {
      PS.stage.sound.play(key, extra);
      if (!stateParams.playedSounds) {
        stateParams.playedSounds = new Set();
      }
      stateParams.playedSounds!.add(key);
    }
  }

  protected playSound(
    key: AudioKey,
    extra?: Phaser.Types.Sound.SoundConfig | Phaser.Types.Sound.SoundMarker,
    force = false
  ): void {
    this.stateManager.dispatchEvent('playSound', key, extra, force);
  }

  protected isCurrentState(state: S): boolean {
    return this.stateManager.current.key === state;
  }

  protected isCommandExecuted(command: Command): boolean {
    return command.isExecuted(this.playerIndex, this._orientation.x);
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

export class BaseCharacterWithFrameDefinition<
  S extends string = string,
  D extends StateDefinition = StateDefinition
> extends BaseCharacter<S, D> {
  protected frameDefinitionMap: FrameDefinitionMap;
  protected colliderManager: FrameDefinitionColliderManager;

  constructor(playerIndex = 0, frameDefinitionMap: FrameDefinitionMap) {
    super(playerIndex);
    this.frameDefinitionMap = frameDefinitionMap;
    this.colliderManager = new FrameDefinitionColliderManager(this, this.frameDefinitionMap, () => {
      const { currentFrame: frame, currentAnim: anim } = this.sprite.anims;
      const animKey = anim.key.split('-')[1];
      if (this.frameDefinitionMap.frameDef[animKey]) {
        return {
          index: getFrameIndexFromSpriteIndex(this.frameDefinitionMap.frameDef[animKey].animDef, frame.index),
          direction: { x: !this.sprite.flipX, y: true },
          frameKey: animKey
        };
      } else {
        return null;
      }
    });
  }

  protected setupSprite(): void {
    super.setupSprite();
    addAnimationsByDefinition(this.sprite, this.frameDefinitionMap);
  }

  protected playAnimation(key: string, params: { force?: boolean; startFrame?: number } = {}) {
    playAnimation(this.sprite, [this.frameDefinitionMap.name, key].join('-'), params);
  }

  protected get currentAnimation(): string {
    return this.sprite.anims.currentAnim.key.split('-')[1];
  }
}
