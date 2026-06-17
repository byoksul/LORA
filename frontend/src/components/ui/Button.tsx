import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-hover shadow-card',
      secondary: 'bg-surface text-text border border-border hover:bg-card-hover',
      ghost: 'text-muted hover:text-text hover:bg-surface',
      danger: 'bg-danger/10 text-danger hover:bg-danger/15 border border-danger/25',
      success: 'bg-success/10 text-success hover:bg-success/15 border border-success/25',
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-2xl min-h-[36px]',
      md: 'px-4 py-2.5 text-sm rounded-2xl min-h-[40px]',
      lg: 'px-6 py-3 text-base rounded-2xl min-h-[48px]',
      xl: 'px-8 py-4 text-lg rounded-2xl font-medium min-h-[56px]',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'touch-target touch-pressable inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
