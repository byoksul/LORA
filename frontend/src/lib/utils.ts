import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount)
}

export function formatElapsed(date: string | Date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  return formatDurationSeconds(diff)
}

export function formatDurationSeconds(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds)
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/** Sipariş oluşumundan hazır olana kadar geçen süre (sabit). */
export function formatPrepDuration(createdDate: string, readyAt: string) {
  const seconds = Math.floor(
    (new Date(readyAt).getTime() - new Date(createdDate).getTime()) / 1000
  )
  return formatDurationSeconds(seconds)
}

export const DISCOUNT_PERCENT = 25

/** Fiziksel menüyle uyumlu: indirimli tutar 5 TL'ye yuvarlanır. */
export function calculateDiscountedTotal(subtotal: number, hasDiscount: boolean) {
  if (!hasDiscount || subtotal <= 0) return subtotal
  const discounted = subtotal * (100 - DISCOUNT_PERCENT) / 100
  return Math.round(discounted / 5) * 5
}

export function calculateDiscountAmount(subtotal: number, hasDiscount: boolean) {
  if (!hasDiscount || subtotal <= 0) return 0
  return subtotal - calculateDiscountedTotal(subtotal, hasDiscount)
}

export function getDiscountLabel(discountType: string) {
  switch (discountType) {
    case 'Student':
      return 'Öğrenci'
    case 'HealthcareWorker':
      return 'Sağlık personeli'
    default:
      return ''
  }
}

export function formatProductPrice(price: number, priceLarge?: number | null) {
  if (priceLarge) return `${formatCurrency(price)} – ${formatCurrency(priceLarge)}`
  return formatCurrency(price)
}

export function getMilkLabel(milkType?: string | null) {
  if (milkType === 'LactoseFree') return 'Laktozsuz'
  if (milkType === 'Regular') return 'Laktozlu'
  return null
}

export function buildCartKey(productId: string, sizeLabel?: string | null, milkType?: string | null) {
  return `${productId}|${sizeLabel ?? ''}|${milkType ?? ''}`
}

export function productNeedsOptions(product: { priceLarge?: number | null; supportsMilkChoice: boolean }) {
  return !!product.priceLarge || product.supportsMilkChoice
}
