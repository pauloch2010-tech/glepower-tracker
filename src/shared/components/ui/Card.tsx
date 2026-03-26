import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'raised' | 'gradient' | 'outline'
  pressable?: boolean
  glow?: boolean
}

const variantClasses = {
  default: 'bg-surface',
  raised: 'bg-surface-raised',
  gradient: 'bg-gradient-card',
  outline: 'bg-transparent border border-surface-overlay',
}

export function Card({
  children,
  variant = 'default',
  pressable = false,
  glow = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card shadow-card p-4',
        variantClasses[variant],
        pressable && 'active:scale-[0.98] transition-transform duration-150 cursor-pointer',
        glow && 'shadow-glow',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── Card Sub-components ──────────────────────────────────────────────────────
export function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-3 pb-3 border-b border-surface-overlay', className)} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-3 pt-3 border-t border-surface-overlay', className)} {...props}>
      {children}
    </div>
  )
}
