// 访客 IP 信息胶囊（Komari 风格）
;(async () => {
  try {
    const r = await fetch('https://ipinfo.io/json')
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

    capsule.addEventListener('click', dismiss)

    let injected = false
    const inject = () => {
      if (document.getElementById('visitor-capsule')) return
      document.body.appendChild(capsule)
      if (!injected) {
        requestAnimationFrame(() => capsule.classList.add('vc-show'))
        injected = true
      }
    }

    const observer = new MutationObserver(() => {
      if (!document.getElementById('visitor-capsule')) inject()
    })
    observer.observe(document.body, { childList: true })

    await new Promise(r => setTimeout(r, 1500))
    inject()

    const timer = setTimeout(dismiss, 10000)

    function dismiss() {
      clearTimeout(timer)
      observer.disconnect()
      capsule.classList.remove('vc-show')
      capsule.addEventListener('transitionend', () => capsule.remove(), { once: true })
    }
  } catch {}
})()
