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
