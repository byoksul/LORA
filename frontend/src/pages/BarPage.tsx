import { useEffect, useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FullscreenButton } from '@/components/FullscreenButton'
import { Logo } from '@/components/Logo'
import { BarOrderCard } from '@/components/BarOrderCard'
import { api } from '@/lib/api'
import { startSignalR } from '@/lib/signalr'
import { cn } from '@/lib/utils'

export function BarPage() {
  const queryClient = useQueryClient()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const { data: orders = [] } = useQuery({
    queryKey: ['activeOrders'],
    queryFn: async () => {
      const res = await api.getActiveOrders()
      return res.data || []
    },
    refetchInterval: 30000,
  })

  const queue = orders
    .filter((o) => o.status === 'Pending' || o.status === 'Preparing')
    .sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime())

  const ready = orders
    .filter((o) => o.status === 'Ready')
    .sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime())

  const handleMarkReady = useCallback(
    async (id: string) => {
      setProcessingId(id)
      const result = await api.updateOrderStatus(id, 'Ready')
      setProcessingId(null)
      if (!result.success) return
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] })
    },
    [queryClient]
  )

  useEffect(() => {
    startSignalR(
      () => queryClient.invalidateQueries({ queryKey: ['activeOrders'] }),
      () => queryClient.invalidateQueries({ queryKey: ['activeOrders'] })
    )
  }, [queryClient])

  return (
    <div className="h-dvh max-h-dvh flex flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-surface/50">
        <Logo variant="menu" className="max-w-[160px]" />
        <FullscreenButton className="border-0 bg-transparent min-h-[48px] min-w-[48px]" />
      </header>

      <div className="flex-1 grid grid-cols-2 gap-3 p-3 min-h-0 overflow-hidden">
        {/* Yapılacak */}
        <section className="flex flex-col min-h-0 rounded-2xl border border-border bg-surface/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/70 shrink-0">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-text">Yapılacak</h2>
              <span className="text-sm font-bold text-warning tabular-nums">{queue.length}</span>
            </div>
            <p className="text-xs text-muted mt-0.5">Hazır olduğunda butona bas</p>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-y-contain p-2 space-y-2 min-h-0">
            {queue.length === 0 ? (
              <p className="text-center text-sm text-muted/50 py-16">Bekleyen sipariş yok</p>
            ) : (
              queue.map((order) => (
                <BarOrderCard
                  key={order.id}
                  order={order}
                  variant="queue"
                  onMarkReady={handleMarkReady}
                  isProcessing={processingId === order.id}
                />
              ))
            )}
          </div>
        </section>

        {/* Hazır */}
        <section
          className={cn(
            'flex flex-col min-h-0 rounded-2xl border overflow-hidden',
            'border-success/25 bg-success/[0.03]'
          )}
        >
          <div className="px-4 py-3 border-b border-success/20 shrink-0">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-success">Hazır</h2>
              <span className="text-sm font-bold text-success tabular-nums">{ready.length}</span>
            </div>
            <p className="text-xs text-muted mt-0.5">Müşteriye verilecek</p>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-y-contain p-2 space-y-2 min-h-0">
            {ready.length === 0 ? (
              <p className="text-center text-sm text-muted/50 py-16">Henüz hazır sipariş yok</p>
            ) : (
              ready.map((order) => (
                <BarOrderCard key={order.id} order={order} variant="ready" />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export const KitchenPage = BarPage
