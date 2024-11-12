import { REALTIME_SUBSCRIBE_STATES, RealtimeChannel } from "@supabase/supabase-js"
import supabaseClient from "../client"
import { useCallback, useEffect, useState } from "react"
import { useUser } from "./use-user"

export function useLatency() {

    const { user } = useUser()
    const [latency, setLatency] = useState<number>(0)
    const [enabled, setEnabled] = useState(true)

    // Ping channel is used to calculate roundtrip time from client to server to client
    let pingChannel: RealtimeChannel

    const onFocus = useCallback(() => setEnabled(true), [setEnabled])
    const onBlur = useCallback(() => setEnabled(false), [setEnabled])

    useEffect(() => {
        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);
        // Specify how to clean up after this effect:
        return () => {
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("blur", onBlur);
        };
    }, []);

    useEffect(() => {
        if (!user) return

        let pingIntervalId: ReturnType<typeof setInterval> | undefined

        pingChannel = supabaseClient.channel(`ping:${user.id}`, {
            config: { broadcast: { ack: true } },
        })


        pingChannel.subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
            if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
                pingIntervalId = setInterval(async () => {
                    if (!enabled) return

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
            pingIntervalId && clearInterval(pingIntervalId)
            pingChannel && supabaseClient.removeChannel(pingChannel)
        }
    }, [user, enabled])

    return latency

}