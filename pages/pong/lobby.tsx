import { NextPage } from "next";
import { Button, Input, Loading, Modal } from "@supabase/ui";
import { useRouter } from "next/router";
import { useCreateGame } from "../../hooks/use-create-game";
import { useUser } from "../../hooks/use-user";
import { useState } from "react";
import LatencyBadge from "../../components/LatencyBadge";

const Lobby: NextPage = () => {
  const router = useRouter();
  const { createGame, loading } = useCreateGame({
    onCreated: (roomId: string) => {
      router.push(`/pong/game/${roomId}`);
    },
  });
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const { user } = useUser();

  return (
    <div
      className={[
        "h-screen w-screen p-4 flex justify-center items-center relative",
        "max-h-screen max-w-screen overflow-hidden",
      ].join(" ")}
    >
      <Modal
        size="tiny"
        title="Join Game"
        description="Enter the 6 digit room code"
        visible={joinOpen}
        onCancel={() => setJoinOpen(false)}
        onConfirm={() => router.push(`/pong/game/${joinInput}`)}
        confirmText="Join"
      >
        <Input
          value={joinInput}
          onChange={(e) =>
            setJoinInput(
              e.target.value
                .toUpperCase()
                .slice(0, 6)
                .replaceAll(/[^A-Z0-9]]/g, "")
            )
          }
        ></Input>
      </Modal>
      <div
        className="absolute h-full w-full left-0 top-0 pointer-events-none"
        style={{
          opacity: 0.02,
          backgroundSize: "16px 16px",
          backgroundImage:
            "linear-gradient(to right, gray 1px, transparent 1px),\n    linear-gradient(to bottom, gray 1px, transparent 1px)",
        }}
      />
      <div className="flex flex-col flex-col-2 items-center gap-4 w-fit">
        <h1 className="text-white text-6xl">PONG</h1>
        {user ? (
          <>
            <Button block type="primary" size="xlarge" onClick={() => createGame(user.id)} loading={loading}>
              Create
            </Button>
            <Button block type="default" size="xlarge" onClick={() => setJoinOpen(true)}>
              Join
            </Button>
          </>
        ) : (
          <Loading active>{""}</Loading>
        )}
      </div>
      <LatencyBadge />
    </div>
  );
};

export default Lobby;
