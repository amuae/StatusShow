import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { AlertTriangle, ChevronRight, Loader2, X } from 'lucide-react'
import { Card } from './ui/card'
import { Flag } from './Flag'
import { StatusDot } from './StatusDot'
import { displayName, distroLogo } from '../utils/derive'
import type { Node } from '../types'

const MAP_W = 900
const MAP_H = 520
const TINY_DEG = 2
const GEO_URL = `${import.meta.env.BASE_URL}world.geo.json`

/* ── 水墨绿热力色 ─── */
const HEAT_LIGHT = [
  [186, 208, 190],   // 淡墨绿
  [120, 160, 132],   // 中墨绿
  [58, 107, 74],     // 深墨绿
]
const HEAT_DARK = [
  [142, 178, 150],
  [90, 138, 108],
  [58, 107, 74],
]

const cnameMap = new Map<string, string>()
const knownA2 = new Set<string>()
const tinyCenter = new Map<string, [number, number]>()
let mapPromise: Promise<void> | null = null

interface CountryEntry {
  online: number
  offline: number
  nodes: Node[]
}

interface Props {
  nodes: Node[]
  onOpen?: (uuid: string) => void
}

/** 检测当前是否暗色模式 */
function isDark(): boolean {
  return document.documentElement.classList.contains('dark')
}

function ringBbox(ring: number[][]) {
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  return { minLng, maxLng, minLat, maxLat, w: maxLng - minLng, h: maxLat - minLat }
}

function tinyMeta(geometry: any): { center: [number, number]; size: number } | null {
  if (!geometry?.coordinates) return null
  const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates]
  let best: ReturnType<typeof ringBbox> | null = null
  let bestArea = -1
  for (const poly of polygons) {
    const outer = poly[0]
    if (!outer) continue
    const bb = ringBbox(outer)
    const area = bb.w * bb.h
    if (area > bestArea) {
      bestArea = area
      best = bb
    }
  }
  if (!best) return null
  return {
    center: [(best.minLng + best.maxLng) / 2, (best.minLat + best.maxLat) / 2],
    size: Math.max(best.w, best.h),
  }
}

function heatColor(t: number, dark: boolean) {
  const heat = dark ? HEAT_DARK : HEAT_LIGHT
  const x = Math.min(1, Math.max(0, t))
  const seg = x >= 0.5 ? 1 : 0
  const f = (x - seg * 0.5) * 2
  const a = heat[seg]
  const b = heat[seg + 1]
  const r = Math.round(a[0] + (b[0] - a[0]) * f)
  const g = Math.round(a[1] + (b[1] - a[1]) * f)
  const c = Math.round(a[2] + (b[2] - a[2]) * f)
  return `rgb(${r},${g},${c})`
}

function ensureMap() {
  if (!mapPromise) {
    mapPromise = fetch(GEO_URL)
      .then(r => r.json())
      .then(geo => {
        for (const f of geo.features ?? []) {
          const a2 = f.properties?.name
          if (!a2) continue
          knownA2.add(a2)
          if (f.properties?.cname) cnameMap.set(a2, f.properties.cname)
          const m = tinyMeta(f.geometry)
          if (m && m.size < TINY_DEG) tinyCenter.set(a2, m.center)
        }
        echarts.registerMap('world', geo)
      })
      .catch(err => {
        mapPromise = null
        throw err
      })
  }
  return mapPromise
}

