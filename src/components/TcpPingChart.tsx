import { useMemo } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import type { TaskQueryResult } from '../types'

interface Props {
  data: TaskQueryResult[]
}

function extractLatency(result: TaskQueryResult): number | null {
  if (!result.task_event_result) return null
  // TCP ping result structure: { "latency_ms": 123 } or similar
  const r = result.task_event_result as Record<string, unknown>
  const ms = r.latency_ms ?? r.latency ?? r.time ?? r.ms
  if (typeof ms === 'number') return ms
  // Try parsing nested result
  if (typeof r.result === 'object' && r.result) {
    const inner = r.result as Record<string, unknown>
    const v = inner.latency_ms ?? inner.latency ?? inner.time
    if (typeof v === 'number') return v
  }
  return null
}

export function TcpPingChart({ data }: Props) {
  const chartData = useMemo(() => {
    return data.map(r => ({
      t: r.timestamp,
      latency: extractLatency(r),
      time: new Date(r.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    })).filter(d => d.latency != null && d.latency > 0)
  }, [data])

  if (chartData.length < 2) {
    return (
      <div className="h-10 flex items-center justify-center text-[10px] text-muted-foreground">
        暂无 TCPing 数据
      </div>
    )
  }

  const avg = chartData.reduce((s, d) => s + d.latency!, 0) / chartData.length
  const max = Math.max(...chartData.map(d => d.latency!))

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
        <span>TCPing · 近1小时</span>
        <span className="font-mono">avg {avg.toFixed(0)}ms · max {max.toFixed(0)}ms</span>
      </div>
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tcpPingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
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
              labelFormatter={() => ''}
              formatter={(value: number) => [`${value.toFixed(1)} ms`, '延迟']}
            />
            <Area
              type="monotone"
              dataKey="latency"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              fill="url(#tcpPingGrad)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
