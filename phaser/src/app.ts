import * as Phaser from 'phaser';
import { DebugDrawPlugin } from 'src/plugins/debug.plugin';
import { GameInputPlugin } from 'src/plugins/gameInput.plugin';
import { Stage } from './stage';

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 1000,
  height: 800,
  scene: Stage,
  input: {
    gamepad: true,
  },
  plugins: {
    scene: [
      { key: 'debug', plugin: DebugDrawPlugin, mapping: 'debug' },
      { key: 'GI', plugin: GameInputPlugin, mapping: 'GI' },
    ],
  },
};

new Phaser.Game(gameConfig);
