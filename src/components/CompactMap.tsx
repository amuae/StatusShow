import { useMemo, useState } from 'react'
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

const GREEN = 'hsl(150 20% 40%)'
const GRAY = 'hsl(220 10% 60%)'

const CODE_TO_NAME: Record<string, string> = {
  AF: 'Afghanistan', AL: 'Albania', DZ: 'Algeria', AO: 'Angola',
  AR: 'Argentina', AM: 'Armenia', AU: 'Australia', AT: 'Austria',
  AZ: 'Azerbaijan', BS: 'Bahamas', BD: 'Bangladesh', BY: 'Belarus',
  BE: 'Belgium', BZ: 'Belize', BJ: 'Benin', BT: 'Bhutan',
  BO: 'Bolivia', BA: 'Bosnia and Herz.', BW: 'Botswana', BR: 'Brazil',
  BN: 'Brunei', BG: 'Bulgaria', BF: 'Burkina Faso', BI: 'Burundi',
  KH: 'Cambodia', CM: 'Cameroon', CA: 'Canada', CF: 'Central African Rep.',
  TD: 'Chad', CL: 'Chile', CN: 'China', CO: 'Colombia',
  CG: 'Congo', CR: 'Costa Rica', HR: 'Croatia', CU: 'Cuba',
  CY: 'Cyprus', CZ: 'Czechia', CI: "Côte d'Ivoire",
  DK: 'Denmark', DJ: 'Djibouti', DO: 'Dominican Rep.',
  EC: 'Ecuador', EG: 'Egypt', SV: 'El Salvador', GQ: 'Eq. Guinea',
  ER: 'Eritrea', EE: 'Estonia', ET: 'Ethiopia', FK: 'Falkland Is.',
  FJ: 'Fiji', FI: 'Finland', FR: 'France', GF: 'French Guiana',
  GA: 'Gabon', GM: 'Gambia', GE: 'Georgia', DE: 'Germany',
  GH: 'Ghana', GR: 'Greece', GL: 'Greenland', GT: 'Guatemala',
  GN: 'Guinea', GW: 'Guinea-Bissau', GY: 'Guyana', HT: 'Haiti',
  HN: 'Honduras', HK: 'Hong Kong', HU: 'Hungary', IS: 'Iceland',
  IN: 'India', ID: 'Indonesia', IR: 'Iran', IQ: 'Iraq',
  IE: 'Ireland', IL: 'Israel', IT: 'Italy', JM: 'Jamaica',
  JP: 'Japan', JO: 'Jordan', KZ: 'Kazakhstan', KE: 'Kenya',
  KR: 'Korea', KP: 'N. Korea', KW: 'Kuwait', KG: 'Kyrgyzstan',
  LA: 'Lao PDR', LV: 'Latvia', LB: 'Lebanon', LS: 'Lesotho',
  LR: 'Liberia', LY: 'Libya', LT: 'Lithuania', LU: 'Luxembourg',
  MK: 'North Macedonia', MG: 'Madagascar', MW: 'Malawi', MY: 'Malaysia',
  ML: 'Mali', MR: 'Mauritania', MX: 'Mexico', MD: 'Moldova',
  MN: 'Mongolia', ME: 'Montenegro', MA: 'Morocco', MZ: 'Mozambique',
  MM: 'Myanmar', NA: 'Namibia', NP: 'Nepal', NL: 'Netherlands',
  NC: 'New Caledonia', NZ: 'New Zealand', NI: 'Nicaragua', NE: 'Niger',
  NG: 'Nigeria', NO: 'Norway', OM: 'Oman', PK: 'Pakistan',
  PS: 'Palestine', PA: 'Panama', PG: 'Papua New Guinea', PY: 'Paraguay',
  PE: 'Peru', PH: 'Philippines', PL: 'Poland', PT: 'Portugal',
  PR: 'Puerto Rico', QA: 'Qatar', RO: 'Romania', RU: 'Russia',
  RW: 'Rwanda', SA: 'Saudi Arabia', SN: 'Senegal', RS: 'Serbia',
  SL: 'Sierra Leone', SG: 'Singapore', SK: 'Slovakia', SI: 'Slovenia',
  SO: 'Somalia', ZA: 'South Africa', SS: 'S. Sudan', ES: 'Spain',
  LK: 'Sri Lanka', SD: 'Sudan', SR: 'Suriname', SE: 'Sweden',
  CH: 'Switzerland', SY: 'Syria', TW: 'Taiwan', TJ: 'Tajikstan',
  TZ: 'Tanzania', TH: 'Thailand', TL: 'Timor-Leste', TG: 'Togo',
  TT: 'Trinidad and Tobago', TN: 'Tunisia', TR: 'Turkey',
  TM: 'Turkmenistan', UG: 'Uganda', UA: 'Ukraine',
  AE: 'United Arab Emirates', GB: 'United Kingdom',
  US: 'United States of America', UY: 'Uruguay', UZ: 'Uzbekistan',
  VE: 'Venezuela', VN: 'Vietnam', EH: 'W. Sahara',
  YE: 'Yemen', ZM: 'Zambia', ZW: 'Zimbabwe', XK: 'Kosovo',
}

