import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { formatElapsed, formatPrepDuration, cn } from '@/lib/utils'
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

  return (
    <article
      className={cn(
        'rounded-2xl border bg-card overflow-hidden shadow-card',
        variant === 'ready' ? 'border-success/35 bg-success/[0.04]' : 'border-border',
        isUrgent && 'border-danger/45'
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-1">
        <span className="text-lg font-bold text-muted tabular-nums">#{order.orderNumber}</span>

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

      <ul className="px-4 py-3 space-y-2">
        {order.items.map((item) => (
          <li key={item.id || item.productId} className="flex items-baseline gap-2 min-w-0">
            {item.quantity > 1 && (
              <span className="text-xl font-bold text-primary tabular-nums shrink-0 leading-none">
                {item.quantity}×
              </span>
            )}
            <span
              className={cn(
                'font-bold text-text leading-tight',
                order.items.length === 1 ? 'text-2xl' : 'text-xl'
              )}
            >
              {item.productName}
            </span>
          </li>
        ))}
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
