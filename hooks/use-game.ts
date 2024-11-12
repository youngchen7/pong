import { useUser } from "./use-user";

type Params = {
    roomId: string
}

type Game = {
    // State
    isHost: boolean,
    isPlayer: boolean,
    isSpectator: boolean,
    state: 'ready' | 'playing' | 'paused'
    // Functions
    start: () => void
    pause: () => void
    // Callbacks
}

export function useGame({ roomId }: Params) {
    const { user } = useUser()
}