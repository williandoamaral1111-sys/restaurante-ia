import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrderTracker } from '@/components/customer/order-tracker'

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.role !== 'customer') redirect('/login')

  const order = await prisma.order.findFirst({
    where: { id, customerId: session.id },
    include: {
      restaurant: { select: { name: true, slug: true, logo: true, phone: true, estimatedTime: true } },
      items: true,
      address: true,
    },
  })

  if (!order) notFound()

  return (
    <OrderTracker
      order={order as any}
      customerId={session.id}
    />
  )
}
