import { create } from 'zustand'
import type { OrderItem, PaymentType } from '@/types'

interface CartItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  imageUrl?: string
}

interface PosState {
  items: CartItem[]
  selectedCategoryId: string | null
  addItem: (productId: string, productName: string, unitPrice: number, imageUrl?: string) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setSelectedCategory: (id: string | null) => void
  getTotal: () => number
}

export const usePosStore = create<PosState>((set, get) => ({
  items: [],
  selectedCategoryId: null,
  addItem: (productId, productName, unitPrice, imageUrl) => {
    const items = get().items
    const existing = items.find((i) => i.productId === productId)
    if (existing) {
      set({
        items: items.map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + 1, imageUrl: i.imageUrl ?? imageUrl }
            : i
        ),
      })
    } else {
      set({
        items: [...items, { productId, productName, unitPrice, quantity: 1, imageUrl }],
      })
    }
  },
  removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set({
      items: get().items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    })
  },
  clearCart: () => set({ items: [] }),
  setSelectedCategory: (id) => set({ selectedCategoryId: id }),
  getTotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
}))

const QUEUE_KEY = 'lora_offline_orders'

export interface OfflineOrder {
  items: OrderItem[]
  payments: { paymentType: PaymentType; amount: number }[]
  notes?: string
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
      items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      payments: order.payments,
      notes: order.notes,
    })
    if (result.success) synced.push(i)
  }

  if (synced.length > 0) {
    const remaining = queue.filter((_, i) => !synced.includes(i))
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
  }
}
