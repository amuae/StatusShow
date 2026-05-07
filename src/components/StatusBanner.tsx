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
    <div className={`card-soft rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap sm:flex-nowrap items-center gap-x-2 gap-y-1 sm:gap-3 ${
      allOk
        ? 'border-l-2 border-l-primary/40'
        : 'border-l-2 border-l-destructive/60'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        {allOk ? (
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary/70 shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive shrink-0" />
        )}
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
          {allOk ? '服务正常' : '服务异常'}
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 ml-auto text-[11px] sm:text-xs font-mono">
        <span className="flex items-center gap-1 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-primary/60" />
          {online}
        </span>
        {degraded > 0 && (
          <span className="flex items-center gap-1 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-destructive/60" />
            {degraded}
          </span>
        )}
        <span className="flex items-center gap-1 whitespace-nowrap">
          <span className={`w-2 h-2 rounded-full ${offline > 0 ? 'bg-destructive' : 'bg-muted-foreground/40'}`} />
          {offline}
        </span>
      </div>
      {/* Progress bar — hidden on very small screens */}
      <div className="hidden sm:block w-24 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
        <div className="h-full flex">
          <div className="progress-ink transition-all duration-500" style={{ width: `${total ? (online / total) * 100 : 0}%` }} />
          {degraded > 0 && <div className="bg-destructive/70 transition-all duration-500" style={{ width: `${total ? (degraded / total) * 100 : 0}%` }} />}
          <div className="bg-destructive transition-all duration-500" style={{ width: `${total ? (offline / total) * 100 : 0}%` }} />
        </div>
      </div>
    </div>
  )
}