export function WorldMap({ nodes, onOpen }: Props) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [pickedA2, setPickedA2] = useState<string | null>(null)
  const [renderA2, setRenderA2] = useState<string | null>(null)
  const [dark, setDark] = useState(isDark)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  /* 监听暗色/亮色切换 */
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(isDark()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    ensureMap()
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (pickedA2) {
      setRenderA2(pickedA2)
    } else if (renderA2) {
      const t = window.setTimeout(() => setRenderA2(null), 160)
      return () => clearTimeout(t)
    }
  }, [pickedA2, renderA2])

  const { byCountry, total } = useMemo(() => {
    const map = new Map<string, CountryEntry>()
    let total = 0
    for (const n of nodes) {
      const a2 = n.meta?.region?.trim().toUpperCase()
      if (!a2 || !/^[A-Z]{2}$/.test(a2)) continue
      total++
      const e = map.get(a2) || { online: 0, offline: 0, nodes: [] }
      if (n.online) e.online++
      else e.offline++
      e.nodes.push(n)
      map.set(a2, e)
    }
    return { byCountry: map, total }
  }, [nodes])

  const dataSig = useMemo(
    () =>
      [...byCountry.entries()]
        .map(([k, v]) => `${k}:${v.online}/${v.offline}`)
        .sort()
        .join(','),
    [byCountry],
  )

  const liveRef = useRef({ byCountry, onOpen })
  useEffect(() => {
    liveRef.current = { byCountry, onOpen }
  })

  const option = useMemo(() => buildOption(byCountry, dark), [dataSig, dark])
  /* 数据到了才渲染地图，避免空数据 → ECharts 拒绝刷新的 bug */
  const canRender = ready && total > 0

  useEffect(() => {
    if (!canRender || !wrapRef.current) return
    /* 销毁重建：数据到达或暗色模式切换时完全重绘 */
    if (chartRef.current) {
      chartRef.current.dispose()
      chartRef.current = null
    }
    chartRef.current = echarts.init(wrapRef.current)
    chartRef.current.on('click', (p: any) => {
      const cur = liveRef.current
      const e = cur.byCountry.get(p.name)
      if (!e) return
      if (e.nodes.length === 1) cur.onOpen?.(e.nodes[0].uuid)
      else setPickedA2(p.name)
    })
    chartRef.current.setOption(option)
  }, [canRender, option])

  useEffect(() => {
    if (!canRender || !chartRef.current) return
    const ro = new ResizeObserver(() => chartRef.current?.resize())
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [canRender])

  useEffect(() => {
    return () => {
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  const renderEntry = renderA2 ? byCountry.get(renderA2) ?? null : null

  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-center mb-3 px-1">
        <div className="text-sm font-semibold text-foreground/90">地理位置</div>
      </div>

      <div
        className={`relative w-full overflow-hidden rounded-md border border-border/60 ${dark ? 'bg-[hsl(220_20%_12%)]' : 'bg-[hsl(36_25%_90%)]'}`}
        style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}
      >
        {/* 只有数据到了才挂载 canvas */}
        {canRender && <div ref={wrapRef} className="absolute inset-0" />}
        {/* 数据未到时显示加载提示 */}
        {ready && total === 0 && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground/60 pointer-events-none">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> 加载中…
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>地图加载失败</div>
            <div className="text-xs text-muted-foreground/60 break-all">{error.message}</div>
          </div>
        )}

        {renderEntry && renderA2 && (
          <NodePopover
            a2={renderA2}
            entry={renderEntry}
            open={pickedA2 === renderA2}
            onPick={uuid => {
              setPickedA2(null)
              onOpen?.(uuid)
            }}
            onClose={() => setPickedA2(null)}
          />
        )}

        <div className="absolute bottom-3 right-4 z-10 font-mono text-sm font-semibold tracking-wider text-muted-foreground pointer-events-none uppercase">
          {total} nodes
        </div>
      </div>
    </Card>
  )
}

/* ──────────────────────────────────────────────────────────
 * ECharts 颜色必须用逗号分隔的 HSL/RGBA 格式。
 * 现代 CSS hsl(36 10% 22% / 0.50) 空格语法 ECharts 无法解析！
 * ────────────────────────────────────────────────────────── */

