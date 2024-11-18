"use client";

import { useEffect, useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "./game/PhaserGame";
import { MainMenu } from "./game/scenes/MainMenu";
import { useUser } from "../../hooks/use-user";
import { Scene } from "phaser";

type Props = {
  roomId: string;
};

function Pong({ roomId }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { user } = useUser();

  // The sprite can only be moved in the MainMenu Scene
  const [canMoveSprite, setCanMoveSprite] = useState(true);

  //  References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0 });

  const movePaddle = (x: number) => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene as MainMenu;

      if (scene && user) {
        scene.movePaddle(x, user.id);
      }
    }
  };

  const changeScene = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene as MainMenu;

      if (scene) {
        scene.changeScene();
      }
    }
  };

  const addSprite = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene;

      if (scene) {
        // Add more stars
        const x = Phaser.Math.Between(64, scene.scale.width - 64);
        const y = Phaser.Math.Between(64, scene.scale.height - 64);

        //  `add.sprite` is a Phaser GameObjectFactory method and it returns a Sprite Game Object instance
        const star = scene.add.sprite(x, y, "star");

        //  ... which you can then act upon. Here we create a Phaser Tween to fade the star sprite in and out.
        //  You could, of course, do this from within the Phaser Scene code, but this is just an example
        //  showing that Phaser objects and systems can be acted upon from outside of Phaser itself.
        scene.add.tween({
          targets: star,
          duration: 500 + Math.random() * 1000,
          alpha: 0,
          yoyo: true,
          repeat: -1,
        });
      }
    }
  };

  // Event emitted from the PhaserGame component
  const currentScene = (scene: Phaser.Scene) => {
    setCanMoveSprite(scene.scene.key !== "MainMenu");
  };

  if (!user) return null;

  return (
    <div
      id="pointer-lock-container"
      ref={containerRef}
      onMouseMove={(e) => {
        if ("id" in e.target && e.target.id === "pointer-lock-container") {
          movePaddle(e.movementX);
        }
      }}
      onClick={() => {
        containerRef.current?.requestPointerLock();
      }}
    >
      <PhaserGame
        ref={phaserRef}
        currentActiveScene={currentScene}
        roomId={roomId}
        userId={user.id}
      />
    </div>
  );
}

export default Pong;
