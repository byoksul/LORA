import logoMark from '@/assets/logo-mark.png'
import { cn } from '@/lib/utils'

type LogoVariant = 'sidebar' | 'login' | 'menu'

interface LogoProps {
  className?: string
  align?: 'left' | 'center'
  /** sidebar: POS/Admin köşe | login: giriş kartı | menu: QR menü */
  variant?: LogoVariant
}

const variantStyles: Record<LogoVariant, string> = {
  sidebar: 'w-full max-h-[80px] object-contain object-center',
  login: 'w-full max-w-[280px] max-h-[120px] object-contain object-center',
  menu: 'w-full max-w-[260px] max-h-[96px] object-contain object-center',
}

export function Logo({ className, align = 'center', variant = 'sidebar' }: LogoProps) {
  return (
    <img
      src={logoMark}
      alt="LORA Coffee Company"
      className={cn(
        'block',
        variantStyles[variant],
        align === 'center' && 'mx-auto',
        className
      )}
    />
  )
}
