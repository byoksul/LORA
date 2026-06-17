import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { api } from '@/lib/api'
import type { Product, ProductRecipeItem } from '@/types'

interface ProductRecipePanelProps {
  product: Product
  onClose: () => void
}

export function ProductRecipePanel({ product, onClose }: ProductRecipePanelProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(`${product.name} Reçetesi`)
  const [isActive, setIsActive] = useState(true)
  const [items, setItems] = useState<ProductRecipeItem[]>([])
  const [newStockId, setNewStockId] = useState('')
  const [newQty, setNewQty] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: stockItems } = useQuery({
    queryKey: ['stock'],
    queryFn: async () => (await api.getStockItems()).data || [],
  })

  useQuery({
    queryKey: ['recipe', product.id],
    queryFn: async () => {
      const res = await api.getProductRecipe(product.id)
      if (res.success && res.data) {
        setName(res.data.name)
        setIsActive(res.data.isActive)
        setItems(res.data.items)
      }
      return res.data
    },
  })

  const handleAddItem = () => {
    if (!newStockId || !newQty) return
    const stock = stockItems?.find((s) => s.id === newStockId)
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        stockItemId: newStockId,
        stockItemName: stock?.name || '',
        quantity: parseFloat(newQty),
        unit: newUnit || stock?.unit || '',
        isOptional: false,
      },
    ])
    setNewStockId('')
    setNewQty('')
    setNewUnit('')
  }

  const handleSave = async () => {
    setSaving(true)
    await api.upsertProductRecipe(product.id, {
      name,
      isActive,
      items: items.map((i) => ({
        stockItemId: i.stockItemId,
        quantity: i.quantity,
        unit: i.unit,
        isOptional: i.isOptional,
      })),
    })
    queryClient.invalidateQueries({ queryKey: ['adminProducts'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    setSaving(false)
    onClose()
  }

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <Card className="w-full max-w-2xl p-6 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text">Reçete — {product.name}</h2>
            <p className="text-sm text-muted">Hammadde tüketim miktarlarını tanımlayın</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-card-hover cursor-pointer text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Reçete adı" />
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Aktif reçete
          </label>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
              <span className="flex-1 text-sm text-text">{item.stockItemName}</span>
              <span className="text-sm font-medium">{item.quantity} {item.unit}</span>
              <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-danger cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted text-center py-4">Henüz reçete kalemi yok</p>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-3 p-4 rounded-xl bg-background border border-border">
          <select
            value={newStockId}
            onChange={(e) => {
              setNewStockId(e.target.value)
              const s = stockItems?.find((x) => x.id === e.target.value)
              if (s) setNewUnit(s.unit)
            }}
            className="px-3 py-2 rounded-xl bg-card border border-border text-text text-sm"
          >
            <option value="">Stok kalemi</option>
            {stockItems?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Input type="number" step="0.001" placeholder="Miktar" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
          <Input placeholder="Birim" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
          <Button variant="secondary" onClick={handleAddItem} disabled={!newStockId || !newQty}>
            <Plus className="w-4 h-4" /> Ekle
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || items.length === 0}>Kaydet</Button>
          <Button variant="secondary" onClick={onClose}>İptal</Button>
        </div>
      </Card>
    </div>
  )
}
