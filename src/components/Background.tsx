export function Background() {
  return (
    <div className="fixed inset-0 -z-10 bg-soft" aria-hidden>
      {/* 水墨云纹装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 左上远山 */}
        <svg
          className="absolute -top-20 -left-20 w-[600px] h-[400px] opacity-[0.04] dark:opacity-[0.06]"
          viewBox="0 0 600 400"
          fill="none"
          style={{ animation: 'cloud-drift 20s ease-in-out infinite' }}
        >
          <path
            d="M0 300 Q100 200 200 280 Q300 180 400 250 Q500 200 600 300 L600 400 L0 400 Z"
            fill="currentColor"
            className="text-foreground"
          />
          <path
            d="M0 320 Q150 250 300 300 Q450 250 600 320 L600 400 L0 400 Z"
            fill="currentColor"
            className="text-foreground"
            opacity="0.5"
          />
        </svg>

        {/* 右下山影 */}
        <svg
          className="absolute -bottom-10 -right-10 w-[500px] h-[300px] opacity-[0.03] dark:opacity-[0.05]"
          viewBox="0 0 500 300"
          fill="none"
          style={{ animation: 'cloud-drift 25s ease-in-out infinite reverse' }}
        >
          <path
            d="M500 250 Q400 150 300 220 Q200 120 100 200 Q0 150 0 250 L0 300 L500 300 Z"
            fill="currentColor"
            className="text-foreground"
          />
        </svg>

        {/* 水墨晕染点 */}
        <div
          className="absolute top-[20%] left-[10%] w-48 h-48 rounded-full opacity-[0.02] dark:opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, hsl(220 15% 40%), transparent 70%)',
            animation: 'cloud-drift 30s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-[30%] right-[15%] w-32 h-32 rounded-full opacity-[0.02] dark:opacity-[0.03]"
          style={{
            background: 'radial-gradient(circle, hsl(220 12% 50%), transparent 70%)',
            animation: 'cloud-drift 35s ease-in-out infinite reverse',
          }}
        />
      </div>
    </div>
  )
}
