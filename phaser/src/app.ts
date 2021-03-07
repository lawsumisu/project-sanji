import * as Phaser from 'phaser';
import { DebugDrawPlugin } from 'src/plugins/debug.plugin';
import { GameInputPlugin } from 'src/plugins/gameInput.plugin';
import { Stage } from 'src/stage';
import { PS } from 'src/global';
import { KeyboardPluginPS } from 'src/plugins/keyboard.plugin';

const config = PS.config;
const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  // parent: 'phaser-example',
  width: config.width,
  height: config.height,
  render: {
    antialias: false,
  },
  scene: Stage,
  input: {
    gamepad: true,
  },
  plugins: {
    scene: [
      { key: 'debugDraw', plugin: DebugDrawPlugin, mapping: 'debugDraw' },
      { key: 'GI', plugin: GameInputPlugin, mapping: 'GI' },
      { key: 'keyboard', plugin: KeyboardPluginPS, mapping: 'keyboard' }
    ],
  },
};

new Phaser.Game(gameConfig);
