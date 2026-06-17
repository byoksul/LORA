import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'

const PIN_LENGTH = 6

interface PinKeypadProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (pin: string) => void
  disabled?: boolean
}

export function PinKeypad({ value, onChange, onComplete, disabled }: PinKeypadProps) {
  const digits = value.split('')

  const addDigit = (digit: string) => {
    if (disabled || value.length >= PIN_LENGTH) return
    const next = value + digit
    onChange(next)
    if (next.length === PIN_LENGTH) onComplete?.(next)
  }

  const removeDigit = () => {
    if (disabled || value.length === 0) return
    onChange(value.slice(0, -1))
  }

  const clear = () => {
    if (disabled) return
    onChange('')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-3">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-11 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-semibold transition-colors',
              digits[i]
                ? 'border-primary bg-primary/15 text-text'
                : 'border-border bg-surface text-transparent',
              i === digits.length && !disabled && 'border-primary/50'
            )}
          >
            {digits[i] ? '•' : ''}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            disabled={disabled}
            onClick={() => addDigit(d)}
            className="h-14 rounded-2xl bg-surface border border-border text-xl font-medium text-text hover:bg-card-hover active:scale-95 transition-colors cursor-pointer disabled:opacity-50"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={clear}
          className="h-14 rounded-2xl bg-surface border border-border flex items-center justify-center text-muted hover:text-text hover:bg-card-hover transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Temizle"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => addDigit('0')}
          className="h-14 rounded-2xl bg-surface border border-border text-xl font-medium text-text hover:bg-card-hover active:scale-95 transition-colors cursor-pointer disabled:opacity-50"
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={removeDigit}
          className="h-14 rounded-2xl bg-surface border border-border text-sm font-medium text-muted hover:text-text hover:bg-card-hover transition-colors cursor-pointer disabled:opacity-50"
        >
          Sil
        </button>
      </div>
    </div>
  )
}
