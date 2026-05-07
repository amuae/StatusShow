import { DollarSign, TrendingDown } from 'lucide-react'
import { remainingValue, hasCost } from '../utils/cost'
import type { Node } from '../types'

interface Props {
  nodes: Map<string, Node>
}

export function NodeValueCard({ nodes }: Props) {
  let totalPrice = 0
  let totalRemaining = 0
  let counted = 0

  for (const n of nodes.values()) {
    if (n.meta?.hidden) continue
    if (!hasCost(n.meta)) continue
    totalPrice += n.meta.price
    totalRemaining += remainingValue(n.meta)
    counted++
  }

  if (counted === 0) return null

  return (
    <div className="card-soft rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <DollarSign className="h-4 w-4 text-seal" />
        节点价值（估算）
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-muted-foreground">总价值</span>
          <span className="text-lg font-bold font-mono">${totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            剩余价值
          </span>
          <span className="text-lg font-bold font-mono text-emerald-500">${totalRemaining.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
