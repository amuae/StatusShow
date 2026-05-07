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

// Exponential moving average to smooth jitter
function smoothEMA(values: number[], alpha = 0.3): number[] {
  if (values.length === 0) return []
  const result = [values[0]]
  for (let i = 1; i < values.length; i++) {
    result.push(alpha * values[i] + (1 - alpha) * result[i - 1])
  }
  return result
}

// Percentile helper
function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx), hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const t = payload[0]?.payload?.t
  return (
    <div style={{
      fontSize: 10,
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 6,
      padding: '6px 10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      {t != null && (
        <div style={{ marginBottom: 4, color: 'hsl(var(--muted-foreground))', fontSize: 9 }}>
          {new Date(t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      )}
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '1px 0' }}>
          <span style={{ width: 8, height: 3, borderRadius: 2, background: p.color, display: 'inline-block' }} />
          <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{p.dataKey}</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
            {typeof p.value === 'number' ? `${p.value.toFixed(1)} ms` : '-'}
          </span>
        </div>
      ))}
    </div>
  )
}

const BUCKET_MS = 10_000

export function TcpPingChart({ data }: Props) {
  const { chartData, sources, yDomain } = useMemo(() => {
    const cleaned = data
      .filter(r => r.success)
      .map(r => ({
        t: r.timestamp,
        bucket: Math.round(r.timestamp / BUCKET_MS) * BUCKET_MS,
        latency: extractLatency(r),
        source: r.cron_source || 'default',
      }))
      .filter(d => d.latency != null && d.latency > 0)
      .sort((a, b) => a.t - b.t)

    if (cleaned.length < 2) return { chartData: [], sources: [], yDomain: [0, 100] as [number, number] }

    const allSources = [...new Set(cleaned.map(d => d.source))].filter(Boolean)

    // Group by source for smoothing
    const bySource = new Map<string, { t: number; v: number }[]>()
    for (const s of allSources) bySource.set(s, [])
    for (const d of cleaned) bySource.get(d.source)!.push({ t: d.bucket, v: d.latency! })

    // Smooth each source independently
    const smoothed = new Map<string, { t: number; v: number }[]>()
    for (const [s, points] of bySource) {
      const vals = smoothEMA(points.map(p => p.v), 0.3)
      smoothed.set(s, points.map((p, i) => ({ t: p.t, v: vals[i] })))
    }

    // Compute Y domain from smoothed values (5th-95th percentile)
    const allSmoothedVals = [...smoothed.values()].flat().map(p => p.v).sort((a, b) => a - b)
    const yMin = percentile(allSmoothedVals, 5)
    const yMax = percentile(allSmoothedVals, 95)
    const yPad = (yMax - yMin) * 0.1
    const domain: [number, number] = [Math.max(0, yMin - yPad), yMax + yPad]

    // Merge into chart data
    const merged = new Map<number, Record<string, number | string>>()
    for (const [s, points] of smoothed) {
      for (const p of points) {
        let entry = merged.get(p.t)
        if (!entry) { entry = { t: p.t }; merged.set(p.t, entry) }
        entry[s] = p.v
      }
    }

    return {
      chartData: [...merged.values()].sort((a, b) => (a.t as number) - (b.t as number)),
      sources: allSources,
      yDomain: domain,
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
            <XAxis hide />
            <YAxis hide domain={yDomain} />
            <Tooltip content={<CustomTooltip />} />
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
