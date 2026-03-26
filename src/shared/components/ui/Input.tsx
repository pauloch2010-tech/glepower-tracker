import { InputHTMLAttributes, ReactNode, forwardRef } from 'react'
import { cn } from '@/shared/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftAddon?: ReactNode
  rightAddon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, rightAddon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <span className="absolute left-3 text-text-muted pointer-events-none">
              {leftAddon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-surface-raised text-white placeholder-text-muted',
              'rounded-input px-4 py-3 border transition-colors',
              'focus:outline-none focus:border-primary',
              error ? 'border-error' : 'border-surface-overlay',
              leftAddon ? 'pl-10' : undefined,
              rightAddon ? 'pr-10' : undefined,
              className,
            )}
            {...props}
          />

          {rightAddon && (
            <span className="absolute right-3 text-text-muted pointer-events-none">
              {rightAddon}
            </span>
          )}
        </div>

        {error && (
          <p className="text-xs text-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-text-muted">{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
