# StatusShow 自定义功能补丁

> 当官方 StatusShow 更新后，按此文件将自定义功能重新加入。

## 功能概览

1. **Hudson 风格 UI 改造** — 侧边栏布局、状态横幅、汇总卡片、圆形仪表盘
2. **卡片累加流量** — NodeCard 网速行右侧显示 `↓XX GB ↑XX GB`
3. **访客 IP 胶囊** — 页面底部蓝色毛玻璃胶囊，显示访客 IP / 城市 / ISP

---

## 1. Hudson 风格 UI 改造

### 新增组件文件

以下文件需要创建在 `src/components/` 目录：

- `CircularGauge.tsx` — SVG 圆形仪表盘，用于 CPU/内存/磁盘显示
- `StatusBanner.tsx` — 顶部状态横幅，显示在线/降级/离线数量 + 进度条
- `SummaryCards.tsx` — 5 个汇总指标卡（服务器总数、平均CPU、平均内存、总流量、可用率）
- `NodeValueCard.tsx` — 节点价值估算卡片
- `CompactMap.tsx` — 侧边栏小地图（基于 react-simple-maps）
- `BandwidthGraph.tsx` — 实时带宽图表（基于 recharts）
- `Sidebar.tsx` — 组合侧边栏组件

### App.tsx 布局改造

```tsx
// 新增 import
import { StatusBanner } from './components/StatusBanner'
import { SummaryCards } from './components/SummaryCards'
import { Sidebar } from './components/Sidebar'

// 主布局从单栏改为侧边栏 + 主内容
<div className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex gap-6">
  {/* 侧边栏 */}
  <Sidebar nodes={nodes} />
  
  {/* 主内容 */}
  <main className="flex-1 min-w-0 space-y-6">
    {!empty && <StatusBanner nodes={nodes} />}
    {!empty && <SummaryCards nodes={nodes} />}
    {/* 原有过滤器和节点列表 */}
  </main>
</div>
```

### NodeCard.tsx 改造

用 `CircularGauge` 替代 `Progress` 进度条：

```tsx
// 替换 import
import { CircularGauge } from './CircularGauge'
// 移除 Progress import

// 替换 Metric 组件为圆形仪表盘
<div className="flex items-center justify-around py-1">
  <CircularGauge value={u.cpu} size={60} strokeWidth={5} label="CPU" sub={cpu || undefined} />
  <CircularGauge value={u.mem} size={60} strokeWidth={5} label="内存" sub={u.memTotal ? `${bytes(u.memUsed)}` : undefined} />
  <CircularGauge value={u.disk} size={60} strokeWidth={5} label="磁盘" sub={u.diskTotal ? `${bytes(u.diskUsed)}` : undefined} />
</div>
```

---

## 2. 卡片累加流量 (NodeCard.tsx)

在网络速度那行（`<Stat icon={ArrowDown}>` 和 `<Stat icon={ArrowUp}>` 之后），加入累加流量显示：

```diff
          <div className="pt-2.5 border-t border-dashed font-mono text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-3">
              <Stat icon={ArrowDown}>{bytes(u.netIn || 0)}/s</Stat>
              <Stat icon={ArrowUp}>{bytes(u.netOut || 0)}/s</Stat>
+             {(u.totalReceived != null || u.totalTransmitted != null) && (
+               <span className="ml-auto">
+                 ↓{bytes(u.totalReceived || 0)} ↑{bytes(u.totalTransmitted || 0)}
+               </span>
+             )}
            </div>
```

**依赖**: `src/utils/derive.ts` 中需有 `totalReceived` 和 `totalTransmitted` 字段映射：

```ts
// deriveUsage 函数返回值中：
totalReceived: d?.total_received,
totalTransmitted: d?.total_transmitted,
```

`src/types.ts` 中需有类型定义（官方已包含）：

```ts
total_received?: number
total_transmitted?: number
```

---

## 3. 访客 IP 胶囊

需要修改 3 个文件，全部在项目根目录。

### 3a. index.html — 异步注入入口

在 `<body>` 末尾、`</body>` 之前，加入以下 inline snippet。**不要**在 `<head>` 中加 `<link>`，不要在 `<body>` 中加 `<script src="custom.js">`，全部由这段代码动态注入：

```html
    <script>
      // 访客胶囊 — 页面完全加载后异步注入，零阻塞
      window.addEventListener('load', function () {
        setTimeout(function () {
          var link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = './custom.css?v=6'
          document.head.appendChild(link)
          var script = document.createElement('script')
          script.src = './custom.js?v=6'
          document.body.appendChild(script)
        }, 300)
      })
    </script>
```

