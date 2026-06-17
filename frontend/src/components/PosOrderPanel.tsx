import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Gift,
  GraduationCap,
  Layers,
  Minus,
  Plus,
  Receipt,
  ShoppingBag,
  Stethoscope,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DISCOUNT_PERCENT, formatCurrency, getMilkLabel } from '@/lib/utils'
import type { CartItem } from '@/stores/posStore'
import type { DiscountType, PaymentType } from '@/types'

interface PaymentOption {
  type: PaymentType
  label: string
  icon: React.ReactNode
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { type: 'Card', label: 'Kart', icon: <CreditCard className="w-4 h-4" strokeWidth={1.75} /> },
  { type: 'Cash', label: 'Nakit', icon: <Banknote className="w-4 h-4" strokeWidth={1.75} /> },
  { type: 'Complimentary', label: 'İkram', icon: <Gift className="w-4 h-4" strokeWidth={1.75} /> },
  { type: 'Mixed', label: 'Karma', icon: <Layers className="w-4 h-4" strokeWidth={1.75} /> },
]

interface DiscountOption {
  type: DiscountType
  label: string
  icon: React.ReactNode
}

const DISCOUNT_OPTIONS: DiscountOption[] = [
  { type: 'None', label: 'Normal', icon: null },
  { type: 'Student', label: 'Öğrenci', icon: <GraduationCap className="w-3.5 h-3.5" strokeWidth={1.75} /> },
  { type: 'HealthcareWorker', label: 'Sağlık', icon: <Stethoscope className="w-3.5 h-3.5" strokeWidth={1.75} /> },
]

const qtyBtn =
  'touch-target min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center transition-colors active:bg-card-hover'

interface PosOrderPanelProps {
  items: CartItem[]
  subtotal: number
  discountAmount: number
  total: number
  discountType: DiscountType
  paymentType: PaymentType
  processing: boolean
  lastOrderNumber: number | null
  paymentError?: string | null
  onDiscountTypeChange: (type: DiscountType) => void
  onPaymentTypeChange: (type: PaymentType) => void
  onUpdateQuantity: (cartKey: string, quantity: number) => void
  onRemoveItem: (cartKey: string) => void
  onClearCart: () => void
  onPayment: () => void
}

