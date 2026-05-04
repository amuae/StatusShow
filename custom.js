// 访客信息胶囊 — 完全独立，不影响页面加载
;(function () {
  'use strict'

  const GEO_API = [
    { url: 'https://api.ip.sb/geoip', parse: d => ({ ip: d.ip, country: d.country_code, city: d.city, org: d.asn_organization || d.organization }) },
    { url: 'https://ipapi.co/json/', parse: d => ({ ip: d.ip, country: d.country_code, city: d.city, org: d.org }) },
    { url: 'https://ip-api.com/json/', parse: d => ({ ip: d.query, country: d.countryCode, city: d.city, org: d.isp }) },
  ]

  function flagEmoji (cc) {
    if (!cc || cc.length !== 2) return ''
    return String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
  }

  function run () {
    // 确保容器存在
    var root = document.getElementById('root')
    if (!root) return

    // 移除旧胶囊（SPA 路由切换时）
    var old = document.getElementById('ng-visitor-capsule')
    if (old) old.remove()

    var capsule = document.createElement('div')
    capsule.id = 'ng-visitor-capsule'
    capsule.className = 'ng-visitor-capsule ng-visitor-loading'
    capsule.textContent = '🔍 正在获取访客信息…'
    root.appendChild(capsule)

    // 带超时的 fetch
    function fetchWithTimeout (url, ms) {
      var ctrl = new AbortController()
      var timer = setTimeout(function () { ctrl.abort() }, ms)
      return fetch(url, { signal: ctrl.signal }).finally(function () { clearTimeout(timer) })
    }

    // 依次尝试 API
    function tryApi (index) {
      if (index >= GEO_API.length) {
        // 所有 API 都失败，隐藏胶囊
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

    // 10 秒后淡出移除
    setTimeout(function () {
      capsule.classList.add('ng-visitor-fadeout')
      setTimeout(function () { capsule.remove() }, 600)
    }, 10000)
  }

  // 完全异步：等页面加载完再注入
  if (document.readyState === 'complete') {
    setTimeout(run, 1500)
  } else {
    window.addEventListener('load', function () {
      setTimeout(run, 1500)
    })
  }

  // SPA 路由变化时重新注入
  var lastPath = location.pathname
  setInterval(function () {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname
      setTimeout(run, 1000)
    }
  }, 2000)
})()
