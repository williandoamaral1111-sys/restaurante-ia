'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getOrderStatusLabel } from '@/lib/utils'
import { ShoppingBag } from 'lucide-react'

type OrderStatus = 'RECEIVED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'

function getStatusVariant(status: OrderStatus) {
  const map: Record<OrderStatus, 'default' | 'warning' | 'blue' | 'success' | 'destructive'> = {
    RECEIVED: 'default',
    PREPARING: 'warning',
    OUT_FOR_DELIVERY: 'blue',
    DELIVERED: 'success',
    CANCELLED: 'destructive',
  }
  return map[status] || 'secondary'
}

interface Order {
  id: string
  orderNumber: number
  status: OrderStatus
  total: number
  createdAt: Date
  customer: { name: string; phone: string }
  items: { quantity: number; itemName: string }[]
}

export function RecentOrders({ orders }: { orders: Order[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBag size={16} className="text-orange-500" />
          Pedidos Recentes
        </CardTitle>
        <Link href="/dashboard/pedidos" className="text-xs font-medium text-orange-500 hover:text-orange-600">
          Ver todos →
        </Link>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Nenhum pedido ainda</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/pedidos/${order.id}`}
                className="flex items-center gap-4 py-3 transition-colors hover:bg-gray-50 -mx-6 px-6"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sm font-bold text-orange-600">
                  #{order.orderNumber}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{order.customer.name}</p>
                  <p className="truncate text-xs text-gray-400">
                    {order.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant={getStatusVariant(order.status)}>
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                  <p className="mt-0.5 text-xs font-semibold text-gray-700">{formatCurrency(order.total)}</p>
                </div>
                <p className="shrink-0 text-xs text-gray-400">{formatDate(order.createdAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