function CartLine({
  item,
  index,
  compact,
  onUpdateQuantity,
  onRemoveItem,
}: {
  item: CartItem
  index: number
  compact: boolean
  onUpdateQuantity: (cartKey: string, quantity: number) => void
  onRemoveItem: (cartKey: string) => void
}) {
  const milkLabel = getMilkLabel(item.milkType)
  const lineTotal = item.unitPrice * item.quantity

  return (
    <li
      className={`rounded-xl border border-border/80 bg-card overflow-hidden ${
        compact ? 'shadow-none' : 'shadow-card'
      }`}
    >
      <div className={`flex gap-2 ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`font-medium text-text leading-snug ${compact ? 'text-xs' : 'text-sm'}`}>
                <span className="text-muted/70 tabular-nums mr-1.5">#{index + 1}</span>
                {item.productName}
              </p>
              {(item.sizeLabel || milkLabel) && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.sizeLabel && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/15">
                      {item.sizeLabel}
                    </span>
                  )}
                  {milkLabel && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-warning/10 text-warning border border-warning/20">
                      {milkLabel}
                    </span>
                  )}
                </div>
              )}
              <p className="text-[10px] text-muted mt-1 tabular-nums">
                {formatCurrency(item.unitPrice)} × {item.quantity}
              </p>
            </div>
            <p className={`font-semibold text-primary tabular-nums shrink-0 ${compact ? 'text-xs' : 'text-sm'}`}>
              {formatCurrency(lineTotal)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 px-2 pb-2">
        <div className="flex items-center rounded-lg bg-surface border border-border">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.cartKey, item.quantity - 1)}
            className={`${qtyBtn} rounded-l-lg`}
            aria-label="Azalt"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="min-w-[36px] text-center font-semibold text-xs tabular-nums">{item.quantity}</span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.cartKey, item.quantity + 1)}
            className={`${qtyBtn} rounded-r-lg`}
            aria-label="Artır"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onRemoveItem(item.cartKey)}
          className={`${qtyBtn} text-muted active:text-danger active:bg-danger/10`}
          aria-label="Kaldır"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  )
}

export function PosOrderPanel({
  items,
  subtotal,
  discountAmount,
  total,
  discountType,
  paymentType,
  processing,
  lastOrderNumber,
  paymentError,
  onDiscountTypeChange,
  onPaymentTypeChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onPayment,
}: PosOrderPanelProps) {
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0)
  const selectedPayment = PAYMENT_OPTIONS.find((p) => p.type === paymentType)
  const compact = items.length >= 3

  return (
    <aside className="w-[min(40vw,420px)] min-w-[300px] sm:min-w-[320px] lg:min-w-[360px] xl:min-w-[400px] shrink-0 border-l border-border flex flex-col min-h-0 bg-surface">
      <header className="px-3 pt-3 pb-2 shrink-0 border-b border-border/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 text-primary" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-text">Sipariş</h2>
              <p className="text-[11px] text-muted">
                {items.length === 0 ? 'Sepet boş' : `${items.length} kalem · ${totalUnits} adet`}
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="text-[11px] font-medium text-muted px-2 py-1.5 rounded-lg active:text-danger active:bg-danger/10"
            >
              Temizle
            </button>
          )}
        </div>

        {lastOrderNumber && (
          <div className="mt-2 flex items-center gap-2 bg-success/10 border border-success/25 text-success px-3 py-2 rounded-xl text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Sipariş #{lastOrderNumber} oluşturuldu</span>
          </div>
        )}
        {paymentError && (
          <div className="mt-2 bg-danger/10 border border-danger/25 text-danger px-3 py-2 rounded-xl text-xs font-medium">
            {paymentError}
          </div>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-2.5 py-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center rounded-2xl border border-dashed border-border/80 bg-card/30 h-full min-h-[120px]">
            <ShoppingBag className="w-8 h-8 text-muted/50 mb-2" strokeWidth={1.5} />
            <p className="text-sm font-medium text-text">Henüz ürün yok</p>
            <p className="text-xs text-muted mt-1">Ürüne dokunarak ekleyin</p>
          </div>
        ) : (
          <ul className={compact ? 'space-y-1.5' : 'space-y-2'}>
            {items.map((item, index) => (
              <CartLine
                key={item.cartKey}
                item={item}
                index={index}
                compact={compact}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </ul>
        )}
      </div>

      <footer className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm p-2.5 space-y-2 max-h-[48vh] overflow-y-auto overscroll-y-contain">
        <div className="rounded-xl bg-card border border-border p-2.5 space-y-1.5">
          {discountAmount > 0 && (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Ara toplam</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-success">İndirim %{DISCOUNT_PERCENT}</span>
                <span className="tabular-nums text-success">−{formatCurrency(discountAmount)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-end gap-3 pt-0.5">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted">Ödenecek</p>
              <p className="text-[10px] text-muted/70">{selectedPayment?.label ?? 'Ödeme'}</p>
            </div>
            <p className="text-xl xl:text-2xl font-bold text-primary tabular-nums leading-none">
              {formatCurrency(total)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-muted mb-1 px-0.5">İndirim</p>
            <div className="grid grid-cols-3 gap-1">
              {DISCOUNT_OPTIONS.map((option) => {
                const active = discountType === option.type
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => onDiscountTypeChange(option.type)}
                    className={`touch-target flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[10px] font-medium min-h-[44px] ${
                      active
                        ? option.type === 'None'
                          ? 'bg-card border-2 border-primary text-text'
                          : 'bg-success text-white'
                        : 'bg-card border border-border text-muted'
                    }`}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-widest text-muted mb-1 px-0.5">Ödeme</p>
            <div className="grid grid-cols-2 gap-1">
              {PAYMENT_OPTIONS.map((btn) => {
                const active = paymentType === btn.type
                return (
                  <button
                    key={btn.type}
                    type="button"
                    onClick={() => onPaymentTypeChange(btn.type)}
                    className={`touch-target flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-medium min-h-[44px] ${
                      active
                        ? 'bg-primary text-white'
                        : 'bg-card border border-border text-muted'
                    }`}
                  >
                    {btn.icon}
                    <span>{btn.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <Button
          size="xl"
          className="touch-target w-full min-h-[52px] text-sm shadow-soft gap-2"
          disabled={items.length === 0 || processing}
          onClick={onPayment}
        >
          {processing ? (
            'İşleniyor...'
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />
              Ödeme Al — {formatCurrency(total)}
            </>
          )}
        </Button>
      </footer>
    </aside>
  )
}