### 3b. custom.js — 胶囊逻辑

```js
// 访客信息胶囊 — 完全独立，不影响页面加载
;(function () {
  'use strict'

  var GEO_API = [
    { url: 'https://api.ip.sb/geoip', parse: function (d) { return { ip: d.ip, country: d.country_code, city: d.city, org: d.asn_organization || d.organization } } },
    { url: 'https://ipapi.co/json/', parse: function (d) { return { ip: d.ip, country: d.country_code, city: d.city, org: d.org } } },
    { url: 'https://ip-api.com/json/', parse: function (d) { return { ip: d.query, country: d.countryCode, city: d.city, org: d.isp } } },
  ]

  function flagEmoji (cc) {
    if (!cc || cc.length !== 2) return ''
    return String.fromCodePoint.apply(null, [].map.call(cc.toUpperCase(), function (c) { return 0x1F1E6 + c.charCodeAt(0) - 65 }))
  }

  function run () {
    var root = document.getElementById('root')
    if (!root) return

    var old = document.getElementById('ng-visitor-capsule')
    if (old) old.remove()

    var capsule = document.createElement('div')
    capsule.id = 'ng-visitor-capsule'
    capsule.className = 'ng-visitor-capsule ng-visitor-loading'
    capsule.textContent = '🔍 正在获取访客信息…'
    root.appendChild(capsule)

    function fetchWithTimeout (url, ms) {
      var ctrl = new AbortController()
      var timer = setTimeout(function () { ctrl.abort() }, ms)
      return fetch(url, { signal: ctrl.signal }).finally(function () { clearTimeout(timer) })
    }

    function tryApi (index) {
      if (index >= GEO_API.length) {
        capsule.remove()
        return
      }
      var api = GEO_API[index]
      fetchWithTimeout(api.url, 3000)
        .then(function (r) { return r.json() })
        .then(function (data) {
          var info = api.parse(data)
          if (!info.ip) throw new Error('no ip')
          showCapsule(capsule, info)
        })
        .catch(function () {
          tryApi(index + 1)
        })
    }

    tryApi(0)
  }

  function showCapsule (capsule, info) {
    var flag = flagEmoji(info.country)
    var parts = [flag, info.ip, info.city, info.org].filter(Boolean)
    capsule.textContent = parts.join(' · ')
    capsule.className = 'ng-visitor-capsule'

    setTimeout(function () {
      capsule.classList.add('ng-visitor-fadeout')
      setTimeout(function () { capsule.remove() }, 600)
    }, 10000)
  }

  if (document.readyState === 'complete') {
    run()
  } else {
    window.addEventListener('load', run)
  }

  // SPA 路由变化时重新注入
  var lastPath = location.pathname
  setInterval(function () {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname
      setTimeout(run, 500)
    }
  }, 2000)
})()
```

### 3c. custom.css — 胶囊样式

```css
.ng-visitor-capsule {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  font-family: inherit;
  font-size: 12px;
  color: #fff;
  background: rgba(37, 99, 235, 0.75);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 6px 20px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  animation: capsule-fadein 0.4s ease-out 0.1s forwards;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dark .ng-visitor-capsule {
  background: rgba(59, 130, 246, 0.55);
  border-color: rgba(255, 255, 255, 0.1);
}

.ng-visitor-loading {
  opacity: 0.6;
  font-size: 11px;
  animation: none;
}

.ng-visitor-fadeout {
  animation: capsule-fadeout 0.6s ease-out forwards;
}

@keyframes capsule-fadein {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@keyframes capsule-fadeout {
  from { opacity: 1; }
  to { opacity: 0; }
}

@media (max-width: 640px) {
  .ng-visitor-capsule {
    font-size: 10px;
    padding: 5px 14px;
    bottom: 8px;
  }
}
```

---

## 注意事项

- **IP API 选择**: `ipinfo.io` 在国内很多人访问不了，用 `api.ip.sb` 作为首选（国内最快），`ipapi.co` 和 `ip-api.com` 作为降级
- **不要用 MutationObserver**: 会干扰 React SPA 渲染，导致性能问题
- **不要阻塞页面加载**: CSS 和 JS 必须通过 inline snippet 动态注入，不要放在 `<head>` 或 `<body>` 的静态标签中
- **custom.css 和 custom.js 放在项目根目录**（和 index.html 同级）
- **版本号**: 每次修改后递增 `?v=N` 缓存破坏参数
- **侧边栏响应式**: 侧边栏仅在 lg 以上屏幕显示（`hidden lg:block`），移动端自动隐藏
- **汇总卡片响应式**: 5 列网格在小屏幕可能需要调整为 2-3 列
