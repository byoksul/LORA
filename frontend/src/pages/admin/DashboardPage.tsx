import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  AlertTriangle,
  ArrowRight,
  Coffee,
  CreditCard,
  Flame,
  Package,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'
import { HourlyTrafficChart } from '@/components/dashboard/HourlyTrafficChart'
import { Card } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

const PAYMENT_COLORS = {
  Kart: '#D18E70',
  Nakit: '#6BBF8A',
  İkram: '#D4A04A',
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  accent?: 'primary' | 'default'
}) {
  return (
    <Card
      className={`p-4 relative overflow-hidden ${
        accent === 'primary' ? 'border-primary/25 bg-gradient-to-br from-primary/10 to-card' : ''
      }`}
    >
      {accent === 'primary' && (
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
      )}
      <div className="flex items-center gap-2 text-muted mb-2">
        <Icon className={`w-4 h-4 ${accent === 'primary' ? 'text-primary' : ''}`} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${accent === 'primary' ? 'text-primary' : 'text-text'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </Card>
  )
}

function ProductRankList({
  title,
  items,
  emptyText,
  showRank,
}: {
  title: string
  items: { productName: string; quantity: number; revenue: number }[]
  emptyText: string
  showRank?: boolean
}) {
  const maxQty = Math.max(...items.map((p) => p.quantity), 1)

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-text mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((p, i) => (
          <div key={p.productName} className="space-y-1.5">
            <div className="flex items-center gap-3">
              {showRank && (
                <span
                  className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center font-semibold shrink-0 ${
                    i === 0
                      ? 'bg-primary/20 text-primary'
                      : 'bg-background text-muted border border-border'
                  }`}
                >
                  {i + 1}
                </span>
              )}
              <span className="text-sm flex-1 min-w-0 truncate text-text">{p.productName}</span>
              <span className="text-xs text-muted shrink-0">{p.quantity} adet</span>
              <span className="text-sm font-medium shrink-0">{formatCurrency(p.revenue)}</span>
            </div>
            {showRank && (
              <div className="h-1.5 rounded-full bg-background overflow-hidden ml-10">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all"
                  style={{ width: `${(p.quantity / maxQty) * 100}%` }}
                />
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-muted text-sm text-center py-6">{emptyText}</p>
        )}
      </div>
    </Card>
  )
}

export function DashboardPage() {
  const todayLabel = new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.getDashboard()).data,
    refetchInterval: 60000,
  })

  const { data: activeOrders } = useQuery({
    queryKey: ['dashboard-active-orders'],
    queryFn: async () => (await api.getActiveOrders()).data || [],
    refetchInterval: 30000,
  })

  if (isLoading || !dashboard) {
    return (
      <div className="p-8 flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted text-sm">Dashboard yükleniyor…</p>
        </div>
      </div>
    )
  }

  const paymentData = [
    { name: 'Kart', value: dashboard.paymentDistribution.cardAmount },
    { name: 'Nakit', value: dashboard.paymentDistribution.cashAmount },
    { name: 'İkram', value: dashboard.paymentDistribution.complimentaryAmount },
  ].filter((d) => d.value > 0)

  const paymentTotal = paymentData.reduce((s, d) => s + d.value, 0)
  const stock = dashboard.stockSummary
  const hasAlerts =
    (stock?.criticalStockCount ?? 0) > 0 || (stock?.expiringSoon?.length ?? 0) > 0

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Operasyon merkezi</p>
          <h1 className="text-2xl lg:text-3xl font-semibold text-text">Dashboard</h1>
          <p className="text-muted text-sm mt-1">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          {activeOrders && activeOrders.length > 0 && (
            <Link
              to="/bar"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/15 border border-primary/25 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Coffee className="w-4 h-4" />
              {activeOrders.length} aktif sipariş
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Günlük Ciro"
          value={formatCurrency(dashboard.dailyRevenue)}
          sub={`Haftalık ${formatCurrency(dashboard.weeklyRevenue)}`}
          icon={TrendingUp}
          accent="primary"
        />
        <StatCard
          label="Sipariş"
          value={dashboard.orderCount.toString()}
          sub="Bugün tamamlanan"
          icon={ShoppingBag}
        />
        <StatCard
          label="Ortalama Sepet"
          value={formatCurrency(dashboard.averageBasket)}
          sub="Günlük ortalama"
          icon={CreditCard}
        />
        <StatCard
          label="Aylık Ciro"
          value={formatCurrency(dashboard.monthlyRevenue)}
          sub="Son 30 gün"
          icon={TrendingUp}
        />
      </div>

      {/* Operasyon uyarıları */}
      <Card
        className={`p-5 ${
          hasAlerts ? 'border-warning/30 bg-warning/5' : 'border-border'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${hasAlerts ? 'text-warning' : 'text-muted'}`} />
            <h3 className="text-sm font-semibold text-text">Operasyon Uyarıları</h3>
          </div>
          <Link
            to="/admin/stock"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Stok yönetimi <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {!hasAlerts ? (
          <p className="text-sm text-muted py-2">
            Kritik stok veya yakın tükenme uyarısı yok — her şey yolunda.
          </p>
        ) : (
          <div className="space-y-2">
            {stock && stock.criticalStockCount > 0 && (
              <p className="text-sm text-warning">
                {stock.criticalStockCount} stok kalemi kritik seviyede
              </p>
            )}
            {stock?.expiringSoon.map((f) => (
              <p key={f.stockItemId} className="text-sm text-muted border-l-2 border-primary/50 pl-3">
                {f.message}
              </p>
            ))}
          </div>
        )}
      </Card>

      {/* Stock ops strip */}
      {stock && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted">Kritik stok</p>
              <p className="text-xl font-bold text-text">{stock.criticalStockCount}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted">Bugün düşen hareket</p>
              <p className="text-xl font-bold text-text">{stock.todaySaleOutCount}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger/15 flex items-center justify-center">
              <Flame className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-xs text-muted">Bugünkü fire</p>
              <p className="text-xl font-bold text-text">{stock.todayWasteQuantity.toFixed(1)}</p>
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted mb-2">En çok tüketilen (bugün)</p>
            <div className="space-y-1">
              {stock.topConsumedItems.slice(0, 2).map((item) => (
                <div key={item.stockItemId} className="flex justify-between text-sm">
                  <span className="text-text truncate">{item.name}</span>
                  <span className="text-muted shrink-0 ml-2">
                    {item.totalQuantity} {item.unit}
                  </span>
                </div>
              ))}
              {stock.topConsumedItems.length === 0 && (
                <p className="text-sm text-muted">Veri yok</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="p-5 lg:col-span-3">
          <HourlyTrafficChart data={dashboard.hourlyTraffic} />
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold text-text mb-1">Ödeme Dağılımı</h3>
          <p className="text-xs text-muted mb-4">Bugünkü tahsilat</p>
          {paymentData.length > 0 ? (
            <>
              <div className="relative h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={82}
                      dataKey="value"
                      stroke="none"
                      paddingAngle={3}
                    >
                      {paymentData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PAYMENT_COLORS[entry.name as keyof typeof PAYMENT_COLORS]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null
                        const item = payload[0].payload as { name: string; value: number }
                        const pct = paymentTotal > 0 ? ((item.value / paymentTotal) * 100).toFixed(0) : 0
                        return (
                          <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-soft">
                            <p className="text-text font-medium">{item.name}</p>
                            <p className="text-primary">{formatCurrency(item.value)} · {pct}%</p>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-xs text-muted">Toplam</p>
                    <p className="text-lg font-bold text-text">{formatCurrency(paymentTotal)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-2">
                {paymentData.map((d) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: PAYMENT_COLORS[d.name as keyof typeof PAYMENT_COLORS] }}
                    />
                    <span className="text-sm text-muted flex-1">{d.name}</span>
                    <span className="text-sm font-medium">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted text-sm text-center py-16">Bugün henüz ödeme yok</p>
          )}
        </Card>
      </div>

      {/* Revenue trend mini + products */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-1">
          <h3 className="font-semibold text-text mb-1">Ciro Özeti</h3>
          <p className="text-xs text-muted mb-4">Günlük / haftalık / aylık</p>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { label: 'Günlük', value: dashboard.dailyRevenue },
                  { label: 'Haftalık', value: dashboard.weeklyRevenue },
                  { label: 'Aylık', value: dashboard.monthlyRevenue },
                ]}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D18E70" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#D18E70" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v ?? 0))}
                  contentStyle={{
                    background: '#2A2B2F',
                    border: '1px solid #3A3B40',
                    borderRadius: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#D18E70"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={{ fill: '#D18E70', r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-center">
            <div className="rounded-lg bg-background p-2">
              <p className="text-[10px] text-muted">Günlük</p>
              <p className="text-xs font-semibold">{formatCurrency(dashboard.dailyRevenue)}</p>
            </div>
            <div className="rounded-lg bg-background p-2">
              <p className="text-[10px] text-muted">Haftalık</p>
              <p className="text-xs font-semibold">{formatCurrency(dashboard.weeklyRevenue)}</p>
            </div>
            <div className="rounded-lg bg-background p-2">
              <p className="text-[10px] text-muted">Aylık</p>
              <p className="text-xs font-semibold">{formatCurrency(dashboard.monthlyRevenue)}</p>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
          <ProductRankList
            title="En Çok Satan"
            items={dashboard.topProducts}
            emptyText="Bugün satış verisi yok"
            showRank
          />
          <ProductRankList
            title="En Az Satan"
            items={dashboard.lowProducts}
            emptyText="Veri yok"
          />
        </div>
      </div>
    </div>
  )
}
