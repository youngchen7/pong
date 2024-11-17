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
  name: string;
  roomId?: string;
};

export function usePlayers({ roomId, name }: Params) {
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const roomChannelRef = useRef<RealtimeChannel>();
  const { user } = useUser();
  const game = useGame({ roomId });

  let playerType: PlayerType | undefined;
  if (game.success && user) {
    if (game.hostId === user.id) {
      playerType = PlayerType.HOST;
    } else if (game.playerId === user.id) {
      playerType = PlayerType.PLAYER;
    } else {
      playerType = PlayerType.SPECTATOR;
    }
  }

  useEffect(() => {
    if (!roomId || !user || !router.isReady) return;

    const roomChannel = supabaseClient
      .channel(`pong-players:${roomId}`, {
        config: { presence: { key: user.id } },
      })
      .on(
        REALTIME_LISTEN_TYPES.PRESENCE,
        { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC },
        () => {
          const state = roomChannel.presenceState();
          console.log("sync:" + JSON.stringify(state, undefined, 4));
          setPlayers(
            Object.values(state).map(([player]) => player as unknown as Player)
          );
        }
      )
      .subscribe(async (status: `${REALTIME_SUBSCRIBE_STATES}`) => {
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
            router.push(`/pong/lobby`);
          }
        }
      });

    // Must properly remove subscribed channel
    return () => {
      roomChannel && supabaseClient.removeChannel(roomChannel);
      roomChannelRef.current = undefined;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roomId, setPlayers, playerType]);

  // Auto-select player two any time the list of players changes
  // and nobody is the player
  useEffect(() => {
    // If the game hasn't loaded successfully, or we have less than two players.
    // There's no point trying to select a player two.
    if (!user || !game.success || players.length < 2) return;

    // Not allowed to update game if you're not the host.
    if (user.id !== game.hostId) return;

    const otherPlayers = players.filter((p) => p.user_id !== user.id);
    if (otherPlayers.every((p) => p.user_id !== game.playerId)) {
      game.setPlayer(otherPlayers[0].user_id);
    }
  }, [user, game, players]);

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
