import { REALTIME_SUBSCRIBE_STATES, RealtimeChannel } from "@supabase/supabase-js"
import supabaseClient from "../client"
import { useEffect, useState } from "react"
import { useUser } from "./use-user"

export function useLatency() {

    const { user } = useUser()
    const [latency, setLatency] = useState<number>(0)

    // Ping channel is used to calculate roundtrip time from client to server to client
    let pingChannel: RealtimeChannel

    useEffect(() => {
        if (!user) return

        let pingIntervalId: ReturnType<typeof setInterval> | undefined

        pingChannel = supabaseClient.channel(`ping:${user.id}`, {
            config: { broadcast: { ack: true } },
        })


        pingChannel.subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
            if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
                pingIntervalId = setInterval(async () => {
                    console.log('ping')
                    const start = performance.now()
                    const resp = await pingChannel.send({
                        type: 'broadcast',
                        event: 'PING',
                        payload: {},
                    })

                    if (resp !== 'ok') {
                        console.log('pingChannel broadcast error')
                        setLatency(-1)
                    } else {
                        const end = performance.now()
                        const newLatency = end - start

                        setLatency(newLatency)
                    }
                }, 1000)
            }
        })

        return () => {
            console.log('remove ping')
            pingIntervalId && clearInterval(pingIntervalId)
            pingChannel && supabaseClient.removeChannel(pingChannel)
        }
    }, [user])

    return latency.toFixed(1)

}