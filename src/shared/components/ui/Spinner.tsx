import { cn } from '@/shared/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Carregando..."
      className={cn(
        'rounded-full border-surface-overlay border-t-primary animate-spin',
        sizeMap[size],
        className,
      )}
    />
  )
}
