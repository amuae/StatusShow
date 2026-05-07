import { cn } from '../utils/cn'

export function StatusDot({ online, className }: { online: boolean; className?: string }) {
  return (
    <span
      title={online ? '在线' : '离线'}
      className={cn(
        'inline-block w-2 h-2 rounded-full shrink-0',
        online ? 'bg-[#3a6b4a] ring-2 ring-[#3a6b4a]/20 dark:bg-[#4a8a5a] dark:ring-[#4a8a5a]/20' : 'bg-destructive ring-2 ring-destructive/20',
        className,
      )}
    />
  )
}
