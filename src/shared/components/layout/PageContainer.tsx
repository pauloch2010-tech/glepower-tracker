import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Removes horizontal padding — useful for full-bleed content */
  noPadding?: boolean
  /** Centers content vertically (flex column + justify-center) */
  centered?: boolean
  /** Makes this a scrollable container */
  scrollable?: boolean
}

/**
 * Standard page wrapper with consistent horizontal padding
 * and optional vertical centering.
 */
export function PageContainer({
  children,
  noPadding = false,
  centered = false,
  scrollable = false,
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'flex flex-col w-full flex-1',
        !noPadding && 'px-4 md:px-6 lg:px-8',
        centered && 'justify-center items-center',
        scrollable && 'overflow-y-auto',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
