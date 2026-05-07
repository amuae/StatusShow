import { NodeValueCard } from './NodeValueCard'
import { WorldMap } from './WorldMap'
import { BandwidthGraph } from './BandwidthGraph'
import type { Node } from '../types'

interface Props {
  nodes: Map<string, Node>
  onOpen?: (uuid: string) => void
}

export function Sidebar({ nodes, onOpen }: Props) {
  const list = [...nodes.values()].filter(n => !n.meta?.hidden)
  return (
    <aside className="w-72 shrink-0 space-y-4 hidden lg:block">
      <NodeValueCard nodes={nodes} />
      <WorldMap nodes={list} onOpen={onOpen} />
      <BandwidthGraph nodes={nodes} />
    </aside>
  )
}
