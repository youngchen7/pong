import { useEffect, useRef, useState, } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { nanoid } from 'nanoid'
import { Badge, IconUser, Input } from '@supabase/ui'
import {
  REALTIME_LISTEN_TYPES,
  REALTIME_PRESENCE_LISTEN_EVENTS,
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimeChannelSendResponse,
} from '@supabase/supabase-js'

import supabaseClient from '../../../client'

import Loader from '../../../components/Loader'

type Player = {
  name: string, playerType: PlayerType, user_id: string
}

const enum PlayerType {
  // Player One
  HOST = 'Host',
  // Player Two
  PLAYER = 'Player',
  // Ignore
  SPECTATOR = 'Spectator'
}

// Generate a random user id
const userId = nanoid()

const Room: NextPage = () => {
  const router = useRouter()

  let roomChannelRef = useRef<RealtimeChannel>()

  const [isInitialStateSynced, setIsInitialStateSynced] = useState<boolean>(false)
  const [latency, setLatency] = useState<number>(0)
  const [name, _setName] = useState('Guest')
  const [playerType, setPlayerType] = useState(PlayerType.PLAYER)
  const [players, setPlayers] = useState<Player[]>([])

  const ready = router.isReady
  const { slug } = router.query
  const roomId = Array.isArray(slug) ? slug[0] : undefined

  const setName = (name: string) => {
    _setName(name)
    if (roomChannelRef.current) {
      void roomChannelRef.current.track({ user_id: userId, name, playerType })
    }
  }

  useEffect(() => {
    if (!ready) return

    let roomChannel: RealtimeChannel

    console.log(slug)

    if (!roomId) {
      const newRoomId = nanoid()
      console.log(`No room. Creating ${newRoomId}`)
      router.push(`/pong/${newRoomId}`)
      setPlayerType(PlayerType.HOST)
    } else {
      roomChannel = supabaseClient.channel(`pong:${roomId}`, { config: { presence: { key: userId } } })
      roomChannel.on(
        REALTIME_LISTEN_TYPES.PRESENCE,
        { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC },
        () => {
          const state = roomChannel.presenceState()
          console.log('sync:' + JSON.stringify(state, undefined, 4))
          setIsInitialStateSynced(true)
          setPlayers(Object.values(state).map(([player]) => player as unknown as Player))
        }
      )

      roomChannel.subscribe(async (status: `${REALTIME_SUBSCRIBE_STATES}`) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          const resp: RealtimeChannelSendResponse = await roomChannel.track({ user_id: userId, name, playerType })

          if (resp === 'ok') {
            console.log('Subscribed')
            roomChannelRef.current = roomChannel
          } else {
            router.push(`/pong`)
          }
        }
      })

    }

    // Must properly remove subscribed channel
    return () => {
      roomChannel && supabaseClient.removeChannel(roomChannel)
      roomChannelRef.current = undefined
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, ready])

  useEffect(() => {
    let pingIntervalId: ReturnType<typeof setInterval> | undefined
    let pingChannel: RealtimeChannel

    // Ping channel is used to calculate roundtrip time from client to server to client
    pingChannel = supabaseClient.channel(`ping:${userId}`, {
      config: { broadcast: { ack: true } },
    })
    pingChannel.subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        pingIntervalId = setInterval(async () => {
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isInitialStateSynced])

  if (!roomId) {
    return <Loader />
  }

  return (
    <div
      className={[
        'h-screen w-screen p-4 flex flex-col justify-between relative',
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
      <div className="flex flex-col h-full justify-end">
        <div className="flex items-end justify-between">
          <Badge>Latency: {latency.toFixed(1)}ms</Badge>
          <div className='flex flex-col space-y-2'>
            {players.filter(p => p.user_id !== userId).map(p =>
              <>
                <Input disabled className='border-none' actions={<Badge color={p.playerType === PlayerType.HOST ? 'red' : 'green'}>{p.playerType}</Badge>} size='tiny' icon={<IconUser size={12} />} value={p.name} />
              </>
            )}
            <Input actions={<Badge color={playerType === PlayerType.HOST ? 'red' : 'green'}>{playerType}</Badge>} size='tiny' icon={<IconUser size={12} />} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
      </div>

    </div>
  )
}

export default Room
