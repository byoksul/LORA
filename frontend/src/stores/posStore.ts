import { create } from 'zustand'
import { buildCartKey, calculateDiscountAmount, calculateDiscountedTotal } from '@/lib/utils'
import type { DiscountType, MilkType, OrderItem, PaymentType, ProductSize } from '@/types'

export interface CartItem {
  cartKey: string
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  imageUrl?: string
  sizeLabel?: ProductSize
  milkType?: MilkType
}

interface AddItemOptions {
  sizeLabel?: ProductSize
  milkType?: MilkType
}

interface PosState {
  items: CartItem[]
  selectedCategoryId: string | null
  discountType: DiscountType
  addItem: (
    productId: string,
    productName: string,
    unitPrice: number,
    imageUrl?: string,
    options?: AddItemOptions
  ) => void
  removeItem: (cartKey: string) => void
  updateQuantity: (cartKey: string, quantity: number) => void
  clearCart: () => void
  setSelectedCategory: (id: string | null) => void
  setDiscountType: (type: DiscountType) => void
  getSubtotal: () => number
  getDiscountAmount: () => number
  getTotal: () => number
}

export const usePosStore = create<PosState>((set, get) => ({
  items: [],
  selectedCategoryId: null,
  discountType: 'None',
  addItem: (productId, productName, unitPrice, imageUrl, options) => {
    const sizeLabel = options?.sizeLabel
    const milkType = options?.milkType
    const cartKey = buildCartKey(productId, sizeLabel, milkType)
    const items = get().items
    const existing = items.find((i) => i.cartKey === cartKey)

    if (existing) {
      set({
        items: items.map((i) =>
          i.cartKey === cartKey
            ? { ...i, quantity: i.quantity + 1, imageUrl: i.imageUrl ?? imageUrl }
            : i
        ),
      })
    } else {
      set({
        items: [
          ...items,
          { cartKey, productId, productName, unitPrice, quantity: 1, imageUrl, sizeLabel, milkType },
        ],
      })
    }
  },
  removeItem: (cartKey) => set({ items: get().items.filter((i) => i.cartKey !== cartKey) }),
  updateQuantity: (cartKey, quantity) => {
    if (quantity <= 0) {
      get().removeItem(cartKey)
      return
    }
    set({
      items: get().items.map((i) => (i.cartKey === cartKey ? { ...i, quantity } : i)),
    })
  },
  clearCart: () => set({ items: [], discountType: 'None' }),
  setSelectedCategory: (id) => set({ selectedCategoryId: id }),
  setDiscountType: (type) => set({ discountType: type }),
  getSubtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
  getDiscountAmount: () => {
    const { discountType } = get()
    const hasDiscount = discountType === 'Student' || discountType === 'HealthcareWorker'
    return calculateDiscountAmount(get().getSubtotal(), hasDiscount)
  },
  getTotal: () => {
    const { discountType } = get()
    const hasDiscount = discountType === 'Student' || discountType === 'HealthcareWorker'
    return calculateDiscountedTotal(get().getSubtotal(), hasDiscount)
  },
}))

const QUEUE_KEY = 'lora_offline_orders'

export interface OfflineOrder {
  items: OrderItem[]
  payments: { paymentType: PaymentType; amount: number }[]
  notes?: string
  discountType?: DiscountType
  timestamp?: number
}

export function getOfflineQueue(): OfflineOrder[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

export function addToOfflineQueue(order: Omit<OfflineOrder, 'timestamp'>) {
  const queue = getOfflineQueue()
  queue.push({ ...order, timestamp: Date.now() })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  return 100 + queue.length
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY)
}

export async function syncOfflineQueue() {
  const queue = getOfflineQueue()
  if (queue.length === 0) return

  const { api } = await import('@/lib/api')
  const synced: number[] = []

  for (let i = 0; i < queue.length; i++) {
    const order = queue[i]
    const result = await api.createOrder({
      items: order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        sizeLabel: i.sizeLabel ?? undefined,
        milkType: i.milkType ?? undefined,
      })),
      payments: order.payments,
      notes: order.notes,
      discountType: order.discountType ?? 'None',
    })
    if (result.success) synced.push(i)
  }

  if (synced.length > 0) {
    const remaining = queue.filter((_, i) => !synced.includes(i))
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
  }
}
