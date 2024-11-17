import { useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { nanoid } from "nanoid";
import { Badge, Button, IconArrowLeft, IconCopy, IconUser, Input } from "@supabase/ui";

import Loader from "../../../components/Loader";
import LatencyBadge from "../../../components/LatencyBadge";
import { useGame } from "../../../hooks/use-game";
import { PlayerType, usePlayers } from "../../../hooks/use-players";
import { useUser } from "../../../hooks/use-user";

// Generate a random user id
const userId = nanoid();

const Room: NextPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const roomId = Array.isArray(slug) ? slug[0] : undefined;

  const [name, _setName] = useState("Guest");

  const { user } = useUser();
  const game = useGame({ roomId });
  const { players, setPlayerName } = usePlayers({ roomId });
  const ourPlayer = players.find((p) => p.user_id === user?.id);

  const setName = (name: string) => {
    _setName(name);
    setPlayerName(name);
  };

  if (!roomId || !ourPlayer) {
    return <Loader />;
  }

  return (
    <div
      className={[
        "h-screen w-screen p-4 flex flex-col justify-between relative",
        "max-h-screen max-w-screen overflow-hidden",
      ].join(" ")}
    >
      <div
        className="absolute h-full w-full left-0 top-0 pointer-events-none"
        style={{
          opacity: 0.02,
          backgroundSize: "16px 16px",
          backgroundImage:
            "linear-gradient(to right, gray 1px, transparent 1px),\n    linear-gradient(to bottom, gray 1px, transparent 1px)",
        }}
      />
      <div className="flex flex-col h-full justify-end">
        <div className="flex items-end justify-between">
          <div className="flex flex-col space-y-2">
            {players
              .filter((p) => p.user_id !== userId)
              .map((p) => (
                <>
                  <Input
                    disabled
                    className="border-none"
                    actions={<Badge color={p.playerType === PlayerType.HOST ? "red" : "green"}>{p.playerType}</Badge>}
                    size="tiny"
                    icon={<IconUser size={12} />}
                    value={p.name}
                  />
                </>
              ))}
            <Input
              actions={
                <Badge color={ourPlayer.playerType === PlayerType.HOST ? "red" : "green"}>{ourPlayer.playerType}</Badge>
              }
              size="tiny"
              icon={<IconUser size={12} />}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="absolute top-5 right-5">
        <Button
          className="absolute top-0 left-0"
          icon={
            <IconCopy
              strokeWidth={2}
              size={18}
              onClick={() => {
                navigator.clipboard.writeText(roomId);
              }}
            />
          }
        >
          {roomId}
        </Button>
      </div>
      <div className="absolute top-5 left-5">
        <Button
          className="absolute top-0 left-0"
          icon={<IconArrowLeft strokeWidth={2} size={18} />}
          onClick={() => router.push("/pong/lobby")}
        />
      </div>
      <LatencyBadge />
    </div>
  );
};

export default Room;
