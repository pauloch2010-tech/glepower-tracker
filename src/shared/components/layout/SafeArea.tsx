import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

interface SafeAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  top?: boolean
  bottom?: boolean
}

/**
 * Adds safe-area padding for notched devices (iPhone X+, etc.)
 */
export function SafeArea({
  children,
  top = false,
  bottom = false,
  className,
  ...props
}: SafeAreaProps) {
  return (
    <div
      className={cn(top && 'pt-safe', bottom && 'pb-safe', className)}
      {...props}
    >
      {children}
    </div>
  )
}
