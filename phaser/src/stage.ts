import * as Phaser from 'phaser';
import { DebugDrawPlugin } from 'src/plugins/debug.plugin';
import { GameInputPlugin } from 'src/plugins/gameInput.plugin';

export class Stage extends Phaser.Scene {
  // TODO

  public preload(): void {
    // TODO
  }

  public create(): void {
    this.cameras.main.setBounds(0, 0, 1500, 1200);
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

  protected draw(): void {
    // TODO
  }

}