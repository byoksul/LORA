import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'

export function StockPage() {
  const queryClient = useQueryClient()
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [movementType, setMovementType] = useState<'In' | 'Out'>('In')
  const [quantity, setQuantity] = useState('')

  const { data: stockItems } = useQuery({
    queryKey: ['stock'],
    queryFn: async () => (await api.getStockItems()).data || [],
  })

  const criticalItems = stockItems?.filter((s) => s.isCritical) || []

  const handleMovement = async () => {
    if (!selectedItem || !quantity) return
    await api.createStockMovement({
      stockItemId: selectedItem,
      movementType,
      quantity: parseFloat(quantity),
      notes: undefined,
    })
    queryClient.invalidateQueries({ queryKey: ['stock'] })
    setQuantity('')
    setSelectedItem(null)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stok Yönetimi</h1>
        <p className="text-muted text-sm mt-1">Stok giriş/çıkış ve kritik seviye takibi</p>
      </div>

      {criticalItems.length > 0 && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2 text-warning mb-3">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Kritik Stok Uyarıları</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {criticalItems.map((item) => (
              <Badge key={item.id} variant="warning">
                {item.name}: {item.currentQuantity} {item.unit}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-medium mb-4">Stok Hareketi</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <select
            value={selectedItem || ''}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="px-4 py-3 rounded-xl bg-background border border-border text-text"
          >
            <option value="">Stok kalemi seçin</option>
            {stockItems?.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => setMovementType('In')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                movementType === 'In' ? 'bg-success/10 text-success border border-success/30' : 'bg-card border border-border text-muted'
              }`}
            >
              <ArrowDown className="w-4 h-4" /> Giriş
            </button>
            <button
              onClick={() => setMovementType('Out')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                movementType === 'Out' ? 'bg-danger/10 text-danger border border-danger/30' : 'bg-card border border-border text-muted'
              }`}
            >
              <ArrowUp className="w-4 h-4" /> Çıkış
            </button>
          </div>
          <Input
            type="number"
            placeholder="Miktar"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Button onClick={handleMovement} disabled={!selectedItem || !quantity}>
            Kaydet
          </Button>
        </div>
      </Card>

      <div className="grid gap-3">
        {stockItems?.map((item) => (
          <Card key={item.id} className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{item.name}</h3>
                {item.isCritical && <Badge variant="warning">Kritik</Badge>}
              </div>
              <p className="text-sm text-muted">
                Kritik seviye: {item.criticalLevel} {item.unit}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{item.currentQuantity}</p>
              <p className="text-xs text-muted">{item.unit}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
