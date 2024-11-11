import { NextPage } from "next";
import { useUserId } from "../../hooks/use-user-id";
import { Badge, Button } from "@supabase/ui";
import { useLatency } from "../../hooks/use-latency";
import { useRouter } from "next/router";
import { useCreateGame } from "../../hooks/use-create-game";

const Lobby: NextPage = () => {
    const router = useRouter()

    const { createGame, loading } = useCreateGame({
        onCreated: (roomId: string) => {
            router.push(`/pong/${roomId}`)
        }
    })

    const [userId, resetUserId] = useUserId()
    const latency = useLatency()

    return (
        <div
            className={[
                'h-screen w-screen p-4 flex justify-center items-center relative',
                'max-h-screen max-w-screen overflow-hidden',
            ].join(' ')}
        >
            <div
                className="absolute h-full w-full left-0 top-0 pointer-events-none"
                style={{
                    opacity: 0.02,
                    backgroundSize: '16px 16px',
                    backgroundImage:
                        'linear-gradient(to right, gray 1px, transparent 1px),\n    linear-gradient(to bottom, gray 1px, transparent 1px)',
                }}
            />
            <div className='flex flex-col flex-col-2 items-center gap-4 w-fit'>
                <h1 className="text-white text-6xl">PONG</h1>
                <Button block type='primary' size='xlarge' onClick={() => createGame(userId)} loading={loading}>Create</Button>
                <Button block type='default' size='xlarge'>Join</Button>
            </div>
            <div className='absolute right-0 bottom-0 p-2' onDoubleClick={resetUserId}>
                <Badge color="gray">{latency}ms // {userId}</Badge>
            </div>
        </div>
    )
}

export default Lobby
