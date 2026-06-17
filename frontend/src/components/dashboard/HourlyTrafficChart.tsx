import { useMemo, useState } from 'react'
import {
  Area,
  Bar,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { Clock, TrendingUp } from 'lucide-react'
import type { HourlyData } from '@/types'

const PRIMARY = '#D18E70'
const PRIMARY_SOFT = 'rgba(209, 142, 112, 0.35)'

function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

interface HourlyTrafficChartProps {
  data: HourlyData[]
}

export function HourlyTrafficChart({ data }: HourlyTrafficChartProps) {
  const [view, setView] = useState<'business' | 'full'>('business')
  const currentHour = new Date().getHours()

  const chartData = useMemo(() => {
    const enriched = data.map((d) => ({
      ...d,
      label: formatHourLabel(d.hour),
      isCurrent: d.hour === currentHour,
      isPeak: false,
    }))
    const peakCount = Math.max(...enriched.map((d) => d.orderCount), 0)
    enriched.forEach((d) => {
      if (d.orderCount === peakCount && peakCount > 0) d.isPeak = true
    })
    if (view === 'business') {
      return enriched.filter((d) => d.hour >= 7 && d.hour <= 23)
    }
    return enriched
  }, [data, currentHour, view])

  const totalOrders = data.reduce((s, d) => s + d.orderCount, 0)
  const peak = data.reduce(
    (best, d) => (d.orderCount > best.orderCount ? d : best),
    data[0] ?? { hour: 0, orderCount: 0 }
  )
  const activeHours = data.filter((d) => d.orderCount > 0).length
  const avgPerActiveHour =
    activeHours > 0 ? (totalOrders / activeHours).toFixed(1) : '0'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-text">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Saatlik Yoğunluk</h3>
          </div>
          <p className="text-xs text-muted mt-1">Bugünkü sipariş dağılımı</p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-background border border-border">
          <button
            type="button"
            onClick={() => setView('business')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              view === 'business' ? 'bg-primary text-white' : 'text-muted hover:text-text'
            }`}
          >
            İş saatleri
          </button>
          <button
            type="button"
            onClick={() => setView('full')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              view === 'full' ? 'bg-primary text-white' : 'text-muted hover:text-text'
            }`}
          >
            24 saat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-background/60 border border-border/60 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted">Toplam sipariş</p>
          <p className="text-lg font-bold text-text mt-0.5">{totalOrders}</p>
        </div>
        <div className="rounded-xl bg-background/60 border border-border/60 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted">Yoğun saat</p>
          <p className="text-lg font-bold text-primary mt-0.5">
            {peak.orderCount > 0 ? formatHourLabel(peak.hour) : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-background/60 border border-border/60 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted">Ort. / aktif saat</p>
          <p className="text-lg font-bold text-text mt-0.5">{avgPerActiveHour}</p>
        </div>
      </div>

      {totalOrders === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border/80 bg-background/30">
          <TrendingUp className="w-8 h-8 text-muted/40 mb-3" />
          <p className="text-sm text-muted">Bugün henüz sipariş yok</p>
          <p className="text-xs text-muted/70 mt-1">İlk sipariş geldiğinde grafik dolacak</p>
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="hourlyArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(58, 59, 64, 0.5)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: '#A8A8A8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={view === 'full' ? 2 : 0}
                angle={view === 'full' ? -45 : 0}
                textAnchor={view === 'full' ? 'end' : 'middle'}
                height={view === 'full' ? 50 : 30}
              />
              <YAxis
                tick={{ fill: '#A8A8A8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip
                cursor={{ stroke: PRIMARY_SOFT, strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  const row = payload[0].payload as HourlyData & {
                    label: string
                    isCurrent: boolean
                    isPeak: boolean
                  }
                  return (
                    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-soft text-sm">
                      <p className="font-medium text-text">{row.label}</p>
                      <p className="text-primary font-semibold mt-1">
                        {row.orderCount} sipariş
                      </p>
                      {row.isCurrent && (
                        <p className="text-[10px] text-muted mt-1">Şu anki saat</p>
                      )}
                      {row.isPeak && (
                        <p className="text-[10px] text-warning mt-0.5">En yoğun saat</p>
                      )}
                    </div>
                  )
                }}
              />
              {chartData.some((d) => d.hour === currentHour) && (
                <ReferenceLine
                  x={formatHourLabel(currentHour)}
                  stroke={PRIMARY}
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
              )}
              <Area
                type="monotone"
                dataKey="orderCount"
                fill="url(#hourlyArea)"
                stroke="none"
              />
              <Bar
                dataKey="orderCount"
                fill={PRIMARY}
                radius={[6, 6, 0, 0]}
                maxBarSize={view === 'full' ? 14 : 28}
                opacity={0.9}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
