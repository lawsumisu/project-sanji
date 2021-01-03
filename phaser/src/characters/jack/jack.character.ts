import { CommonCharacter } from 'src/characters/common';
import jack from 'src/characters/jack/jack.frame.json';
import { PS } from 'src/global';

export default class Jack extends CommonCharacter<never, {}> {
  constructor(playerIndex = 0) {
    super(playerIndex, jack, 'jack');
  }

  public preload(): void {
    super.preload();
    PS.stage.load.multiatlas('hugo', 'characters/jack/sprites/hugo.json', 'characters/jack/sprites');
  }
}