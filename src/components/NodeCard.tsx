import { ArrowDown, ArrowUp, Clock, type LucideIcon } from 'lucide-react'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { CircularGauge } from './CircularGauge'
import { Flag } from './Flag'
import { StatusDot } from './StatusDot'
import { bytes, pct, relativeAge, uptime } from '../utils/format'
import { cpuLabel, deriveUsage, displayName, distroLogo, osLabel, virtLabel } from '../utils/derive'
import { cn } from '../utils/cn'
import type { Node } from '../types'
import type { ReactNode } from 'react'

export function NodeCard({ node }: { node: Node }) {
  const u = deriveUsage(node)
  const tags = Array.isArray(node.meta?.tags) ? node.meta.tags : []
  const os = osLabel(node)
  const logo = distroLogo(node)
  const virt = virtLabel(node)
  const cpu = cpuLabel(node)

  return (
    <a href={`#${encodeURIComponent(node.uuid)}`} className="block">
      <Card
        className={cn(
          'p-4 transition hover:border-primary/50 hover:shadow-md flex flex-col gap-3',
          !node.online && 'opacity-60',
        )}
      >
        {/* Header: status + name + flag */}
        <div className="flex items-center gap-2">
          <StatusDot online={node.online} />
          {logo && (
            <img src={logo} alt="" className="w-5 h-5 shrink-0 object-contain" loading="lazy" />
          )}
          <span className="font-semibold flex-1 min-w-0 truncate" title={displayName(node)}>
            {displayName(node)}
          </span>
          <Flag code={node.meta?.region} className="shrink-0" />
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

        {/* Network + uptime */}
        <div className="pt-2.5 border-t border-dashed font-mono text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-3">
            <Stat icon={ArrowDown}>{bytes(u.netIn || 0)}/s</Stat>
            <Stat icon={ArrowUp}>{bytes(u.netOut || 0)}/s</Stat>
            {(u.totalReceived != null || u.totalTransmitted != null) && (
              <span className="ml-auto">
                ↓{bytes(u.totalReceived || 0)} ↑{bytes(u.totalTransmitted || 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Stat icon={Clock}>{uptime(u.uptime)}</Stat>
            <span className="ml-auto">{relativeAge(u.ts)}</span>
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
