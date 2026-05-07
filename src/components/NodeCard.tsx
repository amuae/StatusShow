import { ArrowDown, ArrowUp, type LucideIcon } from 'lucide-react'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { CircularGauge } from './CircularGauge'
import { TcpPingChart } from './TcpPingChart'
import { Flag } from './Flag'
import { StatusDot } from './StatusDot'
import { bytes } from '../utils/format'
import { cpuLabel, deriveUsage, displayName, osLabel, virtLabel } from '../utils/derive'
import { cn } from '../utils/cn'
import type { Node, TaskQueryResult } from '../types'
import type { ReactNode } from 'react'

interface Props {
  node: Node
  tcpPingData?: TaskQueryResult[]
}

export function NodeCard({ node, tcpPingData }: Props) {
  const u = deriveUsage(node)
  const tags = Array.isArray(node.meta?.tags) ? node.meta.tags : []
  const os = osLabel(node)
  const virt = virtLabel(node)
  const cpu = cpuLabel(node)

  return (
    <a href={`#${encodeURIComponent(node.uuid)}`} className="block">
      <Card
        className={cn(
          'p-4 transition-all duration-300 flex flex-col gap-3',
          !node.online && 'opacity-50 grayscale',
        )}
      >
        {/* Header: status + country flag + name + uptime */}
        <div className="flex items-center gap-2">
          <StatusDot online={node.online} />
          <Flag code={node.meta?.region} className="shrink-0" />
          <span className="font-semibold flex-1 min-w-0 truncate" title={displayName(node)}>
            {displayName(node)}
          </span>
          {node.meta?.price > 0 && (
            <span className="text-xs text-muted-foreground font-mono shrink-0 whitespace-nowrap">
              {node.meta.priceUnit}{node.meta.price}/{node.meta.priceCycle <= 31 ? '月' : node.meta.priceCycle <= 100 ? '季' : '年'}
              {node.meta.expireTime && (
                <span> · {new Date(node.meta.expireTime).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}到期</span>
              )}
            </span>
          )}
        </div>

        {/* OS + Virt */}
        {(os || virt) && (
          <div className="font-mono text-xs text-muted-foreground truncate">
            {[os, virt].filter(Boolean).join(' · ')}
          </div>
        )}

        {/* Circular gauges */}
        <div className="flex items-center justify-around py-1">
          <CircularGauge value={u.cpu} size={60} strokeWidth={5} label="CPU" sub={cpu || undefined} />
          <CircularGauge value={u.mem} size={60} strokeWidth={5} label="内存" sub={u.memTotal ? `${bytes(u.memUsed)}` : undefined} />
          <CircularGauge value={u.disk} size={60} strokeWidth={5} label="磁盘" sub={u.diskTotal ? `${bytes(u.diskUsed)}` : undefined} />
        </div>

        {/* TCP Ping chart - before network stats */}
        {tcpPingData && tcpPingData.length > 0 && (
          <div className="border-t border-border/40 pt-2">
            <TcpPingChart data={tcpPingData} />
          </div>
        )}

        {/* Network speed + traffic - bottom, same row */}
        <div className="border-t border-border/40 pt-2 font-mono text-xs text-muted-foreground">
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              <Stat icon={ArrowDown}>{bytes(u.netIn || 0)}/s</Stat>
              <Stat icon={ArrowUp}>{bytes(u.netOut || 0)}/s</Stat>
            </div>
            {(u.totalReceived != null || u.totalTransmitted != null) && (
              <span className="ml-auto">
                ↓{bytes(u.totalReceived || 0)} ↑{bytes(u.totalTransmitted || 0)}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => (
              <Badge key={t} variant="outline" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </a>
  )
}

function Stat({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {children}
    </span>
  )
}
