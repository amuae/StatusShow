export function Background() {
  return (
    <div className="fixed inset-0 -z-10 bg-soft" aria-hidden>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 左侧主山 — 底部，用 CSS opacity 避免 SVG 内叠加 */}
        <svg
          className="absolute -left-[5%] bottom-0 w-[60vw] h-[350px] opacity-[0.08] dark:opacity-[0.14]"
          viewBox="0 0 700 350"
          fill="none"
          preserveAspectRatio="xMinYMax slice"
          style={{ animation: 'cloud-drift 25s ease-in-out infinite' }}
        >
          <path d="M0 180 Q80 60 180 140 Q260 20 380 100 Q480 0 580 80 Q650 40 700 120 L700 350 L0 350 Z" fill="currentColor" className="text-foreground" />
          <path d="M0 220 Q120 120 260 190 Q380 100 500 170 Q600 120 700 190 L700 350 L0 350 Z" fill="currentColor" className="text-foreground" />
        </svg>

        {/* 中间远山 */}
        <svg
          className="absolute left-[20%] bottom-0 w-[65vw] h-[300px] opacity-[0.04] dark:opacity-[0.10]"
          viewBox="0 0 700 300"
          fill="none"
          preserveAspectRatio="xMidYMax slice"
          style={{ animation: 'cloud-drift 35s ease-in-out infinite' }}
        >
          <path d="M0 250 Q100 100 200 180 Q300 40 400 120 Q500 20 600 100 Q680 60 700 150 L700 300 L0 300 Z" fill="currentColor" className="text-foreground" />
          <path d="M0 270 Q150 180 300 220 Q450 150 600 200 Q660 180 700 230 L700 300 L0 300 Z" fill="currentColor" className="text-foreground" />
        </svg>

        {/* 右侧远山 */}
        <svg
          className="absolute -right-[5%] bottom-0 w-[55vw] h-[300px] opacity-[0.06] dark:opacity-[0.12]"
          viewBox="0 0 600 300"
          fill="none"
          preserveAspectRatio="xMaxYMax slice"
          style={{ animation: 'cloud-drift 30s ease-in-out infinite reverse' }}
        >
          <path d="M600 150 Q500 30 400 110 Q300 0 200 80 Q100 20 0 100 L0 300 L600 300 Z" fill="currentColor" className="text-foreground" />
          <path d="M600 200 Q480 110 360 170 Q240 80 120 140 Q60 100 0 160 L0 300 L600 300 Z" fill="currentColor" className="text-foreground" />
        </svg>

        {/* 云雾飘带 — 上1/3 */}
        <div
          className="absolute top-[5%] left-0 right-0 h-20 opacity-[0.08] dark:opacity-[0.12]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, hsl(220 12% 65%) 15%, hsl(220 10% 72%) 50%, hsl(220 12% 65%) 85%, transparent 100%)',
            filter: 'blur(30px)',
            animation: 'cloud-drift 40s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-[15%] left-[10%] right-[10%] h-16 opacity-[0.05] dark:opacity-[0.08]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, hsl(220 10% 70%) 25%, hsl(220 8% 78%) 50%, hsl(220 10% 70%) 75%, transparent 100%)',
            filter: 'blur(25px)',
            animation: 'cloud-drift 45s ease-in-out infinite reverse',
          }}
        />

        {/* 水墨晕染点 — 中上部 */}
        <div
          className="absolute top-[20%] left-[8%] w-56 h-56 rounded-full opacity-[0.04] dark:opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, hsl(220 18% 40%), transparent 70%)', filter: 'blur(20px)', animation: 'cloud-drift 35s ease-in-out infinite' }}
        />
        <div
          className="absolute top-[35%] right-[12%] w-40 h-40 rounded-full opacity-[0.03] dark:opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, hsl(220 15% 50%), transparent 70%)', filter: 'blur(15px)', animation: 'cloud-drift 28s ease-in-out infinite reverse' }}
        />
      </div>
    </div>
  )
}
