import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, getOrderStatusLabel, getPaymentMethodLabel } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { startOfMonth, startOfDay, subDays, subMonths } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function RelatoriosPage() {
  const session = await getSession()
  const restaurantId = session!.id

  const today = startOfDay(new Date())
  const monthStart = startOfMonth(new Date())
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1))

  const [todayStats, monthStats, lastMonthStats, paymentBreakdown, topItemsMonth, last30DaysSales] =
    await Promise.all([
      prisma.order.aggregate({
        where: { restaurantId, createdAt: { gte: today }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
      }),
      prisma.order.aggregate({
        where: { restaurantId, createdAt: { gte: monthStart }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          restaurantId,
          createdAt: { gte: lastMonthStart, lt: monthStart },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where: { restaurantId, createdAt: { gte: monthStart }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.orderItem.groupBy({
        by: ['menuItemId', 'itemName'],
        where: {
          order: { restaurantId, createdAt: { gte: monthStart }, status: { not: 'CANCELLED' } },
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      prisma.$queryRaw<{ date: string; total: number; count: number }[]>`
        SELECT
          DATE("createdAt") as date,
          COALESCE(SUM(total), 0) as total,
          COUNT(*) as count
        FROM orders
        WHERE "restaurantId" = ${restaurantId}
          AND status != 'CANCELLED'
          AND "createdAt" >= ${subDays(new Date(), 29)}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
    ])

  const monthGrowth =
    lastMonthStats._sum.total
      ? (((monthStats._sum.total || 0) - (lastMonthStats._sum.total || 0)) /
          (lastMonthStats._sum.total || 1)) *
        100
      : 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: 'Faturamento Hoje',
            value: formatCurrency(todayStats._sum.total || 0),
            sub: `${todayStats._count} pedidos`,
            color: 'bg-green-50 text-green-700',
          },
          {
            label: 'Faturamento do Mês',
            value: formatCurrency(monthStats._sum.total || 0),
            sub: `${monthGrowth >= 0 ? '+' : ''}${monthGrowth.toFixed(1)}% vs mês anterior`,
            color: 'bg-blue-50 text-blue-700',
          },
          {
            label: 'Ticket Médio',
            value: formatCurrency(monthStats._avg.total || 0),
            sub: 'média por pedido',
            color: 'bg-purple-50 text-purple-700',
          },
          {
            label: 'Total de Pedidos',
            value: String(monthStats._count),
            sub: 'no mês atual',
            color: 'bg-orange-50 text-orange-700',
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{stat.value}</p>
              <p className={`mt-1 rounded-full px-2 py-0.5 text-xs font-medium inline-block ${stat.color}`}>
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales chart 30 days */}
      <SalesChart data={last30DaysSales} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Pratos do Mês */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Pratos do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topItemsMonth.map((item, idx) => (
                <div key={item.menuItemId} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{item.itemName}</p>
                    <p className="text-xs text-gray-400">{item._sum.quantity} unidades</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-gray-900">
                    {formatCurrency(item._sum.totalPrice || 0)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formas de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formas de Pagamento (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentBreakdown.map((p) => {
                const totalMonth = monthStats._sum.total || 1
                const pct = (((p._sum.total || 0) / totalMonth) * 100).toFixed(1)
                return (
                  <div key={p.paymentMethod}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {getPaymentMethodLabel(p.paymentMethod)}
                      </span>
                      <span className="text-gray-500">
                        {formatCurrency(p._sum.total || 0)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-orange-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">{p._count} pedidos</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
