import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ClipboardList,
  Flame,
  History,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  TrendingDown,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { STOCK_UNITS, WASTE_REASONS, type StockItem } from '@/types'

type Tab = 'overview' | 'items' | 'movements' | 'purchase' | 'waste' | 'count'

type StockItemForm = {
  name: string
  unit: string
  customUnit: string
  currentQuantity: string
  criticalLevel: string
  isActive: boolean
}

const emptyStockItemForm = (): StockItemForm => ({
  name: '',
  unit: 'adet',
  customUnit: '',
  currentQuantity: '0',
  criticalLevel: '0',
  isActive: true,
})

const stockItemToForm = (item: StockItem): StockItemForm => ({
  name: item.name,
  unit: STOCK_UNITS.includes(item.unit as (typeof STOCK_UNITS)[number]) ? item.unit : 'custom',
  customUnit: STOCK_UNITS.includes(item.unit as (typeof STOCK_UNITS)[number]) ? '' : item.unit,
  currentQuantity: String(item.currentQuantity),
  criticalLevel: String(item.criticalLevel),
  isActive: item.isActive,
})

const resolveUnit = (form: StockItemForm) =>
  form.unit === 'custom' ? form.customUnit.trim() : form.unit

export function StockPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [wasteReason, setWasteReason] = useState(WASTE_REASONS[0])
  const [countedQty, setCountedQty] = useState('')
  const [supplier, setSupplier] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [filterItem, setFilterItem] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [itemForm, setItemForm] = useState<StockItemForm>(emptyStockItemForm())
  const [savingItem, setSavingItem] = useState(false)

  const { data: stockItems } = useQuery({
    queryKey: ['stock'],
    queryFn: async () => (await api.getStockItems()).data || [],
  })

  const { data: forecasts } = useQuery({
    queryKey: ['stock-forecast'],
    queryFn: async () => (await api.getStockForecast()).data || [],
  })

  const { data: movements } = useQuery({
    queryKey: ['stock-movements', filterItem, filterType, filterStart, filterEnd],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (filterItem) params.stockItemId = filterItem
      if (filterType) params.movementType = filterType
      if (filterStart) params.startDate = filterStart
      if (filterEnd) params.endDate = filterEnd
      return (await api.getStockMovements(params)).data || []
    },
  })

  const criticalItems = stockItems?.filter((s) => s.isCritical) || []
  const selectedStock = stockItems?.find((s) => s.id === selectedItem)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['stock'] })
    queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    queryClient.invalidateQueries({ queryKey: ['stock-forecast'] })
    queryClient.invalidateQueries({ queryKey: ['stock-dashboard'] })
  }

  const handlePurchase = async () => {
    if (!selectedItem || !quantity) return
    const qty = parseFloat(quantity)
    const cost = parseFloat(unitCost) || 0
    await api.stockPurchase(selectedItem, {
      quantity: qty,
      unitCost: cost || undefined,
      totalCost: cost ? cost * qty : undefined,
      supplierName: supplier || undefined,
      invoiceNumber: invoiceNo || undefined,
      notes: notes || undefined,
    })
    invalidate()
    resetForm()
  }

  const handleWaste = async () => {
    if (!selectedItem || !quantity) return
    await api.stockWaste(selectedItem, {
      quantity: parseFloat(quantity),
      reason: wasteReason,
      notes: notes || undefined,
    })
    invalidate()
    resetForm()
  }

  const handleCount = async () => {
    if (!selectedItem || !countedQty) return
    await api.stockAdjustment(selectedItem, {
      countedQuantity: parseFloat(countedQty),
      notes: notes || undefined,
    })
    invalidate()
    resetForm()
  }

  const handleManual = async (type: 'in' | 'out') => {
    if (!selectedItem || !quantity) return
    const data = { quantity: parseFloat(quantity), notes: notes || undefined }
    if (type === 'in') await api.stockManualIn(selectedItem, data)
    else await api.stockManualOut(selectedItem, data)
    invalidate()
    resetForm()
  }

  const resetForm = () => {
    setQuantity('')
    setNotes('')
    setCountedQty('')
    setSupplier('')
    setInvoiceNo('')
    setUnitCost('')
    setSelectedItem('')
  }

  const openNewItemForm = () => {
    setEditingItem(null)
    setItemForm(emptyStockItemForm())
    setShowItemForm(true)
    setTab('items')
  }

  const openEditItemForm = (item: StockItem) => {
    setEditingItem(item)
    setItemForm(stockItemToForm(item))
    setShowItemForm(true)
    setTab('items')
  }

  const handleSaveItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const unit = resolveUnit(itemForm)
    if (!itemForm.name.trim() || !unit) return

    setSavingItem(true)
    try {
      if (editingItem) {
        await api.updateStockItem(editingItem.id, {
          name: itemForm.name.trim(),
          unit,
          criticalLevel: parseFloat(itemForm.criticalLevel) || 0,
          isActive: itemForm.isActive,
        })
      } else {
        await api.createStockItem({
          name: itemForm.name.trim(),
          unit,
          currentQuantity: parseFloat(itemForm.currentQuantity) || 0,
          criticalLevel: parseFloat(itemForm.criticalLevel) || 0,
          isActive: itemForm.isActive,
        })
      }
      invalidate()
      setShowItemForm(false)
      setEditingItem(null)
      setItemForm(emptyStockItemForm())
    } finally {
      setSavingItem(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Genel', icon: <TrendingDown className="w-4 h-4" /> },
    { id: 'items', label: 'Stok Kalemleri', icon: <Package className="w-4 h-4" /> },
    { id: 'movements', label: 'Hareketler', icon: <History className="w-4 h-4" /> },
    { id: 'purchase', label: 'Stok Girişi', icon: <PackagePlus className="w-4 h-4" /> },
    { id: 'waste', label: 'Fire', icon: <Flame className="w-4 h-4" /> },
    { id: 'count', label: 'Sayım', icon: <ClipboardList className="w-4 h-4" /> },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">Stok Yönetimi</h1>
          <p className="text-muted text-sm mt-1">İsteğe bağlı hammadde takibi (un, süt vb.). Hazır ürün stokları Ürün Yönetimi&apos;nden girilir.</p>
        </div>
        <Button onClick={openNewItemForm}>
          <Plus className="w-4 h-4" />
          Yeni Stok Kalemi
        </Button>
      </div>

      {criticalItems.length > 0 && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2 text-warning mb-3">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Kritik Stok Uyarıları ({criticalItems.length})</span>
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

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${
              tab === t.id ? 'bg-primary text-white' : 'bg-card text-muted hover:text-text'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          {forecasts && forecasts.filter((f) => f.hasEnoughData && f.remainingDays != null && f.remainingDays <= 5).length > 0 && (
            <Card className="p-4 border-primary/20 bg-primary/5">
              <h3 className="font-medium text-text mb-3">Yakında Bitebilecek Stoklar</h3>
              <div className="space-y-2">
                {forecasts
                  .filter((f) => f.hasEnoughData && f.remainingDays != null && f.remainingDays <= 5)
                  .map((f) => (
                    <p key={f.stockItemId} className="text-sm text-muted">{f.message}</p>
                  ))}
              </div>
            </Card>
          )}

          <div className="grid gap-3">
            {stockItems?.map((item) => {
              const forecast = forecasts?.find((f) => f.stockItemId === item.id)
              return (
                <Card key={item.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-text">{item.name}</h3>
                      {item.isCritical && <Badge variant="warning">Kritik</Badge>}
                    </div>
                    <p className="text-sm text-muted mt-1">
                      Kritik seviye: {item.criticalLevel} {item.unit}
                    </p>
                    {forecast && (
                      <p className="text-xs text-muted/80 mt-1">{forecast.message}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${item.isCritical ? 'text-warning' : 'text-text'}`}>
                      {item.currentQuantity}
                    </p>
                    <p className="text-xs text-muted">{item.unit}</p>
                  </div>
                  <button
                    onClick={() => openEditItemForm(item)}
                    className="p-2 rounded-lg hover:bg-card-hover transition-colors cursor-pointer text-muted hover:text-text"
                    title="Düzenle"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </Card>
              )
            })}
            {stockItems?.length === 0 && (
              <Card className="p-8 text-center text-muted">
                <p>Henüz stok kalemi yok.</p>
                <Button className="mt-4" onClick={openNewItemForm}>
                  <Plus className="w-4 h-4" />
                  İlk stok kalemini ekle
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'items' && (
        <div className="space-y-4">
          {showItemForm && (
            <Card className="p-6 space-y-4">
              <h3 className="font-medium text-text">
                {editingItem ? 'Stok Kalemini Düzenle' : 'Yeni Stok Kalemi'}
              </h3>
              <p className="text-sm text-muted">
                Sandviç gibi hazır ürünler için birim olarak <strong className="text-text">adet</strong> seçin.
                Ürün reçetesinde bu kalemi kullanın; satışta otomatik düşer.
              </p>
              <form onSubmit={handleSaveItem} className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="Kalem adı (ör. Mozarelle Sandviç)"
                  value={itemForm.name}
                  onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <select
                  value={itemForm.unit}
                  onChange={(e) => setItemForm((f) => ({ ...f, unit: e.target.value }))}
                  className="px-4 py-3 rounded-xl bg-background border border-border text-text"
                >
                  {STOCK_UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                  <option value="custom">Diğer…</option>
                </select>
                {itemForm.unit === 'custom' && (
                  <Input
                    placeholder="Özel birim (ör. paket)"
                    value={itemForm.customUnit}
                    onChange={(e) => setItemForm((f) => ({ ...f, customUnit: e.target.value }))}
                    required
                  />
                )}
                {!editingItem ? (
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="Başlangıç miktarı"
                    value={itemForm.currentQuantity}
                    onChange={(e) => setItemForm((f) => ({ ...f, currentQuantity: e.target.value }))}
                  />
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-background border border-border text-sm">
                    <span className="text-muted">Mevcut miktar: </span>
                    <span className="font-medium text-text">
                      {editingItem.currentQuantity} {editingItem.unit}
                    </span>
                    <span className="text-muted text-xs block mt-1">
                      Miktar değişikliği için Stok Girişi veya Sayım sekmesini kullanın.
                    </span>
                  </div>
                )}
                <Input
                  type="number"
                  step="0.001"
                  placeholder="Kritik seviye (uyarı eşiği)"
                  value={itemForm.criticalLevel}
                  onChange={(e) => setItemForm((f) => ({ ...f, criticalLevel: e.target.value }))}
                />
                <label className="flex items-center gap-2 text-sm text-text md:col-span-2">
                  <input
                    type="checkbox"
                    checked={itemForm.isActive}
                    onChange={(e) => setItemForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  Aktif
                </label>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" disabled={savingItem || !itemForm.name.trim() || !resolveUnit(itemForm)}>
                    Kaydet
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowItemForm(false)
                      setEditingItem(null)
                      setItemForm(emptyStockItemForm())
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="grid gap-3">
            {stockItems?.map((item) => (
              <Card key={item.id} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-text">{item.name}</h3>
                    {!item.isActive && <Badge variant="danger">Pasif</Badge>}
                    {item.isCritical && <Badge variant="warning">Kritik</Badge>}
                  </div>
                  <p className="text-sm text-muted mt-1">
                    Birim: {item.unit} · Kritik seviye: {item.criticalLevel} {item.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${item.isCritical ? 'text-warning' : 'text-text'}`}>
                    {item.currentQuantity}
                  </p>
                  <p className="text-xs text-muted">{item.unit}</p>
                </div>
                <button
                  onClick={() => openEditItemForm(item)}
                  className="p-2 rounded-lg hover:bg-card-hover transition-colors cursor-pointer text-muted hover:text-text"
                  title="Düzenle"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </Card>
            ))}
            {!showItemForm && stockItems?.length === 0 && (
              <Card className="p-8 text-center text-muted">
                <p>Henüz stok kalemi yok.</p>
                <Button className="mt-4" onClick={openNewItemForm}>
                  <Plus className="w-4 h-4" />
                  İlk stok kalemini ekle
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'movements' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="grid md:grid-cols-4 gap-3">
              <select
                value={filterItem}
                onChange={(e) => setFilterItem(e.target.value)}
                className="px-3 py-2 rounded-xl bg-background border border-border text-text text-sm"
              >
                <option value="">Tüm stok kalemleri</option>
                {stockItems?.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-xl bg-background border border-border text-text text-sm"
              >
                <option value="">Tüm hareket tipleri</option>
                <option value="PurchaseIn">Satın Alma</option>
                <option value="ManualIn">Manuel Giriş</option>
                <option value="ManualOut">Manuel Çıkış</option>
                <option value="SaleOut">Satış</option>
                <option value="WasteOut">Fire</option>
                <option value="Adjustment">Sayım</option>
                <option value="CancelReturn">İptal İadesi</option>
              </select>
              <Input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
              <Input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted text-left">
                    <th className="p-3">Tarih</th>
                    <th className="p-3">Stok</th>
                    <th className="p-3">Tip</th>
                    <th className="p-3">Miktar</th>
                    <th className="p-3">Önceki</th>
                    <th className="p-3">Yeni</th>
                    <th className="p-3">Referans</th>
                    <th className="p-3">Not</th>
                    <th className="p-3">Kullanıcı</th>
                  </tr>
                </thead>
                <tbody>
                  {movements?.map((m) => (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-card-hover">
                      <td className="p-3 text-muted">
                        {new Date(m.createdDate).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className="p-3 text-text">{m.stockItemName}</td>
                      <td className="p-3">
                        <Badge variant={m.movementType.includes('Out') || m.movementType === 'WasteOut' ? 'danger' : 'success'}>
                          {m.movementType}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium">
                        {m.movementType.includes('Out') || m.movementType === 'WasteOut' ? '-' : '+'}
                        {m.quantity} {m.unit}
                      </td>
                      <td className="p-3 text-muted">{m.previousQuantity}</td>
                      <td className="p-3">{m.newQuantity}</td>
                      <td className="p-3 text-muted text-xs">
                        {m.referenceType ? `${m.referenceType}` : '—'}
                        {m.notes?.includes('Sipariş') ? ` ${m.notes}` : ''}
                      </td>
                      <td className="p-3 text-muted text-xs max-w-[120px] truncate">{m.notes || '—'}</td>
                      <td className="p-3 text-muted text-xs">{m.createdByName || '—'}</td>
                    </tr>
                  ))}
                  {movements?.length === 0 && (
                    <tr><td colSpan={9} className="p-8 text-center text-muted">Hareket bulunamadı</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'purchase' && (
        <Card className="p-6 space-y-4">
          <h3 className="font-medium text-text">Stok Girişi (Satın Alma)</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="px-4 py-3 rounded-xl bg-background border border-border text-text"
            >
              <option value="">Stok kalemi seçin</option>
              {stockItems?.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            <Input type="number" placeholder="Miktar" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <Input type="number" step="0.01" placeholder="Birim maliyet (₺)" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            <Input placeholder="Tedarikçi adı" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            <Input placeholder="Fatura/fiş no" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
            <Input placeholder="Not" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button onClick={handlePurchase} disabled={!selectedItem || !quantity}>Kaydet</Button>
        </Card>
      )}

      {tab === 'waste' && (
        <Card className="p-6 space-y-4">
          <h3 className="font-medium text-text flex items-center gap-2">
            <Flame className="w-5 h-5 text-danger" /> Fire Gir
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="px-4 py-3 rounded-xl bg-background border border-border text-text"
            >
              <option value="">Stok kalemi seçin</option>
              {stockItems?.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            <Input type="number" placeholder="Miktar" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <select
              value={wasteReason}
              onChange={(e) => setWasteReason(e.target.value as typeof wasteReason)}
              className="px-4 py-3 rounded-xl bg-background border border-border text-text"
            >
              {WASTE_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <Input placeholder="Not" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button onClick={handleWaste} disabled={!selectedItem || !quantity}>Fire Kaydet</Button>
        </Card>
      )}

      {tab === 'count' && (
        <Card className="p-6 space-y-4">
          <h3 className="font-medium text-text">Sayım / Düzeltme</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="px-4 py-3 rounded-xl bg-background border border-border text-text"
            >
              <option value="">Stok kalemi seçin</option>
              {stockItems?.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            {selectedStock && (
              <div className="px-4 py-3 rounded-xl bg-background border border-border text-sm">
                <span className="text-muted">Sistem miktarı: </span>
                <span className="font-medium text-text">{selectedStock.currentQuantity} {selectedStock.unit}</span>
              </div>
            )}
            <Input
              type="number"
              placeholder="Sayılan miktar"
              value={countedQty}
              onChange={(e) => setCountedQty(e.target.value)}
            />
            {selectedStock && countedQty && (
              <div className="px-4 py-3 rounded-xl bg-card border border-border text-sm">
                <span className="text-muted">Fark: </span>
                <span className={`font-medium ${parseFloat(countedQty) - selectedStock.currentQuantity < 0 ? 'text-danger' : 'text-success'}`}>
                  {(parseFloat(countedQty) - selectedStock.currentQuantity).toFixed(2)} {selectedStock.unit}
                </span>
              </div>
            )}
            <Input placeholder="Not" value={notes} onChange={(e) => setNotes(e.target.value)} className="md:col-span-2" />
          </div>
          <Button onClick={handleCount} disabled={!selectedItem || !countedQty}>Sayımı Kaydet</Button>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted mb-3">Hızlı manuel giriş/çıkış</p>
            <div className="grid md:grid-cols-3 gap-3">
              <Input type="number" placeholder="Miktar" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              <div className="flex gap-2">
                <button
                  onClick={() => handleManual('in')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-success/10 text-success border border-success/30 cursor-pointer"
                >
                  <ArrowDown className="w-4 h-4" /> Giriş
                </button>
                <button
                  onClick={() => handleManual('out')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-danger/10 text-danger border border-danger/30 cursor-pointer"
                >
                  <ArrowUp className="w-4 h-4" /> Çıkış
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
