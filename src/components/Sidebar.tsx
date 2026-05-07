import { NodeValueCard } from './NodeValueCard'
import { CompactMap } from './CompactMap'
import { BandwidthGraph } from './BandwidthGraph'
import type { Node } from '../types'

interface Props {
  nodes: Map<string, Node>
  onOpen?: (uuid: string) => void
}

export function Sidebar({ nodes, onOpen }: Props) {
  return (
    <aside className="w-72 shrink-0 space-y-4 hidden lg:block">
      <NodeValueCard nodes={nodes} />
      <CompactMap nodes={nodes} onOpen={onOpen} />
      <BandwidthGraph nodes={nodes} />
    </aside>
  )
}
