import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Wifi, WifiOff } from 'lucide-react'
import { ProductImage } from '@/components/ProductImage'
import { Logo } from '@/components/Logo'
import { FullscreenButton } from '@/components/FullscreenButton'
import { PosOrderPanel } from '@/components/PosOrderPanel'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import {
  usePosStore,
  addToOfflineQueue,
  syncOfflineQueue,
  getOfflineQueue,
} from '@/stores/posStore'
import type { PaymentType } from '@/types'

const categoryBtnClass = (active: boolean) =>
  `touch-target touch-pressable w-full text-left px-4 py-3 rounded-2xl text-sm lg:text-base font-medium transition-colors cursor-pointer min-h-[48px] ${
    active
      ? 'bg-primary text-white'
      : 'text-muted active:bg-card active:text-text lg:hover:text-text lg:hover:bg-card'
  }`

const productCardClass =
  'touch-target touch-pressable flex flex-col text-left rounded-2xl bg-card border border-border overflow-hidden transition-colors active:border-primary/50 active:bg-card-hover cursor-pointer min-h-[160px] lg:min-h-[180px] shadow-card'

export function PosPage() {
  const { items, selectedCategoryId, addItem, removeItem, updateQuantity, clearCart, setSelectedCategory, getTotal } = usePosStore()
  const [paymentType, setPaymentType] = useState<PaymentType>('Card')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastOrderNumber, setLastOrderNumber] = useState<number | null>(null)
  const [processing, setProcessing] = useState(false)
  const [offlineCount, setOfflineCount] = useState(getOfflineQueue().length)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.getCategories()
      return res.data || []
    },
  })

  const { data: products } = useQuery({
    queryKey: ['products', selectedCategoryId],
    queryFn: async () => {
      const res = await api.getProducts(selectedCategoryId || undefined)
      return res.data || []
    },
  })

  useEffect(() => {
    if (categories?.length && !selectedCategoryId) {
      setSelectedCategory(categories[0].id)
    }
  }, [categories, selectedCategoryId, setSelectedCategory])

  useEffect(() => {
    if (navigator.onLine) {
      syncOfflineQueue().then(() => setOfflineCount(getOfflineQueue().length))
    }
  }, [])

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      await syncOfflineQueue()
      setOfflineCount(getOfflineQueue().length)
    }
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const total = getTotal()

  const handlePayment = async () => {
    if (items.length === 0) return
    setProcessing(true)

    const orderData = {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      payments: [{ paymentType, amount: total }],
      notes: undefined,
    }

    if (!isOnline) {
      const pendingNumber = addToOfflineQueue({
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.unitPrice * i.quantity,
        })),
        payments: [{ paymentType, amount: total }],
      })
      setOfflineCount(getOfflineQueue().length)
      clearCart()
      setLastOrderNumber(pendingNumber)
      setProcessing(false)
      return
    }

    const result = await api.createOrder(orderData)
    if (result.success && result.data) {
      setLastOrderNumber(result.data.orderNumber)
      clearCart()
    }
    setProcessing(false)
  }

  return (
    <div className="h-dvh max-h-dvh flex bg-background overflow-hidden min-h-0 touch-target">
      {/* Kategoriler — 1024px'de dar, tablette dokunmatik */}
      <aside className="w-40 sm:w-44 lg:w-48 xl:w-56 shrink-0 border-r border-border flex flex-col min-h-0 bg-surface">
        <div className="relative border-b border-border py-3 px-3 flex justify-center items-center min-h-[72px] lg:min-h-[80px]">
          <Logo variant="sidebar" />
          <FullscreenButton
            className="absolute right-1 top-1 border-0 bg-transparent min-h-[48px] min-w-[48px] active:bg-card/60 lg:hover:bg-card/40"
          />
        </div>
        <nav className="flex-1 p-2 lg:p-3 space-y-1.5 overflow-y-auto min-h-0 overscroll-y-contain">
          {categories?.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={categoryBtnClass(selectedCategoryId === cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border flex items-center gap-2 text-xs text-muted shrink-0 min-h-[48px]">
          {isOnline ? <Wifi className="w-4 h-4 text-success shrink-0" /> : <WifiOff className="w-4 h-4 text-warning shrink-0" />}
          <span className="truncate">{isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
          {offlineCount > 0 && (
            <span className="ml-auto bg-warning/15 text-warning px-2 py-1 rounded-full text-[11px] shrink-0">
              {offlineCount} bekliyor
            </span>
          )}
        </div>
      </aside>

      {/* Ürünler — 1024: 2 sütun, 1366+: 3 sütun */}
      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-y-contain p-3 lg:p-4 xl:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4 xl:gap-5">
          {products?.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addItem(product.id, product.name, product.price, product.imageUrl)}
              className={productCardClass}
            >
              <div className="aspect-[4/3] lg:aspect-square overflow-hidden bg-surface pointer-events-none">
                <ProductImage
                  name={product.name}
                  imageUrl={product.imageUrl}
                  className="w-full h-full"
                />
              </div>
              <div className="p-3 lg:p-4 flex flex-col gap-1 min-h-[72px] pointer-events-none">
                <h3 className="font-semibold text-sm lg:text-base text-text leading-snug line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-primary font-bold text-base lg:text-lg tabular-nums">
                  {formatCurrency(product.price)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </main>

      <PosOrderPanel
        items={items}
        total={total}
        paymentType={paymentType}
        processing={processing}
        lastOrderNumber={lastOrderNumber}
        onPaymentTypeChange={setPaymentType}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onPayment={handlePayment}
      />
    </div>
  )
}
