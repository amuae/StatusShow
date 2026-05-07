import { AlertTriangle, CheckCircle, XCircle, MinusCircle } from 'lucide-react'
import type { Node } from '../types'

interface Props {
  nodes: Map<string, Node>
}

export function StatusBanner({ nodes }: Props) {
  let online = 0
  let degraded = 0
  let offline = 0

  for (const n of nodes.values()) {
    if (n.meta?.hidden) continue
    if (n.online) {
      online++
    } else {
      offline++
    }
  }

  const total = online + degraded + offline
  const allOk = offline === 0 && degraded === 0

  return (
    <div className={`card-soft rounded-lg px-4 py-3 flex items-center gap-3 ${
      allOk
        ? 'border-l-2 border-l-primary/40'
        : 'border-l-2 border-l-destructive/60'
    }`}>
      {allOk ? (
        <CheckCircle className="h-5 w-5 text-primary/70 shrink-0" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
      )}
      <span className="text-sm font-medium">
        {allOk ? '所有服务正常' : '部分服务异常'}
      </span>
      <div className="flex items-center gap-3 ml-auto text-xs font-mono">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary/60" />
          正常 {online}
        </span>
        {degraded > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-destructive/60" />
            降级 {degraded}
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${offline > 0 ? 'bg-destructive' : 'bg-muted-foreground/40'}`} />
          离线 {offline}
        </span>
      </div>
      {/* Progress bar */}
      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
        <div className="h-full flex">
          <div className="progress-ink transition-all duration-500" style={{ width: `${total ? (online / total) * 100 : 0}%` }} />
          {degraded > 0 && <div className="bg-destructive/70 transition-all duration-500" style={{ width: `${total ? (degraded / total) * 100 : 0}%` }} />}
          <div className="bg-destructive transition-all duration-500" style={{ width: `${total ? (offline / total) * 100 : 0}%` }} />
        </div>
      </div>
    </div>
  )
}
