import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { TopDishes } from '@/components/dashboard/top-dishes'
import { SalesChart } from '@/components/dashboard/sales-chart'
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { startOfDay, startOfMonth, subDays } from 'date-fns'

export default async function DashboardPage() {
  const session = await getSession()
  const restaurantId = session!.id

  const today = startOfDay(new Date())
  const monthStart = startOfMonth(new Date())
  const yesterday = startOfDay(subDays(new Date(), 1))

  const [
    todayOrders,
    monthOrders,
    yesterdayOrders,
    pendingOrders,
    topItems,
    recentOrders,
    salesLast7Days,
  ] = await Promise.all([
    // Pedidos de hoje
    prisma.order.aggregate({
      where: { restaurantId, createdAt: { gte: today }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
      _count: true,
    }),
    // Pedidos do mês
    prisma.order.aggregate({
      where: { restaurantId, createdAt: { gte: monthStart }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
      _count: true,
    }),
    // Pedidos de ontem (para comparação)
    prisma.order.aggregate({
      where: {
        restaurantId,
        createdAt: { gte: yesterday, lt: today },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
      _count: true,
    }),
    // Pedidos pendentes
    prisma.order.count({
      where: { restaurantId, status: { in: ['RECEIVED', 'PREPARING'] } },
    }),
    // Pratos mais vendidos do dia
    prisma.orderItem.groupBy({
      by: ['menuItemId', 'itemName'],
      where: {
        order: { restaurantId, createdAt: { gte: today }, status: { not: 'CANCELLED' } },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    // Pedidos recentes
    prisma.order.findMany({
      where: { restaurantId },
      include: {
        customer: { select: { name: true, phone: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    // Vendas últimos 7 dias
    prisma.$queryRaw<{ date: string; total: number; count: number }[]>`
      SELECT
        DATE("createdAt") as date,
        COALESCE(SUM(total), 0) as total,
        COUNT(*) as count
      FROM orders
      WHERE "restaurantId" = ${restaurantId}
        AND status != 'CANCELLED'
        AND "createdAt" >= ${subDays(new Date(), 6)}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
  ])

  const todayTotal = todayOrders._sum.total || 0
  const yesterdayTotal = yesterdayOrders._sum.total || 0
  const growthPercent =
    yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0

  const stats = [
    {
      label: 'Vendas Hoje',
      value: formatCurrency(todayTotal),
      sub: `${todayOrders._count} pedidos`,
      trend: growthPercent,
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Vendas do Mês',
      value: formatCurrency(monthOrders._sum.total || 0),
      sub: `${monthOrders._count} pedidos`,
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Pedidos Pendentes',
      value: String(pendingOrders),
      sub: 'aguardando ação',
      icon: Clock,
      color: 'text-orange-600 bg-orange-50',
    },
    {
      label: 'Pedidos Concluídos',
      value: String(todayOrders._count),
      sub: 'finalizados hoje',
      icon: CheckCircle,
      color: 'text-purple-600 bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{stat.sub}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
              </div>
              {stat.trend !== undefined && (
                <div className="mt-3 flex items-center gap-1">
                  <span
                    className={`text-xs font-semibold ${
                      stat.trend >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {stat.trend >= 0 ? '+' : ''}
                    {stat.trend.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-400">vs ontem</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts + Top Dishes */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesChart data={salesLast7Days} />
        </div>
        <div>
          <TopDishes items={topItems} />
        </div>
      </div>

      {/* Recent Orders */}
      <RecentOrders orders={recentOrders} />
    </div>
  )
}
