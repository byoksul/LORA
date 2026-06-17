/** LORA markası için ürün görseli yoksa veya yüklenemezse kullanılan placeholder */
export const PRODUCT_IMAGE_PLACEHOLDER =
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop&auto=format&q=85'

export function isValidImageUrl(url?: string | null): boolean {
  if (!url || !url.trim()) return false
  if (url.includes('c7c8b0c8c8c8')) return false
  return url.startsWith('http://') || url.startsWith('https://')
}
