import { useEffect, useState } from 'react'
import { taskQuery } from '../api/methods'
import type { BackendPool } from '../api/pool'
import type { TaskQueryResult } from '../types'

const WINDOW_MS = 60 * 60 * 1000
const REFRESH_MS = 2_000
const QUERY_TIMEOUT_MS = 5_000

function clean(rows: TaskQueryResult[] | undefined): TaskQueryResult[] {
  return (rows ?? [])
    .filter(r => r.success && r.task_event_result)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-60)
}

export interface LatencyMap {
  ping: Map<string, TaskQueryResult[]>
  tcp: Map<string, TaskQueryResult[]>
}

export function useAllLatency(pool: BackendPool | null, uuids: string[]) {
  const [data, setData] = useState<LatencyMap>({ ping: new Map(), tcp: new Map() })

  useEffect(() => {
    if (!pool || !uuids.length) return
    let cancelled = false

    const fetchAll = async () => {
      const now = Date.now()
      const window: [number, number] = [now - WINDOW_MS, now]

      const results = await Promise.allSettled(
        pool.entries.map(async entry => {
          // Query TCP ping for all uuids on this backend
          const allTcp = await Promise.allSettled(
            uuids.map(uuid =>
              taskQuery(
                entry.client,
                [{ uuid }, { timestamp_from_to: window }, { type: 'tcp_ping' }],
                QUERY_TIMEOUT_MS,
              ).then(rows => ({ uuid, rows: clean(rows) }))
            )
          )
          return allTcp
        })
      )

      if (cancelled) return

      const tcpMap = new Map<string, TaskQueryResult[]>()
      for (const result of results) {
        if (result.status !== 'fulfilled') continue
        for (const r of result.value) {
          if (r.status !== 'fulfilled') continue
          tcpMap.set(r.value.uuid, r.value.rows)
        }
      }

      setData({ ping: new Map(), tcp: tcpMap })
    }

    fetchAll()
    const timer = setInterval(fetchAll, REFRESH_MS)
    return () => { cancelled = true; clearInterval(timer) }
  }, [pool, uuids.join(',')])

  return data
}
