// 访客 IP 信息胶囊（Komari 风格）
// 非阻塞：页面渲染不受 API 延迟影响
;(async () => {
  try {
    // 用 AbortController 设置 3 秒超时，防止 API 慢拖垮页面
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 3000)

    const r = await fetch('https://ipinfo.io/json', { signal: ctrl.signal })
    clearTimeout(timer)
    if (!r.ok) return
    const d = await r.json()

    const ip = d.ip || ''
    const country = d.country || ''
    const city = d.city || ''
    const org = (d.org || '').replace(/^AS\d+\s+/, '')

    if (!ip) return

    const flag = country.length === 2
      ? String.fromCodePoint(...[...country.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
      : ''

    const capsule = document.createElement('div')
    capsule.id = 'visitor-capsule'
    capsule.innerHTML = `
      <span class="vc-flag">${flag}</span>
      <span class="vc-body">
        <span class="vc-ip">${ip}</span>
        <span class="vc-sep"></span>
        <span class="vc-city">${city || country}</span>
        <span class="vc-sep"></span>
        <span class="vc-org" title="${org}">${org}</span>
      </span>
    `

    capsule.addEventListener('click', () => {
      capsule.classList.remove('vc-show')
      capsule.addEventListener('transitionend', () => capsule.remove(), { once: true })
    })

    // 等 React 挂载完毕再注入
    await new Promise(r => setTimeout(r, 2000))
    if (document.getElementById('visitor-capsule')) return
    document.body.appendChild(capsule)
    requestAnimationFrame(() => capsule.classList.add('vc-show'))

    // 10 秒后自动消失
    setTimeout(() => {
      if (!capsule.isConnected) return
      capsule.classList.remove('vc-show')
      capsule.addEventListener('transitionend', () => capsule.remove(), { once: true })
    }, 10000)
  } catch {}
})()
