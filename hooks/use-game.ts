import { useEffect, useState } from "react";
import supabaseClient from "../client";
import { useUser } from "./use-user";

type Game =
  | {
      // State
      loading: false;
      error: false;
      isHost: boolean;
      isPlayer: boolean;
      isSpectator: boolean;
      state?: "ready" | "playing" | "paused";
      // Functions
      start: () => void;
      pause: () => void;
      selectPlayer: (userId: string) => void;
      // Callbacks
    }
  | {
      loading: true;
      error: boolean;
    }
  | {
      loading: boolean;
      error: true;
    };

type GameData = {
  id: number;
  created_at: Date;
  room_id: string;
  host_id: string;
  player_id: string | null;
  state: "ready" | "playing" | "paused";
};

const loadGame = async ({
  roomId,
  onSuccess,
  onError,
}: {
  roomId: string;
  onSuccess: (data: GameData) => void;
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

type Params = {
  roomId?: string;
};

export function useGame({ roomId }: Params): Game {
  const { user } = useUser();
  const [game, setGame] = useState<GameData>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    loadGame({
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

  if (!user || !game) {
    return {
      loading: true,
      error,
    };
  }

  if (error) {
    return {
      loading: !!user && !!game,
      error: true,
    };
  }

  return {
    loading: false,
    error: false,
    isHost: game.host_id === user.id,
    isPlayer: game.player_id === user.id,
    isSpectator: game.host_id !== user.id && game.player_id !== user.id,
    state: game.state,
    start: () => {},
    pause: () => {},
    selectPlayer: () => {},
  };
}