interface MarkerGroup {
  key: string
  lat: number
  lng: number
  nodes: { name: string; online: boolean; uuid: string }[]
}

export function CompactMap({ nodes, onOpen }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; group: MarkerGroup } | null>(null)

  const { groups, activeNames } = useMemo(() => {
    const byPos = new Map<string, Node[]>()
    const names = new Set<string>()

    for (const n of nodes.values()) {
      if (n.meta?.hidden) continue
      const code = n.meta?.region?.trim().toUpperCase()
      if (code && CODE_TO_NAME[code]) names.add(CODE_TO_NAME[code])
      if (n.meta?.lat == null || n.meta?.lng == null) continue
      const k = `${n.meta.lat.toFixed(2)},${n.meta.lng.toFixed(2)}`
      const list = byPos.get(k)
      if (list) list.push(n)
      else byPos.set(k, [n])
    }

    return {
      groups: [...byPos.entries()].map(([key, ns]) => ({
        key,
        lat: ns[0].meta.lat!,
        lng: ns[0].meta.lng!,
        nodes: ns.map(n => ({
          name: displayName(n),
          online: n.online,
          uuid: n.uuid,
        })),
      })),
      activeNames: names,
    }
  }, [nodes])

  const handleMarkerClick = (e: React.MouseEvent, g: MarkerGroup) => {
    e.stopPropagation()
    if (g.nodes.length === 1) {
      onOpen?.(g.nodes[0].uuid)
    } else {
      const svg = (e.target as SVGElement).closest('svg')
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      setTooltip(prev => prev?.group.key === g.key ? null : {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        group: g,
      })
    }
  }

  return (
    <div className="card-soft rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MapPin className="h-4 w-4 text-primary/70" />
        节点地图
        <span className="ml-auto text-xs text-muted-foreground font-mono">
          {groups.reduce((s, g) => s + g.nodes.length, 0)} 节点
        </span>
      </div>
      <div
        className="relative w-full overflow-hidden rounded-md border border-border/40 text-foreground"
        style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}
        onClick={() => setTooltip(null)}
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
              geographies.map(geo => {
                const isActive = activeNames.has(geo.properties.name)
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isActive ? GREEN : 'currentColor'}
                    fillOpacity={isActive ? 0.22 : 0.06}
                    stroke="currentColor"
                    strokeOpacity={0.2}
                    strokeWidth={0.4}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fillOpacity: isActive ? 0.30 : 0.10 },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>

          {groups.map(g => {
            const anyOnline = g.nodes.some(n => n.online)
            return (
              <Marker key={g.key} coordinates={[g.lng, g.lat]}>
                {anyOnline && (
                  <circle r={6} fill={GREEN} opacity={0.2}>
                    <animate attributeName="r" values="4;8;4" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0;0.3" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  r={g.nodes.length > 1 ? 4 : 2.5}
                  fill={anyOnline ? GREEN : GRAY}
                  stroke="white"
                  strokeWidth={0.8}
                  className="cursor-pointer"
                  onClick={(e) => handleMarkerClick(e, g)}
                />
                {g.nodes.length > 1 && (
                  <text y={1.5} textAnchor="middle" fontSize={5} fontWeight={600} fill="white" style={{ pointerEvents: 'none' }}>
                    {g.nodes.length}
                  </text>
                )}
              </Marker>
            )
          })}
        </ComposableMap>

        {/* Tooltip — vertical list with status dots */}
        {tooltip && (
          <div
            className="absolute z-10 rounded-md bg-popover/95 backdrop-blur text-popover-foreground text-xs shadow-lg border border-border/50 overflow-hidden"
            style={{
              left: Math.min(tooltip.x, MAP_W - 120),
              top: tooltip.y - 8 - tooltip.group.nodes.length * 28,
              transform: 'translateX(-50%)',
            }}
          >
            {tooltip.group.nodes.map((n, i) => (
              <button
                key={n.uuid}
                className="flex items-center gap-2 px-3 py-1.5 w-full text-left hover:bg-accent transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen?.(n.uuid)
                  setTooltip(null)
                }}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${n.online ? 'bg-[#3a6b4a]' : 'bg-gray-400'}`} />
                <span className="truncate">{n.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
