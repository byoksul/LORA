import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { ProductImage } from '@/components/ProductImage'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import type { MilkType, Product, ProductSize } from '@/types'

interface PosAddItemModalProps {
  product: Product
  onClose: () => void
  onConfirm: (unitPrice: number, options: { sizeLabel?: ProductSize; milkType?: MilkType }) => void
}

export function PosAddItemModal({ product, onClose, onConfirm }: PosAddItemModalProps) {
  const hasSizes = !!product.priceLarge
  const hasMilk = product.supportsMilkChoice

  const [size, setSize] = useState<ProductSize>('Büyük')
  const [milk, setMilk] = useState<MilkType>('Regular')

  const unitPrice =
    hasSizes && size === 'Büyük' && product.priceLarge ? product.priceLarge : product.price

  useEffect(() => {
    setSize('Büyük')
    setMilk('Regular')
  }, [product.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-surface border border-border shadow-soft overflow-hidden animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-4 border-b border-border">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-card border border-border shrink-0">
            <ProductImage name={product.name} imageUrl={product.imageUrl} className="w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-text leading-snug">{product.name}</h3>
            <p className="text-primary font-bold text-xl tabular-nums mt-1">{formatCurrency(unitPrice)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-muted active:bg-card"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {hasSizes && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted mb-2">Boyut</p>
              <div className="grid grid-cols-2 gap-2">
                {(['Küçük', 'Büyük'] as ProductSize[]).map((option) => {
                  const price = option === 'Büyük' ? product.priceLarge! : product.price
                  const active = size === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSize(option)}
                      className={`touch-target rounded-2xl border px-4 py-3 text-left transition-all min-h-[56px] ${
                        active
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                          : 'border-border bg-card active:bg-card-hover'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-text">{option}</span>
                      <span className="block text-xs text-muted tabular-nums mt-0.5">{formatCurrency(price)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {hasMilk && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted mb-2">Süt</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'Regular' as MilkType, label: 'Laktozlu' },
                  { value: 'LactoseFree' as MilkType, label: 'Laktozsuz' },
                ]).map((option) => {
                  const active = milk === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMilk(option.value)}
                      className={`touch-target rounded-2xl border px-4 py-3 text-sm font-semibold transition-all min-h-[52px] ${
                        active
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/30 text-text'
                          : 'border-border bg-card text-muted active:bg-card-hover'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 pt-0">
          <Button
            size="xl"
            className="w-full min-h-[56px] text-base"
            onClick={() =>
              onConfirm(unitPrice, {
                sizeLabel: hasSizes ? size : undefined,
                milkType: hasMilk ? milk : undefined,
              })
            }
          >
            Sepete Ekle — {formatCurrency(unitPrice)}
          </Button>
        </div>
      </div>
    </div>
  )
}
