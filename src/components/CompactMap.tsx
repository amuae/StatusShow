import { useMemo } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { MapPin } from 'lucide-react'
import { displayName } from '../utils/derive'
import type { Node } from '../types'

interface Props {
  nodes: Map<string, Node>
  onOpen?: (uuid: string) => void
}

const MAP_W = 400
const MAP_H = 220
const GEO_URL = `${import.meta.env.BASE_URL}world-110m.json`

const GREEN = 'rgb(16 185 129)'
const GRAY = 'rgb(148 163 184)'

const geoBase = {
  fill: 'currentColor',
  fillOpacity: 0.08,
  stroke: 'currentColor',
  strokeOpacity: 0.2,
  strokeWidth: 0.4,
  outline: 'none',
}
const GEO_STYLE = {
  default: geoBase,
  hover: { ...geoBase, fillOpacity: 0.12 },
  pressed: geoBase,
}

export function CompactMap({ nodes, onOpen }: Props) {
  const groups = useMemo(() => {
    const byPos = new Map<string, Node[]>()
    for (const n of nodes.values()) {
      if (n.meta?.hidden) continue
      if (n.meta?.lat == null || n.meta?.lng == null) continue
      const k = `${n.meta.lat.toFixed(2)},${n.meta.lng.toFixed(2)}`
      const list = byPos.get(k)
      if (list) list.push(n)
      else byPos.set(k, [n])
    }
    return [...byPos.entries()].map(([key, ns]) => ({
      key,
      lat: ns[0].meta.lat!,
      lng: ns[0].meta.lng!,
      online: ns.some(n => n.online),
      count: ns.length,
      name: ns.map(n => displayName(n)).join(', '),
    }))
  }, [nodes])

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MapPin className="h-4 w-4 text-blue-500" />
        节点地图
        <span className="ml-auto text-xs text-muted-foreground font-mono">{groups.reduce((s, g) => s + g.count, 0)} 节点</span>
      </div>
      <div
        className="relative w-full overflow-hidden rounded-md border border-border/40 text-foreground"
        style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}
      >
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 100 }}
          width={MAP_W}
          height={MAP_H}
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography key={geo.rsmKey} geography={geo} style={GEO_STYLE} />
              ))
            }
          </Geographies>

          {groups.map(g => (
            <Marker key={g.key} coordinates={[g.lng, g.lat]}>
              {g.online && (
                <circle r={6} fill={GREEN} opacity={0.2}>
                  <animate attributeName="r" values="4;8;4" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                r={g.count > 1 ? 4 : 2.5}
                fill={g.online ? GREEN : GRAY}
                stroke="white"
                strokeWidth={0.8}
                className="cursor-pointer"
                onClick={() => {
                  if (g.count === 1) onOpen?.('')
                }}
              />
              {g.count > 1 && (
                <text y={1.5} textAnchor="middle" fontSize={5} fontWeight={600} fill="white" style={{ pointerEvents: 'none' }}>
                  {g.count}
                </text>
              )}
            </Marker>
          ))}
        </ComposableMap>
      </div>
    </div>
  )
}
