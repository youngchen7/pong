import { useEffect, useState } from "react";
import supabaseClient from "../client";
import { useUser } from "./use-user";

type Game =
  | {
      // State
      success: true;
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

const loadGame = async ({
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

type Params = {
  roomId?: string;
};

export function useGame({ roomId }: Params): Game {
  const { user } = useUser();
  const [game, setGame] = useState<GameDataRow>();
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
    isHost: game.host_id === user.id,
    isPlayer: game.player_id === user.id,
    isSpectator: game.host_id !== user.id && game.player_id !== user.id,
    state: game.state,
    start: () => {},
    pause: () => {},
    selectPlayer: () => {},
  };
}
