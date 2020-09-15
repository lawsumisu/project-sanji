import * as Phaser from 'phaser';
import { DebugDrawPlugin } from 'src/plugins/debug.plugin';
import { GameInputPlugin } from 'src/plugins/gameInput.plugin';

export class Stage extends Phaser.Scene {
  // TODO
  p1Sprite: Phaser.GameObjects.Sprite;

  public preload(): void {
    this.load.multiatlas('vanessa', 'assets/vanessa.json', 'assets');
  }

  public create(): void {
    this.cameras.main.setBounds(0, 0, 1500, 1200);

    // TODO create player object
    this.p1Sprite = this.add.sprite(100, 100, 'vanessa', 'idle/11.png');
    this.addAnimation('idle', 6, 'idle', 10);
    this.p1Sprite.anims.play('idle');
  }

  public update(time: number, delta: number): void {
    this.draw();
  }

  public get debug(): DebugDrawPlugin {
    return (<any>this.sys).debug;
  }

  public get gameInput(): GameInputPlugin {
    return (<any>this.sys).gameInput;
  }

  private draw(): void {
    // TODO
  }

  private addAnimation(key: string, count: number, prefix: string, frameRate: number, repeat: number = -1): void {
    const frames = this.p1Sprite.anims.animationManager.generateFrameNames('vanessa', {
      start: 1,
      end: count,
      zeroPad: 2,
      prefix: `${prefix}/`,
      suffix: '.png'
    });
    this.p1Sprite.anims.animationManager.create({ key, frames, frameRate, repeat });
  }
}