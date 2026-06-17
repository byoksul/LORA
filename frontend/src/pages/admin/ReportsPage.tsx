import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export function ReportsPage() {
  const { data: salesReport } = useQuery({
    queryKey: ['salesReport'],
    queryFn: async () => (await api.getSalesReport()).data || [],
  })

  const { data: productReport } = useQuery({
    queryKey: ['productReport'],
    queryFn: async () => (await api.getProductSalesReport()).data || [],
  })

  const { data: staffReport } = useQuery({
    queryKey: ['staffReport'],
    queryFn: async () => (await api.getStaffSalesReport()).data || [],
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Raporlar</h1>
        <p className="text-muted text-sm mt-1">Satış ve operasyon raporları</p>
      </div>

      <Card className="p-6">
        <h3 className="font-medium mb-4">Günlük Satış</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted border-b border-border">
                <th className="text-left py-2">Tarih</th>
                <th className="text-right py-2">Sipariş</th>
                <th className="text-right py-2">Ciro</th>
                <th className="text-right py-2">Ort. Sepet</th>
              </tr>
            </thead>
            <tbody>
              {salesReport?.map((r) => (
                <tr key={r.date} className="border-b border-border/50">
                  <td className="py-3">{new Date(r.date).toLocaleDateString('tr-TR')}</td>
                  <td className="text-right">{r.orderCount}</td>
                  <td className="text-right font-medium">{formatCurrency(r.totalRevenue)}</td>
                  <td className="text-right text-muted">{formatCurrency(r.averageBasket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {salesReport?.length === 0 && <p className="text-muted text-center py-4">Veri yok</p>}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-medium mb-4">Ürün Satış Raporu</h3>
          <div className="space-y-3">
            {productReport?.map((r) => (
              <div key={r.productName} className="flex justify-between text-sm">
                <span>{r.productName}</span>
                <div className="flex gap-4">
                  <span className="text-muted">{r.quantity} adet</span>
                  <span className="font-medium">{formatCurrency(r.revenue)}</span>
                </div>
              </div>
            ))}
            {productReport?.length === 0 && <p className="text-muted text-center py-4">Veri yok</p>}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium mb-4">Personel Satış Raporu</h3>
          <div className="space-y-3">
            {staffReport?.map((r) => (
              <div key={r.staffName} className="flex justify-between text-sm">
                <span>{r.staffName}</span>
                <div className="flex gap-4">
                  <span className="text-muted">{r.orderCount} sipariş</span>
                  <span className="font-medium">{formatCurrency(r.totalRevenue)}</span>
                </div>
              </div>
            ))}
            {staffReport?.length === 0 && <p className="text-muted text-center py-4">Veri yok</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
