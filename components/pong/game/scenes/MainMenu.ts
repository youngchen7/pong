import { GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";
import { REALTIME_LISTEN_TYPES, RealtimeChannel } from "@supabase/supabase-js";
import supabaseClient from "../../../../client";
import { Payload } from "../../../../types";
import { throws } from "assert";

export class MainMenu extends Scene {
  background!: GameObjects.Image;
  title!: GameObjects.Text;
  logoTween!: Phaser.Tweens.Tween | null;

  otherPaddle!: GameObjects.Rectangle;
  ourPaddle!: GameObjects.Rectangle;
  leftWall!: GameObjects.Line;
  rightWall!: GameObjects.Line;

  gameChannel?: RealtimeChannel;

  constructor() {
    super("MainMenu");
  }

  connectRealtime(roomId: string, userId: string) {
    if (this.gameChannel) return;
    this.gameChannel = supabaseClient
      .channel(`pong-events:${roomId}`)
      .on(
        REALTIME_LISTEN_TYPES.BROADCAST,
        { event: "POS" },
        (payload: Payload<{ user_id: string; x: number }>) => {
          if (payload.payload && payload.payload.user_id !== userId) {
            this.otherPaddle.x = 600 - payload.payload?.x;
          }
        }
      )
      .subscribe();
  }

  create() {
    this.otherPaddle = this.add
      .rectangle(80, 20, 80, 10, 0xffffff, 1.0)
      .setDepth(100);

    this.ourPaddle = this.add
      .rectangle(80, 780, 80, 10, 0xffffff, 1.0)
      .setDepth(100);

    this.leftWall = this.add.line(1, 400, 1, 0, 1, 800, 0xffffff);
    this.leftWall = this.add.line(599, 400, 1, 0, 1, 800, 0xffffff);

    const roomId = this.game.registry.get("roomId");
    const userId = this.game.registry.get("userId");
    this.connectRealtime(roomId, userId);

    // this.title = this.add
    //   .text(512, 460, "Main Menu", {
    //     fontFamily: "Arial Black",
    //     fontSize: 38,
    //     color: "#ffffff",
    //     stroke: "#000000",
    //     strokeThickness: 8,
    //     align: "center",
    //   })
    //   .setOrigin(0.5)
    //   .setDepth(100);

    EventBus.emit("current-scene-ready", this);
  }

  movePaddle(x: number, userId: string) {
    const newX = Math.min(Math.max(this.ourPaddle.x + x, 50), 550);
    this.gameChannel?.send({
      type: "broadcast",
      event: "POS",
      payload: {
        user_id: userId,
        x: newX,
      },
    });
    this.ourPaddle.setX(newX);
  }

  changeScene() {
    if (this.logoTween) {
      this.logoTween.stop();
      this.logoTween = null;
    }

    this.scene.start("Game");
  }
}
