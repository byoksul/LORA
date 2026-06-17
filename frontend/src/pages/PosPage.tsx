import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Wifi, WifiOff } from 'lucide-react'
import { PosAddItemModal } from '@/components/PosAddItemModal'
import { ProductImage } from '@/components/ProductImage'
import { ProductPriceDisplay } from '@/components/ProductPriceDisplay'
import { Logo } from '@/components/Logo'
import { FullscreenButton } from '@/components/FullscreenButton'
import { PosOrderPanel } from '@/components/PosOrderPanel'
import { api } from '@/lib/api'
import { productNeedsOptions } from '@/lib/utils'
import {
  usePosStore,
  addToOfflineQueue,
  syncOfflineQueue,
  getOfflineQueue,
} from '@/stores/posStore'
import type { MilkType, PaymentType, Product, ProductSize } from '@/types'

const categoryBtnClass = (active: boolean) =>
  `touch-target touch-pressable w-full text-left px-4 py-3 rounded-2xl text-sm lg:text-base font-medium transition-colors cursor-pointer min-h-[48px] ${
    active
      ? 'bg-primary text-white'
      : 'text-muted active:bg-card active:text-text lg:hover:text-text lg:hover:bg-card'
  }`

const productCardClass =
  'touch-target touch-pressable flex items-center gap-3 lg:gap-3.5 text-left rounded-2xl bg-card border border-border p-3 lg:p-3.5 transition-colors active:border-primary/50 active:bg-card-hover cursor-pointer min-h-[88px] lg:min-h-[96px] shadow-card'

export function PosPage() {
  const {
    items,
    selectedCategoryId,
    discountType,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setSelectedCategory,
    setDiscountType,
    getSubtotal,
    getDiscountAmount,
    getTotal,
  } = usePosStore()
  const [paymentType, setPaymentType] = useState<PaymentType>('Card')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastOrderNumber, setLastOrderNumber] = useState<number | null>(null)
  const [processing, setProcessing] = useState(false)
  const [offlineCount, setOfflineCount] = useState(getOfflineQueue().length)
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

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

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const total = getTotal()

  const handleProductClick = (product: Product) => {
    if (productNeedsOptions(product)) {
      setPendingProduct(product)
      return
    }
    addItem(product.id, product.name, product.price, product.imageUrl)
  }

  const handleConfirmAdd = (
    unitPrice: number,
    options: { sizeLabel?: ProductSize; milkType?: MilkType }
  ) => {
    if (!pendingProduct) return
    addItem(
      pendingProduct.id,
      pendingProduct.name,
      unitPrice,
      pendingProduct.imageUrl,
      options
    )
    setPendingProduct(null)
  }

  const handlePayment = async () => {
    if (items.length === 0) return
    setProcessing(true)
    setPaymentError(null)

    const orderData = {
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        sizeLabel: i.sizeLabel,
        milkType: i.milkType,
      })),
      payments: [{ paymentType, amount: total }],
      notes: undefined,
      discountType,
    }

    if (!isOnline) {
      const pendingNumber = addToOfflineQueue({
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          sizeLabel: i.sizeLabel,
          milkType: i.milkType,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.unitPrice * i.quantity,
        })),
        payments: [{ paymentType, amount: total }],
        discountType,
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
    } else {
      setPaymentError(result.message || 'Sipariş oluşturulamadı.')
    }
    setProcessing(false)
  }

  return (
    <div className="h-dvh max-h-dvh flex bg-background overflow-hidden min-h-0 touch-target">
      <aside className="w-36 sm:w-40 lg:w-44 xl:w-52 shrink-0 border-r border-border flex flex-col min-h-0 bg-surface">
        <div className="relative border-b border-border py-3 px-3 flex justify-center items-center min-h-[68px]">
          <Logo variant="sidebar" />
          <FullscreenButton className="absolute right-1 top-1 border-0 bg-transparent min-h-[44px] min-w-[44px] active:bg-card/60" />
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto min-h-0 overscroll-y-contain">
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
        <div className="p-2.5 border-t border-border flex items-center gap-2 text-[11px] text-muted shrink-0">
          {isOnline ? <Wifi className="w-3.5 h-3.5 text-success shrink-0" /> : <WifiOff className="w-3.5 h-3.5 text-warning shrink-0" />}
          <span className="truncate">{isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
          {offlineCount > 0 && (
            <span className="ml-auto bg-warning/15 text-warning px-1.5 py-0.5 rounded-full text-[10px] shrink-0">
              {offlineCount}
            </span>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-y-contain p-2.5 lg:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 lg:gap-3">
          {products?.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleProductClick(product)}
              className={productCardClass}
            >
              <div className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] lg:w-20 lg:h-20 rounded-xl overflow-hidden bg-surface shrink-0 border border-border pointer-events-none">
                <ProductImage name={product.name} imageUrl={product.imageUrl} className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1 pointer-events-none">
                <h3 className="font-semibold text-lg lg:text-xl text-text leading-snug line-clamp-2">
                  {product.name}
                </h3>
                <ProductPriceDisplay
                  price={product.price}
                  priceLarge={product.priceLarge}
                  variant="compact"
                  align="start"
                />
                {(product.priceLarge || product.supportsMilkChoice) && (
                  <p className="text-xs text-muted leading-tight">Boyut / süt seçilebilir</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </main>

      <PosOrderPanel
        items={items}
        subtotal={subtotal}
        discountAmount={discountAmount}
        total={total}
        discountType={discountType}
        paymentType={paymentType}
        processing={processing}
        lastOrderNumber={lastOrderNumber}
        paymentError={paymentError}
        onDiscountTypeChange={setDiscountType}
        onPaymentTypeChange={setPaymentType}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onPayment={handlePayment}
      />

      {pendingProduct && (
        <PosAddItemModal
          product={pendingProduct}
          onClose={() => setPendingProduct(null)}
          onConfirm={handleConfirmAdd}
        />
      )}
    </div>
  )
}
