import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { bytes } from '../utils/format'
import type { Node } from '../types'

interface Props {
  nodes: Map<string, Node>
}

interface BandwidthSample {
  time: string
  in: number
  out: number
}

export function BandwidthGraph({ nodes }: Props) {
  const { currentIn, currentOut, chartData } = useMemo(() => {
    let totalIn = 0
    let totalOut = 0

    // Aggregate latest bandwidth from all online nodes
    for (const n of nodes.values()) {
      if (!n.online || !n.dynamic) continue
      totalIn += n.dynamic.receive_speed || 0
      totalOut += n.dynamic.transmit_speed || 0
    }

    // Build chart data from history - use last 30 samples from any node
    const now = Date.now()
    const samples: BandwidthSample[] = []
    
    // Get the first online node's history for the chart
    for (const n of nodes.values()) {
      if (!n.online || !n.history?.length) continue
      const history = n.history.slice(-30)
      for (const h of history) {
        const time = new Date(h.t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        samples.push({ time, in: h.netIn || 0, out: h.netOut || 0 })
      }
      break // Only use first node's history for now
    }

    return { currentIn: totalIn, currentOut: totalOut, chartData: samples }
  }, [nodes])

  return (
    <div className="card-soft rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ArrowDown className="h-4 w-4 text-primary/70" />
        实时带宽
      </div>
      <div className="flex items-center gap-4 text-xs font-mono">
        <span className="flex items-center gap-1 text-primary/70">
          <ArrowDown className="h-3 w-3" />
          {bytes(currentIn)}/s
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <ArrowUp className="h-3 w-3" />
          {bytes(currentOut)}/s
        </span>
      </div>
      {chartData.length > 0 && (
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="bwIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(220 25% 30%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(220 25% 30%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bwOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(220 15% 50%)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(220 15% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                }}
                formatter={(value: number) => `${bytes(value)}/s`}
              />
              <Area type="monotone" dataKey="in" stroke="hsl(220 25% 30%)" strokeWidth={1.5} fill="url(#bwIn)" name="下载" />
              <Area type="monotone" dataKey="out" stroke="hsl(220 15% 50%)" strokeWidth={1.5} fill="url(#bwOut)" name="上传" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
