import { cn } from '../utils/cn'

export function StatusDot({ online, className }: { online: boolean; className?: string }) {
  return (
    <span
      title={online ? '在线' : '离线'}
      className={cn(
        'inline-block w-2 h-2 rounded-full shrink-0',
        online ? 'bg-primary/70 ring-2 ring-primary/15' : 'bg-destructive ring-2 ring-destructive/20',
        className,
      )}
    />
  )
}
