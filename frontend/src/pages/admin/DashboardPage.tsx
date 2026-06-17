import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { TrendingUp, ShoppingBag, CreditCard } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export function DashboardPage() {
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.getDashboard()
      return res.data
    },
  })

  if (!dashboard) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-muted">Yükleniyor...</div>
      </div>
    )
  }

  const paymentData = [
    { name: 'Kart', value: dashboard.paymentDistribution.cardAmount, color: '#C98A6A' },
    { name: 'Nakit', value: dashboard.paymentDistribution.cashAmount, color: '#3BB273' },
    { name: 'İkram', value: dashboard.paymentDistribution.complimentaryAmount, color: '#FFB020' },
  ].filter((d) => d.value > 0)

  const stats = [
    { label: 'Günlük Ciro', value: formatCurrency(dashboard.dailyRevenue), icon: TrendingUp },
    { label: 'Haftalık Ciro', value: formatCurrency(dashboard.weeklyRevenue), icon: TrendingUp },
    { label: 'Aylık Ciro', value: formatCurrency(dashboard.monthlyRevenue), icon: TrendingUp },
    { label: 'Sipariş Sayısı', value: dashboard.orderCount.toString(), icon: ShoppingBag },
    { label: 'Ortalama Sepet', value: formatCurrency(dashboard.averageBasket), icon: CreditCard },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Günlük operasyon özeti</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-2 text-muted mb-2">
              <stat.icon className="w-4 h-4" />
              <span className="text-xs">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-text">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-medium mb-4">Saatlik Yoğunluk</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dashboard.hourlyTraffic}>
              <XAxis dataKey="hour" tick={{ fill: '#8A8A8A', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8A8A8A', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#181818', border: '1px solid #2A2A2A', borderRadius: '12px' }}
                labelStyle={{ color: '#F5F5F5' }}
              />
              <Bar dataKey="orderCount" fill="#C98A6A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium mb-4">Ödeme Dağılımı</h3>
          {paymentData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={280}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    stroke="none"
                  >
                    {paymentData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#181818', border: '1px solid #2A2A2A', borderRadius: '12px' }}
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {paymentData.map((d) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                    <span className="text-sm text-muted">{d.name}</span>
                    <span className="text-sm font-medium ml-auto">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted text-sm text-center py-12">Bugün henüz ödeme yok</p>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-medium mb-4">En Çok Satan</h3>
          <div className="space-y-3">
            {dashboard.topProducts.map((p, i) => (
              <div key={p.productName} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <span className="text-sm flex-1">{p.productName}</span>
                <span className="text-sm text-muted">{p.quantity} adet</span>
                <span className="text-sm font-medium">{formatCurrency(p.revenue)}</span>
              </div>
            ))}
            {dashboard.topProducts.length === 0 && (
              <p className="text-muted text-sm text-center py-4">Veri yok</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium mb-4">En Az Satan</h3>
          <div className="space-y-3">
            {dashboard.lowProducts.map((p) => (
              <div key={p.productName} className="flex items-center gap-3">
                <span className="text-sm flex-1">{p.productName}</span>
                <span className="text-sm text-muted">{p.quantity} adet</span>
                <span className="text-sm font-medium">{formatCurrency(p.revenue)}</span>
              </div>
            ))}
            {dashboard.lowProducts.length === 0 && (
              <p className="text-muted text-sm text-center py-4">Veri yok</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