function buildOption(byCountry: Map<string, CountryEntry>, dark: boolean) {
  const entries = [...byCountry.entries()].filter(([a2]) => knownA2.has(a2))
  const max = entries.reduce((m, [, e]) => Math.max(m, e.online + e.offline), 0)

  /* data 里只放有节点的国家，value = 节点数 */
  const data = entries.map(([a2, e]) => ({
    name: a2,
    value: e.online + e.offline,
  }))

  const tinyMarkers = entries
    .map(([a2, e]) => {
      const c = tinyCenter.get(a2)
      if (!c) return null
      const v = e.online + e.offline
      const t = max > 0 ? v / max : 0
      return {
        name: a2,
        coord: c,
        value: v,
        symbolSize: 6 + Math.min(8, Math.log2(v + 1) * 3),
        itemStyle: {
          color: heatColor(0.35 + 0.65 * t, dark),
          borderColor: dark ? 'rgba(58,80,52,0.75)' : 'rgba(40,70,48,0.65)',
          borderWidth: 0.8,
          shadowBlur: 6,
          shadowColor: dark ? 'rgba(90,138,108,0.40)' : 'rgba(58,107,74,0.30)',
        },
      }
    })
    .filter((x): x is NonNullable<typeof x> => x != null)

  /* ── 主题色 — hex/rgba 格式（ECharts 兼容） ─── */
  const emptyArea = dark ? 'rgba(39,43,53,0.85)' : 'rgba(220,215,205,0.85)'
  const baseBorder = dark ? 'rgba(100,110,130,0.35)' : 'rgba(160,150,135,0.40)'
  const emphasisArea = dark ? '#5a8a6c' : '#3a6b4a'
  const tooltipBg = dark ? 'rgba(18,20,28,0.94)' : 'rgba(250,247,240,0.96)'
  const tooltipBorder = dark ? 'rgba(60,65,80,0.6)' : 'rgba(180,170,155,0.7)'
  const tooltipText = dark ? '#d4cec4' : '#2c2820'
  const tooltipMuted = dark ? '#8a8278' : '#6b6560'
  const onlineColor = '#3a6b4a'

  return {
    backgroundColor: 'transparent',
    /* pieces visualMap：只映射 value >= 1 的国家 */
    visualMap: {
      type: 'piecewise' as const,
      show: false,
      pieces: [
        { min: 1, color: '#8eb296', label: '1' },
        ...(max >= 2 ? [{ min: 2, color: '#5a8a6c', label: '2+' }] : []),
        ...(max >= 3 ? [{ min: 3, color: '#3a6b4a', label: '3+' }] : []),
      ],
      outOfRange: { color: emptyArea },
    },
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      padding: [6, 10] as [number, number],
      textStyle: { color: tooltipText, fontSize: 12 },
      formatter: (p: any) => {
        const a2 = p.name
        const cname = cnameMap.get(a2)
        const head = cname ? `${cname} <span style="color:${tooltipMuted}">${a2}</span>` : a2
        const e = byCountry.get(a2)
        if (!e) return `<b>${head}</b><br/><span style="color:${tooltipMuted}">无节点</span>`
        const offline = e.offline
          ? ` <span style="color:${tooltipMuted}">· ${e.offline} 离线</span>`
          : ''
        return `<b>${head}</b><br/>${e.online + e.offline} 节点 <span style="color:${onlineColor}">· ${e.online} 在线</span>${offline}`
      },
    },
    series: [
      {
        type: 'map' as const,
        map: 'world',
        roam: false,
        zoom: 1.15,
        layoutCenter: ['50%', '50%'] as [string, string],
        layoutSize: '100%',
        selectedMode: false,
        /* 无节点国家默认色 */
        itemStyle: {
          areaColor: emptyArea,
          borderColor: baseBorder,
          borderWidth: 0.4,
        },
        emphasis: {
          label: { show: false },
          itemStyle: { areaColor: emphasisArea },
        },
        label: { show: false },
        data,
        markPoint: {
          symbol: 'circle',
          label: { show: false },
          emphasis: { label: { show: false }, scale: 1.3 },
          data: tinyMarkers,
        },
      },
    ],
  }
}

function NodePopover({
  a2,
  entry,
  open,
  onPick,
  onClose,
}: {
  a2: string
  entry: CountryEntry
  open: boolean
  onPick: (uuid: string) => void
  onClose: () => void
}) {
  const cname = cnameMap.get(a2) || a2
  return (
    <div
      data-state={open ? 'open' : 'closed'}
      className="absolute right-3 top-3 z-20 w-64 rounded-lg border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden origin-top-right duration-150 fill-mode-forwards data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <div key={a2} className="animate-in fade-in-0 duration-100 fill-mode-forwards">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/70">
          <Flag code={a2} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate leading-tight">{cname}</div>
            <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
              <span className="text-[#3a6b4a]">{entry.online} 在线</span>
              {entry.offline > 0 && <span className="ml-2">{entry.offline} 离线</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="-mr-1 h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="max-h-72 overflow-auto py-1">
          {entry.nodes.map(n => {
            const logo = distroLogo(n)
            return (
              <button
                key={n.uuid}
                onClick={() => onPick(n.uuid)}
                className="group w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left transition-colors"
              >
                <StatusDot online={n.online} className="w-1.5 h-1.5 ring-1" />
                {logo && (
                  <img
                    src={logo}
                    alt=""
                    className="w-3.5 h-3.5 shrink-0 object-contain opacity-80"
                    loading="lazy"
                  />
                )}
                <span className="truncate flex-1 text-foreground/90">{displayName(n)}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
