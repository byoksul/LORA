import { formatCurrency } from '@/lib/utils'

interface ProductPriceDisplayProps {
  price: number
  priceLarge?: number | null
  variant?: 'menu' | 'compact'
  align?: 'start' | 'end'
  className?: string
}

export function ProductPriceDisplay({
  price,
  priceLarge,
  variant = 'menu',
  align = 'end',
  className = '',
}: ProductPriceDisplayProps) {
  if (!priceLarge) {
    const singleClass =
      variant === 'compact' ? 'text-sm lg:text-base font-bold' : 'font-semibold'
    return (
      <span className={`text-primary tabular-nums ${singleClass} ${className}`}>
        {formatCurrency(price)}
      </span>
    )
  }

  const rowClass =
    variant === 'menu'
      ? 'text-sm font-semibold text-primary tabular-nums'
      : 'text-sm lg:text-base font-bold text-primary tabular-nums'

  const labelClass =
    variant === 'menu'
      ? 'text-[11px] font-medium text-muted uppercase tracking-wide'
      : 'text-[11px] lg:text-xs font-medium text-muted'

  const alignClass = align === 'start' ? 'items-start text-left' : 'items-end text-right'

  return (
    <div className={`flex flex-col ${alignClass} gap-1 shrink-0 ${className}`}>
      <div className={rowClass}>
        <span className={`${labelClass} mr-1.5`}>Küçük</span>
        {formatCurrency(price)}
      </div>
      <div className={rowClass}>
        <span className={`${labelClass} mr-1.5`}>Büyük</span>
        {formatCurrency(priceLarge)}
      </div>
    </div>
  )
}
