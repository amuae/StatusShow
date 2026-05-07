import { cn } from '../utils/cn'

interface Props {
  value: number | undefined
  size?: number
  strokeWidth?: number
  label: string
  sub?: string | null
  className?: string
}

function gaugeColor(value: number): string {
  if (value >= 90) return 'text-seal'
  if (value >= 70) return 'text-amber-700 dark:text-amber-500'
  if (value >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-primary/70'
}

function gaugeStroke(value: number): string {
  if (value >= 90) return 'hsl(0 68% 42%)'
  if (value >= 70) return 'hsl(35 60% 45%)'
  if (value >= 50) return 'hsl(38 45% 48%)'
  return 'hsl(220 25% 35%)'
}

export function CircularGauge({ value, size = 64, strokeWidth = 5, label, sub, className }: Props) {
  const pct = value != null && Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : null
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = pct != null ? circumference * (1 - pct / 100) : circumference
  const center = size / 2

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/50"
          />
          {/* Progress circle */}
          {pct != null && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={gaugeStroke(pct)}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          )}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-xs font-semibold font-mono', pct != null ? gaugeColor(pct) : 'text-muted-foreground')}>
            {pct != null ? `${Math.round(pct)}%` : '-'}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      {sub && (
        <span className="text-[9px] text-muted-foreground/70 font-mono truncate max-w-[80px]" title={sub}>
          {sub}
        </span>
      )}
    </div>
  )
}
