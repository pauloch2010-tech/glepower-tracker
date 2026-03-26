import { HTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'muted'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary/20 text-primary border-primary/30',
  secondary: 'bg-secondary/40 text-accent-light border-secondary',
  accent: 'bg-accent/20 text-accent border-accent/30',
  success: 'bg-success/20 text-success border-success/30',
  warning: 'bg-warning/20 text-warning border-warning/30',
  error: 'bg-error/20 text-error border-error/30',
  muted: 'bg-surface text-text-muted border-surface-overlay',
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
}

export function Badge({
  variant = 'muted',
  size = 'sm',
  dot = false,
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'primary' ? 'bg-primary' :
            variant === 'accent' || variant === 'secondary' ? 'bg-accent' :
            variant === 'success' ? 'bg-success' :
            variant === 'warning' ? 'bg-warning' :
            variant === 'error' ? 'bg-error' :
            'bg-text-muted',
          )}
        />
      )}
      {children}
    </span>
  )
}
