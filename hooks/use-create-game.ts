import { useCallback, useState } from "react";
import supabaseClient from "../client";
import { customAlphabet } from 'nanoid'

const roomid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)

export function useCreateGame({ onCreated, onError }: { onCreated: (id: string) => void, onError?: () => void }) {
    const [loading, setLoading] = useState(false)
    const createGame = useCallback(async (userId: string) => {
        const roomId = roomid()

        setLoading(true)

        const response = await supabaseClient.from('game').insert([
            {
                room_id: roomId,
                host_id: userId,
            }
        ])

        if (response.error) {
            onError?.()
        } else {
            onCreated(roomId)
        }


        setLoading(false)
    }, [])
    return { createGame, loading }
}