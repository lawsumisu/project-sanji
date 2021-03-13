import { StateDefinition, StateManager } from 'src/state';
import { Vector2 } from '@lawsumisu/common-utilities';
import { InputHistory } from 'src/plugins/gameInput.plugin';
import * as _ from 'lodash';
import { addAnimationsByDefinition, FrameDefinitionMap } from 'src/characters/frameData';
import { Command } from 'src/command/';
import { PS } from 'src/global';
import { StageObject, UpdateParams } from 'src/stage/stageObject';
import { Hit } from 'src/collider';
import { Unit } from 'src/unit';
import * as Phaser from 'phaser';
import { playAnimation } from 'src/utilitiesPF/animation.util';
import {
  ColliderManager,
  FrameDefinitionColliderManager,
} from 'src/collider/manager';
import { AudioKey } from 'src/assets/audio';
import { Vfx } from 'src/vfx';
import paletteFragShader from 'src/shaders/palette.frag';


class ColorSwapPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game: Phaser.Game) {
    super({
      game: game,
      fragShader: paletteFragShader
    });
  }
}

export interface CommandTrigger<S extends string> {
  command: Command;
  trigger?: () => boolean | (() => boolean);
  state: S;
  stateParams?: { [key: string]: unknown };
  priority?: number;
}

export interface CharacterConfig {
  playerIndex: number;
  palette: {
    name: string;
    index: number;
  };
}

export class BaseCharacter<S extends string = string, D extends StateDefinition = StateDefinition> extends StageObject {
  protected stateManager: StateManager<S, D>;
  protected colliderManager: ColliderManager;
  protected nextStates: Array<{ state: S; executionTrigger: () => boolean; stateParams: object }> = [];
  protected defaultState: S;

  protected walkSpeed = 75;
  protected runSpeed = 125;
  protected dashSpeed = 175;
  protected jumpSpeed = 150;
  protected airSpeed = this.walkSpeed;
  protected gravity = 450;

  public readonly playerIndex: number;
  public readonly paletteIndex: number;
  public readonly paletteName: string;
  protected target: StageObject;

  protected commandList: Array<CommandTrigger<S>> = [];

  protected states: { [key in S]?: D };
  protected audioKeys: AudioKey[] = [];
  protected playedAnimationSounds = new Set();

  constructor(config: Partial<CharacterConfig> = {}) {
    super();
    const { playerIndex = 0, palette = { name: '', index: 0 } } = config;
    this.colliderManager = new ColliderManager();
    this.playerIndex = playerIndex;
    this.paletteIndex = palette.index;
    this.paletteName = [palette.name, 'palette'].join('-');
    this.stateManager = new StateManager<S, D>();
    this.stateManager.onBeforeTransition((key: S) => this.beforeStateTransition(key));
    this.stateManager.onAfterTransition((config, params) => this.afterStateTransition(config, params));
  }

  public get pushbox(): Phaser.Geom.Rectangle {
    return this.colliderManager.getPushbox(this.position);
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
    if (this.paletteIndex >= 0) {
      this.setupPalette(this.paletteIndex);
    }
  }

  public applyHitToSelf(hit: Hit, hitBy: StageObject): void {
    super.applyHitToSelf(hit, hitBy);
    this.freezeFrames = hit.hitstop[1];
    this.addVfx(Vfx.shake(this.sprite, new Vector2(1, 0), 3, this.freezeFrames));
  }

  public applyHitToTarget(hit: Hit, stageObject: StageObject): void {
    super.applyHitToTarget(hit, stageObject);
    this.freezeFrames = hit.hitstop[0];
  }

  public setTarget(stageObject: StageObject): void {
    this.target = stageObject;
  }

  public update(params: UpdateParams): void {
    super.update(params);
    this.updateState();
    if (!this.hasFreezeFrames) {
      this.updateKinematics(params.delta);
      this.updateSprite();
    }
  }

  protected updateState(): void {
    this.checkInputs();
    if (this.hasFreezeFrames) {
      this.sprite.anims.pause();
    } else {
      this.sprite.anims.resume();
      this.goToNextState();
      this.stateManager.update();
      this.updateCollider();
    }
  }

