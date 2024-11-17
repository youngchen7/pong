import {
  REALTIME_LISTEN_TYPES,
  REALTIME_PRESENCE_LISTEN_EVENTS,
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimeChannelSendResponse,
} from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import supabaseClient from "../client";
import { useRouter } from "next/router";
import { useGame } from "./use-game";
import { useUser } from "./use-user";

type Player = {
  name: string;
  playerType: PlayerType;
  user_id: string;
};

export const enum PlayerType {
  // Player One
  HOST = "Host",
  // Player Two
  PLAYER = "Player",
  // Ignore
  SPECTATOR = "Spectator",
}

type Params = {
  roomId?: string;
};

export function usePlayers({ roomId }: Params) {
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const roomChannelRef = useRef<RealtimeChannel>();
  const { user } = useUser();
  const game = useGame({ roomId });

  let playerType: PlayerType | undefined;
  if (game.success) {
    if (game.isHost) {
      playerType = PlayerType.HOST;
    } else if (game.isPlayer) {
      playerType = PlayerType.PLAYER;
    } else if (game.isSpectator) {
      playerType = PlayerType.SPECTATOR;
    }
  }

  useEffect(() => {
    if (!roomId || !user || !router.isReady) return;

    let roomChannel: RealtimeChannel;

    roomChannel = supabaseClient.channel(`pong:${roomId}`, {
      config: { presence: { key: user.id } },
    });
    roomChannel.on(
      REALTIME_LISTEN_TYPES.PRESENCE,
      { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC },
      () => {
        const state = roomChannel.presenceState();
        console.log("sync:" + JSON.stringify(state, undefined, 4));
        setPlayers(
          Object.values(state).map(([player]) => player as unknown as Player)
        );
      }
    );

    roomChannel.subscribe(async (status: `${REALTIME_SUBSCRIBE_STATES}`) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        const resp: RealtimeChannelSendResponse = await roomChannel.track({
          user_id: user.id,
          name,
          playerType,
        });

        if (resp === "ok") {
          console.log("Subscribed");
          roomChannelRef.current = roomChannel;
        } else {
          router.push(`/pong`);
        }
      }
    });

    // Must properly remove subscribed channel
    return () => {
      roomChannel && supabaseClient.removeChannel(roomChannel);
      roomChannelRef.current = undefined;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roomId, setPlayers]);

  return {
    players,
    setPlayerName: (name: string) => {
      if (roomChannelRef.current && user) {
        void roomChannelRef.current.track({
          user_id: user.id,
          name,
          playerType,
        });
      }
    },
  };
}
