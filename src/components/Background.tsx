export function Background() {
  return (
    <div className="fixed inset-0 -z-10 bg-soft" aria-hidden>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 左侧主山 — 浓墨近山 */}
        <svg
          className="absolute -left-10 bottom-0 w-[700px] h-[450px] opacity-[0.12] dark:opacity-[0.15]"
          viewBox="0 0 700 450"
          fill="none"
          style={{ animation: 'cloud-drift 25s ease-in-out infinite' }}
        >
          <path
            d="M0 280 Q80 160 180 240 Q260 120 380 200 Q480 100 580 180 Q650 140 700 220 L700 450 L0 450 Z"
            fill="currentColor"
            className="text-foreground"
          />
          <path
            d="M0 320 Q120 220 260 290 Q380 200 500 270 Q600 220 700 290 L700 450 L0 450 Z"
            fill="currentColor"
            className="text-foreground"
            opacity="0.5"
          />
          <path
            d="M0 360 Q150 300 300 340 Q450 290 600 330 Q660 310 700 350 L700 450 L0 450 Z"
            fill="currentColor"
            className="text-foreground"
            opacity="0.25"
          />
        </svg>

        {/* 右侧远山 — 淡墨 */}
        <svg
          className="absolute -right-10 bottom-0 w-[600px] h-[400px] opacity-[0.08] dark:opacity-[0.12]"
          viewBox="0 0 600 400"
          fill="none"
          style={{ animation: 'cloud-drift 30s ease-in-out infinite reverse' }}
        >
          <path
            d="M600 250 Q500 130 400 210 Q300 90 200 180 Q100 120 0 200 L0 400 L600 400 Z"
            fill="currentColor"
            className="text-foreground"
          />
          <path
            d="M600 300 Q480 210 360 270 Q240 180 120 240 Q60 200 0 260 L0 400 L600 400 Z"
            fill="currentColor"
            className="text-foreground"
            opacity="0.4"
          />
        </svg>

        {/* 云雾飘带 — 顶部 */}
        <div
          className="absolute top-[8%] left-0 right-0 h-24 opacity-[0.06] dark:opacity-[0.08]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, hsl(220 12% 60%) 20%, hsl(220 10% 70%) 50%, hsl(220 12% 60%) 80%, transparent 100%)',
            filter: 'blur(30px)',
            animation: 'cloud-drift 40s ease-in-out infinite',
          }}
        />

        {/* 水墨晕染点 */}
        <div
          className="absolute top-[18%] left-[8%] w-56 h-56 rounded-full opacity-[0.05] dark:opacity-[0.07]"
          style={{
            background: 'radial-gradient(circle, hsl(220 18% 35%), transparent 70%)',
            filter: 'blur(20px)',
            animation: 'cloud-drift 35s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-[25%] right-[12%] w-40 h-40 rounded-full opacity-[0.04] dark:opacity-[0.06]"
          style={{
            background: 'radial-gradient(circle, hsl(220 15% 45%), transparent 70%)',
            filter: 'blur(15px)',
            animation: 'cloud-drift 28s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute top-[50%] left-[45%] w-32 h-32 rounded-full opacity-[0.03] dark:opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, hsl(220 12% 50%), transparent 70%)',
            filter: 'blur(25px)',
            animation: 'cloud-drift 32s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  )
}