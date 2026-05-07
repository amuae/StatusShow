import { Server, Cpu, MemoryStick, HardDrive, Activity, Wifi } from 'lucide-react'
import { bytes } from '../utils/format'
import { deriveUsage } from '../utils/derive'
import type { Node } from '../types'

interface Props {
  nodes: Map<string, Node>
}

export function SummaryCards({ nodes }: Props) {
  let total = 0
  let online = 0
  let offline = 0
  let cpuSum = 0
  let cpuCount = 0
  let memSum = 0
  let memCount = 0
  let totalNetIn = 0
  let totalNetOut = 0
  let totalReceived = 0
  let totalTransmitted = 0
  let highMem = 0

  for (const n of nodes.values()) {
    if (n.meta?.hidden) continue
    total++
    if (n.online) {
      online++
      const u = deriveUsage(n)
      if (u.cpu != null) { cpuSum += u.cpu; cpuCount++ }
      if (u.mem != null) { memSum += u.mem; memCount++; if (u.mem >= 80) highMem++ }
      totalNetIn += u.netIn || 0
      totalNetOut += u.netOut || 0
      totalReceived += u.totalReceived || 0
      totalTransmitted += u.totalTransmitted || 0
    } else {
      offline++
    }
  }

  const avgCpu = cpuCount ? Math.round(cpuSum / cpuCount) : 0
  const avgMem = memCount ? Math.round(memSum / memCount) : 0
  const availability = total ? ((online / total) * 100).toFixed(1) : '0.0'
  const anomaly = offline

  const cards = [
    {
      icon: Server,
      label: '服务器总数',
      value: `${total}`,
      sub: `${online} 在线 / ${offline} 离线`,
      color: 'text-blue-500',
    },
    {
      icon: Cpu,
      label: '平均 CPU',
      value: `${avgCpu}%`,
      sub: `${cpuCount} 台运行中`,
      color: 'text-emerald-500',
    },
    {
      icon: MemoryStick,
      label: '平均内存',
      value: `${avgMem}%`,
      sub: `${highMem} 台高负载`,
      color: 'text-purple-500',
    },
    {
      icon: Activity,
      label: '总流量',
      value: bytes(totalReceived + totalTransmitted),
      sub: `↓${bytes(totalReceived)} / ↑${bytes(totalTransmitted)}`,
      color: 'text-cyan-500',
    },
    {
      icon: Wifi,
      label: '可用率',
      value: `${availability}%`,
      sub: `${anomaly} 台异常`,
      color: anomaly > 0 ? 'text-red-500' : 'text-emerald-500',
    },
  ]

  return (
    <div className="grid grid-cols-5 gap-3">
      {cards.map(c => (
        <div key={c.label} className="rounded-lg border bg-card p-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <c.icon className={`h-4 w-4 ${c.color}`} />
            <span className="text-xs text-muted-foreground">{c.label}</span>
          </div>
          <span className="text-xl font-bold font-mono">{c.value}</span>
          <span className="text-[11px] text-muted-foreground">{c.sub}</span>
        </div>
      ))}
    </div>
  )
}
