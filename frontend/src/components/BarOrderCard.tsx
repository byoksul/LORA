import { useEffect, useState } from 'react'
import { Clock, Percent } from 'lucide-react'
import { formatElapsed, formatPrepDuration, getDiscountLabel, getMilkLabel, cn } from '@/lib/utils'
import type { Order } from '@/types'

interface BarOrderCardProps {
  order: Order
  variant: 'queue' | 'ready'
  onMarkReady?: (id: string) => void
  isProcessing?: boolean
}

export function BarOrderCard({ order, variant, onMarkReady, isProcessing }: BarOrderCardProps) {
  const [elapsed, setElapsed] = useState(formatElapsed(order.createdDate))

  useEffect(() => {
    if (variant !== 'queue') return
    const interval = setInterval(() => setElapsed(formatElapsed(order.createdDate)), 1000)
    return () => clearInterval(interval)
  }, [order.createdDate, variant])

  const isUrgent = variant === 'queue' && parseInt(elapsed.split(':')[0], 10) >= 5
  const prepDuration =
    variant === 'ready' && order.readyAt
      ? formatPrepDuration(order.createdDate, order.readyAt)
      : null
  const hasDiscount = order.discountAmount > 0 && order.discountType !== 'None'
  const discountLabel = getDiscountLabel(order.discountType)

  return (
    <article
      className={cn(
        'rounded-2xl border bg-card overflow-hidden shadow-card',
        variant === 'ready' ? 'border-success/35 bg-success/[0.04]' : 'border-border',
        isUrgent && 'border-danger/45'
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-lg font-bold text-muted tabular-nums">#{order.orderNumber}</span>
          {hasDiscount && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-success bg-success/10 border border-success/25 px-2 py-0.5 rounded-full shrink-0">
              <Percent className="w-3 h-3" strokeWidth={2.5} />
              {discountLabel}
            </span>
          )}
        </div>

        {variant === 'queue' ? (
          <span
            className={cn(
              'flex items-center gap-1 text-xs tabular-nums font-medium',
              isUrgent ? 'text-danger' : 'text-muted'
            )}
          >
            <Clock className="w-3.5 h-3.5" strokeWidth={2} />
            {elapsed}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-success tabular-nums">
            <Clock className="w-3.5 h-3.5" strokeWidth={2} />
            {prepDuration ?? '—'}
            <span className="text-success/70 font-normal">hazırlandı</span>
          </span>
        )}
      </div>

      <ul className="px-4 py-3 space-y-3 md:space-y-4">
        {order.items.map((item) => {
          const milkLabel = getMilkLabel(item.milkType)
          const hasModifiers = !!(item.sizeLabel || milkLabel)
          const isSingleItem = order.items.length === 1

          const badgeClass = cn(
            'inline-flex items-center justify-center font-bold rounded-xl border leading-none',
            isSingleItem
              ? 'text-base sm:text-lg md:text-xl px-4 py-2.5 sm:px-5 sm:py-3 min-h-[44px] sm:min-h-[52px]'
              : 'text-sm sm:text-base md:text-lg px-3.5 py-2 sm:px-4 sm:py-2.5 min-h-[40px] sm:min-h-[44px]'
          )

          return (
            <li
              key={item.id || `${item.productId}-${item.sizeLabel}-${item.milkType}`}
              className={cn('min-w-0', hasModifiers && 'pb-0.5')}
            >
              <div className="flex items-baseline gap-2 min-w-0">
                {item.quantity > 1 && (
                  <span
                    className={cn(
                      'font-bold text-primary tabular-nums shrink-0 leading-none',
                      isSingleItem ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                    )}
                  >
                    {item.quantity}×
                  </span>
                )}
                <span
                  className={cn(
                    'font-bold text-text leading-tight',
                    isSingleItem ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                  )}
                >
                  {item.productName}
                </span>
              </div>
              {hasModifiers && (
                <div className="flex flex-wrap gap-2 sm:gap-2.5 mt-2.5 sm:mt-3">
                  {item.sizeLabel && (
                    <span
                      className={cn(
                        badgeClass,
                        'bg-primary/15 text-primary border-primary/35 shadow-sm'
                      )}
                    >
                      {item.sizeLabel}
                    </span>
                  )}
                  {milkLabel && (
                    <span
                      className={cn(
                        badgeClass,
                        item.milkType === 'LactoseFree'
                          ? 'bg-warning/20 text-warning border-warning/45 shadow-sm'
                          : 'bg-surface text-text border-border shadow-sm'
                      )}
                    >
                      {milkLabel}
                    </span>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {variant === 'queue' && onMarkReady && (
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onMarkReady(order.id)}
          className="touch-target w-full min-h-[52px] bg-primary text-white text-base font-semibold active:opacity-90 disabled:opacity-50 border-t border-primary-hover/30"
        >
          Hazır
        </button>
      )}
    </article>
  )
}
