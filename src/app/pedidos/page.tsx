import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, getOrderStatusLabel } from '@/lib/utils'
import { ChevronRight, ShoppingBag } from 'lucide-react'

const STATUS_COLOR: Record<string, string> = {
  RECEIVED:         'bg-yellow-100 text-yellow-700',
  PREPARING:        'bg-blue-100 text-blue-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED:        'bg-green-100 text-green-700',
  CANCELLED:        'bg-red-100 text-red-600',
}

const STATUS_ICON: Record<string, string> = {
  RECEIVED:         '🔔',
  PREPARING:        '👨‍🍳',
  OUT_FOR_DELIVERY: '🛵',
  DELIVERED:        '✅',
  CANCELLED:        '❌',
}

export default async function PedidosPage() {
  const session = await getSession()
  if (!session || session.role !== 'customer') redirect('/login?redirect=/pedidos')

  const orders = await prisma.order.findMany({
    where: { customerId: session.id },
    include: {
      restaurant: { select: { name: true, slug: true, logo: true } },
      items: { select: { itemName: true, quantity: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/buscar" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="font-bold text-gray-900">Meus Pedidos</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {orders.length === 0 ? (
          <div className="py-20 text-center">
            <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium text-gray-500">Você ainda não fez nenhum pedido</p>
            <Link
              href="/buscar"
              className="mt-4 inline-block rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Ver restaurantes
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/pedidos/${order.id}`}
                className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                {/* Restaurante logo */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-2xl">
                  {order.restaurant.logo
                    ? <img src={order.restaurant.logo} className="h-full w-full rounded-xl object-cover" alt="" />
                    : '🍔'
                  }
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-gray-900">{order.restaurant.name}</p>
                    <span className="shrink-0 text-xs text-gray-400">#{order.orderNumber}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {order.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[order.status]}`}>
                      {STATUS_ICON[order.status]} {getOrderStatusLabel(order.status)}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                  <ChevronRight size={16} className="ml-auto mt-1 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
