import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-4 py-3 rounded-2xl bg-surface border border-border text-text placeholder:text-muted',
        'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
