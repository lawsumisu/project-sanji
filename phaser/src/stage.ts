import * as Phaser from 'phaser';
import { DebugDrawPlugin } from 'src/plugins/debug.plugin';
import { GameInputPlugin } from 'src/plugins/gameInput.plugin';
import { Player } from 'src/player';

export class Stage extends Phaser.Scene {
  p1: Player;

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
    this.p1 = new Player(this);
  }


  public preload(): void {
    this.load.multiatlas('vanessa', 'assets/vanessa.json', 'assets');
  }

  public create(): void {
    this.cameras.main.setBounds(0, 0, 1500, 1200);
    this.p1.create();
  }

  public update(time: number, delta: number): void {
    this.draw();
    this.p1.update({ time, delta: delta / 1000 })
  }

  public get debug(): DebugDrawPlugin {
    return (<any>this.sys).debug;
  }

  public get gameInput(): GameInputPlugin {
    return (<any>this.sys).GI;
  }

  private draw(): void {
    // TODO
  }
}