import { useMemo } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import type { TaskQueryResult } from '../types'

interface Props {
  data: TaskQueryResult[]
}

function extractLatency(result: TaskQueryResult): number | null {
  if (!result.task_event_result) return null
  const r = result.task_event_result
  // tcp_ping results: { tcp_ping: 72.87 }
  // ping results: { ping: 119.71 }
  const val = r.tcp_ping ?? r.ping ?? r.latency_ms ?? r.latency
  if (typeof val === 'number' && val > 0) return val
  return null
}

export function TcpPingChart({ data }: Props) {
  const chartData = useMemo(() => {
    return data
      .filter(r => r.success)
      .map(r => ({
        t: r.timestamp,
        latency: extractLatency(r),
        source: r.cron_source || '',
        time: new Date(r.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }))
      .filter(d => d.latency != null && d.latency > 0)
      .sort((a, b) => a.t - b.t)
  }, [data])

  if (chartData.length < 2) {
    return (
      <div className="h-8 flex items-center justify-center text-[10px] text-muted-foreground">
        暂无 TCPing 数据
      </div>
    )
  }

  // Group by cron_source for multiple lines
  const sources = [...new Set(chartData.map(d => d.source))].filter(Boolean)
  const avg = chartData.reduce((s, d) => s + d.latency!, 0) / chartData.length
  const max = Math.max(...chartData.map(d => d.latency!))

  // Merge same-timestamp entries from different sources
  const merged = new Map<number, Record<string, number>>()
  for (const d of chartData) {
    const existing = merged.get(d.t) || { t: d.t }
    if (d.source) existing[d.source] = d.latency!
    else existing['latency'] = d.latency!
    merged.set(d.t, existing)
  }
  const finalData = [...merged.values()].sort((a, b) => a.t - b.t)

  const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981']

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
        <span>TCPing · 近1小时</span>
        <span className="font-mono">avg {avg.toFixed(0)}ms · max {max.toFixed(0)}ms</span>
      </div>
      <div className="flex items-center gap-2 px-1">
        {sources.map((s, i) => (
          <span key={s} className="flex items-center gap-1 text-[9px]">
            <span className="w-2 h-0.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {s}
          </span>
        ))}
      </div>
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={finalData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              {sources.map((_, i) => (
                <linearGradient key={i} id={`tcpGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Tooltip
              contentStyle={{
                fontSize: 10,
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 6,
                padding: '4px 8px',
              }}
              labelFormatter={(label: number) => new Date(label).toLocaleTimeString('zh-CN')}
              formatter={(value: number, name: string) => [`${value.toFixed(1)} ms`, name]}
            />
            {sources.length > 0 ? sources.map((s, i) => (
              <Area
                key={s}
                type="monotone"
                dataKey={s}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={1.5}
                fill={`url(#tcpGrad${i})`}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            )) : (
              <Area
                type="monotone"
                dataKey="latency"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                fill="url(#tcpGrad0)"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
