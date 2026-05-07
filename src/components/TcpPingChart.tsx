import { useMemo, useState, useRef } from 'react'
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis } from 'recharts'
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

const BUCKET_MS = 10_000
const COLORS = ['#3d3a5c', '#5c6b7a', '#7a6b5c', '#5c4a3a', '#4a5c6b', '#6b5c7a']

export function TcpPingChart({ data }: Props) {
  const [hovered, setHovered] = useState<{ t: number; items: { name: string; color: string; value: number }[] } | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  const { chartData, sources, byTime } = useMemo(() => {
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

    if (cleaned.length < 2) return { chartData: [], sources: [], byTime: new Map() }

    const allSources = [...new Set(cleaned.map(d => d.source))].filter(Boolean)

    const merged = new Map<number, Record<string, number | string>>()
    for (const d of cleaned) {
      let entry = merged.get(d.bucket)
      if (!entry) { entry = { t: d.bucket }; merged.set(d.bucket, entry) }
      entry[d.source] = d.latency!
    }

    const sorted = [...merged.values()].sort((a, b) => (a.t as number) - (b.t as number))

    return { chartData: sorted, sources: allSources, byTime: sorted }
  }, [data])

  if (chartData.length < 2) {
    return (
      <div className="h-8 flex items-center justify-center text-[10px] text-muted-foreground">
        暂无 TCPing 数据
      </div>
    )
  }

  // Find closest data point from touch X coordinate
  function handleTouch(e: React.TouchEvent) {
    e.stopPropagation() // prevent card click
    const rect = chartRef.current?.getBoundingClientRect()
    if (!rect || !chartData.length) return
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const ratio = x / rect.width
    const idx = Math.round(ratio * (chartData.length - 1))
    const point = chartData[Math.max(0, Math.min(idx, chartData.length - 1))]
    if (!point) return
    const items = sources
      .filter(s => point[s] != null)
      .map((s, i) => ({ name: s, color: COLORS[i % COLORS.length], value: point[s] as number }))
    setHovered({ t: point.t as number, items })
  }

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
      <div
        ref={chartRef}
        className="h-12 relative"
        onMouseLeave={() => setHovered(null)}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onTouchEnd={() => setHovered(null)}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
            onMouseMove={(state: any) => {
              if (!state?.activePayload?.length) return
              const payload = state.activePayload
              setHovered({
                t: payload[0]?.payload?.t || 0,
                items: payload.map((p: any) => ({
                  name: p.dataKey,
                  color: p.color || '#888',
                  value: typeof p.value === 'number' ? p.value : 0,
                })),
              })
            }}
          >
            <defs>
              {sources.map((s, i) => (
                <linearGradient key={s} id={`tcpGrad_${s}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <XAxis hide />
            <YAxis hide domain={[0, 300]} />
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

        {hovered && (
          <div className="absolute left-2 top-0 z-10 text-[10px] rounded-md border bg-popover px-2 py-1.5 shadow-md pointer-events-none">
            <div className="mb-0.5 opacity-60 text-[9px]">
              {new Date(hovered.t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            {hovered.items.map(item => (
              <div key={item.name} className="flex items-center gap-1.5 py-px">
                <span className="w-2 h-[3px] rounded-full inline-block" style={{ background: item.color }} />
                <span>{item.name}</span>
                <span className="ml-auto font-mono font-semibold">{item.value.toFixed(1)} ms</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