  protected updateCollider(): void {
    this.colliderManager.update({});
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

  protected checkInputs(): void {
    for (const { command, trigger = () => true, state, stateParams = {} } of this.commandList) {
      if (this.isCommandExecuted(command)) {
        const canTransition = trigger();
        if (_.isFunction(canTransition)) {
          // chainable state, so add to queue
          this.queueNextState(state, stateParams, canTransition);
          break;
        } else if (canTransition && !this.isCurrentState(state)) {
          // Immediately transition to next state.
          this.hasFreezeFrames ? this.queueNextState(state, stateParams) : this.goToNextState(state, stateParams);
          console.log(command.toString());
          break;
        }
      }
    }
  }

  protected setupSprite(): void {
    this._sprite = PS.stage.add.sprite(this.position.x, this.position.y, '');
    this.sprite.depth = 20;
  }

  protected setupPalette(paletteIndex: number): void {
    const swatchSize = 2;
    const swapPaletteName = [this.paletteName, paletteIndex].join('-');
    const { game } = PS.stage;
    if (game.textures.exists(this.paletteName) && !game.textures.exists(swapPaletteName)) {
      (game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines.add(
        swapPaletteName,
        new ColorSwapPipeline(game)
      );

      this.sprite.setPipeline(swapPaletteName);
      const canvasTexture = game.textures.createCanvas(swapPaletteName, 256, 256);
      const canvas = canvasTexture.getSourceImage() as HTMLCanvasElement;
      const context = canvas.getContext('2d') as CanvasRenderingContext2D;
      const { width, height } = game.textures.get(this.paletteName).getSourceImage();

      const numPalettes = height / swatchSize;

      const h = height / numPalettes;
      const imageData = context.getImageData(0, 0, 256, 256);

      function drawPixel(x: number, y: number, color: Phaser.Display.Color) {
        let index = (x + y * 256) * 4;
        const { red, green, blue, alpha } = color;
        imageData.data[index] = red;
        imageData.data[index + 1] = green;
        imageData.data[index + 2] = blue;
        imageData.data[index + 3] = alpha;
      }

      for (let x = 0; x < width; x += swatchSize) {
        for (let y = 0; y < h; y += swatchSize) {
          const originalColor = game.textures.getPixel(x, y, this.paletteName);
          const paletteColor = game.textures.getPixel(x, y + h * paletteIndex, this.paletteName);
          const { red, blue } = originalColor;
          drawPixel(blue, red, paletteColor);
        }
      }
      // Put modified pixel data back into the context.
      context.putImageData(imageData, 0, 0);
      const { pipeline } = this.sprite;
      const texture = game.textures.addCanvas('', canvas, true);
      pipeline.set1i('uPaletteTexture', pipeline.renderer.currentActiveTexture);
      pipeline.renderer.setTexture2D(texture.source[0].glTexture);
      const { gl } = pipeline.renderer;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    } else if (!game.textures.exists(this.paletteName)) {
      console.warn(`Palette not found for ${this.paletteName.split('-')[0]}.`);
    }
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

  protected beforeStateTransition(_nextKey: S): void {
    this.playedAnimationSounds.clear();
  }

  protected playSoundForAnimation(
    key: AudioKey,
    extra?: Phaser.Types.Sound.SoundConfig | Phaser.Types.Sound.SoundMarker,
    force = false
  ) {
    const animationSoundKey = `${this.currentAnimation}-${this.sprite.anims.currentFrame.index}`;
    if (!this.playedAnimationSounds.has(animationSoundKey) || force) {
      this.playedAnimationSounds.add(animationSoundKey);
      PS.stage.playSound(key, extra);
    }
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

  constructor(playerIndex = 0, paletteIndex = 0, frameDefinitionMap: FrameDefinitionMap) {
    super({ playerIndex, palette: { name: frameDefinitionMap.name, index: paletteIndex } });
    this.frameDefinitionMap = frameDefinitionMap;
    this.colliderManager = new FrameDefinitionColliderManager(this, this.frameDefinitionMap);
  }

  protected updateSprite(): void {
    super.updateSprite();
    const frames = this.frameDefinitionMap.frameDef[this.currentAnimation]!.animDef.frames;
    if (_.isArray(frames)) {
      const animFrame = frames[this.sprite.anims.currentFrame.index - 1];
      // TODO remove non-null check once loop logic is removed from animations
      if (animFrame && !_.isNumber(animFrame)) {
        if (animFrame.sfx && this.audioKeys.includes(animFrame.sfx as AudioKey)) {
          this.playSoundForAnimation(animFrame.sfx as AudioKey);
        }
      }
    }
  }

  protected updateCollider(): void {
    this.colliderManager.update(this.sprite);
  }

  protected setupSprite(): void {
    super.setupSprite();
    addAnimationsByDefinition(this.sprite, this.frameDefinitionMap);
  }

  protected playAnimation(key: string, params: { force?: boolean; startFrame?: number } = {}) {
    playAnimation(this.sprite, key, params);
  }

  protected get currentAnimation(): string {
    return this.sprite.anims.currentAnim.key;
  }
}
