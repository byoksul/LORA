import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Gift,
  Layers,
  Minus,
  Plus,
  Receipt,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProductImage } from '@/components/ProductImage'
import { formatCurrency } from '@/lib/utils'
import type { PaymentType } from '@/types'

export interface PosCartItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  imageUrl?: string
}

interface PaymentOption {
  type: PaymentType
  label: string
  icon: React.ReactNode
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { type: 'Card', label: 'Kart', icon: <CreditCard className="w-5 h-5" strokeWidth={1.75} /> },
  { type: 'Cash', label: 'Nakit', icon: <Banknote className="w-5 h-5" strokeWidth={1.75} /> },
  { type: 'Complimentary', label: 'İkram', icon: <Gift className="w-5 h-5" strokeWidth={1.75} /> },
  { type: 'Mixed', label: 'Karma', icon: <Layers className="w-5 h-5" strokeWidth={1.75} /> },
]

const iconBtnClass =
  'touch-target touch-pressable min-h-[48px] min-w-[48px] rounded-xl flex items-center justify-center transition-colors cursor-pointer active:bg-card-hover lg:hover:bg-card-hover'

interface PosOrderPanelProps {
  items: PosCartItem[]
  total: number
  paymentType: PaymentType
  processing: boolean
  lastOrderNumber: number | null
  onPaymentTypeChange: (type: PaymentType) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  onPayment: () => void
}

export function PosOrderPanel({
  items,
  total,
  paymentType,
  processing,
  lastOrderNumber,
  onPaymentTypeChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onPayment,
}: PosOrderPanelProps) {
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0)
  const selectedPayment = PAYMENT_OPTIONS.find((p) => p.type === paymentType)

  return (
    <aside
      className="w-[280px] sm:w-[300px] lg:w-[320px] xl:w-[380px] shrink-0 border-l border-border flex flex-col min-h-0 bg-surface"
    >
      <header className="px-4 pt-4 pb-3 shrink-0 border-b border-border/80">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-primary" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-text tracking-tight">Mevcut sipariş</h2>
              <p className="text-xs text-muted mt-0.5">
                {items.length === 0
                  ? 'Sepet boş'
                  : `${items.length} ürün · ${totalUnits} adet`}
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className={`${iconBtnClass} gap-1.5 px-3 text-xs font-medium text-muted active:text-danger active:bg-danger/10 border border-transparent active:border-danger/20 lg:hover:text-danger lg:hover:bg-danger/10 lg:hover:border-danger/20`}
            >
              <X className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Temizle</span>
            </button>
          )}
        </div>

        {lastOrderNumber && (
          <div
            className="mt-3 flex items-center gap-2.5 bg-success/10 border border-success/25 text-success px-3.5 py-3 rounded-2xl text-sm font-medium animate-fade-in"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Sipariş <span className="tabular-nums">#{lastOrderNumber}</span> oluşturuldu</span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto min-h-0 overscroll-y-contain px-3 py-3 lg:px-4 lg:py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-card/30">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
              <ShoppingBag className="w-7 h-7 text-muted/60" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-text">Henüz ürün eklenmedi</p>
            <p className="text-xs text-muted mt-1.5 max-w-[220px] leading-relaxed">
              Ürün kartlarına dokunarak siparişe ekleyin
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => {
              const lineTotal = item.unitPrice * item.quantity
              return (
                <li
                  key={item.productId}
                  className="rounded-2xl bg-card border border-border/90 overflow-hidden animate-slide-in shadow-card"
                >
                  <div className="flex gap-3 p-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface shrink-0 border border-border/60 pointer-events-none">
                      <ProductImage
                        name={item.productName}
                        imageUrl={item.imageUrl}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center pointer-events-none">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-text leading-snug line-clamp-2">
                            {item.productName}
                          </p>
                          <p className="text-xs text-muted mt-0.5 tabular-nums">
                            {formatCurrency(item.unitPrice)} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-primary tabular-nums shrink-0">
                          {formatCurrency(lineTotal)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-background/60 border-t border-border/60">
                    <span className="text-[10px] uppercase tracking-widest text-muted/80 pl-1 pointer-events-none">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-xl bg-surface border border-border">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                          className={`${iconBtnClass} rounded-l-xl rounded-r-lg`}
                          aria-label="Azalt"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="min-w-[48px] min-h-[48px] flex items-center justify-center font-semibold text-sm tabular-nums pointer-events-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                          className={`${iconBtnClass} rounded-r-xl rounded-l-lg`}
                          aria-label="Artır"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.productId)}
                        className={`${iconBtnClass} text-muted active:text-danger active:bg-danger/10 border border-transparent active:border-danger/20 lg:hover:text-danger lg:hover:bg-danger/10 lg:hover:border-danger/20`}
                        aria-label="Kaldır"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <footer className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm p-3 lg:p-4 space-y-3">
        <div className="rounded-2xl bg-card border border-border p-3 lg:p-4 space-y-3 shadow-card">
          <div className="flex justify-between items-center text-sm min-h-[24px]">
            <span className="text-muted">Ürün çeşidi</span>
            <span className="font-medium tabular-nums text-text">{items.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm min-h-[24px]">
            <span className="text-muted">Toplam adet</span>
            <span className="font-medium tabular-nums text-text">{totalUnits}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-end gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Ödenecek tutar</p>
              <p className="text-[11px] text-muted/70 mt-0.5">
                {selectedPayment?.label ?? 'Ödeme'} ile tahsil
              </p>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-primary tabular-nums leading-none">
              {formatCurrency(total)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted mb-2 px-0.5">
            Ödeme yöntemi
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_OPTIONS.map((btn) => {
              const active = paymentType === btn.type
              return (
                <button
                  key={btn.type}
                  type="button"
                  onClick={() => onPaymentTypeChange(btn.type)}
                  className={`touch-target touch-pressable flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-2xl text-[11px] font-medium transition-all cursor-pointer min-h-[56px] ${
                    active
                      ? 'bg-primary text-white shadow-card ring-2 ring-primary/40 ring-offset-2 ring-offset-background'
                      : 'bg-card border border-border text-muted active:text-text active:border-primary/30 active:bg-card-hover lg:hover:text-text lg:hover:border-primary/30 lg:hover:bg-card-hover'
                  }`}
                >
                  {btn.icon}
                  <span>{btn.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <Button
          size="xl"
          className="touch-target w-full min-h-[56px] text-base shadow-soft gap-2"
          disabled={items.length === 0 || processing}
          onClick={onPayment}
        >
          {processing ? (
            'İşleniyor...'
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 shrink-0" strokeWidth={2} />
              Ödeme Al — {formatCurrency(total)}
            </>
          )}
        </Button>
      </footer>
    </aside>
  )
}
