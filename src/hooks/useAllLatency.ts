import { useEffect, useState } from 'react'
import { taskQuery } from '../api/methods'
import type { BackendPool } from '../api/pool'
import type { TaskQueryResult } from '../types'

const WINDOW_MS = 60 * 60 * 1000
const REFRESH_MS = 10_000
const QUERY_TIMEOUT_MS = 15_000

export function useAllLatency(pool: BackendPool | null) {
  const [tcp, setTcp] = useState<Map<string, TaskQueryResult[]>>(new Map())

  useEffect(() => {
    if (!pool) return
    let cancelled = false

    const fetchAll = async () => {
      const now = Date.now()
      const window: [number, number] = [now - WINDOW_MS, now]

      // One query per backend, NO uuid filter — server returns all results
      const results = await Promise.allSettled(
        pool.entries.map(entry =>
          taskQuery(
            entry.client,
            [{ timestamp_from_to: window }, { type: 'tcp_ping' }],
            QUERY_TIMEOUT_MS,
          )
        )
      )

      if (cancelled) return

      // Group by uuid
      const grouped = new Map<string, TaskQueryResult[]>()
      for (const r of results) {
        if (r.status !== 'fulfilled' || !r.value) continue
        for (const row of r.value) {
          if (!row.success || !row.uuid) continue
          const arr = grouped.get(row.uuid) || []
          arr.push(row)
          grouped.set(row.uuid, arr)
        }
      }

      // Sort each group by timestamp
      for (const arr of grouped.values()) {
        arr.sort((a, b) => a.timestamp - b.timestamp)
      }

      setTcp(grouped)
    }

    fetchAll()
    const timer = setInterval(fetchAll, REFRESH_MS)
    return () => { cancelled = true; clearInterval(timer) }
  }, [pool])

  return tcp
}
