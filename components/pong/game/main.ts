import { Boot } from "./scenes/Boot";
import { GameOver } from "./scenes/GameOver";
import { Game as MainGame } from "./scenes/Game";
import { MainMenu } from "./scenes/MainMenu";
import { AUTO, Game } from "phaser";
import { Preloader } from "./scenes/Preloader";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 600,
  height: 800,
  parent: "game-container",
  render: {
    transparent: true,
  },
  scene: [MainMenu],
};

const StartGame = (parent: string, roomId: string, userId: string) => {
  return new Game({
    ...config,
    parent,
    callbacks: {
      preBoot: (game) => game.registry.merge({ roomId, userId }),
    },
  });
};

export default StartGame;
