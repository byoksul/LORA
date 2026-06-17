import { useState, useEffect } from 'react'
import { Coffee } from 'lucide-react'
import { PRODUCT_IMAGE_PLACEHOLDER, isValidImageUrl } from '@/lib/productImages'

interface ProductImageProps {
  name: string
  imageUrl?: string | null
  className?: string
}

export function ProductImage({ name, imageUrl, className = '' }: ProductImageProps) {
  const primary = isValidImageUrl(imageUrl) ? imageUrl!.trim() : null
  const [src, setSrc] = useState<string | null>(primary)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setSrc(primary)
    setFailed(false)
  }, [primary, imageUrl])

  if (!primary || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-surface ${className}`}
      >
        <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center border border-border">
          <Coffee className="w-6 h-6 text-primary" strokeWidth={1.5} />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted px-2 text-center line-clamp-1">
          LORA
        </span>
      </div>
    )
  }

  return (
    <img
      src={src!}
      alt={name}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (src !== PRODUCT_IMAGE_PLACEHOLDER) setSrc(PRODUCT_IMAGE_PLACEHOLDER)
        else setFailed(true)
      }}
      className={`object-cover ${className}`}
    />
  )
}
