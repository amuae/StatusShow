import { useMemo } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis, XAxis } from 'recharts'
import type { TaskQueryResult } from '../types'

interface Props {
  data: TaskQueryResult[]
}

function extractLatency(result: TaskQueryResult): number | null {
  if (!result.task_event_result) return null
  const r = result.task_event_result
  const val = r.tcp_ping ?? r.ping ?? r.latency_ms ?? r.latency
  if (typeof val === 'number' && val > 0) return val
  return null
}

export function TcpPingChart({ data }: Props) {
  const { chartData, sources } = useMemo(() => {
    const cleaned = data
      .filter(r => r.success)
      .map(r => ({
        t: r.timestamp,
        latency: extractLatency(r),
        source: r.cron_source || 'default',
      }))
      .filter(d => d.latency != null && d.latency > 0)
      .sort((a, b) => a.t - b.t)

    if (cleaned.length < 2) return { chartData: [], sources: [] }

    // Auto-detect all sources from data
    const allSources = [...new Set(cleaned.map(d => d.source))].filter(Boolean)

    // Merge same-timestamp entries from different sources
    const merged = new Map<number, Record<string, number | string>>()
    for (const d of cleaned) {
      const existing = merged.get(d.t) || { t: d.t, time: new Date(d.t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }
      existing[d.source] = d.latency!
      merged.set(d.t, existing)
    }

    return {
      chartData: [...merged.values()].sort((a, b) => (a.t as number) - (b.t as number)),
      sources: allSources,
    }
  }, [data])

  if (chartData.length < 2) {
    return (
      <div className="h-8 flex items-center justify-center text-[10px] text-muted-foreground">
        暂无 TCPing 数据
      </div>
    )
  }

  const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899']

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
        <span>TCPing · 近1小时</span>
        <div className="flex items-center gap-2">
          {sources.map((s, i) => (
            <span key={s} className="flex items-center gap-1 text-[9px]">
              <span className="w-2 h-0.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              {sources.map((s, i) => (
                <linearGradient key={s} id={`tcpGrad_${s}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Tooltip
              contentStyle={{
                fontSize: 10,
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 6,
                padding: '4px 8px',
              }}
              labelFormatter={(_: any, payload: any[]) => {
                if (payload?.[0]?.payload?.t) {
                  return new Date(payload[0].payload.t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }
                return ''
              }}
              formatter={(value: number, name: string) => [`${value.toFixed(1)} ms`, name]}
            />
            {sources.map((s, i) => (
              <Area
                key={s}
                type="monotone"
                dataKey={s}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={1.5}
                fill={`url(#tcpGrad_${s})`}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
