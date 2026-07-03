import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrdersBoard } from '@/components/dashboard/orders-board'

export const dynamic = 'force-dynamic'

export default async function PedidosPage() {
  const session = await getSession()
  const restaurantId = session!.id

  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: { not: 'DELIVERED' },
    },
    include: {
      customer: { select: { name: true, phone: true } },
      address: true,
      items: {
        include: { menuItem: { select: { name: true, images: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos em Andamento</h1>
        <p className="text-sm text-gray-500">{orders.length} pedido(s) ativo(s)</p>
      </div>
      <OrdersBoard initialOrders={orders} restaurantId={restaurantId} />
    </div>
  )
}
