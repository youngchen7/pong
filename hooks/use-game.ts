import { useCallback, useEffect, useState } from "react";
import supabaseClient from "../client";
import { useUser } from "./use-user";
import {
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  RealtimeChannel,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";

type Game =
  | {
      // State
      success: true;
      loading: false;
      error: false;
      hostId: string;
      playerId: string | null;
      state?: "ready" | "playing" | "paused";
      // Functions
      start: () => void;
      pause: () => void;
      setPlayer: (userId: string) => void;
    }
  | {
      success: false;
      loading: true;
      error: boolean;
    }
  | {
      success: false;
      loading: boolean;
      error: true;
    };

type GameDataRow = {
  id: number;
  created_at: Date;
  room_id: string;
  host_id: string;
  player_id: string | null;
  state: "ready" | "playing" | "paused";
};

const loadGameRow = async ({
  roomId,
  onSuccess,
  onError,
}: {
  roomId: string;
  onSuccess: (data: GameDataRow) => void;
  onError?: () => void;
}) => {
  const data = await supabaseClient
    .from("game")
    .select()
    .filter("room_id", "eq", roomId)
    .limit(1);

  if (data.error) {
    onError?.();
  } else {
    onSuccess(data.data[0]);
  }
};

const updateGameRow = async ({
  roomId,
  playerId,
  state,
  onSuccess,
  onError,
}: {
  roomId: string;
  playerId?: string;
  state?: "ready" | "playing" | "paused";
  onSuccess: (data: GameDataRow) => void;
  onError?: () => void;
}) => {
  const data = await supabaseClient
    .from("game")
    .update({ player_id: playerId, state })
    .eq("room_id", roomId)
    .select();
  if (data.error) {
    onError?.();
  } else {
    onSuccess(data.data[0]);
  }
};

type Params = {
  roomId?: string;
};

export function useGame({ roomId }: Params): Game {
  const { user } = useUser();
  const [game, setGame] = useState<GameDataRow>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    loadGameRow({
      roomId,
      onSuccess: (data) => {
        console.log(data);
        setGame(data);
      },
      onError: () => {
        setError(true);
      },
    });
  }, [roomId]);

  // Listen to changes to the game row in the database.
  useEffect(() => {
    if (!roomId) return;
    const gameChannel = supabaseClient
      .channel(`pon--game:${roomId}`)
      .on(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE,
          schema: "public",
          table: "game",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: RealtimePostgresUpdatePayload<GameDataRow>) => {
          setGame(payload.new);
        }
      )
      .subscribe();
    return () => {
      gameChannel && supabaseClient.removeChannel(gameChannel);
    };
  }, [roomId]);

  if (!user || !game) {
    return {
      success: false,
      loading: true,
      error,
    };
  }

  if (error) {
    console.log("Error loading game", error);
    return {
      success: false,
      loading: !!user && !!game,
      error: true,
    };
  }

  return {
    success: true,
    loading: false,
    error: false,
    hostId: game.host_id,
    playerId: game.player_id,
    state: game.state,
    start: () => {
      if (!game) return;
      console.log("Starting game");
      updateGameRow({
        roomId: game.room_id,
        state: "playing",
        onSuccess: (data) => {
          setGame(data);
        },
        onError: () => {
          setError(true);
        },
      });
    },
    pause: () => {
      if (!game) return;
      console.log("Pausing game");
      updateGameRow({
        roomId: game.room_id,
        state: "paused",
        onSuccess: (data) => {
          setGame(data);
        },
        onError: () => {
          setError(true);
        },
      });
    },
    setPlayer: (userId: string) => {
      if (!game) return;
      console.log(`Setting player 2 to: ${userId}`);
      updateGameRow({
        roomId: game.room_id,
        playerId: userId,
        onSuccess: (data) => {
          setGame(data);
        },
        onError: () => {
          setError(true);
        },
      });
    },
  };
}
